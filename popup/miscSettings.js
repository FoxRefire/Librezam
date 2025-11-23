import { getStorage, setStorage } from "../storageHelper/storageHelper.js"
import { t, reloadTranslations, translatePage } from "./i18n.js"

// Show coverart on recognized
isShowCoverart.checked = await getStorage("isShowCoverart")
isShowCoverart.addEventListener("change", () => {
    setStorage("isShowCoverart", isShowCoverart.checked)
})

isRecordAnotherTab.checked = await getStorage("isRecordAnotherTab")
isRecordAnotherTab.addEventListener("change", () => {
    setStorage("isRecordAnotherTab", isRecordAnotherTab.checked)
})

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