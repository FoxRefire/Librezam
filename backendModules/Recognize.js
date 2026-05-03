import { shazamGuess } from "/backendModules/shazamGuess.js"
import { auddGuess } from "/backendModules/auddGuess.js"
import { acrGuess } from "/backendModules/acrGuess.js"
import { tencentGuess } from "/backendModules/tencentGuess.js"
import { neteaseGuess } from "/backendModules/neteaseGuess.js"
import { STREAMING_PROVIDERS } from "/common/streamingProviders.js"

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
    const query = encodeURIComponent(`${result.title} ${result.artist}`)

    // Generate all possible streaming links
    const streamingLinks = {}
    for (const [providerKey, provider] of Object.entries(STREAMING_PROVIDERS)) {
        if (providerKey === 'musicbrainz') {
            streamingLinks[providerKey] = provider.url.replace('$s', `${encodeURIComponent(result.title)}+AND+artist%3A${encodeURIComponent(result.artist)}`)
        } else {
            streamingLinks[providerKey] = provider.url.replace('$s', query)
        }
    }

    // Add streaming links to result
    for (const provider of Object.keys(streamingLinks)) {
        if (!result[provider]) {
            result[provider] = streamingLinks[provider]
        }
    }

    return result
}
