/**
 * kinetic.js
 * The Physics Engine for RPGlitch.
 * Standardized motion primitives using the Web Animations API.
 *
 * "Identical Math System-Wide."
 */
// --- Constants ---
const SHIMMY_DEG = 45; // 12 to 3 swing
const PULSE_SCALE = 1.05;
const SHIMMY_DURATION = 300; // ms
const SPIN_DURATION = 400; // ms
const EASE_ELASTIC = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_SMOOTH = "ease-in-out";
/**
 * Shimmy Action
 * A subtle nervous twitch, rotational.
 * Usage: use:shimmy
 */
export function shimmy(node) {
  let animation;
  function trigger() {
    if (animation) animation.cancel();
    // Keyframes for the "Jazz Hands" (12 to 3)
    const keyframes = [
      { transform: "rotate(0deg)", offset: 0 },
      { transform: `rotate(${SHIMMY_DEG}deg)`, offset: 0.5 },
      { transform: "rotate(0deg)", offset: 1 },
    ];
    animation = node.animate(keyframes, {
      duration: SHIMMY_DURATION,
      easing: EASE_SMOOTH,
      iterations: Infinity,
    });
  }
  function cleanup() {
    if (animation) {
      animation.cancel();
      animation = null;
    }
  }
  // We trigger on mouseenter and stop on mouseleave to mimic CSS :hover
  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", cleanup);
  return {
    destroy() {
      cleanup();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", cleanup);
    },
  };
}
/**
 * Pulse Action
 * A "Pop" scale effect.
 * Usage: use:pulse
 */
export function pulse(node) {
  let animation;
  function trigger() {
    if (animation) animation.cancel();
    const keyframes = [
      { transform: "scale(1)" },
      { transform: `scale(${PULSE_SCALE})` },
    ];
    // Fill: forwards to keep it scaled while hovering
    animation = node.animate(keyframes, {
      duration: 300,
      easing: "ease-out",
      fill: "forwards",
    });
  }
  function cleanup() {
    if (animation) {
      animation.reverse(); // Animate back smoothly
      animation.onfinish = () => animation.cancel();
    }
  }
  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", cleanup);
  return {
    destroy() {
      // cleanup handles listeners removal? No, cleanup is for animation.
      // We need to remove listeners.
      if (animation) animation.cancel();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", cleanup);
    },
  };
}
/**
 * Spin Action
 * A 90 degree rotation.
 * Usage: use:spin
 */
export function spin(node) {
  // Target the SVG inside if possible, or spin the whole node?
  // The original CSS targeted "svg" inside: :global(.spin-hover:hover svg)
  // To be generic, this action should probably spin the node it's attached to.
  // If the user wants to spin the icon, they should attach it to the icon.
  // HOWEVER, for Button component, we are attaching to the Button, but want to spin the Icon.
  // We can accept a selector option.
  const targetSelector = "svg";
  function getTarget() {
    return node.querySelector(targetSelector) || node;
  }
  function trigger() {
    const target = getTarget();
    // Check if already animating?
    // CSS was: transform: rotate(90deg); transition...
    // We use WAAPI to rotate to 90deg
    target.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(90deg)" }],
      {
        duration: SPIN_DURATION,
        easing: EASE_ELASTIC,
        fill: "forwards",
      },
    );
  }
  function reset() {
    const target = getTarget();
    target.animate(
      [{ transform: "rotate(90deg)" }, { transform: "rotate(0deg)" }],
      {
        duration: SPIN_DURATION,
        easing: "ease-out",
        fill: "forwards",
      },
    );
  }
  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", reset);
  return {
    destroy() {
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", reset);
    },
  };
}
/**
 * Stab Action
 * A quick horizontal thrust.
 * Usage: use:stab
 */
export function stab(node) {
  const targetSelector = "svg";
  const DISTANCE = 5; // px
  let animation;
  function getTarget() {
    return node.querySelector(targetSelector) || node;
  }
  function trigger() {
    if (animation) animation.cancel();
    const target = getTarget();
    // Keyframes: Start -> Thrust Right -> Return
    const keyframes = [
      { transform: "translateX(0)", offset: 0 },
      { transform: `translateX(${DISTANCE}px)`, offset: 0.2 }, // Fast out (20% of time)
      { transform: "translateX(0)", offset: 1 }, // Slow return (80% of time)
    ];
    animation = target.animate(keyframes, {
      duration: 600,
      easing: "ease-out",
      iterations: Infinity,
    });
  }
  function cleanup() {
    if (animation) {
      animation.cancel();
      animation = null;
    }
  }
  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", cleanup);
  return {
    destroy() {
      cleanup();
      node.removeEventListener("mouseenter", trigger);
      node.removeEventListener("mouseleave", cleanup);
    },
  };
}
