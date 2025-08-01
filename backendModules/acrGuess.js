export async function acrGuess(audio) {
    let response = await getResponse(audio)
    console.log(JSON.stringify(response))
    let metadata = response.metadata?.music?.[0] || response.metadata?.humming?.[0]

    return {
        title: metadata.title,
        artist: metadata.artists?.[0].name,
        year: metadata.release_date?.slice(0,4) || "",
        apple: "https://music.apple.com/search?term=" + encodeURIComponent(`${metadata.title} ${metadata?.artists?.[0].name}`),
        deezer: `https://www.deezer.com/track/${metadata.external_metadata?.deezer?.track?.id}`,
        spotify: `https://open.spotify.com/track/${metadata.external_metadata?.spotify?.track?.id}`,
        youtube: `https://www.youtube.com/watch?v=${metadata.external_metadata?.youtube?.vid}`,
        art: ""
    }
}

async function getResponse(audio) {
    let body = new FormData()
    let host = await chrome.storage.local.get("acrHost").then(o => o.acrHost) || ""
    let accessKey = await chrome.storage.local.get("acrKey").then(o => o.acrKey) || ""
    let accessSecret = await chrome.storage.local.get("acrSecret").then(o => o.acrSecret) || ""
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
