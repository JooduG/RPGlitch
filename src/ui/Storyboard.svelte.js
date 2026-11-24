/**
 * @file src/ui/Storyboard.svelte.js
 * Reactive controller singleton and layout geometry helpers for the Storyboard stage.
 */
import { active_entity_ids } from "@data";
import { NARRATIVE_STYLES, VISUAL_STYLES } from "@definitions";
import { chrono_engine } from "@engine";
import { fly_card_in, fly_card_out, motion } from "@media";
import { app, execution } from "@state";
import { compute_initials, get_signature_color, pick_random } from "@utils";
import { tick } from "svelte";

export function deck_geometry(viewport, slot_rect, { pickup_scale = 0.62, deck_clearance = 1.25 } = {}) {
  const width = slot_rect.width * pickup_scale;
  const height = slot_rect.height * pickup_scale;
  return { left: Math.max(0, viewport.width / 2 - width / 2), top: Math.max(0, viewport.height - height * deck_clearance), width, height };
}

export function claimed_entity_lock(selected, claimed_ids) {
  const claimed = new Set(Array.from(claimed_ids, String));
  return selected.filter(Boolean).find((e) => e.id != null && claimed.has(String(e.id))) || null;
}

function dress_deal_card(clone, entity) {
  if (!entity) return;
  const color = get_signature_color(entity, "var(--color-gunmetal)");
  clone.style.setProperty("--signature-color", color);
  clone.querySelectorAll("[style]").forEach((el) => {
    if (el.style.getPropertyValue("--signature-color")) el.style.setProperty("--signature-color", color);
  });

  if (entity.profile_picture) {
    clone.querySelectorAll("img").forEach((img) => {
      img.src = entity.profile_picture;
      img.removeAttribute("srcset");
    });
  }

  const heading = clone.querySelector("h3[data-card-text], h5[data-card-text]");
  if (heading) heading.textContent = entity.name || "Untitled";
  const desc = clone.querySelector("p[data-card-text]");
  if (desc) desc.textContent = entity.description || "No description provided.";

  const initials = compute_initials(entity.name);
  clone.querySelectorAll("[class*='text-[clamp(0.6rem']").forEach((el) => {
    el.textContent = initials;
  });
}

function pick_unclaimed(list, exclude_id = null) {
  const items = Array.isArray(list) ? list : [];
  const filtered = items.filter((e) => e && e.id !== exclude_id && !app.claimed_entity_ids.has(String(e.id)));
  if (filtered.length) return pick_random(filtered);
  const fallback = exclude_id != null ? items.filter((e) => e && e.id !== exclude_id) : items;
  return pick_random(fallback.length ? fallback : items) || null;
}

export class StoryboardController {
  #is_shuffling = $state(false);
  #begin_flight_started = $state(false);

  get is_shuffling() {
    return this.#is_shuffling;
  }

  get begin_flight_started() {
    return this.#begin_flight_started;
  }

  set begin_flight_started(val) {
    this.#begin_flight_started = Boolean(val);
  }

  async shuffle() {
    if (execution.loading || this.#is_shuffling) return;
    if (!app.characters.length) await app.load_entities();
    if (!app.characters.length) return;

    const pick_ai = pick_unclaimed(app.characters);
    const pick_user = pick_unclaimed(app.characters, pick_ai?.id ?? null);
    const base_fractal = pick_unclaimed(app.fractal_list);
    const pick_fractal =
      base_fractal ?
        { ...base_fractal, visual_style: pick_random(Object.keys(VISUAL_STYLES)), narrative_style: pick_random(Object.keys(NARRATIVE_STYLES)) }
      : null;

    const picks = { ai: pick_ai, user: pick_user, fractal: pick_fractal };
    const commit_slot = (type, entity) => {
      if (type === "ai") app.selected_ai = entity;
      else if (type === "user") app.selected_user = entity;
      else app.selected_fractal = entity;
    };

    const slots = ["ai", "user", "fractal"].map((type) => {
      const wrap = document.querySelector(`[data-slot-type="${type}"]`);
      const root = wrap?.querySelector("[data-card-root]") || wrap || null;
      return { type, wrap, root, rect: root ? root.getBoundingClientRect() : null };
    });

    if (motion.is_reduced || app.view !== "storyboard" || slots.some((s) => !s.root || !s.rect)) {
      for (const type of ["ai", "user", "fractal"]) commit_slot(type, picks[type]);
      app.card_hand.regenerate_count++;
      return;
    }

    this.#is_shuffling = true;
    const occupied = { ai: app.selected_ai, user: app.selected_user, fractal: app.selected_fractal };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    let title_done = false;
    let remaining = slots.length;

    const finish_shuffle = () => {
      clearTimeout(safety_timer);
      this.#is_shuffling = false;
    };
    const safety_timer = setTimeout(finish_shuffle, 1000);

    slots.forEach((s, i) => {
      s.wrap?.classList.remove("deal-reveal", "deal-revealed");
      s.wrap?.classList.add("deal-reveal");

      const r = /** @type {{ left: number, top: number, width: number, height: number }} */ (s.rect);
      const deck = deck_geometry(viewport, r);

      if (occupied[s.type] && s.root) {
        s.root.style.transition = "none";
        s.root.style.opacity = "0";
        fly_card_out(s.root, deck, { duration_ms: 210 });
      }

      setTimeout(() => {
        if (!s.root || !s.rect) {
          if (--remaining <= 0) finish_shuffle();
          return;
        }
        fly_card_in(s.root, deck, s.rect, {
          tag: "data-deal-in",
          on_clone: (clone) => dress_deal_card(clone, picks[s.type]),
          on_land: async () => {
            commit_slot(s.type, picks[s.type]);
            await tick();
            if (s.root) {
              const frozen = [s.root, s.root.firstElementChild].filter(Boolean);
              frozen.forEach((node) => (node.style.transition = "none"));
              s.root.style.opacity = "";
              void s.root.offsetWidth;
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  frozen.forEach((node) => (node.style.transition = ""));
                }),
              );
            }
            s.wrap?.classList.add("deal-revealed");
            if (!title_done) {
              title_done = true;
              app.card_hand.regenerate_count++;
            }
            if (--remaining <= 0) finish_shuffle();
          },
        });
      }, i * 90);
    });
  }

  async begin() {
    this.#begin_flight_started = false;
    if (!app.selected_ai || !app.selected_user || !app.selected_fractal) return;
    const claimed = await active_entity_ids();
    const locked = claimed_entity_lock([app.selected_ai, app.selected_user, app.selected_fractal], claimed);
    if (locked) {
      console.error(`"${locked.name || "Entity"}" is claimed by an active story. End or delete that story first.`);
      return;
    }
    await chrono_engine.begin_selected_story();
    await app.load_entities();
  }
}

export const storyboard = new StoryboardController();
