// Recording Length
recordLength.value = await chrome.storage.local.get("time").then(o => o.time) || 3200
recordLength.addEventListener("change", async () => {
    await chrome.storage.local.set({ time: Number(recordLength.value) });
});

// Recognize Backend
recognizeBackend.value = await chrome.storage.local.get("backend").then(o => o.backend) || "shazam"
M.FormSelect.init(recognizeBackend,null)
recognizeBackend.addEventListener("change", async () => {
    await chrome.storage.local.set({ backend: recognizeBackend.value })
})

// Show coverart on recognized
isShowCoverart.checked = await chrome.storage.local.get("isShowCoverart").then(o => o.isShowCoverart) || false
isShowCoverart.addEventListener("change", async () => {
    await chrome.storage.local.set({ isShowCoverart: isShowCoverart.checked })
})

// Clear History
M.Modal.init(modalConfirmClear, null);
clearConfirmed.addEventListener("click", () => {
    chrome.storage.local.set({ histories: [] });
});

// Export CSV
exportHistories.addEventListener("click", async () => {
    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    let csvContents = "Title,Artist,Year\n"
    histories.forEach(history => {
        csvContents += `${history.title},${history.artist},${history.year}\n`
    })
    let a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csvContents], {type: "text/plain"}))
    a.download = "Librezam_histories.csv"
    a.click()
});

// Background theme
let currBgImage = await chrome.storage.local.get("bgImage").then(d => d.bgImage);
document.body.style.backgroundImage = currBgImage || "url('/images/background-2.jpg')";

document.querySelectorAll('.bg-opt').forEach(opt => {
    opt.style.backgroundImage == currBgImage && opt.classList.add("bg-selected")
    opt.addEventListener('click', () => {
        const bgImage = opt.style.backgroundImage;
        document.body.style.backgroundImage = bgImage;
        chrome.storage.local.set({ bgImage: bgImage });
        document.querySelector(".bg-selected").classList.remove("bg-selected")
        opt.classList.add("bg-selected")
    });
});
