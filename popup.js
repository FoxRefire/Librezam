import "/libs/shazam-api.min.js";
import { FFmpeg } from "/libs/ffmpeg/ffmpeg/dist/esm/index.js"

let reservedFFmpeg = reserveFFmpeg()
let audios = await getAudiosInTab()
audios.forEach(async audio => {
    let pcm = await convertToPCM(audios[0], reservedFFmpeg)
    let result = await shazamGuess(pcm)
    circler.style.display = "none"
    resultTable.style.display = "block"
    titleResult.innerText = result.title
    artistResult.innerText = result.artist
    yearResult.innerText = result.year
})

function reserveFFmpeg(){
    let ffmpeg = new FFmpeg();
    let reserve = ffmpeg.load({
        coreURL: "/libs/ffmpeg/core/dist/esm/ffmpeg-core.js",
    })
    return [ffmpeg, reserve]
}

async function getAudiosInTab(){
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    let responses = await sendMessagePromises(tabId).then(p => Promise.allSettled(p)).then(arr => arr.map(r => r.value))
    return [].concat(...responses).map(arr => new Uint8Array(arr))
}

async function sendMessagePromises(tabId){
    let promises = []
    let frames = await chrome.webNavigation.getAllFrames({tabId:tabId})
    frames.forEach(f => {
        let promise = chrome.tabs.sendMessage(tabId, {time:2500}, {frameId:f.frameId})
        promises.push(promise)
    })
    return promises
}

async function shazamGuess(pcm){
    let shazam = new Shazam.Shazam()
    let samples = Shazam.s16LEToSamplesArray(pcm);
    return await shazam.recognizeSong(samples)
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
