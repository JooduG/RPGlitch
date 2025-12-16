/**
 * CORE CONSTANTS
 * Single Source of Truth for all shared configurations.
 */

// --- PALETTE: SIGNATURE COLORS ---
export const PALETTE = {
  // --- REDS & WARM ---
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",

  // --- GREENS ---
  emerald: "#10b981",
  green: "#398712",
  jade: "#00895a",

  // --- BLUES & CYANS ---
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  azure: "#017fc0",
  blue: "#3b82f6",
  indigo: "#6366f1",

  // --- PURPLES & PINKS ---
  violet: "#9062ca",
  purple: "#b645cd",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",

  // --- NEUTRALS ---
  slate: "#64748b",
  zinc: "#71717a",
  grey: "#94a3b8",
  sand: "#d6d3d1",
  dark: "#334155",
  light: "#f8fafc",

  // --- ALIASES ---
  pumpkin: "#f97316",
  default: "#b645cd", // Synced to Purple
};

/**
 * Helper to get an RGB triplet string from a hex code.
 * @param {string} hex
 * @returns {string} "r, g, b"
 */
function hexToRgbString(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// Generate RGB Map automatically from PALETTE
export const RGB_MAP = Object.entries(PALETTE).reduce((acc, [key, hex]) => {
  acc[key] = hexToRgbString(hex);
  return acc;
}, {});
