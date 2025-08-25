export const Defaults = {
    isShowCoverart: false,
    bgImage: 'url("/images/background-2.jpg")',
    fallbackRules: {"3500":["shazam"],"7200":["shazam"],"12000":["shazam"]},
    histories: [],
    auddToken: "test",
    acrHost: "",
    acrKey: "",
    acrSecret: ""
}

export async function getStorage(key) {
    return await chrome.storage.local.get(key).then(o => o[key])
        ?? Defaults[key] 
        ?? undefined
}

export async function setStorage(key, value) {
    return await chrome.storage.local.set({ [key]: value })
}
