/**
 * @file src/ui/entity/EntityCard.svelte.js
 * 🃏 CARD MOTION ENGINE
 * Clone-based physical card travel shared by the card hand (select), the slot
 * swap, and the storyboard shuffle. A fixed-position clone of a card element
 * is carried from one rect to another (pickup → glide → set-down) and then
 * dissolved. Callers commit real state via `on_land`, so the destination's
 * update is masked by the arrival of the flying card.
 */

import { clamp } from "@utils";

const GLIDE_EASE = "cubic-bezier(0.25, 1, 0.5, 1)";
const PICKUP_EASE = "cubic-bezier(0.3, 0.9, 0.4, 1)";
const EXIT_EASE = "cubic-bezier(0.4, 0, 1, 1)";

/** @typedef {{ left: number, top: number, width: number, height: number }} Rect */

/**
 * Clones a card element into a fixed-position stand-in ready to be flown.
 * @param {HTMLElement} el
 * @param {string} tag - data attribute for the clone (e.g. "data-flight-clone")
 * @param {number} z
 * @returns {HTMLElement}
 */
export function make_card_clone(el, tag, z) {
  const clone = /** @type {HTMLElement} */ (el.cloneNode(true));
  clone.classList.remove("scale-96");
  clone.setAttribute(tag, "true");
  clone.setAttribute("aria-hidden", "true");
  clone.style.position = "fixed";
  clone.style.margin = "0";
  clone.style.zIndex = String(z);
  clone.style.pointerEvents = "none";
  clone.style.willChange = "transform, opacity";
  clone.style.transformOrigin = "top left";
  clone.style.transition = "none";
  clone.style.opacity = ""; // source may be hidden for the flight; the clone must be visible
  clone.style.filter = "brightness(1.12) drop-shadow(0 calc(var(--spacing-unit, 4px) * 3) calc(var(--spacing-unit, 4px) * 5) rgba(0, 0, 0, 0.55))";
  clone.removeAttribute("data-scrub-hidden");
  clone.removeAttribute("data-scrub-prev-tabindex");
  // Flight clones are visual-only: strip the card's click/hover affordance so
  // they never LOOK interactive mid-flight (the cloned inner wrapper hard-sets
  // pointer-events:auto, which would otherwise keep hover/cursor alive).
  clone.style.cursor = "default";
  clone.querySelectorAll(".pointer-events-auto").forEach((n) => n.style.setProperty("pointer-events", "none", "important"));
  strip_card_text(clone);
  document.body.appendChild(clone);
  return clone;
}

/** @param {HTMLElement} el */
export function rect_of(el) {
  return el.getBoundingClientRect();
}

/**
 * Hides a card's text and badge layers (art-only flight). A flying clone is
 * placed at the deck rect (smaller) and then transform-scaled up to the slot
 * rect, which would inflate `cqi`-based text/badges; stripping them keeps the
 * flight clean and lets the landed card fade its text in via `deal-revealed`.
 * @param {HTMLElement} el
 */
export function strip_card_text(el) {
  el.querySelectorAll("[data-card-text], [data-card-badge]").forEach((node) => {
    node.style.opacity = "0";
  });
}

