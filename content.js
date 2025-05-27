// When a message is received on clicking an icon, the audio in the DOM element is retrieved and responds to the pop-up script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let elements = findMediaElements()
    let promises = []
    elements.forEach(elem => {
        let stream = createStream(elem)
        let audioStream = new MediaStream(stream.getAudioTracks())

        let dataPromise = recordStream(audioStream, Number(request.time)).then(data => Array.from(data))
        promises.push(dataPromise)
    })
    Promise.allSettled(promises).then(arr => sendResponse(arr.map(r => r.value)))
    return true
})

// Workaround for some websites librezam wont work
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = chrome.runtime.getURL("/utils/fixHeadlessAudio.js");
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
    return stream
}
