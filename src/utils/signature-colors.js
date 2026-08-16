/**
 * src/utils/signature-colors.js
 * 🎨 SIGNATURE COLOR NAMES — canonical list
 *
 * Single source of truth for the vibrant entity-signature palette names.
 * Imported by the data layer (normalizer validation) and the media layer
 * (tokens.js hex mapping / deterministic color picks) so the two can never
 * drift apart. The ORDER is significant: the media layer indexes into this
 * array for deterministic color lookup — keep it in the PALETTE-derived order.
 */
export const SIGNATURE_COLORS = [
  "Adrenaline Pink",
  "Crimson Red",
  "Deep Indigo",
  "Electric Cyan",
  "Emerald Green",
  "Forest Green",
  "Lemon Yellow",
  "Proud Purple",
  "Pumpkin Amber",
  "Rusty Orange",
  "Scientific Teal",
  "Soft Rose",
  "Space Blue",
  "Toxic Green",
  "Twilight Violet",
];
