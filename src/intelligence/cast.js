/**
 * src/intelligence/cast.js
 * 🎭 CAST & STAGE SPOTLIGHT OPERATIONS
 *
 * Directorial World Cast management:
 * - Stage Spotlight entry/exit choreography (runtime.in_scene_npc_ids)
 * - Directed interpersonal relational mesh updates
 * - Dynamic NPC spawning & genesis profile synthesis
 */

import { entities } from "@data";
import { sort_into_profile } from "./profile-pipeline.js";

/**
 * Resolves a delegated NPC by id (bare or `npc:<id>`) or by case-insensitive
 * name against the runtime world cast.
 * @param {any} bridge
 * @param {string} npc_id
 * @returns {any | null}
 */
export function resolve_npc_entity(bridge, npc_id) {
  if (!npc_id) return null;
  const npcs = bridge.runtime?.active_npcs || {};
  if (npcs[npc_id]) return npcs[npc_id];
  const by_name = Object.values(npcs).find((n) => String(n?.name || "").toLowerCase() === npc_id.toLowerCase());
  return by_name || null;
}

/**
 * Applies the Director's Stage Spotlight choreography (enter/exit) to
 * runtime.in_scene_npc_ids.
 * @param {any} bridge
 * @param {{ enter?: string[], exit?: string[] } | null} change
 * @returns {Promise<boolean>}
 */
export async function apply_in_scene_change(bridge, change) {
  if (!change || typeof change !== "object") return false;
  const npcs = bridge.runtime?.active_npcs || {};
  const current = new Set(bridge.runtime?.in_scene_npc_ids || []);

  const resolve_id = (raw, { id_like = false } = {}) => {
    if (!raw) return null;
    const id = String(raw).trim().replace(/^npc:/i, "");
    if (!id) return null;
    if (npcs[id]) return id;
    const by_name = Object.values(npcs).find(
      (n) =>
        String(n?.name || "")
          .trim()
          .toLowerCase() === id.toLowerCase(),
    );
    if (by_name) return by_name.id;
    if (current.has(id)) return id;
    if (id_like && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) return id;
    return null;
  };

  let changed = false;
  for (const id of change.enter || []) {
    const resolved = resolve_id(id, { id_like: true });
    if (resolved && !current.has(resolved)) {
      current.add(resolved);
      changed = true;
    }
  }
  for (const id of change.exit || []) {
    const resolved = resolve_id(id);
    if (resolved && current.delete(resolved)) changed = true;
  }
  if (changed && bridge.runtime) {
    bridge.runtime.in_scene_npc_ids = [...current];
  }
  return changed;
}

/**
 * Applies the Director's relational-web mutations — directed
 * `[Source] → [Target]: [Dynamic]` edges resolved against the active trio and
 * world cast (by id or case-insensitive name).
 * @param {any} bridge
 * @param {string[]} rels
 */
