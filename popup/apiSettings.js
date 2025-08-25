import { getStorage, setStorage } from "../storageHelper/storageHelper.js"
auddToken.value = await getStorage("auddToken")
auddToken.addEventListener("change", async () => {
    await setStorage("auddToken", auddToken.value)
})

acrHost.value = await getStorage("acrHost")
acrHost.addEventListener("change", async () => {
    await setStorage("acrHost", acrHost.value)
})
acrKey.value = await getStorage("acrKey")
acrKey.addEventListener("change", async () => {
    await setStorage("acrKey", acrKey.value)
})
acrSecret.value = await getStorage("acrSecret")
acrSecret.addEventListener("change", async () => {
    await setStorage("acrSecret", acrSecret.value)
})
