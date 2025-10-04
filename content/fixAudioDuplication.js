// Create MutationObserver to monitor DOM changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      // Check if node is an element that could contain media elements
      if (node instanceof Element) {
        // Handle media elements in the main DOM
        if (node instanceof HTMLVideoElement || node instanceof HTMLAudioElement) {
          if (!node.classList.contains("librezamFlag")) {
            node.classList.add("librezamFlag");
          }
        }

        // Handle elements with Shadow DOM
        if (node.shadowRoot) {
          handleShadowRoot(node.shadowRoot);
        }

        // Check for media elements within the node
        const mediaElements = node.querySelectorAll('video, audio');
        mediaElements.forEach(media => {
          if (!media.classList.contains("librezamFlag")) {
            media.classList.add("librezamFlag");
          }
        });

        // Check for elements with Shadow DOM within the node
        const shadowHosts = node.querySelectorAll('*');
        shadowHosts.forEach(host => {
          if (host.shadowRoot) {
            handleShadowRoot(host.shadowRoot);
          }
        });
      }
    });
  });
});

// Function to handle Shadow DOM
function handleShadowRoot(shadowRoot) {
  // Add observer for the Shadow DOM
  observer.observe(shadowRoot, {
    childList: true,
    subtree: true
  });

  // Check existing media elements in Shadow DOM
  const shadowMediaElements = shadowRoot.querySelectorAll('video, audio');
  shadowMediaElements.forEach(media => {
    if (!media.classList.contains("librezamFlag")) {
      media.classList.add("librezamFlag");
    }
  });
}

// Start observing DOM changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

