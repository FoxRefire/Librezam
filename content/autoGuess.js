function autoGuess() {
    let lastRun = 0
    setInterval(() => {
        let now = Date.now()
        if(window.isAutoMode && now - lastRun >= 9000) {
            lastRun = now
            autoGuessRecorder().then(audios => {
                chrome.runtime.sendMessage({
                    action:"AutoGuess",
                    audios: audios
                })
            })
        }
    }, 750)
}

function autoGuessRecorder() {
    let elements = findMediaElements()
    let audioPromises = elements.map(elem => recordElem(elem, 7200))
    return Promise.allSettled(audioPromises).then(arr => arr.map(r => r.value))
}

autoGuess()