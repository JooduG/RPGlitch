/**
 * kinetic.js
 * The Physics Engine for RPGlitch.
 * Standardized motion primitives using the Web Animations API.
 *
 * "Identical Math System-Wide."
 */
// --- Constants & Token Integration ---
const getMotionToken = (token, fallback) => {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!val) return fallback;
  if (val.endsWith("s")) return parseFloat(val) * 1000;
  if (val.endsWith("ms")) return parseFloat(val);
  return isNaN(parseFloat(val)) ? val : parseFloat(val);
};

// Standardized Durations (ms)
const MOTION_FAST = getMotionToken("--motion-fast", 200);
const MOTION_SLOW = getMotionToken("--motion-slow", 400);

// Physics Primitives
const SHIMMY_DEG = 45;
const PULSE_SCALE = 1.05;
const EASE_ELASTIC = getMotionToken("--motion-elastic", "cubic-bezier(0.34, 1.56, 0.64, 1)");
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
      duration: MOTION_FAST,
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
    const keyframes = [{ transform: "scale(1)" }, { transform: `scale(${PULSE_SCALE})` }];
    // Fill: forwards to keep it scaled while hovering
    animation = node.animate(keyframes, {
      duration: MOTION_FAST,
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
  const targetSelector = "svg";
  let animation;

  function getTarget() {
    return node.querySelector(targetSelector) || node;
  }

  function trigger() {
    const target = getTarget();
    if (animation) {
      animation.playbackRate = 1;
      animation.play();
    } else {
      animation = target.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(90deg)" }], {
        duration: MOTION_SLOW,
        easing: EASE_ELASTIC,
        fill: "forwards",
      });
    }
  }

  function reset() {
    if (animation) {
      animation.playbackRate = -1;
      animation.play();
    }
  }

  node.addEventListener("mouseenter", trigger);
  node.addEventListener("mouseleave", reset);
  return {
    destroy() {
      if (animation) animation.cancel();
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
      duration: MOTION_SLOW,
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

/**
 * Kinetic Scroll Action
 * Enables drag-to-scroll with momentum.
 * Usage: use:kineticScroll
 */
export function kineticScroll(node) {
  let isDown = false;
  let startY;
  let scrollTop;
  let velocity = 0;
  let lastY = 0;
  let lastTime = 0;
  let rafId;

  const onDown = (e) => {
    isDown = true;
    const pageY = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    startY = pageY - node.offsetTop;
    scrollTop = node.scrollTop;
    velocity = 0;
    lastY = pageY;
    lastTime = Date.now();
    if (rafId) cancelAnimationFrame(rafId);
  };

  const onUp = () => {
    isDown = false;
    requestAnimationFrame(applyMomentum);
  };

  const onMove = (e) => {
    if (!isDown) return;

    // Prevent native scrolling while dragging - jules review
    if (e.cancelable) e.preventDefault();

    const pageY = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    const y = pageY - node.offsetTop;
    const walk = (y - startY) * 1.5;
    node.scrollTop = scrollTop - walk;

    const now = Date.now();
    const dt = now - lastTime;
    const dy = pageY - lastY;
    if (dt > 0) velocity = dy / dt;
    lastY = pageY;
    lastTime = now;
  };

  const applyMomentum = () => {
    if (isDown || Math.abs(velocity) < 0.1) return;
    node.scrollTop -= velocity * 10;
    velocity *= 0.95;
    rafId = requestAnimationFrame(applyMomentum);
  };

  node.addEventListener("mousedown", onDown);
  node.addEventListener("mouseleave", onUp);
  node.addEventListener("mouseup", onUp);
  node.addEventListener("mousemove", onMove);

  node.addEventListener("touchstart", onDown, { passive: true });
  node.addEventListener("touchend", onUp);
  node.addEventListener("touchmove", onMove, { passive: false });

  return {
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      node.removeEventListener("mousedown", onDown);
      node.removeEventListener("mouseleave", onUp);
      node.removeEventListener("mouseup", onUp);
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("touchstart", onDown);
      node.removeEventListener("touchend", onUp);
      node.removeEventListener("touchmove", onMove);
    },
  };
}
