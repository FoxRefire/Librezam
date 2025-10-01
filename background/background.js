import { Recognize } from "/backendModules/Recognize.js"
import { getStorage, setStorage } from "../storageHelper/storageHelper.js"

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(chrome.offscreen) {
        offscreenRun(request).then(d => sendResponse(d))
    } else {
        if(request.action == "CORSRecord"){
            CORSRecord(request.mediaSrc, request.currentTime, request.ms).then(d => sendResponse(d))
        }

        if(request.action == "AutoGuess"){
            AutoGuess(request.aud).then(d => sendResponse(d))
        }
    }
    return true
})

chrome.commands.onCommand.addListener(async (command) => {
    if(command == "tab-recognize"){
        await chrome.action.openPopup()
    }

    if(command == "mic-recognize"){
        chrome.windows.create({
            url: "/popup/guess.html?mic=true",
            type: "popup",
            width: 350,
            height: 500
          })
    }
})

async function CORSRecord(mediaSrc, currentTime, ms){
    let elem = new Audio(mediaSrc)
    console.log(elem)
    elem.crossOrigin = "anonymous"
    elem.currentTime = currentTime

    await elem.play()
    let stream = createStream(elem)
    return await recordStream(stream, ms).then(data => Array.from(data))
}

async function AutoGuess(audios) {
    audios = audios.map(arr => new Uint8Array(arr)).filter(a=> a.length)
    audios.forEach(async audio => {
        try {
            let result = await Recognize(audio)
            await showNotification(result)
            await saveHistory(result)
        } catch(e) {
            console.log("Song was not recognized", e)
        }
    })
}

async function offscreenRun(request) {
    await chrome.offscreen.createDocument({
        url: '/background/offscreen.html',
        reasons: ['WORKERS'],
        justification: 'Workaround of using the DOM on Chromium service worker'
    })
    let result = await chrome.runtime.sendMessage(request)
    await chrome.offscreen.closeDocument()
    return result
}

function createStream(elem){
    let stream = elem.captureStream ? elem.captureStream() : elem.mozCaptureStream()

    let audioCtx = new AudioContext()
    let source = audioCtx.createMediaElementSource(elem)
    source.connect(audioCtx.createMediaStreamDestination())

    return new MediaStream(stream.getAudioTracks())
}

function recordStream(stream, ms){
    return new Promise(resolve => {
        let data = []
        let recorder = new MediaRecorder(stream)
        recorder.ondataavailable = e => data.push(e.data)
        recorder.onstop = _ => data[0].arrayBuffer().then(ab => resolve(new Uint8Array(ab)))
        recorder.start()
        setTimeout(() => recorder.stop(), ms)
    })
}

async function showNotification(result) {
    let previousResult = await getStorage("histories")?.at(-1)
    let currentResult = Object.fromEntries(Object.entries(result).filter(([key]) => ["title", "artist", "year"].includes(key)))

    if(JSON.stringify(previousResult) != JSON.stringify(currentResult)) {
        await chrome.notifications.create({
            type: "basic",
            iconUrl: "images/icon.png",
            title: "Song recognized!",
            message: `${result.artist} - ${result.title}(${result.year})`,
                                          priority: 2
        })
    }
}

async function saveHistory(result){
    let newItem = {
        title: result.title,
        artist: result.artist
    }

    let histories = await getStorage("histories") || []
    histories = histories.filter(item => JSON.stringify(item) != JSON.stringify(newItem))
    histories.push(newItem)

    await setStorage("histories", histories)
}
