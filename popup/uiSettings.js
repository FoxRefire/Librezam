// Show coverart on recognized
isShowCoverart.checked = await chrome.storage.local.get("isShowCoverart").then(o => o.isShowCoverart) || false
isShowCoverart.addEventListener("change", async () => {
    await chrome.storage.local.set({ isShowCoverart: isShowCoverart.checked })
})

// Background theme
let currBgImage = await chrome.storage.local.get("bgImage").then(d => d.bgImage) || 'url("/images/background-2.jpg")'
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