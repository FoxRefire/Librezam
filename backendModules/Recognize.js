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
    
    // Generate all possible streaming links
    const streamingLinks = {
        apple: `https://music.apple.com/search?term=${query}`,
        deezer: `https://www.deezer.com/search/${query}`,
        spotify: `https://open.spotify.com/search/${query}`,
        youtube: `https://www.youtube.com/results?search_query=${query}`,
        youtube_music: `https://music.youtube.com/search?q=${query}`,
        kkbox: `https://www.kkbox.com/tw/tc/search.php?word=${query}`,
        soundcloud: `https://soundcloud.com/search?q=${query}`,
        tidal: `https://tidal.com/search?q=${query}`,
        qq_music: `https://y.qq.com/n/ryqq/search?w=${query}`,
        netease_music: `https://music.163.com/#/search/m/?s=${query}`,
        google_search: `https://www.google.com/search?q=${query}`,
        duckduckgo_search: `https://duckduckgo.com/?q=${query}`,
        musicbrainz: `https://musicbrainz.org/search?query=${query}&type=recording`
    }
    
    // Add streaming links to result
    Object.keys(streamingLinks).forEach(provider => {
        if (!result[provider]) {
            result[provider] = streamingLinks[provider]
        }
    })
    
    return result
}
