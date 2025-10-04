import { getStorage } from "../storageHelper/storageHelper.js"

export async function tencentGuess(audio) {
    let pcm = await convertToPCM(audio)
    let response = await getResponse(pcm)
    console.log(JSON.stringify(response))

    return {
        title: response.songlist[0].songname,
        artist: response.songlist[0]?.singername,
        album: response.songlist[0]?.albumname,
        art: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${response.songlist[0]?.albummid}.jpg`
    }
}

async function convertToPCM(audio) {
    const audioContext = new AudioContext({
        sampleRate: 8000
    });

    const audioBuffer = await audioContext.decodeAudioData(new Uint8Array(audio).buffer);
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;

    const pcmData = new Int16Array(length);

    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let ch = 0; ch < numChannels; ch++) {
            sum += audioBuffer.getChannelData(ch)[i];
        }
        let mixed = sum / numChannels;

        pcmData[i] = Math.max(-32768, Math.min(32767, mixed * 32767));
    }

    return new Uint8Array(pcmData.buffer);
}

let b64 = {
    decode: s => decodeURIComponent(escape(atob(s))),
    encode: b => btoa(Array.from(new Uint8Array(b)).map(e => String.fromCharCode(e)).join(""))
}

async function getResponse(pcm) {
    let sessionId = Date.now()
    
    // Get the current mode setting
    let tencentMode = await getStorage("tencentMode")
    let response
    
    if (tencentMode === "humming") {
        // Humming mode only (fpType=4)
        response = await makeRequest(pcm, sessionId, 4)
    } else if (tencentMode === "original") {
        // Original mode only (fpType=5)
        response = await makeRequest(pcm, sessionId, 5)
    } else { // "both" mode
        // Try original mode first (fpType=5)
        response = await makeRequest(pcm, sessionId, 5)
        
        // If original didn't match, try humming mode (fpType=4)
        if (response.message === "not_match") {
            response = await makeRequest(pcm, sessionId, 4)
        }
    }
    
    response.songlist?.forEach(song => {
        song.songname = b64.decode(song.songname)
        song.singername = b64.decode(song.singername)
        song.albumname = b64.decode(song.albumname)
    })

    return response
}

async function makeRequest(pcm, sessionId, fpType) {
    return await fetch(`https://c6.y.qq.com/youtu/humming/search?sessionid=${sessionId}&recognizetype=1&fpType=${fpType}`, {
        method: "POST",
        body: b64.encode(pcm)
    }).then(r => r.json())
}
