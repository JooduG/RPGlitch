<script>
  /**
   * @file TypewriterRenderer.svelte
   * 📝 COGNITIVE TEXT STREAMER ELEMENT
   * Deconstructs HTML text layers into reactive token buffers.
   * Eliminates direct DOM tree mutations and manual text node truncation algorithms.
   */
  import { motion } from "./engine.svelte.js";
  import { Audio } from "@media";

  /**
   * @typedef {Object} Props
   * @property {string} [targetHtml=""]
   */

  /** @type {Props} */
  let { targetHtml = "" } = $props();

  /** @type {number} */
  let currentLength = $state(0);

  /**
   * Parse text input stream into reactive structural token buffers.
   * Isolates structural layout elements from text characters to allow optimized paint cycles.
   */
  let tokenBuffer = $derived.by(() => {
    const tokens = [];
    const regex = /(<[^>]+>|[^<]+)/g;
    let match;

    while ((match = regex.exec(targetHtml)) !== null) {
      const val = match[0];
      if (val.startsWith("<")) {
        tokens.push({ type: "tag", value: val });
      } else {
        for (const char of val) {
          tokens.push({ type: "text", value: char });
        }
      }
    }
    return tokens;
  });

  // Calculate total plain-text characters reactively from the computed token buffer
  let totalLength = $derived(tokenBuffer.filter((t) => t.type === "text").length);

  // Reconstruct structural markup up to current plain-text length limits
  let slicedHtml = $derived.by(() => {
    let output = "";
    let textCount = 0;
    const targetCount = Math.floor(currentLength);
    /** @type {string[]} */
    const openTags = [];

    for (const token of tokenBuffer) {
      if (token.type === "tag") {
        const tag = token.value;
        if (tag.startsWith("</")) {
          openTags.pop();
          output += tag;
        } else if (tag.startsWith("<") && !tag.endsWith("/>") && !tag.startsWith("<!")) {
          const nameMatch = tag.match(/<([a-zA-Z0-9:-]+)/);
          if (nameMatch) openTags.push(nameMatch[1]);
          output += tag;
        } else {
          output += tag;
        }
      } else {
        if (textCount < targetCount) {
          output += token.value;
          textCount++;
        } else {
          break;
        }
      }
    }

    // Auto-close any unclosed tags to guarantee layout safety frames
    for (let i = openTags.length - 1; i >= 0; i--) {
      output += `</${openTags[i]}>`;
    }

    return output;
  });

  // Calculate typewriter acceleration pacing metrics deterministically
  let speed = $derived.by(() => {
    const remaining = totalLength - currentLength;
    let baseSpeed = 0.04; // ~40 chars/sec base
    if (remaining > 150) {
      baseSpeed = 0.2; // 200 chars/sec acceleration mapping
    } else if (remaining > 50) {
      baseSpeed = 0.1; // 100 chars/sec acceleration mapping
    }

    // Scale with global motion intensity and voice rate metrics
    const intensity = motion.isReduced ? 0 : motion.intensity;
    const voiceRateFactor = Audio.voice.enabled && Audio.voice.isSpeaking ? Audio.voice.rate : 1.0;
    return baseSpeed * intensity * voiceRateFactor;
  });

  // Keep track of voice pacing reactively
  $effect(() => {
    if (Audio.voice.enabled && Audio.voice.isSpeaking) {
      // Audio.voice telemetry synchronization hooks mapped here
    }
  });

  // Run typing progress loops smoothly via framework interval gates instead of raw animation frames
  $effect(() => {
    if (currentLength < totalLength) {
      let lastTime = performance.now();

      const intervalId = setInterval(() => {
        const now = performance.now();
        const elapsed = now - lastTime;
        lastTime = now;

        currentLength = Math.min(totalLength, currentLength + elapsed * speed);
        if (currentLength >= totalLength) {
          clearInterval(intervalId);
        }
      }, 16); // High-frequency framework polling interval

      return () => {
        clearInterval(intervalId);
      };
    }
  });
</script>

<div class="typewriter-container" style="content-visibility: auto;">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html slicedHtml}
</div>
