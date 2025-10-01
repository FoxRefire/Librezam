export async function neteaseGuess(audio) {
    let pcm = await convertToPCM(audio)
    let response = await getResponse(pcm)
    console.log(JSON.stringify(response))

    return {
        title: response[0].song.name,
        artist: response[0].song?.artists?.[0]?.name,
        year: response[0].song.album?.name,
        apple: "",
        deezer: "",
        spotify: "",
        youtube: "",
        art: response[0].song.album?.picUrl
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

    return monoData.buffer
}

async function getResponse(pcm) {
    let response = await fetch(`https://ncm-recognizer-proxy-0vx43g2d4hq2.foxrefire.deno.net/api`, {
        method: "POST",
        body: pcm
    }).then(r => r.json())
    return response
}
