// sync time

document.addEventListener('DOMContentLoaded', async () => {
    let currentTime = await chrome.storage.local.get("time").then(o => o.time) || 3200;
    recordLength.value = currentTime;
});

recordLength.addEventListener("change", async () => {
    await chrome.storage.local.set({ time: Number(recordLength.value) });
});

M.Modal.init(modalConfirmClear, null);
clearConfirmed.addEventListener("click", () => {
    chrome.storage.local.set({ histories: [] });
});

exportHistories.addEventListener("click", async () => {
    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    let csvContents = "Name,Artist,Year\n"
    histories.forEach(history => {
        csvContents += `${history.name},${history.artist},${history.year}`
    })
    let a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csvContents], {type: "text/plain"}))
    a.download = "Librezam_histories.csv"
    a.click()
});

// sync background by retrieving background-image-style
document.addEventListener('DOMContentLoaded', async () => {
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
});
