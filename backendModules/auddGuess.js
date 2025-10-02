import { getStorage } from "../storageHelper/storageHelper.js"
export async function auddGuess(audio) {
    let response = await getResponse(audio)
    console.log(JSON.stringify(response))
    let result = {
        title: response.result.title,
        artist: response.result.artist,
        year: response.result.release_date?.slice(0,4) || "",
        art: response.result.song_link+"?thumb"
    }
    if(response.result.apple_music?.url){
        result.apple = response.result.apple_music?.url
    }
    if(response.result.deezer?.link){
        result.deezer = response.result.deezer?.link
    }
    if(response.result.spotify?.external_urls.spotify){
        result.spotify = response.result.spotify?.external_urls.spotify
    }

    return result
}
async function getResponse(audio) {
    let body = new FormData()
    let auddToken = await getStorage("auddToken")
    body.append("api_token", auddToken)
    body.append("file", new Blob([audio]))
    body.append("return", "apple_music,spotify,deezer")

    return await fetch("https://api.audd.io/?jsonp=?", {
        method: "POST",
        body: body
    }).then(r => r.text()).then(t => JSON.parse(t.slice(2, -1)))
}