export async function apply_relationships(bridge, rels) {
  const edges = Array.isArray(rels) ? rels : [];
  if (!edges.length) return;

  const targets = new Map();
  const register = (e) => {
    if (e?.id) targets.set(String(e.id), e);
  };
  register(bridge.runtime?.active_ai);
  register(bridge.runtime?.active_user);
  register(bridge.runtime?.active_fractal);
  for (const n of Object.values(bridge.runtime?.active_npcs || {})) register(n);

  const by_name = new Map();
  for (const e of targets.values())
    by_name.set(
      String(e.name || "")
        .trim()
        .toLowerCase(),
      e,
    );
  const find = (raw) => {
    const key = String(raw || "").trim();
    if (!key) return null;
    return targets.get(key) || by_name.get(key.toLowerCase()) || null;
  };

  const dirty = new Set();
  for (const edge of edges) {
    const m = String(edge).match(/^\s*(.+?)\s*(?:→|->|—>\s*)\s*(.+?)\s*:\s*(.+)$/);
    if (!m) continue;
    const [, src_raw, tgt_raw, dyn] = m;
    const source = find(src_raw.trim());
    if (!source) continue;
    const clean_edge = `${src_raw.trim()} → ${tgt_raw.trim()}: ${dyn.trim()}`.slice(0, 160);
    const list = Array.isArray(source.relationships) ? source.relationships.slice() : [];
    const target_key = tgt_raw.trim().toLowerCase();
    const idx = list.findIndex((r) => {
      const before_colon = String(r).split(":")[0];
      const has_arrow = /→|->|—>/i.test(before_colon);
      const target_name = has_arrow
        ? before_colon
            .split(/→|->|—>/i)
            .pop()
            .trim()
            .toLowerCase()
        : before_colon.trim().toLowerCase();
      return target_name && (target_name === target_key || target_key.includes(target_name) || target_name.includes(target_key));
    });
    if (idx >= 0) list[idx] = clean_edge;
    else list.unshift(clean_edge);
    source.relationships = list.slice(0, 12);
    dirty.add(source);
  }

  for (const source of dirty) {
    try {
      const source_type = source.type === "fractal" ? "fractal" : "character";
      const updated = await entities.upsert(source_type, { ...source, relationships: source.relationships });
      const type = source.type === "fractal" ? "fractal" : "character";
      if (type === "fractal" && bridge.runtime?.active_fractal?.id === source.id) bridge.runtime.active_fractal = updated;
      else if (type === "character") {
        if (bridge.runtime?.active_ai?.id === source.id) bridge.runtime.active_ai = updated;
        else if (bridge.runtime?.active_user?.id === source.id) bridge.runtime.active_user = updated;
        else if (bridge.runtime?.active_npcs?.[source.id]) bridge.runtime.active_npcs = { ...bridge.runtime.active_npcs, [source.id]: updated };
      }
      bridge.app.log(`[GameMaster] Relational web updated: ${source.name}.`, "system");
    } catch (err) {
      bridge.app.log(`[GameMaster] Relationship update failed: ${err?.message || err}`, "warn");
    }
  }
}

/**
 * Applies Director genesis requests — spawns brand-new recurring NPCs.
 * @param {any} bridge
 * @param {Array<{ name: string, description?: string, role_tier?: number, voice_register?: string, signature_color?: string }>} genesis
 * @param {(bridge: any, draft: any) => Promise<any>} [spawner_fn]
 */
export async function apply_genesis(bridge, genesis, spawner_fn = spawn_npc) {
  for (const g of genesis || []) {
    if (!g?.name) continue;
    const cast = [
      bridge.runtime?.active_ai,
      bridge.runtime?.active_user,
      bridge.runtime?.active_fractal,
      ...Object.values(bridge.runtime?.active_npcs || {}),
    ].filter(Boolean);
    if (
      cast.some(
        (e) =>
          String(e.name || "")
            .trim()
            .toLowerCase() === String(g.name).toLowerCase(),
      )
    ) {
      bridge.app?.log(`[GameMaster] Genesis "${g.name}" already in cast — convergence guard.`, "warn");
      continue;
    }
    try {
      const scene_context = [
        bridge.runtime?.active_fractal?.name ? `Setting: ${bridge.runtime.active_fractal.name}` : "",
        bridge.runtime?.active_fractal?.present?.physical || "",
        bridge.runtime?.active_fractal?.present?.non_physical || "",
      ]
        .filter(Boolean)
        .join(" — ");

      const npc = await spawner_fn(bridge, {
        name: g.name,
        description: g.description,
        role_tier: g.role_tier,
        voice_register: g.voice_register,
        signature_color: g.signature_color,
        scene_context,
      });
      if (npc) bridge.app.log(`[GameMaster] ✨ Genesis: ${npc.name} entered the scene.`, "system");
    } catch (err) {
      bridge.app.log(`[GameMaster] Genesis failed for "${g.name}": ${err?.message || err}`, "error");
    }
  }
}

