export const Defaults = {
    isRecordAnotherTab: false,
    bgImage: 'url("/images/background-2.jpg")',
    fallbackRules: {"3500":["shazam"],"7200":["shazam"],"12000":["shazam"]},
    histories: [],
    auddToken: "test",
    acrHost: "",
    acrKey: "",
    acrSecret: "",
    acrIsUseDefaultCredential: false,
    acrMode: "both",
    tencentMode: "both",
    selectedStreamingProviders: ["apple", "deezer", "spotify", "youtube"],
    enableExperimentalFix: false,
    noDoubleHosts: ["soundcloud.com"],
    noAppendHosts: ["osu.ppy.sh"],
    corsHosts: ["radio.garden"],
    sk: "da36b574-e869-41f5-8512-bc261615b84e",
    language: "auto",
    captureMethod: "contentScript"
}

export async function getStorage(key) {
    return await chrome.storage.local.get(key).then(o => o[key])
        ?? Defaults[key] 
        ?? undefined
}

export async function setStorage(key, value) {
    return await chrome.storage.local.set({ [key]: value })
}
