import { getStorage, Defaults } from "../storageHelper/storageHelper.js"
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
    let host, accessKey, accessSecret
    if(await getStorage("acrIsUseDefaultCredential")){
        [host, accessKey, accessSecret] = await getDefaultCredential()
    }else{
        [host, accessKey, accessSecret] = [
            await getStorage("acrHost"),
            await getStorage("acrKey"),
            await getStorage("acrSecret")
        ]
    }
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

async function getDefaultCredential(){
    // Proprietary! AGPL exception DO NOT use these credentials outside of Librezam.
    // When using Librezam code in other projects, please ensure this function is removed.
    let dcs = [
        // ap-southeast
        "ZxXnFlPVDnXPyOfyEw1Mog==:IZ0crRNNBU53ZLruLu9wO9vXU8kOUmWAUeJlitvaXrEYvydgmRPnrARyAj79xT6BnZMOBSb13QM9oo9hHqteLRUr72OA9cpobYaQcWLE1uJ9n0x8Zx//Vav1PH7DrUAtsO1l6ycR5VQG+IlBhco88g==",
        "SoFfeRa1PsVrizlysqXfsg==:T1s6hCZNypOr+hRrR4pPtVncJG4lQpIakshRwAqJjW80ujzbb+xnvYNExpBgDq459uMz6BsfoZnhTzQDYSmIW5T979d1RQWAKkgzSL3gsAd44p56ImSK4GlbGpwLd170Lua93WT01H/diMt2jSI2+w==",
        // us-west-2
        "lqp3M7tzMbVsuYFaIExeVA==:k/vID+e5fIrjNlgbR9VDPwuaU41kq4VBsbmXdQ0+77rgA1rSzFsjcOUfBGMsFSpmg/0wtM5ekrdVVgQnfb8QYr0zHNxFgDCmas8J9LhfRc+oMcjlNe4tXCzIiADfXeS0DVq/Y2+M/NeTaU72cgnuqg==",
        "c+JeugKci5vqnerPvzlFxA==:C7oJaW1FFVoRkfNt+gJHAPEOC+Iwu6g9foFoTxJpu2u3IpdSfD3VarzhsMM2RdlN4sonr9MJ0JXnSUU0Nte9/UR7J9C5IbIAJOmbSmZ0mMljlDqFrifTEh+hYIzC6cszAkfRuPQJJW7r0bvnYA9TLQ==",
        "ir1G5+fljNZJcWpi1zeNTQ==:sI3ooVqd3eypIGJxh4DCQagaN2OgV9yPIk9edkwPnLKr7ZlR+Yd4Vfx33oPfJBgTWKGiCsBppcwXjJARnbe4JYXW9x5mO7hrNs8zqK28eEgXUI1TprQ/OgKjSi8RTpTkKgIceeDKVeiVNFf4Jt9wWw==",
        // eu-west-1
        "UH+kgHBRkin5RB4/H46aFQ==:nN+JcUfKM4qZa+5/C2VZ0lwhMjLc2dDumTuasvdWfAQNE6nvXJprmH/k5P7YZ5TGQxciXVifgSIAJBwylxqHOL/5LuBWKqkiybg9QFJ7Ej6LXPKix6CjTsqIQ+YoEfWukXaiPDw85cwwCCr8AaF2cQ==",
        "9bqodp/qzd0T5eOF9toZsg==:GpqCl5TFro+g7sYubFzcmLfmcCoIPPxV719t4GQgGNU80rdKvOLYKj4jbOgQwLujHBPHOjZkRhGE4bcvOk8ahLXM00f5qC18no+LzIRBpvdEbbI2/6PkfO+2vBStZZPHZrzQAo7F0POMtbrkvS/8Sg=="
    ]

    const [ivB64,encB64]=dcs[Math.floor(Math.random() * dcs.length)].split(":");
    const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(`${chrome.runtime.getManifest().name}-${Defaults.sk}`),"PBKDF2",false,["deriveKey"]);
    const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:new TextEncoder().encode("s"),iterations:1e5,hash:"SHA-256"},k,{name:"AES-CBC",length:256},false,["decrypt"]);
    const dec=await crypto.subtle.decrypt({name:"AES-CBC",iv:Uint8Array.from(atob(ivB64),c=>c.charCodeAt(0))},key,Uint8Array.from(atob(encB64),c=>c.charCodeAt(0)));
    return new TextDecoder().decode(dec).split(':');
}
