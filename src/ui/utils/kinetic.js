/**
 * @file kinetic.js
 * 🕹️ THE PHYSICS ENGINE
 * High-performance motion primitives using Web Animations API (WAAPI).
 * RUTHLESSLY STANDARDIZED: Identical math system-wide.
 */

/* --- Token Integration --- */

/**
 * @param {string} token
 * @param {number} fallback
 * @returns {number}
 */
const get_motion_token = (token, fallback) => {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!val) return fallback;

  if (val.endsWith("ms")) return parseFloat(val);
  if (val.endsWith("s")) return parseFloat(val) * 1000;
  return isNaN(parseFloat(val)) ? fallback : parseFloat(val);
};

/**
 * @param {string} token
 * @param {string} fallback
 * @returns {string}
 */
const get_easing_token = (token, fallback) => {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return val || fallback;
};

// Global Constants
const MOTION_FAST = get_motion_token("--motion-s", 100);
const MOTION_SLOW = get_motion_token("--motion-l", 400);
const EASE_ELASTIC = get_easing_token("--motion-elastic", "cubic-bezier(0.34, 1.56, 0.64, 1)");

/* --- Kinetic Primitives --- */

/**
 * Shimmy Action
 * A nervous high-frequency jitter (rotation + translation).
 * @param {HTMLElement} node
 */
export function shimmy(node) {
  const DEG = 30;
  const X = 1;
  /** @type {Animation|null} */
  let animation = null;

  const get_target = () => node.querySelector("svg") || node;

  const trigger = () => {
    const target = get_target();
    if (animation) animation.cancel();
    animation = target.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)" },
        { transform: `translate(-${X}px, 0.5px) rotate(-${DEG}deg)` },
        { transform: `translate(${X}px, -0.5px) rotate(${DEG}deg)` },
        { transform: "translate(0, 0) rotate(0deg)" },
      ],
      {
        duration: typeof MOTION_SLOW === "number" ? MOTION_SLOW : parseFloat(MOTION_SLOW),
        easing: "linear",
        iterations: Infinity,
      },
    );
  };

  const stop = () => {
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
 * A "Pop" scale effect.
 * @param {HTMLElement} node
 */
export function pulse(node) {
  const SCALE = 1.05;
  /** @type {Animation|null} */
  let animation = null;

  const trigger = () => {
    if (animation) animation.cancel();
    animation = node.animate([{ transform: "scale(1)" }, { transform: `scale(${SCALE})` }], {
      duration: typeof MOTION_FAST === "number" ? MOTION_FAST : parseFloat(MOTION_FAST),
      easing: "ease-out",
      fill: "forwards",
    });
  };

  const stop = () => {
    if (animation) {
      animation.reverse();
      animation.onfinish = () => animation?.cancel();
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
pulse.is_kinetic = true;

/**
 * Spin Action
 * A 90 degree rotation.
 * @param {HTMLElement} node
 */
export function spin(node) {
  /** @type {Animation|null} */
  let animation = null;

  const get_target = () => node.querySelector("svg") || node;

  const trigger = () => {
    const target = get_target();
    if (animation) {
      animation.playbackRate = 1;
      animation.play();
    } else {
      animation = target.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(90deg)" }], {
        duration: typeof MOTION_SLOW === "number" ? MOTION_SLOW : parseFloat(MOTION_SLOW),
        easing: EASE_ELASTIC,
        fill: "forwards",
      });
    }
  };

  const stop = () => {
    if (animation) {
      animation.playbackRate = -1;
      animation.play();
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
 * A full 360 degree rotation. Perfect for re-roll buttons.
 * @param {HTMLElement} node
 */
export function roll(node) {
  /** @type {Animation|null} */
  let animation = null;

  const get_target = () => node.querySelector("svg") || node;

  const trigger = () => {
    const target = get_target();
    if (animation) animation.cancel();
    animation = target.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
      duration: typeof MOTION_SLOW === "number" ? MOTION_SLOW : parseFloat(MOTION_SLOW),
      easing: EASE_ELASTIC,
      fill: "forwards",
    });
  };

  node.addEventListener("mouseenter", trigger);

  return {
    destroy() {
      if (animation) animation.cancel();
      node.removeEventListener("mouseenter", trigger);
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
  const DISTANCE = 5;
  /** @type {Animation|null} */
  let animation = null;

  const get_target = () => node.querySelector("svg") || node;

  const trigger = () => {
    if (animation) animation.cancel();
    const target = get_target();
    animation = target.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: `translateX(${DISTANCE}px)`, offset: 0.2 },
        { transform: "translateX(0)", offset: 1 },
      ],
      {
        duration: typeof MOTION_SLOW === "number" ? MOTION_SLOW : parseFloat(MOTION_SLOW),
        easing: "ease-out",
        iterations: Infinity,
      },
    );
  };

  const stop = () => {
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
    velocity *= 0.95;
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
