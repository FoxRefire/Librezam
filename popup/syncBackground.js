import { getStorage } from "../storageHelper/storageHelper.js"
document.body.style.backgroundImage = await getStorage("bgImage")