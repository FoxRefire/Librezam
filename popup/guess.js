import { Recognize } from "/backendModules/Recognize.js"

// grab background option from storage
document.body.style.backgroundImage = await chrome.storage.local.get("bgImage").then(d => d.bgImage) || "url('/images/background-2.jpg')"

writeHistory()
autoModeController()
await recordAudiosInTab()
guess()

async function guess(retries = 0) {
    let audios = (await getNextRecorded()).filter(a=> a.length)
    console.log(audios)
    if(!audios.length){
        if(retries == 0) {
            showError("No audio elements detected...")
        } else {
            showError("Song was not recognized...")
        }
    }


    audios.forEach(async audio => {
        try{
            let result = await Recognize(audio)
            await writeResult(result)
            saveHistory(result)
        } catch(e) {
            console.log(e)
            guess(++retries)
        }
    })
}

async function writeHistory(){
    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    const escapeStr = t => new Option(t).innerHTML

    histories.forEach(history => {
        document.getElementById("historyTBody").insertAdjacentHTML("afterbegin",`
            <tr>
                <td>${escapeStr(history.title)}</td>
                <td>${escapeStr(history.artist)}</td>
                <td>${escapeStr(history.year)}</td>
            </tr>
        `)
    })
}

async function recordAudiosInTab(){
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    let times = await chrome.storage.local.get("times").then(o => Number(o.times)) || [3200, 12000]
    let responses = await sendMessagePromises(tabId, {action: "Record", times: times})
}

async function getNextRecorded() {
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    let responses = await sendMessagePromises(tabId, {action: "GetNextRecorded"})
    return [].concat(...responses).map(arr => new Uint8Array(arr))
}

async function sendMessagePromises(tabId, request){
    let promises = []
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

    let isShowCoverart = await chrome.storage.local.get("isShowCoverart").then(o => o.isShowCoverart) || false
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
        artist: result.artist,
        year: result.year
    }

    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    histories = histories.filter(item => JSON.stringify(item) != JSON.stringify(newItem))
    histories.push(newItem)

    await chrome.storage.local.set({histories})
}

function showError(msg) {
    circler.style.display = "none"
    notification.innerText = msg
}

async function autoModeController() {
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    isAutoMode.checked = await sendMessagePromises(tabId, {action: "QueryAutoMode"}).then(r => Boolean(r?.[0]))
    isAutoMode.addEventListener("change", async evt => {
        await sendMessagePromises(tabId, {action: "SetAutoMode", checked: evt.target.checked})
    })
}
