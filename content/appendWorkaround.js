async function mainInjector() {
    const { getStorage } = await import(chrome.runtime.getURL("../storageHelper/storageHelper.js"))
    if(await getStorage("enableExperimentalFix") && !await testHostByKey("noAppendHosts")) {
        injectScript("fixAudioBufferSourceNode.js")
    }
    if(await testHostByKey("noDoubleHosts")) {
        injectScript("fixAudioDuplication.js")
    }
    if(!await testHostByKey("noAppendHosts")) {
        injectScript("fixHeadlessAudio.js")
    }
    if(await testHostByKey("corsHosts")) {
        injectScript("fixCORSFalseNegative.js")
    }

}
function injectScript(src) {
    if(document instanceof HTMLDocument) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = chrome.runtime.getURL("/content/" + src);
        (document.head || document.documentElement).appendChild(script);
    }
}
async function testHostByKey(key){
    const { getStorage } = await import(chrome.runtime.getURL("../storageHelper/storageHelper.js"))
    let hosts = await getStorage(key)
    return hosts.includes(location.hostname)
}

mainInjector()