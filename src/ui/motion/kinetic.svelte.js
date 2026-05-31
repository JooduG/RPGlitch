/**
 * @file kinetic.svelte.js
 * 🕹️ THE PHYSICS ENGINE
 * High-performance motion primitives using Web Animations API (WAAPI) and spring physics.
 * RUTHLESSLY STANDARDIZED: Fully type-safe, pure Svelte 5 reactive tracking.
 */

import { resolve_ms, resolve_number, resolve_string } from "@components";
import { motion, spring } from "./engine.svelte.js";

/* --- Kinetic Primitives --- */

/**
 * Helper to find appropriate animation target
 * @param {Element} node
 * @returns {HTMLElement}
 */
const get_target = (node) => /** @type {HTMLElement} */ (node.querySelector("svg") || node);

/**
 * Standardized manager for registering hover-triggered physical animations.
 * Synchronizes with global motion engine intensity and prefers-reduced-motion.
 *
 * @param {HTMLElement} node - Element target.
 * @param {object} config - Configuration options.
 * @param {(target: HTMLElement, intensity: number) => Animation | null} config.animate - Trigger animation builder.
 * @param {(target: HTMLElement, currentAnimation: Animation | null) => void} [config.onStop] - Stop animation hook.
 * @returns {import('svelte/action').ActionReturn}
 */
function createKineticAction(node, config) {
  /** @type {Animation | null} */
  let animation = null;
  let isHovered = false;

  const trigger = () => {
    isHovered = true;
    node.dataset.kinetic = "true";

    const intensity = motion.isReduced ? 0 : motion.intensity;
    if (intensity === 0) return;

    const target = get_target(node);
    if (animation) {
      animation.cancel();
      animation = null;
    }
    animation = config.animate(target, intensity);
  };

  const stop = () => {
    isHovered = false;
    const target = get_target(node);
    if (config.onStop) {
      config.onStop(target, animation);
    } else if (animation) {
      animation.cancel();
    }
    animation = null;
  };

  // Svelte 5 Effect to handle dynamic intensity / reduced motion updates reactively
  /** @type {(() => void) | null} */
  let cleanupEffect = null;
  if (typeof window !== "undefined") {
    cleanupEffect = $effect.root(() => {
      $effect(() => {
        const intensity = motion.isReduced ? 0 : motion.intensity;
        if (isHovered) {
          if (intensity === 0) {
            if (animation) {
              animation.cancel();
              animation = null;
            }
          } else if (animation) {
            animation.playbackRate = intensity;
          } else {
            const target = get_target(node);
            animation = config.animate(target, intensity);
          }
        }
      });
    });
  }

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      if (animation) animation.cancel();
      if (cleanupEffect) cleanupEffect();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", stop);
    },
  };
}

/**
 * Shimmy Action
 * A nervous high-frequency jitter (rotation + translation).
 * @param {HTMLElement} node
 * @returns {import('svelte/action').ActionReturn}
 */
export function shimmy(node) {
  return createKineticAction(node, {
    animate: (target, intensity) => {
      const baseDuration = resolve_ms("--duration-slow", 500, node);
      const animation = target.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)" },
          {
            transform:
              "translate(calc(var(--kinetic-shimmy-offset) * -1), var(--kinetic-shimmy-y)) rotate(-30deg)",
          },
          {
            transform:
              "translate(var(--kinetic-shimmy-offset), calc(var(--kinetic-shimmy-y) * -1)) rotate(30deg)",
          },
          { transform: "translate(0, 0) rotate(0deg)" },
        ],
        {
          duration: baseDuration,
          easing: "linear",
          iterations: Infinity,
        },
      );
      animation.playbackRate = intensity;
      return animation;
    },
  });
}
shimmy.is_kinetic = true;

/**
 * Pulse Action
 * A looping "Heartbeat" thump.
 * @param {HTMLElement} node
 * @returns {import('svelte/action').ActionReturn}
 */
export function pulse(node) {
  /** @type {Animation | null} */
  let return_anim = null;

  return createKineticAction(node, {
    animate: (target, intensity) => {
      if (return_anim) {
        return_anim.cancel();
        return_anim = null;
      }
      const baseDuration = resolve_ms("--duration-ambient", 1000, node);
      const animation = target.animate(
        [
          { transform: "scale(1)", offset: 0 },
          { transform: "var(--scale-pulse)", offset: 0.14 },
          { transform: "scale(1)", offset: 0.28 },
          { transform: "var(--scale-pulse)", offset: 0.42 },
          { transform: "scale(1)", offset: 0.7 },
          { transform: "scale(1)", offset: 1 },
        ],
        {
          duration: baseDuration,
          easing: "ease-in-out",
          iterations: Infinity,
        },
      );
      animation.playbackRate = intensity;
      return animation;
    },
    onStop: (target, currentAnimation) => {
      if (currentAnimation) {
        currentAnimation.cancel();
        const duration = resolve_ms("--duration-fast", 250, node);
        const easing = resolve_string("--ease-out", "cubic-bezier(0, 0, 0.2, 1)", node);
        return_anim = target.animate([{ transform: "scale(1)" }], { duration, easing });
        return_anim.onfinish = () => {
          return_anim = null;
        };
      }
    },
  });
}
pulse.is_kinetic = true;

/**
 * Spin Action
 * A 90 degree rotation powered by spring physics.
 * @param {HTMLElement} node
 * @returns {import('svelte/action').ActionReturn}
 */
