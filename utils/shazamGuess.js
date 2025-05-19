import "/libs/shazam-api.min.js"
import { FFmpeg } from "/libs/ffmpeg/ffmpeg/dist/esm/index.js"

let reservedFFmpeg = reserveFFmpeg()

export async function shazamGuess(audio) {
    let pcm = await convertToPCM(audio, reservedFFmpeg)
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

function reserveFFmpeg() {
    let ffmpeg = new FFmpeg();
    let reserve = ffmpeg.load({
        coreURL: "/libs/ffmpeg/core/dist/esm/ffmpeg-core.js",
    })
    return [ffmpeg, reserve]
}

async function convertToPCM(audio, reservedFFmpeg) {
    let [ffmpeg, reserve] = reservedFFmpeg
    await reserve
    await ffmpeg.writeFile("audio.webm", new Uint8Array(audio));
    await ffmpeg.exec([
        "-i", "audio.webm",
        "-ar", "16000",
        "-ac", "1",
        "-f", "s16le",
        "-y",
        "out.pcm"
    ])
    return await ffmpeg.readFile("out.pcm");
}

async function getResponse(pcm) {
    let shazam = new Shazam.Shazam()
    let samples = Shazam.s16LEToSamplesArray(pcm);
    return await shazam.fullRecognizeSong(samples)
}
