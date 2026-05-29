<script>
  import { sanitizeToFragment } from "@platform";
  import { motion } from "./engine.svelte.js";
  import { Audio } from "@media";
  import { safe_html } from "@components";

  /**
   * @typedef {Object} Props
   * @property {string} [targetHtml=""]
   */

  /** @type {Props} */
  let { targetHtml = "" } = $props();

  let currentLength = $state(0);

  // Calculate total plain-text length of targetHtml reactively
  let totalLength = $derived.by(() => {
    const fragment = sanitizeToFragment(targetHtml);
    return get_text_length(fragment);
  });

  // Calculate the sliced HTML based on currentLength reactively
  let slicedHtml = $derived.by(() => {
    const fragment = sanitizeToFragment(targetHtml);
    truncate_to_length(fragment, Math.floor(currentLength));

    // Convert fragment back to HTML string safely
    const container = document.createElement("div");
    container.appendChild(fragment);
    return container.innerHTML;
  });

  // Calculate the typewriter speed reactively
  let speed = $derived.by(() => {
    const remaining = totalLength - currentLength;
    let baseSpeed = 0.04; // ~40 chars/sec base
    if (remaining > 150) {
      baseSpeed = 0.2; // 200 chars/sec
    } else if (remaining > 50) {
      baseSpeed = 0.1; // 100 chars/sec
    }

    // Scale with global motion intensity and voice rate
    const intensity = motion.isReduced ? 0 : motion.intensity;
    const voiceRateFactor = Audio.voice.enabled && Audio.voice.isSpeaking ? Audio.voice.rate : 1.0;
    return baseSpeed * intensity * voiceRateFactor;
  });

  // Keep track of voice pacing reactively
  $effect(() => {
    if (Audio.voice.enabled && Audio.voice.isSpeaking) {
      // Audio.voice speaks in synchronization with text streams
    }
  });

  // Run the typing progress loop reactively
  $effect(() => {
    if (currentLength < totalLength) {
      let lastTime = performance.now();
      let active = true;

      const tick = (/** @type {number} */ now) => {
        if (!active) return;
        const elapsed = now - lastTime;
        lastTime = now;

        currentLength = Math.min(totalLength, currentLength + elapsed * speed);
        if (currentLength < totalLength) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
      return () => {
        active = false;
      };
    }
  });

  /**
   * @param {DocumentFragment} fragment
   */
  function get_text_length(fragment) {
    let length = 0;
    const walk = (/** @type {Node} */ n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        length += n.textContent?.length ?? 0;
      } else {
        for (let i = 0; i < n.childNodes.length; i++) {
          walk(n.childNodes[i]);
        }
      }
    };
    walk(fragment);
    return length;
  }

  /**
   * @param {Node} n
   * @param {number} targetLength
   */
  function truncate_to_length(n, targetLength) {
    let count = 0;
    const walk = (/** @type {Node} */ current) => {
      if (current.nodeType === Node.TEXT_NODE) {
        const text = current.textContent ?? "";
        const len = text.length;
        if (count + len <= targetLength) {
          count += len;
        } else if (count >= targetLength) {
          current.textContent = "";
        } else {
          current.textContent = text.substring(0, targetLength - count);
          count = targetLength;
        }
      } else {
        for (let i = 0; i < current.childNodes.length; i++) {
          walk(current.childNodes[i]);
        }
      }
    };
    walk(n);
  }
</script>

<div class="typewriter-container" style="content-visibility: auto;">
  <div use:safe_html={slicedHtml}></div>
</div>
