chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let elements = Array.from(document.querySelectorAll('audio, video')).filter(media => !media.paused)
    let promises = []
    elements.forEach(elem => {
        let stream = elem.captureStream()
        let audioStream = new MediaStream(stream.getAudioTracks())

        let dataPromise = recordStream(audioStream, Number(request.time)).then(data => Array.from(data))
        promises.push(dataPromise)
    })
    Promise.allSettled(promises).then(arr => sendResponse(arr.map(r => r.value)))
    return true
})

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