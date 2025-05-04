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

// sync background by retrieving background-image-style (no further communication needed across different html pages)

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('selectedBackgroundImage', (data) => {
        if (data.selectedBackgroundImage) {
            document.body.style.backgroundImage = data.selectedBackgroundImage;
        }
    });

    document.querySelectorAll('.bg-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            const bgImage = opt.style.backgroundImage;
            document.body.style.backgroundImage = bgImage;
            chrome.storage.local.set({ selectedBackgroundImage: bgImage });
        });
    });
});

/*
// sync background by retrieving bg-opt-# (requires cross communication between guess files and settings files)

document.addEventListener('DOMContentLoaded', async () => {
    chrome.storage.local.get('selectedBackgroundClass', (data) => {
        if (data.selectedBackgroundClass) {
            const savedOpt = document.querySelector(`.${data.selectedBackgroundClass}`);
            if (savedOpt) {
                document.body.style.backgroundImage = savedOpt.style.backgroundImage;
            }
        }
    });
    document.querySelectorAll('.bg-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            const bgClass = opt.classList.value.split(' ').find(cls => cls.startsWith('bg-opt-'));
            if (bgClass) {
                document.body.style.backgroundImage = opt.style.backgroundImage;
                chrome.storage.local.set({ selectedBackgroundClass: bgClass });
            }
        });
    });
});
*/