/**
 * Spawns a new roster NPC (Tier 1 by default), persists it to Dexie,
 * registers it on the active story, and puts it on-stage.
 * @param {any} bridge
 * @param {{ name: string, description?: string, role_tier?: number, relationships?: string[], voice_register?: string, signature_color?: string, scene_context?: string }} [draft]
 * @returns {Promise<any | null>}
 */
export async function spawn_npc(bridge, draft = {}) {
  const name = String(draft?.name || "").trim();
  if (!name) return null;
  const raw_color = String(draft?.signature_color || "").trim();
  const desc = String(draft?.description || "").trim();
  const scene_context = String(draft?.scene_context || "").trim();

  // 1. Base entity shell
  let entity = {
    name,
    type: "character",
    description: desc,
    eternal: {
      physical: desc,
      non_physical: "",
    },
    present: {
      physical: desc,
      non_physical: "",
    },
    future: "",
    past: [],
    dynamics: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    dynamics_baseline: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    role_tier: Math.max(1, Math.min(3, Number(draft?.role_tier) || 1)),
    relationships: Array.isArray(draft?.relationships) ? draft.relationships : [],
    voice_register: draft?.voice_register || "low_curt",
    is_wanderer: false,
    signature_color: raw_color || undefined,
  };

  // 2. Rich Character Profile Synthesis (same pipeline as import)
  try {
    const synthesis_source = [
      `Character Name: ${name}`,
      desc ? `Core Concept: ${desc}` : "",
      raw_color ? `Signature Color: ${raw_color}` : "",
      scene_context ? `Scene Context & Atmosphere: ${scene_context}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const rich_profile = await sort_into_profile(synthesis_source, "character");
    if (rich_profile && typeof rich_profile === "object") {
      const { apply_profile_to_entity } = await import("./profile-pipeline.js");
      entity = apply_profile_to_entity(entity, rich_profile);
    }
  } catch (err) {
    bridge.app?.log(`[GameMaster] Genesis rich synthesis failed for "${name}", using raw draft: ${err?.message || err}`, "warn");
  }

  // Ensure signature color and name are firmly grounded
  if (name) entity.name = name;
  if (raw_color) entity.signature_color = raw_color;
  entity.role_tier = Math.max(1, Math.min(3, Number(draft?.role_tier) || entity.role_tier || 1));

  const saved_entity = await entities.upsert("character", entity);

  // 3. Genesis portrait — fire-and-forget in background using rich physical description
  const { visual_engine } = await import("@media");
  if (typeof visual_engine?.generate === "function" && typeof window !== "undefined") {
    try {
      const portrait_promise = visual_engine.generate(saved_entity.id, { mode: "solo_entity", resolution: "512x512", _entity: saved_entity });
      if (portrait_promise && typeof portrait_promise.catch === "function") {
        portrait_promise.catch((err) => bridge.app?.log(`[GameMaster] Portrait generation for "${name}" failed: ${err?.message || err}`, "warn"));
      }
    } catch (_err) {
      /* portrait failure must never break genesis */
    }
  }

  // 4. Register on active story
  const story_id = bridge.runtime?.story_id;
  if (story_id && story_id !== "debug") {
    try {
      const { stories } = await import("@data");
      const story = await stories.get(story_id);
      const npc_ids = [...new Set([...(story?.npc_ids || []), saved_entity.id])];
      if (npc_ids.length !== (story?.npc_ids || []).length) {
        await stories.update_cast(story_id, npc_ids);
      }
    } catch (err) {
      bridge.app?.log(`[GameMaster] Failed to register NPC on the story: ${err?.message || err}`, "warn");
    }
  }

  // 5. Hydrate into active runtime state & stage spotlight
  const npcs = { ...(bridge.runtime?.active_npcs || {}) };
  npcs[saved_entity.id] = saved_entity;
  if (bridge.runtime) {
    bridge.runtime.active_npcs = npcs;
    bridge.runtime.in_scene_npc_ids = [...new Set([...(bridge.runtime.in_scene_npc_ids || []), saved_entity.id])];
  }
  bridge.app?.log(`[GameMaster] Roster expanded: ${name}.`, "system");
  return saved_entity;
}
