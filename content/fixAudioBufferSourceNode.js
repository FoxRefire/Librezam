// Keep original start method
const origStart = AudioBufferSourceNode.prototype.start;

// Create <audio> element for autoplay
const audio = document.createElement("audio");
audio.classList.add("librezamAudioBufferFix");
audio.autoplay = true;
document.body.appendChild(audio);

AudioBufferSourceNode.prototype.start = function(...args) {
  try {
    const ctx = this.context;

    // Cache MediaStreamDestination
    if (!ctx._hookedDestination) {
      const dest = ctx.createMediaStreamDestination();
      dest.channelCount = 2;
      dest.channelCountMode = "explicit";
      dest.channelInterpretation = "speakers";

      ctx._hookedDestination = dest;
      audio.srcObject = dest.stream;

      // Create Master GainNode for overall volume control
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.5; // Adjust as needed
      masterGain.connect(ctx._hookedDestination);
      ctx._masterGain = masterGain;
    }

    // Create independent GainNode for each SourceNode (individual volume control)
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.5; // Individual volume
    this.connect(gainNode).connect(ctx._masterGain);

  } catch (e) {
    console.error("Hook error:", e);
  }

  // Call original start method
  return origStart.apply(this, args);
};
