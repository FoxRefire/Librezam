import { getStorage, setStorage, Defaults } from "../storageHelper/storageHelper.js"

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

// Export all settings and histories as JSON
exportAllData.addEventListener("click", async () => {
    try {
        const allData = {}
        
        // Get all settings from Defaults keys
        for (const key of Object.keys(Defaults)) {
            allData[key] = await getStorage(key)
        }
        
        // Add metadata
        allData._metadata = {
            exportDate: new Date().toISOString(),
            version: "1.0",
            description: "Librezam settings and recognition history export"
        }
        
        const jsonString = JSON.stringify(allData, null, 2)
        const blob = new Blob([jsonString], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `Librezam_backup_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        
        URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Export failed:", error)
        alert("エクスポートに失敗しました: " + error.message)
    }
});

// Import settings and histories from JSON
importAllData.addEventListener("click", () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.addEventListener('change', async (event) => {
        const file = event.target.files[0]
        if (!file) return
        
        try {
            const text = await file.text()
            const data = JSON.parse(text)
            
            // Validate metadata
            if (!data._metadata || !data._metadata.version) {
                throw new Error("無効なファイル形式です。Librezamのバックアップファイルを選択してください。")
            }
            
            // Confirm import
            const confirmed = confirm(
                "この操作は現在の設定と履歴を上書きします。\n" +
                "続行しますか？\n\n" +
                `バックアップ作成日: ${data._metadata.exportDate}\n` +
                `履歴数: ${data.histories ? data.histories.length : 0}件`
            )
            
            if (!confirmed) return
            
            // Import all settings except metadata
            for (const [key, value] of Object.entries(data)) {
                if (key !== '_metadata' && Object.prototype.hasOwnProperty.call(Defaults, key)) {
                    await setStorage(key, value)
                }
            }
            
            alert("インポートが完了しました。ページを再読み込みしてください。")
            
        } catch (error) {
            console.error("Import failed:", error)
            alert("インポートに失敗しました: " + error.message)
        }
    })
    
    input.click()
});