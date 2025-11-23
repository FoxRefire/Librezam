import { getStorage, setStorage, Defaults } from "../storageHelper/storageHelper.js"
import { t } from "./i18n.js"

// Available streaming providers with their display names and icons
const STREAMING_PROVIDERS = {
    'apple': { name: 'Apple Music', icon: '/images/apple.png' },
    'deezer': { name: 'Deezer', icon: '/images/deezer.png' },
    'spotify': { name: 'Spotify', icon: '/images/spotify.png' },
    'youtube': { name: 'YouTube', icon: '/images/youtube.png' },
    'youtube_music': { name: 'YouTube Music', icon: '/images/ytmusic.png' },
    'kkbox': { name: 'KKBOX', icon: '/images/kkbox.png' },
    'soundcloud': { name: 'SoundCloud', icon: '/images/soundcloud.png' },
    'tidal': { name: 'Tidal', icon: '/images/tidal.png' },
    'qq_music': { name: 'QQ Music', icon: '/images/qqmusic.png' },
    'netease_music': { name: 'Netease Music', icon: '/images/netease.png' },
    'google_search': { name: 'Google Search', icon: '/images/google.png' },
    'duckduckgo_search': { name: 'DuckDuckGo Search', icon: '/images/duckduckgo.png' },
    'musicbrainz': { name: 'MusicBrainz', icon: '/images/musicbrainz.png' }
}

let selectedProviders = []
let availableProviders = []

// Drag and drop variables
let draggedElement = null
let draggedIndex = -1

init()

async function init() {
    // Load current settings
    selectedProviders = await getStorage("selectedStreamingProviders") || []
    availableProviders = Object.keys(STREAMING_PROVIDERS).filter(key => !selectedProviders.includes(key))
    
    renderProviders()
    setupEventListeners()
}

function renderProviders() {
    renderSelectedProviders()
    renderAvailableProviders()
    updateCounter()
}

function renderSelectedProviders() {
    const selectedList = document.getElementById('selectedList')
    selectedList.innerHTML = ''
    
    selectedProviders.forEach((providerId, index) => {
        const provider = STREAMING_PROVIDERS[providerId]
        const providerElement = createProviderElement(providerId, provider, true, index)
        selectedList.appendChild(providerElement)
    })
    
    // Add drag listeners after all elements are rendered
    setupDragAndDrop()
}

function renderAvailableProviders() {
    const availableList = document.getElementById('availableList')
    availableList.innerHTML = ''
    
    availableProviders.forEach(providerId => {
        const provider = STREAMING_PROVIDERS[providerId]
        const providerElement = createProviderElement(providerId, provider, false)
        availableList.appendChild(providerElement)
    })
}

function createProviderElement(providerId, provider, isSelected, index = -1) {
    const div = document.createElement('div')
    div.className = `provider-item ${isSelected ? 'selected' : 'available'}`
    div.draggable = isSelected
    div.dataset.providerId = providerId
    div.dataset.index = index
    
    div.innerHTML = `
        <img src="${provider.icon}" width="24" height="24" class="provider-icon">
        <span class="provider-name">${provider.name}</span>
        ${isSelected ? '<i class="material-icons remove-btn">close</i>' : ''}
    `
    
    return div
}

function setupEventListeners() {
    // Add provider to selected
    document.getElementById('availableList').addEventListener('click', (e) => {
        const providerItem = e.target.closest('.provider-item')
        if (providerItem && selectedProviders.length < 5) {
            addProvider(providerItem.dataset.providerId)
        }
    })
    
    // Remove provider from selected
    document.getElementById('selectedList').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const providerItem = e.target.closest('.provider-item')
            removeProvider(providerItem.dataset.providerId)
        }
    })
    
    // Reset to default providers
    document.getElementById('resetProviders').addEventListener('click', (e) => {
        e.preventDefault()
        resetToDefault()
    })
    
    // Drag and drop for reordering
    setupDragAndDrop()
}

