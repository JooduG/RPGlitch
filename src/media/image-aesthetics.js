/**
 * src/media/image-aesthetics.js
 * 👁️ AESTHETIC DESCRIPTION
 * Turns entity state into deterministic visual descriptions: filters
 * non-visual keys, merges eternal/present physical traits, resolves the active
 * visual style and its engine tokens, and renders the aesthetic map as JSON
 * lines (extract) or descriptive sentences (flatten). Pure — no reactivity.
 */

import { VISUAL_STYLES } from "@data";
import { CLOTHING_KEYS, safe_parse_pseudo_json, state_bridge } from "@utils";
import { get_signature_label, PALETTE } from "./palette.js";

/**
 * Keys that must NEVER reach an image-generation prompt. Carried/stashed items
 * (INVENTORY/STASH) would be painted onto the body as worn clothing, and the
 * epistemic/status tags (SECRET/PLAN/STATUS) are private or non-visual state.
 */
export const VISUAL_EXCLUDED_KEYS = new Set(["INVENTORY", "STASH", "SECRET", "PLAN", "STATUS"]);

export function strip_visual_excluded(raw) {
  if (!raw) return "";
  const parsed = safe_parse_pseudo_json(raw);
  if (parsed.__raw_prose__) return raw;
  const kept = Object.entries(parsed)
    .filter(([k]) => !VISUAL_EXCLUDED_KEYS.has(k))
    .map(([k, v]) => `[${k}: ${Array.isArray(v) ? v.join(", ") : String(v).replace(/[[\]]/g, "")}]`);
  return kept.join(" ");
}

export function resolve_portrait_visual_style_key(entity = {}) {
  const entity_style = entity?.visual_style;
  if (entity_style && entity_style !== "default" && entity_style !== "" && VISUAL_STYLES[entity_style]) {
    return entity_style;
  }
  const app_style = state_bridge.app ? state_bridge.app.settings?.visual_style : null;
  if (app_style && app_style !== "default" && VISUAL_STYLES[app_style]) {
    return app_style;
  }
  return "none";
}

export function resolve_story_visual_style_key(fractal) {
  const fractal_style =
    fractal?.visual_style || state_bridge.runtime?.active_fractal?.visual_style || state_bridge.app?.selected_fractal?.visual_style;
  if (fractal_style && fractal_style !== "default" && fractal_style !== "" && VISUAL_STYLES[fractal_style]) {
    return fractal_style;
  }
  const app_style = state_bridge.app?.settings?.visual_style ?? null;
  if (app_style && app_style !== "default" && VISUAL_STYLES[app_style]) {
    return app_style;
  }
  return "none";
}

export function parse_visual_engine(engineXml = "") {
  const result = { medium: "", palette: "", camera: "", composition: "", texture: "", negative_prompt: "" };
  if (!engineXml) return result;

  const extract_tag = (tag) => {
    const match = engineXml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : "";
  };

  result.medium = extract_tag("medium");
  result.palette = extract_tag("palette");
  result.camera = extract_tag("camera");
  result.composition = extract_tag("composition");
  result.texture = extract_tag("texture");
  result.negative_prompt = extract_tag("negative_prompt");
  return result;
}

export function resolve_visual_engine_tokens(style_key) {
  const style = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
  const tokens = parse_visual_engine(style.visual_engine);

  if (style.negative_prompt && typeof style.negative_prompt === "string") {
    tokens.negative_prompt = style.negative_prompt.trim();
  }
  return tokens;
}

const normalize_comma_spacing = (str) => str.replace(/,([^\s])/g, ", $1");

export const flatten_physical = (raw) => {
  if (!raw) return "";
  const parsed = safe_parse_pseudo_json(raw);

  if (parsed.__raw_prose__) {
    return normalize_comma_spacing(parsed.__raw_prose__);
  }

  if (Object.keys(parsed).length > 0) {
    const clauses = Object.entries(parsed)
      .map(([k, v]) => {
        const val_str = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (!val_str) return "";
        return `${k.replace(/_/g, " ")}: ${val_str}`;
      })
      .filter(Boolean);
    return normalize_comma_spacing(clauses.join(". "));
  }

  return normalize_comma_spacing(raw.trim());
};

