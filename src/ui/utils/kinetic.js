/**
 * @file kinetic.js
 * 🕹️ THE PHYSICS ENGINE
 * High-performance motion primitives using Web Animations API (WAAPI).
 * RUTHLESSLY STANDARDIZED: Identical math system-wide.
 */

/* --- Token Integration --- */

/**
 * @param {string} token
 * @param {string} fallback
 * @returns {string}
 */
const get_token_raw = (token, fallback) => {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return val || fallback;
};

/**
 * Parses CSS time strings (e.g. "250ms", "0.5s") into raw milliseconds.
 * @param {string} str
 * @returns {number}
 */
const parse_ms = (str) => {
  const match = str.match(/([\d.]+)(ms|s)/);
  if (!match) return parseFloat(str) || 0;
  const [_, val, unit] = match;
  return unit === "ms" ? parseFloat(val) : parseFloat(val) * 1000;
};

// Global Constants (Durations)
const DURATION_FAST = parse_ms(get_token_raw("--duration-fast", "250ms"));
const DURATION_SLOW = parse_ms(get_token_raw("--duration-slow", "500ms"));

// Global Constants (Easings)
const EASE_OUT = get_token_raw("--ease-out", "cubic-bezier(0, 0, 0.2, 1)");
const EASE_ELASTIC = get_token_raw("--ease-elastic", "cubic-bezier(0.34, 1.56, 0.64, 1)");

// Global Constants (Kinetic Dimensions)
const SHIMMY_DEG = get_token_raw("--kinetic-shimmy-rotation", "30deg");
const SHIMMY_X = get_token_raw("--kinetic-shimmy-offset", "1px");
const SHIMMY_Y = get_token_raw("--kinetic-shimmy-y", "0.5px");
const PULSE_SCALE_MAX = 1.08;
const PULSE_SCALE_MID = 1.04;
const SPIN_ROTATION = get_token_raw("--kinetic-spin-rotation", "90deg");
const ROLL_ROTATION = get_token_raw("--kinetic-roll-rotation", "360deg");
const STAB_DISTANCE = get_token_raw("--kinetic-stab-distance", "4px");

const FRICTION = parseFloat(get_token_raw("--kinetic-momentum-friction", "0.95"));

/* --- Kinetic Primitives --- */

/**
 * Helper to find appropriate animation target
 * @param {Element} node
 * @returns {Element}
 */
const get_target = (node) => node.querySelector("svg") || /** @type {HTMLElement} */ (node);

/**
 * Shimmy Action
 * A nervous high-frequency jitter (rotation + translation).
 * @param {HTMLElement} node
 */
export function shimmy(node) {
  /**
   * @type {Animation | null}
   */
  let animation = null;

  const trigger = () => {
    node.dataset.kinetic = "true";
    const target = get_target(node);
    if (animation) animation.cancel();
    animation = target.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)" },
        {
          transform: `translate(calc(${SHIMMY_X} * -1), ${SHIMMY_Y}) rotate(calc(${SHIMMY_DEG} * -1))`,
        },
        { transform: `translate(${SHIMMY_X}, calc(${SHIMMY_Y} * -1)) rotate(${SHIMMY_DEG})` },
        { transform: "translate(0, 0) rotate(0deg)" },
      ],
      {
        duration: DURATION_SLOW,
        easing: "linear",
        iterations: Infinity,
      },
    );
  };

  const stop = () => {
    delete node.dataset.kinetic;
    if (animation) {
      animation.cancel();
      animation = null;
    }
  };

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      stop();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", stop);
    },
  };
}
shimmy.is_kinetic = true;

/**
 * Pulse Action
 * A looping "Heartbeat" thump.
 * @param {HTMLElement} node
 */
export function pulse(node) {
  /**
   * @type {Animation | null}
   */
  let animation = null;

  const trigger = () => {
    node.dataset.kinetic = "true";
    if (animation) animation.cancel();

    // Heartbeat thump: big beat -> small beat -> rest
    animation = node.animate(
      [
        { transform: "scale(1)", offset: 0 },
        { transform: `scale(${PULSE_SCALE_MAX})`, offset: 0.14 },
        { transform: "scale(1)", offset: 0.28 },
        { transform: `scale(${PULSE_SCALE_MID})`, offset: 0.42 },
        { transform: "scale(1)", offset: 0.7 },
        { transform: "scale(1)", offset: 1 },
      ],
      {
        duration: 1000,
        easing: "ease-in-out",
        iterations: Infinity,
      },
    );
  };

  const stop = () => {
    if (animation) {
      // Smooth return to 1
      animation.cancel();
      node.animate([{ transform: "scale(1)" }], { duration: DURATION_FAST, easing: EASE_OUT });
    }
    delete node.dataset.kinetic;
  };

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      if (animation) animation.cancel();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", stop);
    },
  };
}
pulse.is_kinetic = true;

/**
 * Spin Action
 * A 90 degree rotation.
 * @param {HTMLElement} node
 */
