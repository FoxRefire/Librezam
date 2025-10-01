import { getStorage, setStorage } from "../storageHelper/storageHelper.js"

// Show coverart on recognized
isShowCoverart.checked = await getStorage("isShowCoverart")
isShowCoverart.addEventListener("change", () => {
    setStorage("isShowCoverart", isShowCoverart.checked)
})

isRecordAnotherTab.checked = await getStorage("isRecordAnotherTab")
isRecordAnotherTab.addEventListener("change", () => {
    setStorage("isRecordAnotherTab", isRecordAnotherTab.checked)
})

// Background theme
let currBgImage = await getStorage("bgImage")
document.querySelectorAll('.bg-opt').forEach(opt => {
    opt.style.backgroundImage == currBgImage && opt.classList.add("bg-selected")
    opt.addEventListener('click', () => {
        const bgImage = opt.style.backgroundImage;
        document.body.style.backgroundImage = bgImage;
        setStorage("bgImage", bgImage)
        document.querySelector(".bg-selected").classList.remove("bg-selected")
        opt.classList.add("bg-selected")
    });
});