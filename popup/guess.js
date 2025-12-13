import { Recognize } from "/backendModules/Recognize.js"
import { getStorage, setStorage } from "../storageHelper/storageHelper.js"
import { t } from "./i18n.js"

init()

function init() {
    if(window.location.search.includes("mic=true")) {
        startMicRecognition()
    } else {
        startTabRecognition()
    }

    // Initialize dropdown menu
    M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'));
    
    writeHistory()
    autoModeController()
    micRecognitionController()
}

async function startTabRecognition() {
    // Initialize UI for recognition
    circler.style.opacity = "0"
    circler.style.display = "block"
    circler.style.transition = "opacity 0.3s ease"
    setTimeout(() => {
        circler.style.opacity = "1"
    }, 50)
    
    resultTable.style.display = "none"
    streamProviders.style.display = "none"
    notification.classList.remove("show", "pulse", "recognizing")
    
    let fallbackRules = await getStorage("fallbackRules")
    let times = Object.keys(fallbackRules).map(t => Number(t))
    let backendsMap = Object.values(fallbackRules)

    await recordAudiosInTab(times)

        for(let backends of backendsMap) {
            showStatus(t("listening"))
            let audios = await getNextRecorded().then(r => r.filter(a=> a.length))
            if(!audios.length) {
                showError(t("noAudioElementsDetected"))
                return
            }

            for(let backend of backends) {
                let isFound = await getResult(audios, backend)
                if(isFound) {
                    return
                }
            }
        }
        showError(t("songNotRecognized"))
}

async function getResult(audios, backend) {
    for(let audio of audios) {
        try{
            showStatus(t("queryingWith", [backend]))
            let result = await Recognize(audio, backend)
            await writeResult(result)
            await saveHistory(result)
            await writeHistory() // Update history display immediately
            notification.style.display = "none"
            return true
        } catch(e) {
            console.log(e)
        }
    }
    return false
}

let currentHistories = []
let currentSort = { field: 'date', ascending: false } // Default: date descending

async function writeHistory(){
    currentHistories = await getStorage("histories") || []
    // Sort by date descending by default
    currentHistories.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    renderHistoryTable()
    setupHistoryControls()
}

function renderHistoryTable(histories = currentHistories) {
    const container = document.getElementById("historyCards")
    container.innerHTML = ""
    const escapeStr = t => new Option(t).innerHTML

    histories.forEach((history, index) => {
        const card = document.createElement("div")
        card.className = "history-card"
        card.dataset.index = index
        
        // Format date
        const dateStr = history.timestamp ? new Date(history.timestamp).toLocaleDateString() : ""
        
        card.innerHTML = `
            <div class="history-card-header">
                <div class="history-card-cover" style="background-image: url('${history.art || ''}')"></div>
                <div class="history-card-main-info">
                    <div class="history-card-title">${escapeStr(history.title)}</div>
                    <div class="history-card-artist">${escapeStr(history.artist)}</div>
                    ${history.album ? `<div class="history-card-album">${escapeStr(history.album)}</div>` : ''}
                    ${dateStr ? `<div class="history-card-date">${dateStr}</div>` : ''}
                </div>
                <div class="history-card-actions">
                    <button class="history-card-btn detail-btn" data-index="${index}">
                        <i class="material-icons">visibility</i>
                    </button>
                    <button class="history-card-btn delete-btn" data-index="${index}">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </div>
        `
        
        container.appendChild(card)
    })
}

function setupHistoryControls() {
    // Remove existing event listeners to prevent duplicates
    const sortButtons = ['sortByTitle', 'sortByArtist', 'sortByDate']
    sortButtons.forEach(id => {
        const button = document.getElementById(id)
        const newButton = button.cloneNode(true)
        button.parentNode.replaceChild(newButton, button)
    })

    // Sort controls
    document.getElementById("sortByTitle").addEventListener("click", () => {
        toggleSort('title')
    })
    
    document.getElementById("sortByArtist").addEventListener("click", () => {
        toggleSort('artist')
    })
    
    document.getElementById("sortByDate").addEventListener("click", () => {
        toggleSort('date')
    })

    // Detail and delete buttons - use event delegation to avoid duplicates
    if (!document.hasHistoryControlsListener) {
        document.addEventListener("click", async (e) => {
            if (e.target.closest(".detail-btn")) {
                const index = parseInt(e.target.closest(".detail-btn").dataset.index)
                await writeResult(currentHistories[index])
                if(notification.style.color === "orange") {
                    notification.style.display = "none"
                }
            } else if (e.target.closest(".delete-btn")) {
                const index = parseInt(e.target.closest(".delete-btn").dataset.index)
                await deleteHistoryItem(index)
            }
        })
        document.hasHistoryControlsListener = true
    }
}

