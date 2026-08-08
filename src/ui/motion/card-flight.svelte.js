/**
 * @file src/ui/motion/card-flight.svelte.js
 * 🃏 CARD-FLIGHT ENGINE
 * Clone-based physical card travel shared by the card hand (select), the slot
 * swap, and the storyboard shuffle. A fixed-position clone of a card element
 * is carried from one rect to another (pickup → glide → set-down) and then
 * dissolved. Callers commit real state via `on_land`, so the destination's
 * update is masked by the arrival of the flying card.
 */

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
