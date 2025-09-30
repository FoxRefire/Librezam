import { shazamGuess } from "/backendModules/shazamGuess.js"
import { auddGuess } from "/backendModules/auddGuess.js"
import { acrGuess } from "/backendModules/acrGuess.js"
import { tencentGuess } from "/backendModules/tencentGuess.js"
import { neteaseGuess } from "/backendModules/neteaseGuess.js"

export async function Recognize(audio, backend) {
    console.log(audio)
    let backendCall = null
    switch(backend) {
        case "shazam":
            backendCall = shazamGuess
            break;
        case "audd":
            backendCall = auddGuess
            break
        case "acr":
            backendCall = acrGuess
            break
        case "tencent":
            backendCall = tencentGuess
            break
        case "netease":
            backendCall = neteaseGuess
            break
    }

    return await backendCall(audio)
}
