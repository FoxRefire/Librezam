export async function tencentGuess(audio) {
    let pcm = await convertToPCM(audio)
    let response = await getResponse(pcm)
    console.log(JSON.stringify(response))

    return {
        title: response.songlist[0].songname,
        artist: response.songlist[0].singername,
        year: response.songlist[0].albumname,
        apple: "",
        deezer: "",
        spotify: "",
        youtube: "",
        art: ""
    }
}

async function convertToPCM(audio) {
    // Create AudioContext
    const audioContext = new AudioContext();

    // Convert to ArrayBuffer
    const arrayBuffer = (audio instanceof ArrayBuffer) ? audio : new Uint8Array(audio).buffer;

    // Decode it
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Original sampleRates
    const inputSampleRate = audioBuffer.sampleRate;
    const inputChannels = audioBuffer.numberOfChannels;
    const inputLength = audioBuffer.length;

    // ---- Monauralize it ----
    const monoData = new Float32Array(inputLength);
    for (let i = 0; i < inputLength; i++) {
        let sum = 0;
        for (let ch = 0; ch < inputChannels; ch++) {
            sum += audioBuffer.getChannelData(ch)[i];
        }
        monoData[i] = sum / inputChannels;
    }

    // ---- Resample to 16khz ----
    const targetSampleRate = 8000;
    const duration = audioBuffer.duration;
    const outputLength = Math.round(duration * targetSampleRate);
    const offlineCtx = new OfflineAudioContext(1, outputLength, targetSampleRate);

    // Create Mono AudioBuffer
    const monoBuffer = offlineCtx.createBuffer(1, inputLength, inputSampleRate);
    monoBuffer.copyToChannel(monoData, 0);

    // Create BufferSource
    const source = offlineCtx.createBufferSource();
    source.buffer = monoBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    // Render it
    const resampledBuffer = await offlineCtx.startRendering();

    // ---- Convert to int16(s16le) ----
    const channelData = resampledBuffer.getChannelData(0);
    const pcmData = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return new Uint8Array(pcmData.buffer);
}

let b64 = {
    decode: s => decodeURIComponent(escape(atob(s))),
    encode: b => btoa(Array.from(new Uint8Array(b)).map(e => String.fromCharCode(e)).join(""))
}

async function getResponse(pcm) {
    let sessionId = Date.now()
    let response = await fetch(`https://c6.y.qq.com/youtu/humming/search?sessionid=${sessionId}&recognizetype=1&fpType=5`, {
        method: "POST",
        body: b64.encode(pcm)
    }).then(r => r.json())

    response.songlist.forEach(song => {
        song.songname = b64.decode(song.songname)
        song.singername = b64.decode(song.singername)
        song.albumname = b64.decode(song.albumname)
    })

    return response
}