// Add drag event listeners to each provider item
function addDragListeners(element, index) {
    element.draggable = true
    element.dataset.index = index
    
    element.addEventListener('dragstart', (e) => {
        draggedElement = element
        draggedIndex = parseInt(element.dataset.index)
        e.dataTransfer.effectAllowed = 'move'
        element.classList.add('dragging')
        element.style.opacity = '0.5'
    })
    
    element.addEventListener('dragend', (e) => {
        element.classList.remove('dragging')
        element.style.opacity = '1'
        draggedElement = null
        draggedIndex = -1
        // Remove drag-over class from all elements
        document.querySelectorAll('.provider-item').forEach(item => {
            item.classList.remove('drag-over')
        })
    })
    
    element.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    })
    
    element.addEventListener('dragenter', (e) => {
        e.preventDefault()
        if (element !== draggedElement) {
            element.classList.add('drag-over')
        }
    })
    
    element.addEventListener('dragleave', (e) => {
        element.classList.remove('drag-over')
    })
    
    element.addEventListener('drop', (e) => {
        e.preventDefault()
        element.classList.remove('drag-over')
        
        if (draggedElement && draggedElement !== element) {
            const selectedList = document.getElementById('selectedList')
            const newIndex = Array.from(selectedList.children).indexOf(element)
            reorderProviders(draggedIndex, newIndex)
        }
    })
}

// Function to get the element after which to insert the dragged element
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.provider-item:not(.dragging)')]
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child }
        } else {
            return closest
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element
}

function setupDragAndDrop() {
    const selectedList = document.getElementById('selectedList')
    const providerItems = selectedList.querySelectorAll('.provider-item')
    
    // Remove existing listeners to avoid duplicates
    providerItems.forEach(item => {
        const newItem = item.cloneNode(true)
        item.parentNode.replaceChild(newItem, item)
    })
    
    // Add drag listeners to all provider items
    selectedList.querySelectorAll('.provider-item').forEach((element, index) => {
        addDragListeners(element, index)
    })
}

function addProvider(providerId) {
    if (selectedProviders.length >= 5) return
    
    selectedProviders.push(providerId)
    availableProviders = availableProviders.filter(id => id !== providerId)
    
    renderProviders()
    saveSettings()
}

function removeProvider(providerId) {
    selectedProviders = selectedProviders.filter(id => id !== providerId)
    availableProviders.push(providerId)
    availableProviders.sort()
    
    renderProviders()
    saveSettings()
}

function reorderProviders(fromIndex, toIndex) {
    // Ensure indices are valid
    if (fromIndex < 0 || fromIndex >= selectedProviders.length || 
        toIndex < 0 || toIndex >= selectedProviders.length) {
        return
    }
    
    const [movedProvider] = selectedProviders.splice(fromIndex, 1)
    selectedProviders.splice(toIndex, 0, movedProvider)
    
    renderProviders()
    saveSettings()
}

function updateCounter() {
    const counter = document.querySelector('#selectedProviders h6')
    counter.textContent = t('selectedProviders', [String(selectedProviders.length)])
}

async function saveSettings() {
    await setStorage("selectedStreamingProviders", selectedProviders)
}

function resetToDefault() {
    // Reset to default providers from storageHelper Defaults
    selectedProviders = Defaults.selectedStreamingProviders
    availableProviders = Object.keys(STREAMING_PROVIDERS).filter(key => !selectedProviders.includes(key))
    
    renderProviders()
    saveSettings()
    
    // Show confirmation message
    showNotification(t("settingsResetToDefault"), "success")
}

function showNotification(message, type = "info") {
    // Create a temporary notification element
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `
    
    // Set background color based on type
    if (type === "success") {
        notification.style.backgroundColor = "#4CAF50"
    } else if (type === "error") {
        notification.style.backgroundColor = "#F44336"
    } else {
        notification.style.backgroundColor = "#2196F3"
    }
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = "1"
        notification.style.transform = "translateX(0)"
    }, 100)
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = "0"
        notification.style.transform = "translateX(100%)"
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        }, 300)
    }, 3000)
}
