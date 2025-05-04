import "/libs/shazam-api.min.js";
import { FFmpeg } from "/libs/ffmpeg/ffmpeg/dist/esm/index.js"

writeHistory()
let reservedFFmpeg = reserveFFmpeg()
let audios = (await getAudiosInTab()).filter(a=> a.length)

if(!audios.length){
    showError("No audio elements detected...")
}

audios.forEach(async audio => {
    let pcm = await convertToPCM(audio, reservedFFmpeg)
    let result = await shazamGuess(pcm)

    if(result){
        writeResult(result)
        saveHistory(result)
    } else {
        showError("Song was not recognized...")
    }
})

async function writeHistory(){
    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    histories.forEach(history => {
        document.getElementById("historyTBody").insertAdjacentHTML("afterbegin",`
            <tr>
                <td>${history.title}</td>
                 <td>${history.artist}</td>
                  <td>${history.year}</td>
            </tr>
        `)
    })
}

function reserveFFmpeg(){
    let ffmpeg = new FFmpeg();
    let reserve = ffmpeg.load({
        coreURL: "/libs/ffmpeg/core/dist/esm/ffmpeg-core.js",
    })
    return [ffmpeg, reserve]
}

async function getAudiosInTab(){
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    let time = await chrome.storage.local.get("time").then(o => Number(o.time)) || 3200
    let responses = await sendMessagePromises(tabId, time).then(p => Promise.allSettled(p)).then(arr => arr.map(r => r.value))
    return [].concat(...responses).map(arr => new Uint8Array(arr))
}

async function sendMessagePromises(tabId, ms){
    let promises = []
    let frames = await chrome.webNavigation.getAllFrames({tabId:tabId})
    frames.forEach(f => {
        let promise = chrome.tabs.sendMessage(tabId, {time: ms}, {frameId:f.frameId})
        promises.push(promise)
    })
    return promises
}

async function shazamGuess(pcm){
    let shazam = new Shazam.Shazam()
    let samples = Shazam.s16LEToSamplesArray(pcm);
    return await shazam.fullRecognizeSong(samples)
}

async function convertToPCM(audio, reservedFFmpeg){
    let [ffmpeg, reserve] = reservedFFmpeg
    await reserve
    await ffmpeg.writeFile("audio.webm", new Uint8Array(audio));
    await ffmpeg.exec([
        "-i", "audio.webm",
        "-ar", "16000",
        "-ac", "1",
        "-f", "s16le",
        "-y",
        "out.pcm"
    ])
    return await ffmpeg.readFile("out.pcm");
}

function writeResult(result){
    circler.style.display = "none"
    resultTable.style.display = "block"
    streamProviders.style.display = "block"

    titleResult.innerText = result.track.title
    artistResult.innerText  = result.track.subtitle
    yearResult.innerText = result.track.sections[0].metadata[2]?.text || ""

    appleMusicLink.href = result.track.hub.options[0].actions[0].uri
    deezerLink.href = result.track.hub.providers[1].actions[0].uri.replace("deezer-query://", "https://")
    spotifyLink.href = "https://open.spotify.com/search/" + result.track.hub.providers[0].actions[0].uri.slice(15)
    youtubeLink.href = "https://www.youtube.com/results?search_query=" + result.track.hub.providers[0].actions[0].uri.slice(15)
}

async function saveHistory(result){
    let newItem = {
        title: result.track.title,
        artist: result.track.subtitle,
        year: result.track.sections[0].metadata[2]?.text || ""
    }

    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    histories = histories.filter(item => JSON.stringify(item) != JSON.stringify(newItem))
    histories.push(newItem)

    await chrome.storage.local.set({histories})
}

function showError(msg) {
    circler.style.display = "none"
    notification.innerText = msg
}
