export const APP_VERSION = "0.1.0";

// --- VALIDATION CONSTANTS ---

export const MAX_NAME_LENGTH = 50;
export const MAX_DESC_LENGTH = 500; // UI limit (engine handles more)
export const MAX_TAGS_LENGTH = 5;

export const IMG_RESOLUTION = "512x768";

// --- ERROR MESSAGES ---
export const ERROR_MESSAGES = {
  CONNECTION_LOST: "Connection lost with AI server.",
};

// --- ENTITY TYPES ---
export const ENTITY_TYPES = {
  AI_CHARACTER: "ai_character",
  USER_CHARACTER: "user_character",
  FRACTAL: "fractal",
};

// --- PALETTE: SIGNATURES (V5 Vibrant Mix) ---
// Must match _variables.scss
export const PALETTE = {
  // REDS / WARMS
  red: "#ef4444",
  rose: "#f43f5e",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",

  // GREENS
  lime: "#84cc16",
  emerald: "#10b981",

  // BLUES / CYANS
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  indigo: "#6366f1",

  // PURPLES / PINKS
  violet: "#8b5cf6",
  purple: "#a855f7",
  pink: "#ec4899",

  // NEUTRALS
  stone: "#78716c",
  zinc: "#71717a",

  // Fallback
  default: "#a855f7", // Purple 500
};

// --- RGB MAP ---
// Used for CSS variables requiring RGB triplets (e.g. rgba(var(--rgb), 0.5))
export const RGB_MAP = {
  red: "239, 68, 68",
  rose: "244, 63, 94",
  orange: "249, 115, 22",
  amber: "245, 158, 11",
  yellow: "234, 179, 8",

  lime: "132, 204, 22",
  emerald: "16, 185, 129",

  cyan: "6, 182, 212",
  sky: "14, 165, 233",
  indigo: "99, 102, 241",

  violet: "139, 92, 246",
  purple: "168, 85, 247",
  pink: "236, 72, 153",

  stone: "120, 113, 108",
  zinc: "113, 113, 122",

  default: "168, 85, 247", // Purple
};

export const AVATAR_PLACEHOLDERS = {
  default:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4eiIvPjxwYXRoIGQ9Ik02IDIxdi0yYTYgNiAwIDAgMSAxMiAweiIvPjwvc3ZnPg==",
};