function toggleSort(field) {
    // If clicking the same field, toggle ascending/descending
    if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending
    } else {
        // If clicking a different field, start with ascending
        currentSort.field = field
        currentSort.ascending = true
    }
    
    // Sort the histories
    currentHistories.sort((a, b) => {
        let comparison = 0
        
        switch (field) {
            case 'title':
                comparison = a.title.localeCompare(b.title)
                break
            case 'artist':
                comparison = a.artist.localeCompare(b.artist)
                break
            case 'date':
                comparison = (a.timestamp || 0) - (b.timestamp || 0)
                break
        }
        
        return currentSort.ascending ? comparison : -comparison
    })
    
    // Update sort indicators
    updateSortIndicators()
    
    // Re-render table
    renderHistoryTable()
}

function updateSortIndicators() {
    // Reset all icons to unfold_more
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.textContent = 'unfold_more'
    })
    
    // Set the active sort icon
    const activeButton = document.getElementById(`sortBy${currentSort.field.charAt(0).toUpperCase() + currentSort.field.slice(1)}`)
    const activeIcon = activeButton.querySelector('.sort-icon')
    
    if (currentSort.ascending) {
        activeIcon.textContent = 'keyboard_arrow_up'
    } else {
        activeIcon.textContent = 'keyboard_arrow_down'
    }
}

async function deleteHistoryItem(index) {
    currentHistories.splice(index, 1)
    await setStorage("histories", currentHistories)
    renderHistoryTable()
}

async function recordAudiosInTab(times){
    return await sendMessagePromises({action: "Record", times: times})
}

async function getNextRecorded() {
    let responses = await sendMessagePromises({action: "GetNextRecorded"})
    return [].concat(...responses).map(arr => new Uint8Array(arr))
}

async function getTabId() {
    if(getTabId.tabId) {
        return getTabId.tabId
    }
    let tab = await chrome.tabs.query({active:true, currentWindow:true}).then(t => t[0])
    let tabId = tab.id
    let isRecordAnotherTab = await getStorage("isRecordAnotherTab")
    if(!tab.audible && isRecordAnotherTab){
        let anotherTab = await chrome.tabs.query({audible:true, currentWindow:true}).then(t => t[0])
        if(anotherTab){
            tabId = anotherTab.id
        }
    }
    getTabId.tabId = tabId
    return tabId
}

async function sendMessagePromises(request) {
    let promises = []
    let tabId = await getTabId()

    let frames = await chrome.webNavigation.getAllFrames({tabId:tabId})
    frames.forEach(f => {
        let promise = chrome.tabs.sendMessage(tabId, request, {frameId:f.frameId})
        promises.push(promise)
    })
    return Promise.allSettled(promises).then(arr => arr.map(r => r.value))
}

async function writeResult(result){
    // Smooth transition out for spinner
    circler.style.opacity = "0"
    circler.style.transition = "opacity 0.3s ease"
    setTimeout(() => {
        circler.style.display = "none"
    }, 300)
    
    // Smooth fade in for results
    resultTable.style.opacity = "0"
    resultTable.style.display = "block"
    resultTable.style.transition = "opacity 0.5s ease"
    streamProviders.style.opacity = "0"
    streamProviders.style.display = "block"
    streamProviders.style.transition = "opacity 0.5s ease"
    
    // Trigger fade in
    setTimeout(() => {
        resultTable.style.opacity = "1"
        streamProviders.style.opacity = "1"
    }, 50)

    // Always show coverart
    surfaceContainer.style.backgroundImage = `url('${result.art}')`

    // Update basic info
    let elms = ["title", "artist", "album"]
    elms.forEach(out => {
        let outElm = document.querySelector(`.result.${out}`)
        outElm.innerText = result[out]
    })

    // Update streaming providers
    await updateStreamingProviders(result)
}

