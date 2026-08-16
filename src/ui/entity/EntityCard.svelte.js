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

// ── SCROLL-LINKED CARD MIGRATION (merged from card-migration.svelte.js) ──────────────
/**
 * @file src/ui/entity/EntityCard.svelte.js (merged from motion/card-migration.svelte.js)
 * 🎞 SCROLL-LINKED ENTITY CARD MIGRATION
 * The story's three entity cards are scrubbed by the scroll wheel: while the
 * prologue message is in view they sit inside it, and scrolling carries them
 * in lockstep toward the side panels (and back), pausing wherever the scroll
 * pauses. A fixed scrub layer carries art-only clones along the interpolated
 * path; the real cards are only shown at the endpoints (p=0 → prologue,
 * p=1 → panels) so they stay fully interactive once docked. Also hosts the
 * begin-story flight that carries the storyboard cards into the prologue.
 */
import { motion } from "@motion/engine.svelte.js";

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

// ── SCRUB TRAVEL CONFIG ───────────────────────────────────────────────────
// Path modes for the card/badge migration. Toggle live from the console with
// `window.SCRUB_MODE` or via the `?scrub=` URL param (default "arc"):
//   "arc"      — cards hold high over the message while sliding out, then drop
//                into the panels at the end (up-and-over curve, off the text).
//   "side"     — cards slide out sideways through the bubble edges first, then
//                lower into the panels.
//   "straight" — the original straight-line lerp.
let _url_scrub_mode = null;
function scrub_mode() {
  const w = window.SCRUB_MODE;
  if (w === "arc" || w === "side" || w === "straight") return w;
  if (_url_scrub_mode === null) _url_scrub_mode = new URLSearchParams(location.search).get("scrub");
  return _url_scrub_mode === "side" || _url_scrub_mode === "straight" ? _url_scrub_mode : "arc";
}

// The dynamic prologue title drops down to sit right above the first paragraph,
// parking by the halfway point of the scrub. Toggle with
// `window.NO_TITLE_GLIDE = true` or `?title=off`.
let _url_title_glide = null;
function title_glide_enabled() {
  if (window.NO_TITLE_GLIDE) return false;
  if (_url_title_glide === null) _url_title_glide = new URLSearchParams(location.search).get("title") !== "off";
  return _url_title_glide;
}

// Front-loaded ease: most of the travel happens in the first part of the
// scroll so the cards clear the text quickly.
function ease_front(t) {
  return 1 - Math.pow(1 - t, 1.6);
}

// Vertical settle is delayed so cards slide sideways before dropping.
function ease_settle(t) {
  return clamp((t - 0.35) / 0.65, 0, 1);
}

function smoothstep(t) {
  const s = clamp(t, 0, 1);
  return s * s * (3 - 2 * s);
}

/** Resolves a travel point for a scrub clone at progress `p`. */
function travel_point(mode, p, start, end, start_top) {
  const pe = ease_front(p);
  const dy = end.top - start_top;
  let top;
  if (mode === "straight") {
    top = start_top + dy * pe;
  } else if (mode === "side") {
    top = start_top + dy * ease_settle(p);
  } else {
    // arc: hold high over the message, then drop into the panel.
    const lift = Math.min(120, dy * 0.5);
    top = start_top + dy * pe - lift * 4 * pe * (1 - pe);
  }
  return {
    left: start.left + (end.left - start.left) * pe,
    top,
    width: start.width + (end.width - start.width) * pe,
    height: start.height + (end.height - start.height) * pe,
  };
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
function msg_title() {
  const row = document.querySelector("[data-msg-prologue]");
  // The dynamic title sits just above the cards row, as a sibling inside the
  // same message body — not a descendant of the row.
  return row?.parentElement?.querySelector("[data-msg-title]") ?? null;
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

// The prologue's dynamic title drops down to sit right above the first
// paragraph. Distance = the card row plus its surrounding gaps, measured from
// layout so it lands flush above the prose.
function title_distance(row, title) {
  const rm = parseFloat(getComputedStyle(row).marginBottom) || 0;
  const tm = parseFloat(getComputedStyle(title).marginBottom) || 0;
  return row.offsetHeight + rm + tm - 16;
}
function place_title(p, row, title) {
  if (!row || !title || !title_glide_enabled()) return;
  // Drop alongside the cards/badges from the very start of the scrub, and park
  // by the halfway point — half the cards' travel time.
  const t = smoothstep(p / 0.5);
  if (t <= 0) {
    title.style.transform = "";
    return;
  }
  title.style.transform = `translateY(${Math.round(title_distance(row, title) * t)}px)`;
}
function reset_title(title) {
  if (title) title.style.transform = "";
}

/** Removes every hidden style and scrub clone (e.g. when storymode unmounts). */
export function clear_card_location() {
  document.querySelectorAll("[data-card-root], [data-msg-style-badge], [data-panel-style-badge]").forEach(show_card);
  reset_title(msg_title());
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
function place_badge_clone(p, shift, rest) {
  const src = msg_badge();
  const dst = panel_badge();
  if (!scrub_badge_clone || !src || !dst) return;
  const start = rect_of(src);
  const end = rect_of(dst);
  const start_top = start.top - shift + rest;
  const pt = travel_point(scrub_mode(), p, start, end, start_top);
  scrub_badge_clone.style.left = `${pt.left}px`;
  scrub_badge_clone.style.top = `${pt.top}px`;
  scrub_badge_clone.style.width = `${pt.width}px`;
  scrub_badge_clone.style.height = `${pt.height}px`;
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
    reset_title(msg_title());
    return;
  }

  const row = document.querySelector("[data-msg-prologue]");
  let p, rest;
  if (!row) {
    p = 1;
    rest = 0;
  } else {
    const vp_rect = vp.getBoundingClientRect();
    const shift = row.getBoundingClientRect().top - vp_rect.top;
    // `rest` = the row's offset within the scroll content (constant while
    // scrolling). The migration is anchored to it, so it begins the moment the
    // prologue starts scrolling up from its resting position — not only once
    // the row reaches the top of the viewport.
    rest = shift + vp.scrollTop;
    const window_px = Math.max(row.offsetHeight * 0.6, vp_rect.height * 0.45);
    p = clamp(-(shift - rest) / window_px, 0, 1);
  }

  const title = msg_title();
  place_title(p, row, title);

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
    // Origin pinned to where the card sat at its resting position, so the
    // cards visibly detach from the bubble the moment it starts scrolling.
    const start_top = start.top - shift + rest;
    // Cover-style travel: lerp the box rect directly (left/top/width/height).
    // The card's images are object-cover, so the sides crop as the card grows
    // or shrinks instead of stretching the art like a non-uniform scale would.
    const pt = travel_point(scrub_mode(), p, start, end, start_top);
    clone.style.left = `${pt.left}px`;
    clone.style.top = `${pt.top}px`;
    clone.style.width = `${pt.width}px`;
    clone.style.height = `${pt.height}px`;
  }
  place_badge_clone(p, shift, rest);
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
