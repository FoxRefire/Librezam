export const Defaults = {
    isShowCoverart: false,
    isRecordAnotherTab: false,
    bgImage: 'url("/images/background-2.jpg")',
    fallbackRules: {"3500":["shazam"],"7200":["shazam"],"12000":["shazam"]},
    histories: [],
    auddToken: "test",
    acrHost: "",
    acrKey: "",
    acrSecret: "",
    acrMode: "both",
    tencentMode: "both",
    selectedStreamingProviders: ["apple", "deezer", "spotify", "youtube"],
    enableExperimentalFix: false,
    noDoubleHosts: ["soundcloud.com"],
    noAppendHosts: ["osu.ppy.sh"],
    corsHosts: ["radio.garden"]
}

export async function getStorage(key) {
    return await chrome.storage.local.get(key).then(o => o[key])
        ?? Defaults[key] 
        ?? undefined
}

export async function setStorage(key, value) {
    return await chrome.storage.local.set({ [key]: value })
}
