import { getStorage, setStorage } from "../storageHelper/storageHelper.js"
// Clear History
M.Modal.init(modalConfirmClear, null);
clearConfirmed.addEventListener("click", () => {
    setStorage("histories", [])
});

// Export CSV
exportHistories.addEventListener("click", async () => {
    let histories = await getStorage("histories") || []
    let csvContents = "Title,Artist,Album,Timestamp\n"
    histories.forEach(history => {
        const timestamp = history.timestamp ? new Date(history.timestamp).toISOString() : ""
        csvContents += `"${history.title}","${history.artist}","${history.album || ""}","${timestamp}"\n`
    })
    let a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csvContents], {type: "text/plain"}))
    a.download = "Librezam_histories.csv"
    a.click()
});