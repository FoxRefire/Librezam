// When a message is received on clicking an icon, the audio in the DOM element is retrieved and responds to the pop-up script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.action == "Record") {
        mainRecorder(request.times)
        sendResponse(true)
    }
    if(request.action == "QueryAutoMode") {
        sendResponse(window.isAutoMode)
    }
    if(request.action == "SetAutoMode") {
        window.isAutoMode = Boolean(request.checked)
        sendResponse(window.isAutoMode)
    }
    if(request.action == "GetNextRecorded") {
        getNextRecorded().then(r => sendResponse(r))
    }
    return true
})
let audioPromisesMap = []
autoGuess()
injectScript("/content/workaround.js")
injectScript("/content/appendAudioBuffer.js")


function mainRecorder(times) {
    let elements = findMediaElements()
    audioPromisesMap = []

    times.forEach(time => {
        let audioPromises = []
        elements.forEach(elem => {
            let audioPromise
            if(!elem.currentSrc || new URL(elem.currentSrc).origin == document.location.origin) {
                let stream = createStream(elem)
                audioPromise = recordStream(stream, time).then(data => Array.from(data))
            } else {
                audioPromise = recordStreamCORS(elem.currentSrc, elem.currentTime, time)
            }
            audioPromises.push(audioPromise)
        })
        audioPromisesMap.push(audioPromises)
    })
}

function getNextRecorded() {
    if(!audioPromisesMap.length) {
        return -1
    }
    return Promise.allSettled(audioPromisesMap.shift()).then(arr => arr.map(r => r.value))
}

// Ensure Shadow-root is explored recursively (Fix for some websites such as reddit)
// https://stackoverflow.com/a/75787966/27020071
function findMediaElements() {
    const elements = Array.from(document.querySelectorAll('audio, video'))
    for (const {shadowRoot} of document.querySelectorAll("*")) {
        if (shadowRoot) {
            elements.push(...shadowRoot.querySelectorAll("audio, video"));
        }
    }
    return elements.filter(media => !media.paused);
}

function createStream(elem){
    let mediaStream
    if(!elem.mediaStream?.active) {
        let stream = elem.captureStream ? elem.captureStream() : elem.mozCaptureStream()
        mediaStream = new MediaStream(stream.getAudioTracks())
        elem.mediaStream = mediaStream
    } else {
        mediaStream = elem.mediaStream
    }

    if (!elem.classList.contains("librezamFlag") && !elem.captureStream){
        let audioCtx = new AudioContext()
        let source = audioCtx.createMediaElementSource(elem)
        source.connect(audioCtx.destination)
        elem.classList.add("librezamFlag")
    }
    return mediaStream
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

function recordStreamCORS(mediaSrc, currentTime, ms){
    return chrome.runtime.sendMessage({
        action:"CORSRecord",
        mediaSrc,
        currentTime,
        ms
    })
}

function autoGuess() {
    let lastRun = 0
    setInterval(() => {
        let now = Date.now()
        if(window.isAutoMode && now - lastRun >= 25000) {
            lastRun = now
            mainRecorder(3200).then(aud => {
                chrome.runtime.sendMessage({
                    action:"AutoGuess",
                    aud: aud
                })
            })
        }
    }, 750)
}

function injectScript(src) {
    if(document instanceof HTMLDocument) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = chrome.runtime.getURL(src);
        (document.head || document.documentElement).appendChild(script);
    }
}
