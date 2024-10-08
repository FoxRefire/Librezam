document.addEventListener('DOMContentLoaded', async () => {
    let currentTime = await chrome.storage.local.get("time").then(o => o.time) || 3200
    recordLength.value = currentTime
})
recordLength.addEventListener("change", async () => {
    await chrome.storage.local.set({time: Number(recordLength.value)})
})

M.Modal.init(modalConfirmClear, null)
clearConfirmed.addEventListener("click", () => {
    chrome.storage.local.set({histories: []})
})
