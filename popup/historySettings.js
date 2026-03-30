import { getStorage, setStorage, Defaults } from "../common/storageHelper.js"
import { t } from "./i18n.js"

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
        alert(t('settingsExportFailed') + error.message)
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
                throw new Error(t('importedBackupFileFormatIsInvalid'))
            }
            
            // Confirm import
            const confirmed = confirm(t('confirmOverwritingSettings', [
                data._metadata.exportDate,
                data.histories ? data.histories.length : 0,
            ]))
            
            if (!confirmed) return
            
            // Import all settings except metadata
            for (const [key, value] of Object.entries(data)) {
                if (key !== '_metadata' && Object.prototype.hasOwnProperty.call(Defaults, key)) {
                    await setStorage(key, value)
                }
            }
            
            alert(t('settingsImportCompleted'))
            
        } catch (error) {
            console.error("Import failed:", error)
            alert(t('settingsImportFailed') + error.message)
        }
    })
    
    input.click()
});