import { getStorage, setStorage } from "../storageHelper/storageHelper.js"

// Helper function to filter empty lines from textarea values
const filterEmptyLines = (text) => text.split("\n").filter(line => line.trim() !== "")

// Helper function to setup checkbox storage
const setupCheckboxStorage = async (element, storageKey) => {
    element.checked = await getStorage(storageKey)
    element.addEventListener("change", () => {
        setStorage(storageKey, element.checked)
    })
}

// Helper function to setup textarea storage with empty line filtering
const setupTextareaStorage = async (element, storageKey) => {
    element.value = await getStorage(storageKey).then(hosts => hosts.join("\n"))
    element.addEventListener("change", () => {
        setStorage(storageKey, filterEmptyLines(element.value))
    })
}

// Initialize all form elements
await Promise.all([
    setupCheckboxStorage(enableExperimentalFix, "enableExperimentalFix"),
    setupTextareaStorage(noDoubleHosts, "noDoubleHosts"),
    setupTextareaStorage(noAppendHosts, "noAppendHosts"),
    setupTextareaStorage(corsHosts, "corsHosts")
])
