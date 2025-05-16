import { shazamGuess } from "/utils/shazamGuess.js"
import { auddGuess } from "/utils/auddGuess.js"

// grab background option from storage
document.body.style.backgroundImage = await chrome.storage.local.get("bgImage").then(d => d.bgImage) || "url('/images/background-2.jpg')"

writeHistory()

let audios = (await getAudiosInTab()).filter(a=> a.length)
if(!audios.length){
    showError("No audio elements detected...")
}
let recognizeBackend = await chrome.storage.local.get("backend").then(o => o.backend)
audios.forEach(async audio => {
    let result = recognizeBackend == "shazam" ? await shazamGuess(audio) : await auddGuess(audio)
    if(result){
        writeResult(result)
        saveHistory(result)
    } else {
        showError("Song was not recognized...")
    }
})

async function writeHistory(){
    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    histories.forEach(history => {
        document.getElementById("historyTBody").insertAdjacentHTML("afterbegin",`
            <tr>
                <td>${history.title}</td>
                <td>${history.artist}</td>
                <td>${history.year}</td>
            </tr>
        `)
    })
}

async function getAudiosInTab(){
    let tabId = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0].id)
    let time = await chrome.storage.local.get("time").then(o => Number(o.time)) || 3200
    let responses = await sendMessagePromises(tabId, time).then(p => Promise.allSettled(p)).then(arr => arr.map(r => r.value))
    return [].concat(...responses).map(arr => new Uint8Array(arr))
}

async function sendMessagePromises(tabId, ms){
    let promises = []
    let frames = await chrome.webNavigation.getAllFrames({tabId:tabId})
    frames.forEach(f => {
        let promise = chrome.tabs.sendMessage(tabId, {time: ms}, {frameId:f.frameId})
        promises.push(promise)
    })
    return promises
}

function writeResult(result){
    circler.style.display = "none"
    resultTable.style.display = "block"
    streamProviders.style.display = "block"

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
