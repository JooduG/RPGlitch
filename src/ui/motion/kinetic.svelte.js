/**
 * @file src/ui/motion/kinetic.svelte.js
 * 🕹️ THE PHYSICS ENGINE
 * High-performance motion primitives using Web Animations API (WAAPI) and spring physics.
 * RUTHLESSLY STANDARDIZED: Fully type-safe, pure Svelte 5 reactive tracking.
 */

import { resolve_ms, resolve_number, resolve_string } from "@utils";
import { motion, spring } from "@motion";

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
function create_kinetic_action(node, config) {
  /** @type {Animation | null} */
  let animation = null;
  let is_hovered = false;

  const trigger = () => {
    is_hovered = true;
    node.dataset.kinetic = "true";

    const intensity = motion.is_reduced ? 0 : motion.intensity;
    if (intensity === 0) return;

    const target = get_target(node);
    if (animation) {
      animation.cancel();
      animation = null;
    }
    animation = config.animate(target, intensity);
  };

  const stop = () => {
    is_hovered = false;
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
  let cleanup_effect = null;
  if (typeof window !== "undefined") {
    cleanup_effect = $effect.root(() => {
      $effect(() => {
        const intensity = motion.is_reduced ? 0 : motion.intensity;
        if (is_hovered) {
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
      if (cleanup_effect) cleanup_effect();
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
  return create_kinetic_action(node, {
    animate: (target, intensity) => {
      const base_duration = resolve_ms("--duration-(--duration-slow)", 500, node);
      const animation = target.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)" },
          {
            transform: "translate(calc(var(--spacing-kinetic-shimmy-offset) * -1), var(--spacing-kinetic-shimmy-y)) rotate(-30deg)",
          },
          {
            transform: "translate(var(--spacing-kinetic-shimmy-offset), calc(var(--spacing-kinetic-shimmy-y) * -1)) rotate(30deg)",
          },
          { transform: "translate(0, 0) rotate(0deg)" },
        ],
        {
          duration: base_duration,
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

  return create_kinetic_action(node, {
    animate: (target, intensity) => {
      if (return_anim) {
        return_anim.cancel();
        return_anim = null;
      }
      const base_duration = resolve_ms("--duration-(--duration-ambient)", 1000, node);
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
          duration: base_duration,
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
        const duration = resolve_ms("--duration-(--duration-fast)", 250, node);
        const easing = resolve_string("--ease-(--ease-out)", "cubic-bezier(0, 0, 0.2, 1)", node);
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
 * Roll Action
 * A full 360 degree rotation powered by spring physics.
 * @param {HTMLElement} node
 * @returns {import('svelte/action').ActionReturn}
 */
export function roll(node) {
  const stiffness = resolve_number("--spring-stiffness-default", 0.15, node);
  const damping = resolve_number("--spring-damping-default", 0.8, node);
  const angle_spring = spring(0, { stiffness, damping });

  const target = get_target(node);

  const trigger = () => {
    node.dataset.kinetic = "true";
    angle_spring.value = 360;
  };

  const stop = () => {
    angle_spring.value = 0;
  };

  /** @type {(() => void) | null} */
  let cleanup_effect = null;
  if (typeof window !== "undefined") {
    cleanup_effect = $effect.root(() => {
      $effect(() => {
        const val = angle_spring.value;
        target.style.transform = `rotate(${val}deg)`;
      });
    });
  }

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", stop);

  return {
    destroy() {
      if (cleanup_effect) cleanup_effect();
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
  return create_kinetic_action(node, {
    animate: (target, intensity) => {
      const base_duration = resolve_ms("--duration-(--duration-slow)", 500, node);
      const easing = resolve_string("--ease-(--ease-out)", "cubic-bezier(0, 0, 0.2, 1)", node);
      const animation = target.animate(
        [
          { transform: "translateX(0)", offset: 0 },
          { transform: "translateX(var(--spacing-kinetic-stab-distance))", offset: 0.2 },
          { transform: "translateX(0)", offset: 1 },
        ],
        {
          duration: base_duration,
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