export function spin(node) {
  const stiffness = resolve_number("--spring-stiffness-default", 0.15, node);
  const damping = resolve_number("--spring-damping-default", 0.8, node);
  const angleSpring = spring(0, { stiffness, damping });

  const target = get_target(node);

  const trigger = () => {
    node.dataset.kinetic = "true";
    angleSpring.value = 90;
  };

  const stop = () => {
    angleSpring.value = 0;
  };

  /** @type {(() => void) | null} */
  let cleanupEffect = null;
  if (typeof window !== "undefined") {
    cleanupEffect = $effect.root(() => {
      $effect(() => {
        const val = angleSpring.value;
        target.style.transform = `rotate(${val}deg)`;
      });
    });
  }

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      if (cleanupEffect) cleanupEffect();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", stop);
    },
  };
}
spin.is_kinetic = true;

/**
 * Roll Action
 * A full 360 degree rotation powered by spring physics.
 * @param {HTMLElement} node
 * @returns {import('svelte/action').ActionReturn}
 */
export function roll(node) {
  const stiffness = resolve_number("--spring-stiffness-default", 0.15, node);
  const damping = resolve_number("--spring-damping-default", 0.8, node);
  const angleSpring = spring(0, { stiffness, damping });

  const target = get_target(node);

  const trigger = () => {
    node.dataset.kinetic = "true";
    angleSpring.value = 360;
  };

  const stop = () => {
    angleSpring.value = 0;
  };

  /** @type {(() => void) | null} */
  let cleanupEffect = null;
  if (typeof window !== "undefined") {
    cleanupEffect = $effect.root(() => {
      $effect(() => {
        const val = angleSpring.value;
        target.style.transform = `rotate(${val}deg)`;
      });
    });
  }

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      if (cleanupEffect) cleanupEffect();
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
 * @returns {import('svelte/action').ActionReturn}
 */
export function stab(node) {
  return createKineticAction(node, {
    animate: (target, intensity) => {
      const baseDuration = resolve_ms("--duration-slow", 500, node);
      const easing = resolve_string("--ease-out", "cubic-bezier(0, 0, 0.2, 1)", node);
      const animation = target.animate(
        [
          { transform: "translateX(0)", offset: 0 },
          { transform: "translateX(var(--kinetic-stab-distance))", offset: 0.2 },
          { transform: "translateX(0)", offset: 1 },
        ],
        {
          duration: baseDuration,
          easing,
          iterations: Infinity,
        },
      );
      animation.playbackRate = intensity;
      return animation;
    },
  });
}
stab.is_kinetic = true;

/**
 * Kinetic Scroll Action
 * Enables drag-to-scroll with momentum.
 * @param {HTMLElement} node
 * @returns {import('svelte/action').ActionReturn}
 */
export function kinetic_scroll(node) {
  let is_down = false;
  let start_y = 0;
  let scroll_top = 0;
  let velocity = 0;
  let last_y = 0;
  let last_time = 0;
  /** @type {number | null} */
  let raf_id = null;

  /** @param {MouseEvent & TouchEvent} e */
  const on_down = (e) => {
    is_down = true;
    const touch = e.touches ? e.touches[0] : null;
    const page_y = touch ? touch.pageY : e.pageY;
    start_y = page_y - node.offsetTop;
    scroll_top = node.scrollTop;
    velocity = 0;
    last_y = page_y;
    last_time = Date.now();
    if (raf_id !== null) cancelAnimationFrame(raf_id);
  };

  const on_up = () => {
    is_down = false;
    requestAnimationFrame(apply_momentum);
  };

  const apply_momentum = () => {
    const intensity = motion.isReduced ? 0 : motion.intensity;
    if (is_down || Math.abs(velocity) < 0.1 || intensity === 0) return;

    const baseFriction = resolve_number("--kinetic-momentum-friction", 0.95, node);
    const friction = baseFriction * intensity;

    node.scrollTop -= velocity * 10 * intensity;
    velocity *= friction;
    raf_id = requestAnimationFrame(apply_momentum);
  };

  /** @param {MouseEvent & TouchEvent} e */
  const on_move = (e) => {
    if (!is_down) return;

    const intensity = motion.isReduced ? 0 : motion.intensity;
    if (intensity === 0) return;

    const multiplier = resolve_number("--kinetic-scroll-multiplier", 1.5, node);
    const threshold = resolve_number("--kinetic-drag-threshold", 10, node);

    const touch = e.touches ? e.touches[0] : null;
    const page_y = touch ? touch.pageY : e.pageY;
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

  node.addEventListener("mousedown", /** @type {EventListener} */ (on_down));
  node.addEventListener("mouseleave", on_up);
  node.addEventListener("mouseup", on_up);
  node.addEventListener("mousemove", /** @type {EventListener} */ (on_move));

  node.addEventListener("touchstart", /** @type {EventListener} */ (on_down), { passive: true });
  node.addEventListener("touchend", on_up);
  node.addEventListener("touchmove", /** @type {EventListener} */ (on_move), { passive: false });

  return {
    destroy() {
      if (raf_id !== null) cancelAnimationFrame(raf_id);
      node.removeEventListener("mousedown", /** @type {EventListener} */ (on_down));
      node.removeEventListener("mouseleave", on_up);
      node.removeEventListener("mouseup", on_up);
      node.removeEventListener("mousemove", /** @type {EventListener} */ (on_move));
      node.removeEventListener("touchstart", /** @type {EventListener} */ (on_down));
      node.removeEventListener("touchend", on_up);
      node.removeEventListener("touchmove", /** @type {EventListener} */ (on_move));
    },
  };
}
