/**
 * @file src/ui/Storyboard.svelte.js
 * 🃏 STORYBOARD STATE & ORCHESTRATION MODULE
 * Pure helpers (card initials, deck geometry, claim lock) plus the shuffle-deal,
 * begin-story flight, and prologue-landing choreography. Component-sibling
 * state module for Storyboard.svelte.
 */
import { NAME_PREFIXES } from "@utils";

const DEFAULT_STOP_WORDS = new Set(NAME_PREFIXES.map((w) => w.replace(/\.$/, "")));

/**
 * Derives card initials from an entity name, skipping common prefixes.
 * @param {any} str
 * @param {Set<string>} [stop_words]
 */
export function compute_initials(str, stop_words = DEFAULT_STOP_WORDS) {
  const words = String(str || "")
    .replace(/['']/g, "")
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/);
  const filtered = words.filter((w) => !stop_words.has(w.toLowerCase()));
  return (
    (filtered.length ? filtered : words)
      .slice(0, 3)
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Computes the on-screen deck rect a card travels to/from during a shuffle.
 * @param {{ width: number, height: number }} viewport
 * @param {{ width: number, height: number }} slot_rect
 * @param {{ pickup_scale?: number, deck_clearance?: number }} [options]
 */
export function deck_geometry(viewport, slot_rect, { pickup_scale = 0.62, deck_clearance = 1.25 } = {}) {
  const width = slot_rect.width * pickup_scale;
  const height = slot_rect.height * pickup_scale;
  return {
    left: Math.max(0, viewport.width / 2 - width / 2),
    top: Math.max(0, viewport.height - height * deck_clearance),
    width,
    height,
  };
}

/**
 * Returns the first selected entity already claimed by an active story (or null),
 * so the begin flow can refuse to start with locked-in entities.
 * @param {Array<{ id: any } | null | undefined>} selected
 * @param {Iterable<unknown>} claimed_ids
 */
export function claimed_entity_lock(selected, claimed_ids) {
  const claimed = new Set(claimed_ids);
  return selected.filter(Boolean).find((e) => e.id != null && claimed.has(String(e.id))) || null;
}

import { pick_random } from "@utils";
import { stories, VISUAL_STYLES, NARRATIVE_STYLES } from "@data";
import { chrono_engine } from "@state";
import { get_signature_color } from "@media";
import { motion, fly_card_in, fly_card_out, capture_storyboard_flight, fly_storyboard_cards_into_prologue } from "@motion";
import { app, simulation_log } from "@state";

// Module-level latches (not reactive — nothing renders them).
let shuffle_active = false;
let begin_flight_started = false;

/**
 * Re-dresses a flying card clone with the newly drawn entity's appearance, so
 * the deal-in doesn't carry the swapped-out card's face up to the slot.
 * @param {HTMLElement} clone
 * @param {any} entity
 */
function dress_deal_card(clone, entity) {
  if (!entity) return;
  const color = get_signature_color(entity, "var(--color-gunmetal)");
  clone.style.setProperty("--signature-color", color);
  clone.querySelectorAll("[style]").forEach((el) => {
    if (el.style.getPropertyValue("--signature-color")) {
      el.style.setProperty("--signature-color", color);
    }
  });
  const pic = entity.profile_picture;
  if (pic) {
    clone.querySelectorAll("img").forEach((img) => {
      img.src = pic;
      img.removeAttribute("srcset");
    });
  }
  const name_span = clone.querySelector(".bg-linear-to-t > span");
  if (name_span) name_span.textContent = entity.name || "Untitled";
  const desc = clone.querySelector(".bg-linear-to-t p");
  if (desc) desc.textContent = entity.description || "No description provided.";
  const initials = compute_initials(entity.name);
  clone.querySelectorAll("[class*='text-[clamp(0.6rem']").forEach((el) => {
    el.textContent = initials;
  });
}

export const storyboard = {
  async shuffle() {
    if (app.simulation.loading) return;
    if (!app.ai_list.length) {
      await app.load_entities();
    }
    if (!app.ai_list.length) return;

    const pick_ai = pick_random(Array.isArray(app.ai_list) ? app.ai_list : []);
    let available_users = Array.isArray(app.user_list) ? app.user_list : [];
    if (pick_ai) {
      available_users = available_users.filter((u) => u.id !== pick_ai.id);
    }
    const pick_user = available_users.length ? pick_random(available_users) : app.user_list?.[0] || null;

    let pick_fractal = null;
    if (Array.isArray(app.fractal_list) && app.fractal_list.length) {
      const random_fractal = pick_random(app.fractal_list);
      if (random_fractal) {
        pick_fractal = {
          ...random_fractal,
          visual_style: pick_random(Object.keys(VISUAL_STYLES)),
          narrative_style: pick_random(Object.keys(NARRATIVE_STYLES)),
        };
      }
    }

    const commit = () => {
      app.selected_ai = pick_ai;
      app.selected_user = pick_user;
      app.selected_fractal = pick_fractal;
      if (typeof app.regenerate_title === "function") {
        app.regenerate_title();
      }
    };

    const slots = ["ai", "user", "fractal"].map((type) => {
      const wrapper = document.querySelector(`[data-slot-type="${type}"]`);
      const root = wrapper?.querySelector("[data-card-root]") || wrapper || null;
      return { type, wrap: wrapper, root, rect: root ? root.getBoundingClientRect() : null };
    });

    const dealable = !motion.is_reduced && app.view === "storyboard" && !shuffle_active;
    if (!dealable || slots.some((s) => !s.root || !s.rect)) {
      // If a deal is already airborne, ignore the click rather than double-committing.
      if (!shuffle_active) commit();
      return;
    }

    // 🃏 THE SHUFFLE DEAL — current cards return to the deck, then the newly
    // drawn cards deal out to their slots, staggered like a real hand.
    shuffle_active = true;
    slots.forEach((s) => {
      s.wrap?.classList.remove("deal-reveal", "deal-revealed");
      s.wrap?.classList.add("deal-reveal");
    });
    const occupied = { ai: app.selected_ai, user: app.selected_user, fractal: app.selected_fractal };
    const picks = { ai: pick_ai, user: pick_user, fractal: pick_fractal };
    const viewport_w = window.innerWidth;
    const viewport_h = window.innerHeight;
    let title_done = false;

    slots.forEach((s, i) => {
      const r = /** @type {{ left: number, top: number, width: number, height: number }} */ (s.rect);
      const deck = deck_geometry({ width: viewport_w, height: viewport_h }, r);

      // Phase 1: return the current occupant to the deck (snappy exit).
      if (occupied[s.type] && s.root) {
        s.root.style.transition = "none";
        s.root.style.opacity = "0";
        fly_card_out(s.root, deck, { duration_ms: 210 });
      }

      // Phase 2: deal the new card in, staggered per slot.
      setTimeout(() => {
        if (!s.root || !s.rect) return;
        fly_card_in(s.root, deck, s.rect, {
          tag: "data-deal-in",
          on_clone: (clone) => dress_deal_card(clone, picks[s.type]),
          on_land: () => {
            if (s.root) {
              s.root.style.opacity = "";
              s.root.style.transition = "";
            }
            s.wrap?.classList.add("deal-revealed");
            app.selected_ai = picks.ai;
            app.selected_user = picks.user;
            app.selected_fractal = picks.fractal;
            // One title roll per shuffle — each slot's on_land used to
            // regenerate the dynamic storyboard title (3x per shuffle).
            if (!title_done && typeof app.regenerate_title === "function") {
              title_done = true;
              app.regenerate_title();
            }
          },
        });
      }, i * 90);
    });

    setTimeout(() => {
      shuffle_active = false;
    }, 180 + 700);
  },

  async begin() {
    // Reset the begin-flight latch so a fresh begin can orchestrate again.
    begin_flight_started = false;
    if (app.settings.dev_mode) {
      app.log("Lobby Bypass Triggered (DEV_MODE)", "system");
      const selection = {
        ai: app.selected_ai || { id: "dev_ai", name: "Dev AI" },
        user: app.selected_user || { id: "dev_user", name: "Dev User" },
        fractal: app.selected_fractal || { id: "dev_fractal", name: "Dev Fractal" },
      };
      motion.intensity = 0.4;
      await chrono_engine.start(selection);
      await app.load_entities();
      return;
    }
    if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;
    const claimed = await stories.active_entity_ids();
    const locked = claimed_entity_lock([app.selected_ai, app.selected_user, app.selected_fractal], claimed);
    if (locked) {
      app.log(`"${locked.name || "Entity"}" is claimed by an active story — end or delete that story first.`, "error");
      return;
    }
    motion.intensity = 0.4;
    await chrono_engine.start({
      ai: app.selected_ai,
      user: app.selected_user,
      fractal: app.selected_fractal,
    });
    await app.load_entities(); // Claim the new story's entities immediately
  },
};

/**
 * Installs the begin-story flight watcher. Must be called once during
 * Console.svelte's component init (it registers a runes effect, so it needs
 * the component's effect context).
 *
 * chrono.start now leaves the storyboard VISIBLE while the prologue
 * generates (no empty viewport). The moment the real prologue entry lands in
 * the feed, we capture the storyboard cards, flip to storymode, and fly the
 * cards from the storyboard into the prologue message.
 */
export function install_begin_flight_effect() {
  $effect(() => {
    const _pending = app.begin_story_pending;
    if (!_pending) return;
    const has_prologue_entry =
      simulation_log.feed.some((entry) => entry.meta?.is_prologue) && app.streaming.active && app.streaming.content.length > 0;
    if (!has_prologue_entry || begin_flight_started) return;
    begin_flight_started = true;
    // Capture BEFORE the flip — the storyboard unmounts on the view change.
    const assets = capture_storyboard_flight();
    app._begin_flight_assets = assets;
    // Defer out of the effect stack: set_view runs flushSync, which must not
    // execute synchronously inside an effect body.
    setTimeout(() => {
      if (!app.begin_story_pending) return; // already handled elsewhere
      app.set_view("storymode");
      setTimeout(() => {
        if (!app.begin_story_pending) return; // already handled elsewhere
        if (!document.querySelector("[data-msg-prologue]")) {
          // Bail gracefully: no prologue message to land in.
          app.begin_story_pending = false;
          app.suppress_card_transitions = false;
          app._begin_flight_assets = null;
          return;
        }
        const vp = document.querySelector("[data-id='storymode-scroll-area'] .scroll-area-viewport");
        if (vp) vp.scrollTop = 0;
        const dst_rects = {};
        const row = document.querySelector("[data-msg-prologue]");
        if (row) {
          for (const type of ["ai", "fractal", "user"]) {
            const card = row.querySelector(`[data-msg-card="${type}"] [data-card-root]`);
            if (card) dst_rects[type] = card.getBoundingClientRect();
          }
        }
        fly_storyboard_cards_into_prologue(assets, dst_rects);
        app.begin_story_pending = false;
        app.suppress_card_transitions = false;
        app._begin_flight_assets = null;
      }, 350);
    }, 0);
  });
}
