document.addEventListener('DOMContentLoaded', async () => {
    let currentTime = await chrome.storage.local.get("time").then(o => o.time) || 3200
    currentRecordLength.innerText = currentTime
    recordLength.value = currentTime
})
recordLength.addEventListener("change", async () => {
    currentRecordLength.innerText = recordLength.value
    await chrome.storage.local.set({time: Number(recordLength.value)})
})