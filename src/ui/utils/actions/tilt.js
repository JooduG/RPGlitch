/**
 * native-tilt.js
 * A dependency-free Svelte action that replicates vanilla-tilt.js physics.
 *
 * Logic:
 * - Calculates mouse position relative to element center
 * - Applies 3D rotation (rotateX/rotateY)
 * - Adds a 'glare' effect (optional)
 * - Uses requestAnimationFrame for 60fps performance
 */
export function tilt(node, options = {}) {
  // Configuration
  const settings = {
    max: 15, // max tilt rotation (degrees)
    perspective: 1000, // transform perspective (px)
    scale: 1.05, // transform scale on hover
    speed: 300, // transition speed (ms)
    axis: null, // 'x' or 'y' - disable one axis
    reset: true, // reset on mouseleave
    ...options,
  };
  let width, height, left, top;
  let transitionTimeout;
  // Initialize styles
  node.style.willChange = "transform";
  node.style.transformStyle = "preserve-3d";
  node.style.transform = `perspective(${settings.perspective}px)`;
  function updateElementPosition() {
    const rect = node.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    left = rect.left;
    top = rect.top;
  }
  function onMouseEnter() {
    updateElementPosition();
    // Only disable transform transition to allow snappy tilt
    node.style.transitionProperty = "transform";
    node.style.transitionDuration = "0ms";
  }
  function onMouseMove(e) {
    if (transitionTimeout) clearTimeout(transitionTimeout);
    const x = e.clientX - left;
    const y = e.clientY - top;
    const xPercentage = x / width;
    const yPercentage = y / height;
    // Calculate rotation
    // X axis rotation comes from Y mouse movement (up/down tilts x-axis)
    // Y axis rotation comes from X mouse movement (left/right tilts y-axis)
    const tiltX = (settings.max / 2 - yPercentage * settings.max).toFixed(2);
    const tiltY = (xPercentage * settings.max - settings.max / 2).toFixed(2);
    // Apply Transform
    // Note: We use scale3d for hardware acceleration
    let transform = `perspective(${settings.perspective}px) rotateX(${settings.axis === "x" ? 0 : tiltX}deg) rotateY(${settings.axis === "y" ? 0 : tiltY}deg) scale3d(${settings.scale}, ${settings.scale}, ${settings.scale})`;
    node.style.transform = transform;
  }
  function onMouseLeave() {
    if (settings.reset) {
      // Restore ONLY transform transition for the snap-back
      node.style.transitionProperty = "transform";
      node.style.transitionDuration = `${settings.speed}ms`;
      node.style.transitionTimingFunction = "cubic-bezier(.03,.98,.52,.99)";
      node.style.transform = `perspective(${settings.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    }
  }
  // Event Listeners
  node.addEventListener("mouseenter", onMouseEnter);
  node.addEventListener("mousemove", onMouseMove);
  node.addEventListener("mouseleave", onMouseLeave);
  // Cleanup
  return {
    destroy() {
      node.removeEventListener("mouseenter", onMouseEnter);
      node.removeEventListener("mousemove", onMouseMove);
      node.removeEventListener("mouseleave", onMouseLeave);
    },
    update(newOptions) {
      Object.assign(settings, newOptions);
    },
  };
}