function place(clone, rect) {
  clone.style.left = `${rect.left}px`;
  clone.style.top = `${rect.top}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
}

/**
 * Carries a clone of `source_el` from `from_rect` to `to_rect` (pickup lift →
 * glide → set-down dissolve). Resolves once the card has landed and `on_land`
 * has run.
 * @param {HTMLElement} source_el
 * @param {Rect} from_rect
 * @param {Rect} to_rect
 * @param {object} [options]
 * @param {(clone: HTMLElement) => void} [options.on_clone] - Re-dress the flying clone right after it spawns (e.g. swap in new portrait/name)
 * @param {() => void} [options.on_land] - Commit real state here (runs under the clone, before it dissolves)
 * @param {number} [options.pickup_ms]
 * @param {number} [options.glide_ms]
 * @param {number} [options.set_down_ms]
 * @param {string} [options.tag]
 * @param {number} [options.z]
 * @returns {Promise<void>}
 */
export function fly_card_in(source_el, from_rect, to_rect, options = {}) {
  const { on_clone, on_land, pickup_ms = 90, glide_ms = 380, set_down_ms = 130, tag = "data-flight-clone", z = 9999 } = options;
  return new Promise((resolve) => {
    const clone = make_card_clone(source_el, tag, z);
    place(clone, from_rect);
    on_clone?.(clone);

    const dx = to_rect.left - from_rect.left;
    const dy = to_rect.top - from_rect.top;
    const sx = to_rect.width / Math.max(1, from_rect.width);
    const sy = to_rect.height / Math.max(1, from_rect.height);

    // Pickup: quick pull up and slight tilt out of wherever the card was.
    requestAnimationFrame(() => {
      clone.style.transition = `transform ${pickup_ms}ms ${PICKUP_EASE}`;
      clone.style.transform = "translateY(-14px) rotate(-3deg) scale(1.05)";
    });

    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      try {
        on_land?.();
      } finally {
        // Set-down: settle slightly and dissolve, revealing the destination card.
        clone.style.transition = `transform ${set_down_ms}ms ease-in, opacity ${set_down_ms}ms ease-in`;
        clone.style.transform = `translate(${dx}px, ${dy}px) rotate(0deg) scale(${sx * 0.96}, ${sy * 0.96})`;
        clone.style.opacity = "0";
        setTimeout(() => clone.remove(), set_down_ms + 40);
        resolve();
      }
    };

    // Glide: carry the card across the stage.
    setTimeout(() => {
      clone.style.transition = `transform ${glide_ms}ms ${GLIDE_EASE}`;
      clone.style.transform = `translate(${dx}px, ${dy + 14}px) rotate(0deg) scale(${sx}, ${sy})`;
      clone.addEventListener("transitionend", (e) => {
        if (e.target === clone && e.propertyName === "transform") land();
      });
    }, pickup_ms + 10);
    // Safety net: if the flight transition event is ever lost, land anyway.
    setTimeout(land, pickup_ms + glide_ms + 10);
  });
}

/**
 * Carries a clone of `source_el` out of its current position to `to_rect` and
 * dissolves it mid-air (used to return a swapped-out card to the deck).
 * @param {HTMLElement} source_el
 * @param {Rect} to_rect
 * @param {object} [options]
 * @param {number} [options.duration_ms]
 * @param {number} [options.tilt_deg]
 * @param {string} [options.tag]
 * @param {number} [options.z]
 * @returns {void}
 */
export function fly_card_out(source_el, to_rect, options = {}) {
  const { duration_ms = 300, tilt_deg = -8, tag = "data-flight-out", z = 9998 } = options;
  const from = rect_of(source_el);
  const clone = make_card_clone(source_el, tag, z);
  place(clone, from);

  const dx = to_rect.left - from.left;
  const dy = to_rect.top - from.top;
  const sx = to_rect.width / Math.max(1, from.width);
  const sy = to_rect.height / Math.max(1, from.height);

  const fade_delay = Math.round(duration_ms * 0.5);
  const fade_ms = Math.round(duration_ms * 0.4);
  requestAnimationFrame(() => {
    clone.style.transition = `transform ${duration_ms}ms ${EXIT_EASE}, opacity ${fade_ms}ms ease-in ${fade_delay}ms`;
    clone.style.transform = `translate(${dx}px, ${dy}px) rotate(${tilt_deg}deg) scale(${sx}, ${sy})`;
    clone.style.opacity = "0";
  });
  setTimeout(() => clone.remove(), duration_ms + fade_delay + fade_ms + 60);
}

import { motion } from "@motion/engine.svelte.js";

const CARD_TYPES = ["ai", "fractal", "user"];
let _begin_flight_running = false;

// ── STATIC CARD LOCATION ──────────────────────────────────────────────────
/**
 * Ensures cards and badges in the prologue message remain displayed in place.
 */
function msg_card(type) {
  return document.querySelector(`[data-msg-prologue] [data-msg-card="${type}"] [data-card-root]`);
}
function panel_card(type) {
  return document.querySelector(`[data-panel-card="${type}"] [data-card-root]`);
}

let scrub_style_injected = false;

function ensure_scrub_style() {
  if (scrub_style_injected) return;
  scrub_style_injected = true;
  const style = document.createElement("style");
  style.textContent =
    "[data-scrub-hidden]{opacity:0!important;transition:none!important}" +
    "[data-scrub-hidden], [data-scrub-hidden] *{pointer-events:none!important}";
  document.head.appendChild(style);
}

/** Instantly hides an element while keeping its layout box. */
function hide_card(el) {
  if (!el) return;
  ensure_scrub_style();
  el.setAttribute("data-scrub-hidden", "true");
  if (el.hasAttribute("tabindex")) {
    el.setAttribute("data-scrub-prev-tabindex", el.getAttribute("tabindex") || "0");
    el.setAttribute("tabindex", "-1");
  }
}

/** Reveals an element, letting its own transition fade it back in. */
function show_card(el) {
  if (!el) return;
  if (!el.hasAttribute("data-scrub-hidden")) return;
  const prev = el.getAttribute("data-scrub-prev-tabindex");
  if (prev !== null) el.setAttribute("tabindex", prev);
  el.removeAttribute("data-scrub-prev-tabindex");
  el.removeAttribute("data-scrub-hidden");
}

function hide_panels() {
  for (const type of CARD_TYPES) hide_card(panel_card(type));
}
function show_msg_cards() {
  for (const type of CARD_TYPES) show_card(msg_card(type));
}

function msg_badge() {
  return document.querySelector("[data-msg-prologue] [data-msg-style-badge]");
}
function panel_badge() {
  return document.querySelector("[data-panel-style-badge]");
}
function msg_title() {
  const row = document.querySelector("[data-msg-prologue]");
  return row?.parentElement?.querySelector("[data-msg-title]") ?? null;
}

function show_msg_badge() {
  show_card(msg_badge());
}
function hide_panel_badge() {
  hide_card(panel_badge());
}

function reset_title(title) {
  if (title) title.style.transform = "";
}

/** Removes every hidden style and reset positions when storymode unmounts. */
export function clear_card_location() {
  document.querySelectorAll("[data-card-root], [data-msg-style-badge], [data-panel-style-badge]").forEach(show_card);
  reset_title(msg_title());
}

export function update_card_scrub() {
  // Static prologue view: cards, badges, and title remain in their natural resting place throughout scrolling.
  show_msg_cards();
  hide_panels();
  show_msg_badge();
  hide_panel_badge();
  reset_title(msg_title());
}

// ── BEGIN-STORY FLIGHT ─────────────────────────────────────────────────────
/**
 * Captures the storyboard slot cards (visuals + rects) before the view flips,
 * so the begin-story flight still has an origin once the storyboard unmounts.
 * @param {{ ai: boolean, fractal: boolean, user: boolean }} [enabled]
 * @returns {{ clones: Record<string, HTMLElement>, rects: Record<string, {left:number,top:number,width:number,height:number}> } | null}
 */
export function capture_storyboard_flight(enabled = { ai: true, fractal: true, user: true }) {
  const assets = { clones: {}, rects: {} };
  for (const type of CARD_TYPES) {
    if (!enabled[type]) continue;
    const root = document.querySelector(`[data-slot-type="${type}"] [data-card-root]`);
    if (!root) continue;
    const retained = root.cloneNode(true);
    retained.style.removeProperty("view-transition-name");
    assets.clones[type] = retained;
    assets.rects[type] = rect_of(root);
  }
  // The fractal's style badge (overlay on the storyboard fractal card) rides
  // the flight and lands under the prologue's fractal card.
  if (enabled.fractal) {
    const badge_root = document.querySelector(`[data-slot-type="fractal"] [data-card-badge]`);
    if (badge_root) {
      const retained = badge_root.cloneNode(true);
      retained.style.removeProperty("view-transition-name");
      assets.badge = { clone: retained, rect: rect_of(badge_root) };
    }
  }
  return assets.clones.ai || assets.clones.fractal || assets.clones.user ? assets : null;
}

function ease_out_cubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Cover-style card flight: carries a clone from one rect to another by lerping
 * its left/top/width/height directly (rAF-driven). Because the card's art is
 * object-cover, the box grows/shrinks and the image crops — it never stretches
 * like a non-uniform transform scale would.
 * @param {HTMLElement} source_el
 * @param {Rect} from_rect
 * @param {Rect} to_rect
 * @param {object} [options]
 * @param {number} [options.duration]
 * @param {number} [options.delay]
 * @param {string} [options.tag]
 * @param {number} [options.z]
 * @param {(clone: HTMLElement) => void} [options.on_clone]
 * @param {() => void} [options.on_land]
 * @returns {Promise<void>}
 */
function cover_flight(source_el, from_rect, to_rect, options = {}) {
  const { duration = 380, delay = 0, tag = "data-begin-flight", z = 9996, on_clone, on_land } = options;
  return new Promise((resolve) => {
    const clone = make_card_clone(source_el, tag, z);
    clone.style.willChange = "left, top, width, height";
    clone.style.left = `${from_rect.left}px`;
    clone.style.top = `${from_rect.top}px`;
    clone.style.width = `${from_rect.width}px`;
    clone.style.height = `${from_rect.height}px`;
    on_clone?.(clone);

    const start = Date.now() + delay;
    const step = () => {
      const t = clamp((Date.now() - start) / duration, 0, 1);
      const e = ease_out_cubic(t);
      clone.style.left = `${from_rect.left + (to_rect.left - from_rect.left) * e}px`;
      clone.style.top = `${from_rect.top + (to_rect.top - from_rect.top) * e}px`;
      clone.style.width = `${from_rect.width + (to_rect.width - from_rect.width) * e}px`;
      clone.style.height = `${from_rect.height + (to_rect.height - from_rect.height) * e}px`;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // Land: reveal the real card beneath, then dissolve the clone.
        try {
          on_land?.();
        } finally {
          clone.style.transition = "opacity 140ms ease-in";
          clone.style.opacity = "0";
          setTimeout(() => clone.remove(), 160);
          resolve();
        }
      }
    };
    if (delay > 0) setTimeout(() => requestAnimationFrame(step), delay);
    else requestAnimationFrame(step);
  });
}

/**
 * Flies the captured storyboard cards into the prologue message's cards the
 * moment the prologue renders. Message cards stay hidden until their card
 * lands, so the flight reads as the card itself settling into the message.
 * @param {{ clones: Record<string, HTMLElement>, rects: Record<string, any> } | null} assets
 * @param {Record<string, any>} [dst_rects] - Pre-measured destination rects (measured while the feed is pinned at the top)
 */
export async function fly_storyboard_cards_into_prologue(assets, dst_rects = {}) {
  if (motion.is_reduced || !assets) return;
  _begin_flight_running = true;
  CARD_TYPES.forEach((type) => {
    const clone_src = assets.clones[type];
    const from_rect = assets.rects[type];
    const dst = msg_card(type);
    if (!clone_src || !from_rect || !dst) {
      show_card(dst);
      return;
    }
    hide_card(dst);
  });
  const jobs = [];
  CARD_TYPES.forEach((type, i) => {
    const clone_src = assets.clones[type];
    const from_rect = assets.rects[type];
    const dst = msg_card(type);
    if (!clone_src || !from_rect || !dst) return;
    jobs.push(
      new Promise((resolve) => {
        setTimeout(() => {
          cover_flight(clone_src, from_rect, dst_rects[type] || rect_of(dst), {
            tag: "data-begin-flight",
            z: 9996,
            duration: 420,
            delay: i * 110,
            on_clone: (clone) => clone.style.removeProperty("view-transition-name"),
            on_land: () => show_card(dst),
          }).then(resolve);
        }, 0);
      }),
    );
  });

  // The fractal's style badge strip flies just under the fractal card and
  // lands below the prologue message's fractal card.
  const badge_src = assets.badge?.clone;
  const badge_from = assets.badge?.rect;
  const badge_dst = document.querySelector("[data-msg-prologue] [data-msg-style-badge]");
  if (badge_src && badge_from && badge_dst) {
    const badge_to = badge_dst.getBoundingClientRect();
    jobs.push(
      new Promise((resolve) => {
        cover_flight(badge_src, badge_from, badge_to, {
          tag: "data-begin-flight",
          z: 9995,
          duration: 420,
          delay: 110,
          on_clone: (clone) => clone.style.removeProperty("view-transition-name"),
        }).then(resolve);
      }),
    );
  }

  await Promise.all(jobs);
  _begin_flight_running = false;
}
