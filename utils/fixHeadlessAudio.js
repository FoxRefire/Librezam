let sitesNoDouble = [
"soundcloud.com"
]

let originalPlay = HTMLMediaElement.prototype.play
HTMLMediaElement.prototype.play = function (...args) {
    if(sitesNoDouble.includes(location.hostname)) {
        this.classList.add("librezamFlag")
    }
    if(!isElemDOMAppended(this)) {
        document.body.append(this)
        console.log("Workaround injected")
    }

    return originalPlay.apply(this, args)
}

function isElemDOMAppended(elem){
    if(elem.parentNode == null) {
        return false
    } else if(elem.parentNode.constructor.name.match("^(HTMLDocument|ShadowRoot)$")) {
        return true
    } else {
        return isElemDOMAppended(elem.parentNode)
    }
}
