// Clear History
M.Modal.init(modalConfirmClear, null);
clearConfirmed.addEventListener("click", () => {
    chrome.storage.local.set({ histories: [] });
});

// Export CSV
exportHistories.addEventListener("click", async () => {
    let histories = await chrome.storage.local.get("histories").then(o => o.histories) || []
    let csvContents = "Title,Artist\n"
    histories.forEach(history => {
        csvContents += `${history.title},${history.artist}\n`
    })
    let a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csvContents], {type: "text/plain"}))
    a.download = "Librezam_histories.csv"
    a.click()
});