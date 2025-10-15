import { getStorage, setStorage } from "../storageHelper/storageHelper.js"
auddToken.value = await getStorage("auddToken")
auddToken.addEventListener("change", async () => {
    await setStorage("auddToken", auddToken.value)
})


// ACRCloud default credential checkbox
acrIsUseDefaultCredential.checked = await getStorage("acrIsUseDefaultCredential") || false
acrIsUseDefaultCredential.addEventListener("change", async () => {
    await setStorage("acrIsUseDefaultCredential", acrIsUseDefaultCredential.checked)
    updateAcrTextboxStates()
})

// Function to update textbox states based on checkbox
function updateAcrTextboxStates() {
    const isDisabled = acrIsUseDefaultCredential.checked
    acrHost.disabled = isDisabled
    acrKey.disabled = isDisabled
    acrSecret.disabled = isDisabled
}

acrHost.value = await getStorage("acrHost")
acrHost.addEventListener("change", async () => {
    await setStorage("acrHost", acrHost.value)
})
acrKey.value = await getStorage("acrKey")
acrKey.addEventListener("change", async () => {
    await setStorage("acrKey", acrKey.value)
})
acrSecret.value = await getStorage("acrSecret")
acrSecret.addEventListener("change", async () => {
    await setStorage("acrSecret", acrSecret.value)
})

// Initialize textbox states
updateAcrTextboxStates()
let currentAcrMode = await getStorage("acrMode")
document.querySelectorAll("#acrMode input").forEach(radio => {
    if (radio.value === currentAcrMode) {
        radio.checked = true
    }
});
document.getElementById("acrMode").addEventListener("change", async (event) => {
    if (event.target.type === "radio") {
        await setStorage("acrMode", event.target.value)
    }
});

let currentTencentMode = await getStorage("tencentMode")
document.querySelectorAll("#tencentMode input").forEach(radio => {
    if (radio.value === currentTencentMode) {
        radio.checked = true
    }
});
document.getElementById("tencentMode").addEventListener("change", async (event) => {
    if (event.target.type === "radio") {
        await setStorage("tencentMode", event.target.value)
    }
});