
function image(options) {
  const { prompt, seed, guidanceScale, resolution, onFinish } = options;

  // Create an iframe to load the Perchance image generator
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';

  // Construct the Perchance URL with the prompt and other parameters
  const perchanceUrl = new URL('https://perchance.org/ai-text-to-image-generator');
  perchanceUrl.searchParams.set('prompt', prompt);
  if (seed) {
    perchanceUrl.searchParams.set('seed', seed);
  }
  if (guidanceScale) {
    perchanceUrl.searchParams.set('guidanceScale', guidanceScale);
  }
  if (resolution) {
    perchanceUrl.searchParams.set('resolution', resolution);
  }

  iframe.src = perchanceUrl.toString();

  // Add the iframe to the document
  document.body.appendChild(iframe);

  // Use a MutationObserver to monitor the iframe for changes
  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        // Check if the image has been generated
        const img = iframe.contentWindow.document.querySelector('img');
        if (img) {
          // Extract the image data
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');

          // Call the onFinish callback
          if (onFinish) {
            onFinish({
              canvas: canvas,
              dataUrl: dataUrl,
              iframe: iframe
            });
          }

          // Disconnect the observer and remove the iframe
          observer.disconnect();
          document.body.removeChild(iframe);
        }
      }
    }
  });

  // Start observing the iframe
  observer.observe(iframe.contentWindow.document.body, { childList: true, subtree: true });

  return iframe;
}
