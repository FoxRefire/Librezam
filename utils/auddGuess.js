export async function auddGuess(audio) {
    let response = await getResponse(audio)
    console.log(JSON.stringify(response))
    return {
        title: response.result.title,
        artist: response.result.artist,
        year: response.result.release_date?.slice(0,4) || "",
        apple: response.result.apple_music?.url || "",
        deezer: response.result.deezer?.link || "",
        spotify: response.result.spotify?.external_urls.spotify || "",
        youtube: "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${response.result.title} ${response.result.artist}`),
        art: response.result.song_link+"?thumb"
    }
}
async function getResponse(audio) {
    let body = new FormData()
    body.append("api_token", "test")
    body.append("file", new Blob([audio]))
    body.append("return", "apple_music,spotify,deezer")

    return await fetch("https://api.audd.io/?jsonp=?", {
        method: "POST",
        body: body
    }).then(r => r.text()).then(t => JSON.parse(t.slice(2, -1)))
}
