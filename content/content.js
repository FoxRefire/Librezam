// When a message is received on clicking an icon, the audio in the DOM element is retrieved and responds to the pop-up script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.action == "Record") {
        ActionRecord(Number(request.time)).then(r => sendResponse(r))
    }
    if(request.action == "QueryAutoMode") {
        sendResponse(window.isAutoMode)
    }
    if(request.action == "SetAutoMode") {
        window.isAutoMode = Boolean(request.checked)
        sendResponse(window.isAutoMode)
    }
    return true
})
autoGuess()


function ActionRecord(time) {
    let elements = findMediaElements()
    let promises = []
    elements.forEach(elem => {
        let dataPromise
        if(new URL(elem.currentSrc).origin == document.location.origin) {
            let stream = createStream(elem)
            dataPromise = recordStream(stream, time).then(data => Array.from(data))
        } else {
            dataPromise = recordStreamCORS(elem.currentSrc, elem.currentTime, time)
        }
        promises.push(dataPromise)
    })

    return Promise.allSettled(promises).then(arr => arr.map(r => r.value))
}

// Workaround for some websites librezam wont work
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = chrome.runtime.getURL("/content/workaround.js");
(document.head || document.documentElement).appendChild(script);

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

function createStream(elem){
    let stream = elem.captureStream ? elem.captureStream() : elem.mozCaptureStream()

    if (!elem.classList.contains("librezamFlag") && !elem.captureStream){
        let audioCtx = new AudioContext()
        let source = audioCtx.createMediaElementSource(elem)
        source.connect(audioCtx.destination)
        elem.classList.add("librezamFlag")
    }
    return new MediaStream(stream.getAudioTracks())
}

function recordStreamCORS(mediaSrc, currentTime, ms){
    return chrome.runtime.sendMessage({
        action:"CORSRun",
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
            ActionRecord(3200).then(aud => {
                chrome.runtime.sendMessage({
                    action:"AutoGuess",
                    aud: aud
                })
            })
        }
    }, 750)
}
