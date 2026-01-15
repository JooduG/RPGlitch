/**
 * THEME SERVICE (LEGACY WRAPPER)
 * Re-exporting from theme.svelte.js to avoid breaking existing imports
 * while centralizing logic in the Runes version.
 */
import { themeStore, PALETTE } from "./theme.svelte.js";

export { PALETTE };

export const getDeterministicColor = (seed) =>
  themeStore.getDeterministicColor(seed);
export const getSignature = (entity) => {
  const color = (
    entity?.visuals?.signatureColor ||
    entity?.signatureColor ||
    ""
  )
    .trim()
    .toLowerCase();
  if (color && color !== "default" && PALETTE[color]) {
    return `var(--signature-${color})`;
  }
  return themeStore.getSignatureColor(entity);
};

export const getContrastColor = (hex) => themeStore.getContrastColor(hex);
export const darkenColor = (hex, amt) => themeStore.darkenColor(hex, amt);
export const mixHex = (c1, c2, w) => themeStore.mixHex(c1, c2, w);

export const ThemeService = {
  apply: (element, colorName) => {
    // Keep apply for non-svelte parts but use store logic
    if (!element) return;
    const hex = themeStore.getSignatureColor({
      visuals: { signatureColor: colorName },
    });
    const rgb = themeStore.hexToRgb(hex);

    element.style.setProperty("--signature-color", hex);
    element.style.setProperty("--signature-rgb", rgb);
    element.classList.add("themed-signature");
  },
  getColor: (colorName) =>
    themeStore.getSignatureColor({ visuals: { signatureColor: colorName } }),
};
