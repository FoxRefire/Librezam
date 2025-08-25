import "/libs/shazam-api.min.js"

export async function shazamGuess(audio) {
    let pcm = await convertToPCM(audio)
    let response = await getResponse(pcm)
    console.log(JSON.stringify(response))

    return {
        title: response.track.title,
        artist: response.track.subtitle,
        year: response.track.sections[0].metadata[2]?.text || "",
        apple: response.track.hub.options[0].actions[0]?.uri,
        deezer: response.track.hub.providers[1].actions[0].uri.replace("deezer-query://", "https://"),
        spotify: "https://open.spotify.com/search/" + response.track.hub.providers[0].actions[0].uri.slice(15),
        youtube: "https://www.youtube.com/results?search_query=" + response.track.hub.providers[0].actions[0].uri.slice(15),
        art: response.track.share.image
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
    const targetSampleRate = 16000;
    const duration = audioBuffer.duration; // 秒
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



async function getResponse(pcm) {
    let shazam = new ShazamAPI.Shazam()
    let samples = ShazamAPI.s16LEToSamplesArray(pcm);
    return await shazam.fullRecognizeSong(samples)
}
