// i18n helper functions for browser extension
// Supports both Chrome and Firefox

// Cache for loaded translation messages
let translationCache = null;
let currentLanguage = null;
let translationLoadPromise = null;

/**
 * Get the i18n API (chrome.i18n or browser.i18n)
 */
function getI18n() {
    if (typeof chrome !== 'undefined' && chrome.i18n) {
        return chrome.i18n;
    }
    if (typeof browser !== 'undefined' && browser.i18n) {
        return browser.i18n;
    }
    // Fallback for testing
    return {
        getMessage: (key, substitutions) => {
            console.warn(`i18n not available, returning key: ${key}`);
            return key;
        }
    };
}

/**
 * Load translation messages from a specific language
 * @param {string} langCode - Language code (e.g., 'en', 'ja', 'de')
 * @returns {Promise<Object>} Translation messages object
 */
async function loadTranslations(langCode) {
    try {
        const response = await fetch(`/_locales/${langCode}/messages.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${langCode}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`Failed to load translations for ${langCode}, falling back to browser default:`, error);
        return null;
    }
}

/**
 * Get the effective language code based on user preference
 * @returns {Promise<string>} Language code
 */
async function getEffectiveLanguage() {
    try {
        // Try to get saved language preference
        const savedLanguage = await chrome.storage.local.get('language').then(result => result.language);
        
        if (savedLanguage && savedLanguage !== 'auto') {
            return savedLanguage;
        }
        
        // Fall back to browser's i18n API
        const i18n = getI18n();
        const browserLang = i18n.getUILanguage ? i18n.getUILanguage() : navigator.language;
        
        // Map browser language to our supported languages
        const langMap = {
            'en': 'en',
            'ja': 'ja',
            'de': 'de',
            'fr': 'fr',
            'ko': 'ko',
            'ru': 'ru',
            'zh-CN': 'zh_CN',
            'zh-TW': 'zh_TW',
            'zh': 'zh_CN',
            'es': 'es',
            'it': 'it'
        };
        
        // Try exact match first
        if (langMap[browserLang]) {
            return langMap[browserLang];
        }
        
        // Try language code only (e.g., 'en' from 'en-US')
        const langCode = browserLang.split('-')[0];
        if (langMap[langCode]) {
            return langMap[langCode];
        }
        
        // Default to English
        return 'en';
    } catch (error) {
        console.warn('Error getting effective language:', error);
        return 'en';
    }
}

/**
 * Initialize translation system with user's preferred language
 */
async function initTranslations() {
    // If already loading, wait for it
    if (translationLoadPromise) {
        return translationLoadPromise;
    }
    
    // If already loaded for current language, return immediately
    const lang = await getEffectiveLanguage();
    if (lang === currentLanguage && translationCache) {
        return; // Already loaded
    }
    
    // Start loading
    translationLoadPromise = (async () => {
        currentLanguage = lang;
        translationCache = await loadTranslations(lang);
        
        // If loading failed, fall back to browser's i18n API
        if (!translationCache) {
            translationCache = null;
        }
        
        translationLoadPromise = null;
    })();
    
    return translationLoadPromise;
}

/**
 * Get a translated message (synchronous version for backward compatibility)
 * @param {string} key - Message key
 * @param {string|string[]} substitutions - Optional substitutions for placeholders
 * @returns {string} Translated message
 */
export function t(key, substitutions) {
    // If we have cached translations, use them
    if (translationCache && translationCache[key]) {
        let message = translationCache[key].message || key;
        
        // Handle substitutions
        if (substitutions) {
            const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
            subs.forEach((sub, index) => {
                message = message.replace(`$${index + 1}`, sub);
            });
        }
        
        return message;
    }
    
    // Fall back to browser's i18n API (will be used until translations are loaded)
    const i18n = getI18n();
    return i18n.getMessage(key, substitutions);
}

/**
 * Synchronous version of t() - alias for backward compatibility
 * @param {string} key - Message key
 * @param {string|string[]} substitutions - Optional substitutions for placeholders
 * @returns {string} Translated message
 */
export function tSync(key, substitutions) {
    return t(key, substitutions);
}

/**
 * Reload translations (call this when language is changed)
 */
export async function reloadTranslations() {
    translationCache = null;
    currentLanguage = null;
    translationLoadPromise = null;
    await initTranslations();
}

/**
 * Translate all elements with data-i18n attribute
 * This should be called after DOM is loaded
 */
export async function translatePage() {
    // Ensure translations are loaded
    await initTranslations();
    
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const substitutions = element.getAttribute('data-i18n-args');
        
        let subs = null;
        if (substitutions) {
            try {
                subs = JSON.parse(substitutions);
                if (!Array.isArray(subs)) {
                    subs = [subs];
                }
            } catch (e) {
                subs = [substitutions];
            }
        }
        
        const message = t(key, subs);
        if (message && message !== key) {
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'hidden')) {
                element.placeholder = message;
            } else if (element.tagName === 'OPTION') {
                element.textContent = message;
            } else if (element.hasAttribute('data-i18n-html')) {
                element.innerHTML = message;
            } else {
                element.textContent = message;
            }
        }
    });
    
    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const message = t(key);
        if (message && message !== key) {
            element.title = message;
        }
    });
    
    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria-label');
        const message = t(key);
        if (message && message !== key) {
            element.setAttribute('aria-label', message);
        }
    });
}

/**
 * Translate manifest strings (name, description, etc.)
 * This updates the page title and other manifest-related strings
 */
export function translateManifest() {
    const i18n = getI18n();
    
    // Update page title if it matches extension name
    if (document.title === 'Librezam' || !document.title) {
        const name = i18n.getMessage('extensionName');
        if (name) {
            document.title = name;
        }
    }
}

// Auto-translate on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await translatePage();
        translateManifest();
    });
} else {
    (async () => {
        await translatePage();
        translateManifest();
    })();
}

