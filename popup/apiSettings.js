auddToken.value = await chrome.storage.local.get("auddToken").then(o => o.auddToken) || "test"
auddToken.addEventListener("change", async () => {
    await chrome.storage.local.set({ auddToken: auddToken.value })
})

acrHost.value = await chrome.storage.local.get("acrHost").then(o => o.acrHost) || ""
acrHost.addEventListener("change", async () => {
    await chrome.storage.local.set({ acrHost: acrHost.value })
})
acrKey.value = await chrome.storage.local.get("acrKey").then(o => o.acrKey) || ""
acrKey.addEventListener("change", async () => {
    await chrome.storage.local.set({ acrKey: acrKey.value })
})
acrSecret.value = await chrome.storage.local.get("acrSecret").then(o => o.acrSecret) || ""
acrSecret.addEventListener("change", async () => {
    await chrome.storage.local.set({ acrSecret: acrSecret.value })
})
