import { getStorage, setStorage } from "../storageHelper/storageHelper.js"
import { t, reloadTranslations, translatePage } from "./i18n.js"

isRecordAnotherTab.checked = await getStorage("isRecordAnotherTab")
isRecordAnotherTab.addEventListener("change", () => {
    setStorage("isRecordAnotherTab", isRecordAnotherTab.checked)
})

// Capture Method setting
const captureMethodSelect = document.getElementById("captureMethodSelect")
const captureMethodContainer = document.getElementById("captureMethodContainer")

// Check if chrome.tabCapture exists (Chrome only feature)
if (typeof chrome !== 'undefined' && chrome.tabCapture) {
    captureMethodContainer.style.display = "block"
    
    const savedCaptureMethod = await getStorage("captureMethod")
    captureMethodSelect.value = savedCaptureMethod
    
    captureMethodSelect.addEventListener("change", async (e) => {
        const selectedMethod = e.target.value
        await setStorage("captureMethod", selectedMethod)
    })
    
    // Translation handling for capture method options
    setTimeout(() => {
        const methodOptions = {
            "contentScript": "captureMethodContentScript",
            "tabCapture": "captureMethodTabCapture"
        }
        
        captureMethodSelect.querySelectorAll('option').forEach(option => {
            const methodKey = methodOptions[option.value]
            if (methodKey) {
                const translated = t(methodKey)
                if (translated && translated !== methodKey) {
                    option.textContent = translated
                }
            }
        })
    }, 100)
}

// Language setting
const languageSelect = document.getElementById("languageSelect")
const savedLanguage = await getStorage("language") || "auto"
languageSelect.value = savedLanguage

// Wait for i18n to translate options, then ensure they are translated
// The translatePage() function should handle this, but we ensure it's done
setTimeout(() => {
    const languageOptions = {
        "auto": "languageAuto",
        "en": "languageEnglish",
        "ja": "languageJapanese",
        "de": "languageGerman",
        "fr": "languageFrench",
        "ko": "languageKorean",
        "ru": "languageRussian",
        "zh_CN": "languageSimplifiedChinese",
        "zh_TW": "languageTraditionalChinese",
        "es": "languageSpanish",
        "it": "languageItalian"
    }
    
    // Update option labels with translations if not already translated
    languageSelect.querySelectorAll('option').forEach(option => {
        const langKey = languageOptions[option.value]
        if (langKey) {
            const translated = t(langKey)
            if (translated && translated !== langKey) {
                option.textContent = translated
            }
        }
    })
}, 100)

languageSelect.addEventListener("change", async (e) => {
    const selectedLanguage = e.target.value
    await setStorage("language", selectedLanguage)
    
    // Reload translations with new language
    await reloadTranslations()
    
    // Re-translate the page
    await translatePage()
    
    // Update option labels with new translations
    const languageOptions = {
        "auto": "languageAuto",
        "en": "languageEnglish",
        "ja": "languageJapanese",
        "de": "languageGerman",
        "fr": "languageFrench",
        "ko": "languageKorean",
        "ru": "languageRussian",
        "zh_CN": "languageSimplifiedChinese",
        "zh_TW": "languageTraditionalChinese",
        "es": "languageSpanish",
        "it": "languageItalian"
    }
    
    languageSelect.querySelectorAll('option').forEach(option => {
        const langKey = languageOptions[option.value]
        if (langKey) {
            option.textContent = t(langKey)
        }
    })
    
    // Update capture method option labels if visible
    if (captureMethodContainer.style.display !== "none") {
        const methodOptions = {
            "contentScript": "captureMethodContentScript",
            "tabCapture": "captureMethodTabCapture"
        }
        
        captureMethodSelect.querySelectorAll('option').forEach(option => {
            const methodKey = methodOptions[option.value]
            if (methodKey) {
                option.textContent = t(methodKey)
            }
        })
    }
    
    // Show success notification
    if (window.M && M.toast) {
        M.toast({ 
            html: t("languageChangeRequiresReload"),
            displayLength: 2000
        })
    }
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
