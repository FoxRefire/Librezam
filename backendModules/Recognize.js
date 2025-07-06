import { shazamGuess } from "/backendModules/shazamGuess.js"
import { auddGuess } from "/backendModules/auddGuess.js"
import { acrGuess } from "/backendModules/acrGuess.js"

export async function Recognize(audio) {
    let recognizeBackend = await chrome.storage.local.get("backend").then(o => o.backend) || "shazam"
    let backendCall = null
    switch(recognizeBackend) {
        case "shazam":
            backendCall = shazamGuess
            break;
        case "audd":
            backendCall = auddGuess
            break
        case "acr":
            backendCall = acrGuess
            break
    }

    return await backendCall(audio)
}
