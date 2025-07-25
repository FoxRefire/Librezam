import { Recognize } from "/backendModules/Recognize.js"

// grab background option from storage
document.body.style.backgroundImage = await chrome.storage.local.get("bgImage").then(d => d.bgImage) || "url('/images/background-2.jpg')"

writeHistory()
autoModeController()

let audios = (await getAudiosInTab()).filter(a=> a.length)
if(!audios.length){
    showError("No audio elements detected...")
}

audios.forEach(async audio => {
    try{
        let result = await Recognize(audio)
        await writeResult(result)
        saveHistory(result)
    } catch(e) {
        showError("Song was not recognized...")
        console.log(e)
    }
})

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

async function getAudiosInTab(){
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    let time = await chrome.storage.local.get("time").then(o => Number(o.time)) || 3200
    let responses = await sendMessagePromises(tabId, {action: "Record", time: time})
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
