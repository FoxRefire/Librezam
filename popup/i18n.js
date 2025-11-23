// i18n helper functions for browser extension
// Supports both Chrome and Firefox

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
 * Get a translated message
 * @param {string} key - Message key
 * @param {string|string[]} substitutions - Optional substitutions for placeholders
 * @returns {string} Translated message
 */
export function t(key, substitutions) {
    const i18n = getI18n();
    return i18n.getMessage(key, substitutions);
}

/**
 * Translate all elements with data-i18n attribute
 * This should be called after DOM is loaded
 */
export function translatePage() {
    const i18n = getI18n();
    
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
        
        const message = i18n.getMessage(key, subs);
        if (message) {
            if (element.tagName === 'INPUT' && element.type === 'text' || element.tagName === 'INPUT' && element.type === 'hidden') {
                element.placeholder = message;
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
        const message = i18n.getMessage(key);
        if (message) {
            element.title = message;
        }
    });
    
    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria-label');
        const message = i18n.getMessage(key);
        if (message) {
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
    document.addEventListener('DOMContentLoaded', () => {
        translatePage();
        translateManifest();
    });
} else {
    translatePage();
    translateManifest();
}

