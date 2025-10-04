let originalPlay = HTMLMediaElement.prototype.play
HTMLMediaElement.prototype.play = function (...args) {
    if(!this.isConnected && this.tagName == "AUDIO") {
        document.body.append(this)
        console.log("Headless element appended", this)
    }

    return originalPlay.apply(this, args)
}