async function updateStreamingProviders(result) {
    const selectedProviders = await getStorage("selectedStreamingProviders")
    
    // Provider icons mapping
    const providerIcons = {
        'apple': '/images/apple.png',
        'deezer': '/images/deezer.png',
        'spotify': '/images/spotify.png',
        'youtube': '/images/youtube.png',
        'youtube_music': '/images/ytmusic.png',
        'kkbox': '/images/kkbox.png',
        'soundcloud': '/images/soundcloud.png',
        'tidal': '/images/tidal.png',
        'qq_music': '/images/qqmusic.png',
        'netease_music': '/images/netease.png',
        'google_search': '/images/google.png',
        'duckduckgo_search': '/images/duckduckgo.png',
        'musicbrainz': '/images/musicbrainz.png'
    }
    
    // Clear existing providers
    streamProviders.innerHTML = ''
    
    // Add selected providers
    selectedProviders.forEach(providerId => {
        if (result[providerId]) {
            const providerElement = document.createElement('a')
            providerElement.className = `result stream ${providerId}`
            providerElement.href = result[providerId]
            providerElement.target = '_blank'
            
            const img = document.createElement('img')
            img.src = providerIcons[providerId]
            img.width = 32
            img.className = 'circle responsive-img'
            
            providerElement.appendChild(img)
            streamProviders.appendChild(providerElement)
        }
    })
}

async function saveHistory(result){
    let newItem = {
        ...result,
        timestamp: Date.now() // Add timestamp for sorting
    }

    let histories = await getStorage("histories")
    // Remove duplicates based on title and artist
    histories = histories.filter(item => !(item.title === newItem.title && item.artist === newItem.artist))
    histories.push(newItem)

    await setStorage("histories", histories)
}

function showError(msg) {
    circler.style.display = "none"
    notification.innerText = msg
    notification.style.color = "orange"
    notification.classList.remove("show", "pulse", "recognizing")
    // Trigger reflow to restart animation
    void notification.offsetWidth
    notification.classList.add("show")
}

function showStatus(msg) {
    if (msg) {
        // Check if message ends with "..." or similar pattern
        const baseMessage = msg.replace(/\.+$/, '')
        const hasDots = msg.endsWith('...') || msg.endsWith('…')
        
        if (hasDots) {
            // Use CSS-animated dots for smoother animation
            notification.innerHTML = baseMessage + '<span class="dots"><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>'
        } else {
            notification.innerText = msg
        }
        
        notification.style.color = "white"
        notification.classList.remove("show", "pulse", "recognizing")
        // Trigger reflow to restart animation
        void notification.offsetWidth
        notification.classList.add("show", "pulse", "recognizing")
    } else {
        // Hide notification smoothly
        notification.classList.remove("show", "pulse", "recognizing")
        setTimeout(() => {
            notification.innerText = ""
            notification.innerHTML = ""
        }, 300)
    }
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
        // Reset UI with smooth transitions
        resultTable.style.opacity = "0"
        streamProviders.style.opacity = "0"
        setTimeout(() => {
            resultTable.style.display = "none"
            streamProviders.style.display = "none"
        }, 300)
        
        circler.style.opacity = "0"
        circler.style.display = "block"
        circler.style.transition = "opacity 0.3s ease"
        setTimeout(() => {
            circler.style.opacity = "1"
        }, 50)
        
        notification.classList.remove("show", "pulse", "recognizing")
        notification.innerText = ""
        
        // Get fallback rules
        let fallbackRules = await getStorage("fallbackRules")
        let times = Object.keys(fallbackRules).map(t => Number(t))
        let backendsMap = Object.values(fallbackRules)
        
        // Record from microphone
        let micAudios = await recordFromMicrophone(times)
        
        // Try recognition with fallback
        for(let backends of backendsMap) {
            showStatus(t("listening"))
            let audio = await micAudios.shift()
            if(!audio) {
                showError(t("noAudioRecordedFromMicrophone"))
                return
            }

            for(let backend of backends) {
                let isFound = await getResult([audio], backend)
                if(isFound) {
                    return
                }
            }
        }
        showError(t("songNotRecognizedFromMicrophone"))
    } catch(e) {
        console.error("Microphone recognition error:", e)
        showError(t("failedToAccessMicrophone"))
    }
}

async function recordFromMicrophone(times) {
    try {
        if(await navigator.permissions.query({ name: 'microphone' }).then(r => r.state !== "granted")) {
            window.open("/popup/grantMicrophone.html", "_blank")
            throw new Error("Microphone access denied")
        }
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
