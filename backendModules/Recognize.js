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

    return await backendCall(audio).then(result => addStreamLinks(result))
}

function addStreamLinks(result) {
    let query = encodeURIComponent(`${result.title} ${result.artist}`)
    if(!result.apple){
        result.apple = `https://music.apple.com/search?term=${query}`
    }
    if(!result.deezer){
        result.deezer = `https://www.deezer.com/search/${query}`
    }
    if(!result.spotify){
        result.spotify = `https://open.spotify.com/search/${query}`
    }
    if(!result.youtube){
        result.youtube = `https://www.youtube.com/results?search_query=${query}`
    }
    return result
}