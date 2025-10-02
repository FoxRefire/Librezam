import { getStorage } from "../storageHelper/storageHelper.js"
export async function acrGuess(audio) {
    let response = await getResponse(audio)
    console.log(JSON.stringify(response))
    
    // Get the current mode setting
    let acrMode = await getStorage("acrMode")
    let metadata = null
    
    // Select metadata based on mode
    if (acrMode === "original") {
        metadata = response.metadata?.music?.[0]
    } else if (acrMode === "humming") {
        metadata = response.metadata?.humming?.[0]
    } else { // "both" mode - try original first, then humming
        metadata = response.metadata?.music?.[0] || response.metadata?.humming?.[0]
    }
    
    let result = {
        title: metadata.title,
        artist: metadata.artists?.[0].name,
        album: metadata.album?.name
    }
    if(metadata.external_metadata?.deezer?.track?.id){
        result.deezer = `https://www.deezer.com/track/${metadata.external_metadata?.deezer?.track?.id}`
    }
    if(metadata.external_metadata?.spotify?.track?.id){
        result.spotify = `https://open.spotify.com/track/${metadata.external_metadata?.spotify?.track?.id}`
    }
    if(metadata.external_metadata?.youtube?.vid){
        result.youtube = `https://www.youtube.com/watch?v=${metadata.external_metadata?.youtube?.vid}`
    }

    return result
}

async function getResponse(audio) {
    let body = new FormData()
    let host = await getStorage("acrHost")
    let accessKey = await getStorage("acrKey")
    let accessSecret = await getStorage("acrSecret")
    let timestamp = (new Date()).getTime()/1000
    body.append("access_key", accessKey)
    body.append("data_type", "audio")
    body.append("signature_version", "1")
    body.append("signature", await createSignature(accessKey, accessSecret, timestamp))
    body.append("timestamp", timestamp)
    body.append("sample", new Blob([audio]))
    body.append("sample_bytes", audio.length)

    return await fetch(`https://${host}/v1/identify`, {
        method: "POST",
        body: body
    }).then(r => r.json())
}


async function createSignature(accessKey, accessSecret, timestamp) {
    let str = ["POST", "/v1/identify", accessKey, "audio", "1", timestamp].join("\n")
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(accessSecret),
        { name: 'HMAC', hash: { name: 'SHA-1' } },
        false,
        ['sign']
    )
    const data = new TextEncoder().encode(str)
    const signature = await crypto.subtle.sign('HMAC', key, data)
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
}
