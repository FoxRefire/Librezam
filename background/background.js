chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.action == "CORSRun"){
        if(!chrome.offscreen) {
            CORSRun(request.mediaSrc, request.currentTime, request.ms).then(d => sendResponse(d))
        } else {
            offscreenCORSRun(request.mediaSrc, request.currentTime, request.ms).then(d => sendResponse(d))
        }
    }
    return true
})

async function CORSRun(mediaSrc, currentTime, ms){
    let elem = new Audio(mediaSrc)
    console.log(elem)
    elem.crossOrigin = "anonymous"
    elem.currentTime = currentTime

    await elem.play()
    let stream = createStream(elem)
    return await recordStream(stream, ms).then(data => Array.from(data))
}

async function offscreenCORSRun(mediaSrc, currentTime, ms) {
    await chrome.offscreen.createDocument({
        url: '/background/offscreen.html',
        reasons: ['WORKERS'],
        justification: 'Workaround of using the DOM on Chromium service worker'
    })
    let result = await chrome.runtime.sendMessage({
        action: "CORSRun",
        mediaSrc,
        currentTime,
        ms
    })
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
