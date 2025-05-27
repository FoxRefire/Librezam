let sites = [
"soundcloud.com",
"www.watzatsong.com",
"radiko.jp",
"www.radiojapan.org"
]

let sitesNoDouble = [
"soundcloud.com"
]

console.log("Workaround injected")

if(sites.includes(location.hostname)) {
    let originalPlay = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (...args) {
        if(sitesNoDouble.includes(location.hostname)) {
            this.classList.add("librezamFlag")
        }
        document.body.append(this)
        return originalPlay.apply(this, args)
    }
}

