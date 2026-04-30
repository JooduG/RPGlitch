/**
 * ðŸ–¼ï¸ Lightbox Store - Polish Visual Module
 * Manages fullscreen image preview state
 */
/** @type {{active: boolean, src: string|null, caption: string}} */
let lightboxState = $state({
  active: false,
  src: null,
  caption: "",
});
/**
 * Opens the lightbox with an image
 * @param {string} src - Image source URL
 * @param {string} caption - Optional caption
 */
export function openLightbox(src, caption = "") {
  lightboxState.active = true;
  lightboxState.src = src;
  lightboxState.caption = caption;
}
/**
 * Closes the lightbox
 */
export function closeLightbox() {
  lightboxState.active = false;
  lightboxState.src = null;
  lightboxState.caption = "";
}
/**
 * Reactive lightbox state (read-only export)
 */
export const lightbox = {
  get active() {
    return lightboxState.active;
  },
  get src() {
    return lightboxState.src;
  },
  get caption() {
    return lightboxState.caption;
  },
};
