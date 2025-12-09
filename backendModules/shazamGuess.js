import "/libs/shazam-api.min.js"

export async function shazamGuess(audio) {
    let pcm = await convertToPCM(audio)
    let response = await getResponse(pcm)
    console.log(JSON.stringify(response))

    return {
        title: response.track.title,
        artist: response.track.subtitle,
        album: response.track.sections[0].metadata[0]?.text || "",
        art: response.track.share.image,
        shazamLink: response.track.share.href || response.track.url
    }
}

async function convertToPCM(audio) {
    const audioContext = new AudioContext({
        sampleRate: 16000
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



async function getResponse(pcm) {
    let language = navigator.language.split("-")[0]
    let shazam = new ShazamAPI.Shazam({
        language
    })
    let samples = ShazamAPI.s16LEToSamplesArray(pcm);
    return await shazam.fullRecognizeSong(samples)
}
