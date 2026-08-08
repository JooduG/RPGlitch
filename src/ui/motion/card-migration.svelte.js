/**
 * @file src/ui/motion/card-migration.svelte.js
 * 🎞 SCROLL-LINKED ENTITY CARD MIGRATION
 * The story's three entity cards are scrubbed by the scroll wheel: while the
 * prologue message is in view they sit inside it, and scrolling carries them
 * in lockstep toward the side panels (and back), pausing wherever the scroll
 * pauses. A fixed scrub layer carries art-only clones along the interpolated
 * path; the real cards are only shown at the endpoints (p=0 → prologue,
 * p=1 → panels) so they stay fully interactive once docked. Also hosts the
 * begin-story flight that carries the storyboard cards into the prologue.
 */
import { motion } from "./engine.svelte.js";
import { make_card_clone, rect_of, strip_card_text } from "./card-flight.svelte.js";

const CARD_TYPES = ["ai", "fractal", "user"];

function msg_card(type) {
  return document.querySelector(`[data-msg-prologue] [data-msg-card="${type}"] [data-card-root]`);
}
function panel_card(type) {
  return document.querySelector(`[data-panel-card="${type}"] [data-card-root]`);
}
function viewport() {
  return document.querySelector("[data-id='storymode-scroll-area'] .scroll-area-viewport");
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ── HIDDEN-STATE MECHANISM ────────────────────────────────────────────────
// Cards (and the fractal style badge) are hidden via a `data-scrub-hidden`
// attribute enforced with `!important` CSS rather than inline styles. Inline
// opacity is owned by EntityCard's `style:opacity` binding (e.g. the profile
// view-transition morph), which would silently wipe a manually-set inline
// opacity — the cause of "hidden" cards popping back when a profile closes.
// `!important` beats that binding, and the descendant rule defeats EntityCard's
// `pointer-events-auto` inner wrapper, so hidden cards are truly unclickable.
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
function show_panels() {
  for (const type of CARD_TYPES) show_card(panel_card(type));
}
function hide_msg_cards() {
  for (const type of CARD_TYPES) hide_card(msg_card(type));
}
function show_msg_cards() {
  for (const type of CARD_TYPES) show_card(msg_card(type));
}

// The fractal's style badge travels with its card: message (under the prologue
// fractal card) ↔ storymode panel (under the fractal panel).
function msg_badge() {
  return document.querySelector("[data-msg-prologue] [data-msg-style-badge]");
}
function panel_badge() {
  return document.querySelector("[data-panel-style-badge]");
}
function hide_msg_badge() {
  hide_card(msg_badge());
}
function show_msg_badge() {
  show_card(msg_badge());
}
function hide_panel_badge() {
  hide_card(panel_badge());
}
function show_panel_badge() {
  show_card(panel_badge());
}

/** Removes every hidden style and scrub clone (e.g. when storymode unmounts). */
export function clear_card_location() {
  document.querySelectorAll("[data-card-root], [data-msg-style-badge], [data-panel-style-badge]").forEach(show_card);
  dispose_scrub_clones();
}

// ── SCRUB LAYER ────────────────────────────────────────────────────────────
let scrub_clones = null;

function make_scrub_clone(src) {
  const clone = src.cloneNode(true);
  clone.setAttribute("data-scrub-clone", "true");
  clone.setAttribute("aria-hidden", "true");
  clone.style.position = "fixed";
  clone.style.margin = "0";
  clone.style.zIndex = "9997";
  clone.style.pointerEvents = "none";
  clone.style.transition = "none";
  clone.style.opacity = "";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = "0";
  clone.style.height = "0";
  clone.style.willChange = "left, top, width, height";
  clone.style.removeProperty("view-transition-name");
  clone.removeAttribute("data-scrub-hidden");
  clone.removeAttribute("data-scrub-prev-tabindex");
  strip_card_text(clone);
  document.body.appendChild(clone);
  // Mid-scroll clicking: route the click to the real card so the SAME context
  // menu opens (anchored at the cursor). The clone itself has no handlers.
  clone.addEventListener("click", (e) => {
    if (!src?.isConnected) return;
    src.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: e.clientX, clientY: e.clientY }));
  });
  return clone;
}

function dispose_scrub_clones() {
  if (scrub_badge_clone) {
    scrub_badge_clone.remove();
    scrub_badge_clone = null;
  }
  if (!scrub_clones) return;
  for (const type of CARD_TYPES) {
    if (scrub_clones[type]) scrub_clones[type].remove();
  }
  scrub_clones = null;
}

let scrub_badge_clone = null;

