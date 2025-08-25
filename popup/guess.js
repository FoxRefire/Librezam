import { Recognize } from "/backendModules/Recognize.js"
import { getStorage, setStorage } from "../storageHelper/storageHelper.js"

main()

async function main() {
    // Initialize dropdown menu
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'));
    
    writeHistory()
    autoModeController()
    micRecognitionController()

    let fallbackRules = await getStorage("fallbackRules")
    let times = Object.keys(fallbackRules).map(t => Number(t))
    let backendsMap = Object.values(fallbackRules)

    await recordAudiosInTab(times)

    for(let backends of backendsMap) {
        let audios = await getNextRecorded().then(r => r.filter(a=> a.length))
        if(!audios.length) {
            showError("No audio elements detected...")
            return
        }

        for(let backend of backends) {
            let isFound = await getResult(audios, backend)
            if(isFound) {
                return
            }
        }
    }
    showError("Song was not recognized...")
}

async function getResult(audios, backend) {
    for(let audio of audios) {
        try{
            let result = await Recognize(audio, backend)
            await writeResult(result)
            saveHistory(result)
            return true
        } catch(e) {
            console.log(e)
        }
    }
    return false
}

async function writeHistory(){
    let histories = await getStorage("histories")
    const escapeStr = t => new Option(t).innerHTML

    histories.forEach(history => {
        document.getElementById("historyTBody").insertAdjacentHTML("afterbegin",`
            <tr>
                <td>${escapeStr(history.title)}</td>
                <td>${escapeStr(history.artist)}</td>
            </tr>
        `)
    })
}

async function recordAudiosInTab(times){
    return await sendMessagePromises({action: "Record", times: times})
}

async function getNextRecorded() {
    let responses = await sendMessagePromises({action: "GetNextRecorded"})
    return [].concat(...responses).map(arr => new Uint8Array(arr))
}

async function sendMessagePromises(request){
    let promises = []
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    let frames = await chrome.webNavigation.getAllFrames({tabId:tabId})
    frames.forEach(f => {
        let promise = chrome.tabs.sendMessage(tabId, request, {frameId:f.frameId})
        promises.push(promise)
    })
    return Promise.allSettled(promises).then(arr => arr.map(r => r.value))
}

async function writeResult(result){
    circler.style.display = "none"
    resultTable.style.display = "block"
    streamProviders.style.display = "block"

    let isShowCoverart = await getStorage("isShowCoverart")
    if(isShowCoverart){
        surfaceContainer.style.backgroundImage = `url('${result.art}')`
    }

    let elms = ["title", "artist", "year", "apple", "deezer", "spotify", "youtube"]
    elms.forEach(out => {
        let outElm = document.querySelector(`.result.${out}`)
        if(!outElm.classList.contains("stream")) {
            outElm.innerText = result[out]
        } else {
            outElm.href = result[out]
        }
    })
}

async function saveHistory(result){
    let newItem = {
        title: result.title,
        artist: result.artist
    }

    let histories = await getStorage("histories")
    histories = histories.filter(item => JSON.stringify(item) != JSON.stringify(newItem))
    histories.push(newItem)

    await setStorage("histories", histories)
}

function showError(msg) {
    circler.style.display = "none"
    notification.innerText = msg
}

async function autoModeController() {
    isAutoMode.checked = await sendMessagePromises({action: "QueryAutoMode"}).then(r => Boolean(r?.[0]))
    isAutoMode.addEventListener("change", async evt => {
        await sendMessagePromises({action: "SetAutoMode", checked: evt.target.checked})
    })
}

async function micRecognitionController() {
    document.getElementById("micRecognition").addEventListener("click", async (e) => {
        e.preventDefault()
        await startMicRecognition()
    })
}

async function startMicRecognition() {
    try {
        // Reset UI
        circler.style.display = "block"
        resultTable.style.display = "none"
        streamProviders.style.display = "none"
        notification.innerText = ""
        
        // Get fallback rules
        let fallbackRules = await getStorage("fallbackRules")
        let times = Object.keys(fallbackRules).map(t => Number(t))
        let backendsMap = Object.values(fallbackRules)
        
        // Record from microphone
        let micAudios = await recordFromMicrophone(times)
        
        // Try recognition with fallback
        for(let backends of backendsMap) {
            let audio = await micAudios.shift()
            if(!audio) {
                showError("No audio recorded from microphone...")
                return
            }

            for(let backend of backends) {
                let isFound = await getResult([audio], backend)
                if(isFound) {
                    return
                }
            }
        }
        showError("Song was not recognized from microphone...")
    } catch(e) {
        console.error("Microphone recognition error:", e)
        showError("Failed to access microphone or record audio")
    }
}

async function recordFromMicrophone(times) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        const data = []

        recorder.ondataavailable = e => data.push(e.data)
        recorder.start(10)

        setTimeout(() => recorder.stop(), Math.max(...times))
        let audioPromises = []
        for(let time of times) {
            let audioPromise = new Promise(resolve => setTimeout(_ => new Blob([new Blob([])].concat(data)).arrayBuffer().then(r => resolve(new Uint8Array(r))), time))
            audioPromises.push(audioPromise)
        }
        return audioPromises
    } catch(error) {
        throw new Error(`Microphone access failed: ${error.message}`)
    }
}
