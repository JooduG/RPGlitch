/**
 * src/utils/style-resolve.js
 * 🎨 STYLE-KEY HIERARCHY RESOLVER
 *
 * Pure, stateless style-key resolution across an explicit entity override
 * and a caller-provided app-level choice. Rank 0 leaf with zero imports:
 * safe for ANY layer to import — notably `@definitions`, which cannot
 * reach upward into `@simulation` (moved down from
 * `simulation/llm-output.js` for exactly that reason; `@simulation`
 * re-exports it so existing consumers keep a single import surface).
 */
export function resolve_style(explicit_style, app_style, registry = {}, fallback = "") {
  if (explicit_style && explicit_style !== "default" && explicit_style !== "" && registry?.[explicit_style]) {
    return explicit_style;
  }

  if (app_style && app_style !== "default" && registry?.[app_style]) {
    return app_style;
  }

  return fallback;
}
