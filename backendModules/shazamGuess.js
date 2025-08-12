import "/libs/shazam-api.min.js"

export async function shazamGuess(audio) {
    let pcm = await convertToPCM(audio)
    let response = await getResponse(pcm)
    console.log(JSON.stringify(response))

    return {
        title: response.track.title,
        artist: response.track.subtitle,
        year: response.track.sections[0].metadata[2]?.text || "",
        apple: response.track.hub.options[0].actions[0].uri,
        deezer: response.track.hub.providers[1].actions[0].uri.replace("deezer-query://", "https://"),
        spotify: "https://open.spotify.com/search/" + response.track.hub.providers[0].actions[0].uri.slice(15),
        youtube: "https://www.youtube.com/results?search_query=" + response.track.hub.providers[0].actions[0].uri.slice(15),
        art: response.track.share.image
    }
}

async function convertToPCM(audio) {
    const audioContext = new AudioContext({
        sampleRate: 16000
    });

    const audioBuffer = await audioContext.decodeAudioData(new Uint8Array(audio).buffer);
    const channelData = audioBuffer.getChannelData(0);
    const pcmData = new Int16Array(channelData.length);

    for (let i = 0; i < channelData.length; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32767));
    }

    return new Uint8Array(pcmData.buffer);
}

async function getResponse(pcm) {
    let shazam = new ShazamAPI.Shazam()
    let samples = ShazamAPI.s16LEToSamplesArray(pcm);
    return await shazam.fullRecognizeSong(samples)
}