/** Fixed-position art-only clone of the fractal style badge strip. */
function make_badge_scrub_clone(src) {
  const clone = src.cloneNode(true);
  clone.setAttribute("data-scrub-clone", "true");
  clone.setAttribute("aria-hidden", "true");
  clone.style.position = "fixed";
  clone.style.margin = "0";
  clone.style.zIndex = "9996";
  clone.style.pointerEvents = "none";
  clone.style.transition = "none";
  clone.style.opacity = "";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.width = "0";
  clone.style.height = "0";
  clone.style.willChange = "left, top, width, height";
  clone.style.removeProperty("view-transition-name");
  clone.removeAttribute("data-scrub-hidden");
  clone.removeAttribute("data-scrub-prev-tabindex");
  document.body.appendChild(clone);
  return clone;
}

/** Positions the badge scrub clone along the same p as the cards. */
function place_badge_clone(p, shift) {
  const src = msg_badge();
  const dst = panel_badge();
  if (!scrub_badge_clone || !src || !dst) return;
  const start = rect_of(src);
  const end = rect_of(dst);
  const start_top = start.top - shift;
  scrub_badge_clone.style.left = `${start.left + (end.left - start.left) * p}px`;
  scrub_badge_clone.style.top = `${start_top + (end.top - start_top) * p}px`;
  scrub_badge_clone.style.width = `${start.width + (end.width - start.width) * p}px`;
  scrub_badge_clone.style.height = `${start.height + (end.height - start.height) * p}px`;
}

let begin_flight_running = false;

/**
 * Recomputes the scroll-scrub and re-renders card visibility + the scrub
 * layer. Cheap enough to run every scroll frame (rAF-throttled by callers).
 * @param {{ pending?: boolean }} [ctx] - pending=true while the begin-story flight is running
 */
export function update_card_scrub({ pending = false } = {}) {
  const vp = viewport();
  if (!vp) return;

  // While the begin-story flight is running the prologue cards are managed by
  // the flight (hidden until each card lands); only keep the panels stowed.
  if (pending || begin_flight_running) {
    hide_panels();
    hide_panel_badge();
    dispose_scrub_clones();
    return;
  }

  const row = document.querySelector("[data-msg-prologue]");
  let p;
  if (!row) {
    p = 1;
  } else {
    const vp_rect = vp.getBoundingClientRect();
    const shift = row.getBoundingClientRect().top - vp_rect.top;
    const window_px = Math.max(row.offsetHeight, vp_rect.height * 0.6);
    p = clamp(-shift / window_px, 0, 1);
  }

  if (motion.is_reduced) {
    if (p > 0.5) {
      show_panels();
      hide_msg_cards();
      show_panel_badge();
      hide_msg_badge();
    } else {
      show_msg_cards();
      hide_panels();
      show_msg_badge();
      hide_panel_badge();
    }
    dispose_scrub_clones();
    return;
  }

  if (p <= 0) {
    show_msg_cards();
    hide_panels();
    show_msg_badge();
    hide_panel_badge();
    dispose_scrub_clones();
    return;
  }
  if (p >= 1) {
    show_panels();
    hide_msg_cards();
    show_panel_badge();
    hide_msg_badge();
    dispose_scrub_clones();
    return;
  }

  // 0 < p < 1 — the cards travel with the scroll wheel.
  hide_msg_cards();
  hide_panels();
  hide_msg_badge();
  hide_panel_badge();
  if (!scrub_clones) {
    scrub_clones = {};
    for (const type of CARD_TYPES) {
      const src = msg_card(type);
      scrub_clones[type] = src ? make_scrub_clone(src) : null;
    }
  }
  if (!scrub_badge_clone) {
    const bsrc = msg_badge();
    scrub_badge_clone = bsrc ? make_badge_scrub_clone(bsrc) : null;
  }
  const vp_rect = vp.getBoundingClientRect();
  const shift = row.getBoundingClientRect().top - vp_rect.top;
  for (const type of CARD_TYPES) {
    const clone = scrub_clones[type];
    const src_card = msg_card(type);
    const dst_card = panel_card(type);
    if (!clone || !src_card || !dst_card) continue;
    const start = rect_of(src_card);
    const end = rect_of(dst_card);
    const start_top = start.top - shift;
    // Cover-style travel: lerp the box rect directly (left/top/width/height).
    // The card's images are object-cover, so the sides crop as the card grows
    // or shrinks instead of stretching the art like a non-uniform scale would.
    clone.style.left = `${start.left + (end.left - start.left) * p}px`;
    clone.style.top = `${start_top + (end.top - start_top) * p}px`;
    clone.style.width = `${start.width + (end.width - start.width) * p}px`;
    clone.style.height = `${start.height + (end.height - start.height) * p}px`;
  }
  place_badge_clone(p, shift);
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
  begin_flight_running = true;
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
  begin_flight_running = false;
}