export function build_aesthetic_map(entity = {}) {
  const eternal_obj = safe_parse_pseudo_json(entity.eternal?.physical || "");
  const present_obj = safe_parse_pseudo_json(entity.present?.physical || "");

  const merged = {};

  const merge_input_source = (sourceObj, fallbackLabel) => {
    if (sourceObj.__raw_prose__) {
      merged[fallbackLabel] = sourceObj.__raw_prose__;
    } else {
      Object.entries(sourceObj).forEach(([k, v]) => {
        if (VISUAL_EXCLUDED_KEYS.has(k)) return;
        merged[k] = v;
      });
    }
  };

  merge_input_source(eternal_obj, "eternal");
  merge_input_source(present_obj, "present");

  // CLOTHING OVERRIDE PROTOCOL
  // If present state declares clothing as None or Bare, strip all eternal clothing tags.
  // Clear markers ([SHIRT: none]) are now DROPPED by safe_parse_pseudo_json, so also scan
  // the raw present text — otherwise a shirtless state would repaint the eternal outfit.
  const raw_present = entity.present?.physical || "";
  const bare_marker =
    /\[(?:CLOTHING|SHIRT|PANTS|SUIT|JACKET|DRESS|SKIRT|COAT|ROBE|ROBES|APPAREL|UNDERWEAR|OUTFIT|CLOAK|BOTTOMS|TOPS|ACCESSORIES|HARNESS|SCRUBS|HARDWARE|EQUIPMENT|GEAR)\s*:\s*(?:none|bare|naked|off|removed|disrobed)\s*\]/i.test(
      raw_present,
    );
  if (bare_marker) {
    for (const ck of CLOTHING_KEYS) {
      if (merged[ck] && !(ck in present_obj)) {
        delete merged[ck];
      }
    }
  }

  const style_key = resolve_portrait_visual_style_key(entity);
  const style_obj = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
  const engine_tokens = resolve_visual_engine_tokens(style_key);
  if (engine_tokens.medium) merged._vs_medium = engine_tokens.medium;
  if (engine_tokens.palette) merged._vs_palette = engine_tokens.palette;
  if (engine_tokens.camera) merged._vs_camera = engine_tokens.camera;
  if (engine_tokens.composition) merged._vs_composition = engine_tokens.composition;
  if (engine_tokens.texture) merged._vs_texture = engine_tokens.texture;
  if (style_key && style_key !== "none" && style_obj.tags && style_obj.tags.length) {
    merged._vs_tags = style_obj.tags.join(", ");
  }

  if (Array.isArray(entity.tags) && entity.tags.length) {
    merged.tags = entity.tags.join(", ");
  }

  const color_name = get_signature_label(entity);
  if (color_name) {
    // flux.md §5: bind the palette hex directly ("in color #HEX") so the aesthetic
    // locks to the exact palette tone; fall back to the legacy label phrasing.
    const hex = /** @type {Record<string, string>} */ (PALETTE)[color_name];
    merged.aesthetic = hex ? `in color ${hex}` : `${color_name.toLowerCase()} aesthetic`;
  }

  return merged;
}

const VS_ORDERED_KEYS = ["_vs_medium", "_vs_palette", "_vs_camera", "_vs_composition", "_vs_texture", "_vs_tags"];

export const aesthetic_resolver = {
  /**
   * Deterministic extraction of traits from entity fields into formatted JSON property lines.
   * @param {any} [entity]
   * @returns {string}
   */
  extract(entity = {}) {
    const merged = build_aesthetic_map(entity);
    const ordered_keys = [...VS_ORDERED_KEYS.filter((k) => merged[k]), ...Object.keys(merged).filter((k) => !VS_ORDERED_KEYS.includes(k))];

    return ordered_keys
      .map((k) => {
        const v = merged[k];
        if (v === undefined || v === null) return "";
        const val_str = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (!val_str) return "";
        const formatted_val = normalize_comma_spacing(val_str);
        const clean_key = k.replace(/^_vs_/, "");
        return `  "${clean_key}": "${formatted_val.replace(/"/g, '\\"')}"`;
      })
      .filter(Boolean)
      .join(",\n");
  },

  /**
   * Deterministic flattening of entity physical traits into continuous descriptive sentences.
   * @param {any} [entity]
   * @returns {string}
   */
  flatten(entity = {}) {
    const merged = build_aesthetic_map(entity);
    const vs_values = VS_ORDERED_KEYS.map((k) => merged[k]).filter(Boolean);
    const other_values = Object.entries(merged)
      .filter(([k]) => !VS_ORDERED_KEYS.includes(k))
      .map(([k, v]) => {
        const val_str = Array.isArray(v) ? v.join(", ") : String(v).trim();
        return k.startsWith("_vs_") || k === "aesthetic" ? val_str : `${k.replace(/_/g, " ")}: ${val_str}`;
      })
      .filter(Boolean);

    return normalize_comma_spacing([...vs_values, ...other_values].join(". "));
  },
};
