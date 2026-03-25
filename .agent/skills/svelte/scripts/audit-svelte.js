/**
 * 🕵️ Svelte Audit Rules (The Rune Guard)
 */

export const svelteRules = [
  {
    id: "SVELTE_LEGACY_PROPS",
    severity: "HERESY",
    regex: /export\s+let\s+\w+/,
    message: "CRITICAL: 'export let' is deprecated. Use '$props()'.",
  },
  {
    id: "SVELTE_LEGACY_REACTIVE",
    severity: "HERESY",
    regex: /\$:/,
    message: "CRITICAL: '$:' reactive declarations are deprecated. Use '$derived' or '$effect'.",
  },
  {
    id: "SVELTE_LEGACY_DISPATCHER",
    severity: "HERESY",
    regex: /createEventDispatcher/,
    message: "CRITICAL: 'createEventDispatcher' is deprecated. Use callback props.",
  },
  {
    id: "SVELTE_LEGACY_SLOT",
    severity: "ADVICE",
    regex: /<slot/,
    message: "WARNING: '<slot>' is deprecated. Use snippets '{@render ...}'.",
  },
  {
    id: "SVELTE_BANNED_PROPS",
    severity: "HERESY",
    regex: /\$\$props|\$\$restProps/,
    message:
      "CRITICAL: '$$props' is banned. Destructure '$props()' for better performance and clarity.",
  },
  {
    id: "SVELTE_LEGACY_STORES",
    severity: "HERESY",
    // Use a negative lookbehind to ensure we don't match $derived, etc.
    regex: /(?<!\$)\b(writable|readable|derived)\(/,
    message: "CRITICAL: Svelte 4 stores are redundant. Use '$state()' and '$derived()' runes.",
  },
];
