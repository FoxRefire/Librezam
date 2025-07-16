let sitesNoDouble = [
    "soundcloud.com"
]

let sitesNoAppend = [
    "osu.ppy.sh"
]

let originalPlay = HTMLMediaElement.prototype.play
HTMLMediaElement.prototype.play = function (...args) {
    if(testHost(sitesNoDouble)) {
        this.classList.add("librezamFlag")
    }
    if(!this.isConnected && this.tagName == "AUDIO" && !testHost(sitesNoAppend)) {
        document.body.append(this)
        console.log("Headless element appended", this)
    }

    return originalPlay.apply(this, args)
}

function testHost(hosts){
    return hosts.includes(location.hostname)
}