export function spin(node) {
  /**
   * @type {Animation | null}
   */
  let animation = null;

  const trigger = () => {
    node.dataset.kinetic = "true";
    const target = get_target(node);
    if (animation) {
      animation.playbackRate = 1;
      animation.play();
    } else {
      animation = target.animate(
        [{ transform: "rotate(0deg)" }, { transform: `rotate(${SPIN_ROTATION})` }],
        {
          duration: DURATION_SLOW,
          easing: EASE_ELASTIC,
          fill: "forwards",
        },
      );
    }
  };

  const stop = () => {
    if (animation) {
      animation.playbackRate = -1;
      animation.play();
      animation.onfinish = () => {
        if (animation && animation.playbackRate === -1) {
          delete node.dataset.kinetic;
        }
      };
    } else {
      delete node.dataset.kinetic;
    }
  };

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      if (animation) animation.cancel();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", stop);
    },
  };
}
spin.is_kinetic = true;

/**
 * Roll Action
 * A full 360 degree rotation with rollback.
 * @param {HTMLElement} node
 */
export function roll(node) {
  /**
   * @type {Animation | null}
   */
  let animation = null;

  const trigger = () => {
    node.dataset.kinetic = "true";
    const target = get_target(node);
    if (animation) {
      animation.playbackRate = 1;
      animation.play();
    } else {
      animation = target.animate(
        [{ transform: "rotate(0deg)" }, { transform: `rotate(${ROLL_ROTATION})` }],
        {
          duration: DURATION_SLOW,
          easing: EASE_ELASTIC,
          fill: "forwards",
        },
      );
    }
  };

  const stop = () => {
    if (animation) {
      animation.playbackRate = -1;
      animation.play();
      animation.onfinish = () => {
        if (animation && animation.playbackRate === -1) {
          delete node.dataset.kinetic;
          animation.cancel();
          animation = null;
        }
      };
    } else {
      delete node.dataset.kinetic;
    }
  };

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      if (animation) animation.cancel();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", stop);
    },
  };
}
roll.is_kinetic = true;

/**
 * Stab Action
 * A quick horizontal thrust.
 * @param {HTMLElement} node
 */
export function stab(node) {
  /**
   * @type {Animation | null}
   */
  let animation = null;

  const trigger = () => {
    node.dataset.kinetic = "true";
    if (animation) animation.cancel();
    const target = get_target(node);
    animation = target.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: `translateX(${STAB_DISTANCE})`, offset: 0.2 },
        { transform: "translateX(0)", offset: 1 },
      ],
      {
        duration: DURATION_SLOW,
        easing: EASE_OUT,
        iterations: Infinity,
      },
    );
  };

  const stop = () => {
    delete node.dataset.kinetic;
    if (animation) {
      animation.cancel();
      animation = null;
    }
  };

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      stop();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", stop);
    },
  };
}
stab.is_kinetic = true;

/**
 * Kinetic Scroll Action
 * Enables drag-to-scroll with momentum.
 * @param {HTMLElement} node
 */
export function kinetic_scroll(node) {
  let is_down = false;
  let start_y = 0;
  let scroll_top = 0;
  let velocity = 0;
  let last_y = 0;
  let last_time = 0;
  /**
   * @type {number | null}
   */
  let raf_id = null;

  const on_down = (/** @type {any} */ e) => {
    is_down = true;
    const page_y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    start_y = page_y - node.offsetTop;
    scroll_top = node.scrollTop;
    velocity = 0;
    last_y = page_y;
    last_time = Date.now();
    if (raf_id) cancelAnimationFrame(raf_id);
  };

  const on_up = () => {
    is_down = false;
    requestAnimationFrame(apply_momentum);
  };

  const apply_momentum = () => {
    if (is_down || Math.abs(velocity) < 0.1) return;
    node.scrollTop -= velocity * 10;
    velocity *= FRICTION;
    raf_id = requestAnimationFrame(apply_momentum);
  };

  const on_move = (/** @type {any} */ e) => {
    if (!is_down) return;

    const page_y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    const y = page_y - node.offsetTop;
    const walk = (y - start_y) * 1.5;

    if (Math.abs(walk) < 10) return;
    if (e.cancelable) e.preventDefault();

    node.scrollTop = scroll_top - walk;

    const now = Date.now();
    const dt = now - last_time;
    const dy = page_y - last_y;
    if (dt > 0) velocity = dy / dt;
    last_y = page_y;
    last_time = now;
  };

  node.addEventListener("mousedown", on_down);
  node.addEventListener("mouseleave", on_up);
  node.addEventListener("mouseup", on_up);
  node.addEventListener("mousemove", on_move);

  node.addEventListener("touchstart", on_down, { passive: true });
  node.addEventListener("touchend", on_up);
  node.addEventListener("touchmove", on_move, { passive: false });

  return {
    destroy() {
      if (raf_id) cancelAnimationFrame(raf_id);
      node.removeEventListener("mousedown", on_down);
      node.removeEventListener("mouseleave", on_up);
      node.removeEventListener("mouseup", on_up);
      node.removeEventListener("mousemove", on_move);
      node.removeEventListener("touchstart", on_down);
      node.removeEventListener("touchend", on_up);
      node.removeEventListener("touchmove", on_move);
    },
  };
}
