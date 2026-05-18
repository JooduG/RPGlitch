/**
 * @file kinetic.js
 * 🕹️ THE PHYSICS ENGINE
 * High-performance motion primitives using Web Animations API (WAAPI).
 * RUTHLESSLY STANDARDIZED: Identical math system-wide.
 */

import { resolve_ms, resolve_number, resolve_string } from "./dom.js";

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
    if (animation) {
      animation.cancel();
      animation = null;
    }

    const duration = resolve_ms("--duration-slow", 500, node);

    animation = target.animate(
      [
        { transform: "translate(0, 0) rotate(0deg)" },
        {
          transform:
            "translate(calc(var(--kinetic-shimmy-offset) * -1), var(--kinetic-shimmy-y)) rotate(calc(var(30deg) * -1))",
        },
        {
          transform:
            "translate(var(--kinetic-shimmy-offset), calc(var(--kinetic-shimmy-y) * -1)) rotate(var(30deg))",
        },
        { transform: "translate(0, 0) rotate(0deg)" },
      ],
      {
        duration,
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
  /**
   * @type {Animation | null}
   */
  let return_anim = null;

  const trigger = () => {
    node.dataset.kinetic = "true";
    if (animation) {
      animation.cancel();
      animation = null;
    }
    if (return_anim) {
      return_anim.cancel();
      return_anim = null;
    }

    const duration = resolve_ms("--duration-ambient", 1000, node);

    // Heartbeat thump: big beat -> small beat -> rest
    animation = node.animate(
      [
        { transform: "scale(1)", offset: 0 },
        { transform: "var(--scale-pulse)", offset: 0.14 },
        { transform: "scale(1)", offset: 0.28 },
        { transform: "var(--scale-pulse)", offset: 0.42 },
        { transform: "scale(1)", offset: 0.7 },
        { transform: "scale(1)", offset: 1 },
      ],
      {
        duration,
        easing: "ease-in-out",
        iterations: Infinity,
      },
    );
  };

  const stop = () => {
    if (animation) {
      // Smooth return to 1
      animation.cancel();
      animation = null;

      const duration = resolve_ms("--duration-fast", 250, node);
      const easing = resolve_string("--ease-out", "cubic-bezier(0, 0, 0.2, 1)", node);
      return_anim = node.animate([{ transform: "scale(1)" }], { duration, easing });
      return_anim.onfinish = () => {
        delete node.dataset.kinetic;
        return_anim = null;
      };
    } else if (!return_anim) {
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
      const duration = resolve_ms("--duration-slow", 500, node);
      const easing = resolve_string("--ease-elastic", "cubic-bezier(0.34, 1.56, 0.64, 1)", node);

      animation = target.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(var(90deg))" }],
        {
          duration,
          easing,
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
      const duration = resolve_ms("--duration-slow", 500, node);
      const easing = resolve_string("--ease-elastic", "cubic-bezier(0.34, 1.56, 0.64, 1)", node);

      animation = target.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(var(360deg))" }],
        {
          duration,
          easing,
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
    if (animation) {
      animation.cancel();
      animation = null;
    }
    const target = get_target(node);

    const duration = resolve_ms("--duration-slow", 500, node);
    const easing = resolve_string("--ease-out", "cubic-bezier(0, 0, 0.2, 1)", node);

    animation = target.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(var(--kinetic-stab-distance))", offset: 0.2 },
        { transform: "translateX(0)", offset: 1 },
      ],
      {
        duration,
        easing,
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
    const friction = resolve_number("--kinetic-momentum-friction", 0.95, node);
    node.scrollTop -= velocity * 10;
    velocity *= friction;
    raf_id = requestAnimationFrame(apply_momentum);
  };

  const on_move = (/** @type {any} */ e) => {
    if (!is_down) return;

    const multiplier = resolve_number("--kinetic-scroll-multiplier", 1.5, node);
    const threshold = resolve_number("--kinetic-drag-threshold", 10, node);

    const page_y = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    const y = page_y - node.offsetTop;
    const walk = (y - start_y) * multiplier;

    if (Math.abs(walk) < threshold) return;
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
