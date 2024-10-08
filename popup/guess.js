import "/libs/shazam-api.min.js";
import { FFmpeg } from "/libs/ffmpeg/ffmpeg/dist/esm/index.js"

writeHistory()
let reservedFFmpeg = reserveFFmpeg()
let audios = (await getAudiosInTab()).filter(a=> a.length)
audios.forEach(async audio => {
    let pcm = await convertToPCM(audio, reservedFFmpeg)
    let result = await shazamGuess(pcm)
    console.log(JSON.stringify(result))
    writeResult(result)
    await saveHistory(result)
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
    yearResult.innerText = result.track.sections[0].metadata[2].text

    appleMusicLink.href = result.track.hub.options[0].actions[0].uri
    deezerLink.href = result.track.hub.providers[1].actions[0].uri.replace("deezer-query://", "https://")
    spotifyLink.href = "https://open.spotify.com/search/" + result.track.hub.providers[0].actions[0].uri.slice(15)
}

async function saveHistory(result){
    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    histories.push({
        title: result.track.title,
        artist: result.track.subtitle,
        year: result.track.sections[0].metadata[2].text
    })
    await chrome.storage.local.set({histories})
}
