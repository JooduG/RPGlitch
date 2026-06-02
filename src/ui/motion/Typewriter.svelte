<script>
  /**
   * @file Typewriter.svelte
   * 📝 UNIFIED KINETIC TEXT ENGINE
   * Combines HTML token-safe parsing with multi-word cycling phase loops.
   */
  import { motion } from "./engine.svelte.js";
  import { Audio } from "@media";
  import { safe_html } from "@components";

  // --- PROP MATRIX BOUNDARIES ---
  let {
    // Legacy single-string input (supports backwards compatibility with Svelte actions)
    targetHtml = "",

    // Core parameters
    text = "",
    words = null,
    class: className = "",
    typeSpeed = null, // ms per char (null falls back to smart engine pacing)
    deleteSpeed = null, // ms per char (null falls back to fast engine reverse)
    delay = 0, // Delay before initial phrase entry begins
    pauseDelay = 1000,
    loop = false,
    as = "div",
    showCursor = false,
    blinkCursor = true,
    cursorStyle = "line",
  } = $props();

  // --- UNIFIED REACTIVE TRACKERS ---
  let currentCharIndex = $state(0);
  let currentWordIndex = $state(0);
  let phase = $state("typing"); // 'typing' | 'pause' | 'deleting'
  let pauseAccumulator = $state(0);
  let initialDelayElapsed = $state(0);

  // Normalize all input sources into a single array stream dependency
  const wordsToAnimate = $derived.by(() => {
    if (words && words.length > 0) return words;
    if (text) return [text];
    if (targetHtml) return [targetHtml];
    return [];
  });

  const hasMultipleWords = $derived(wordsToAnimate.length > 1);
  const currentWordHtml = $derived(wordsToAnimate[currentWordIndex] ?? "");

  /**
   * Parse active text input stream into structural tag/text tokens.
   * Protects code layout from fracturing mid-way through formatting strings.
   */
  const tokenBuffer = $derived.by(() => {
    const tokens = [];
    const regex = /(<[^>]+>|[^<]+)/g;
    let match;

    while ((match = regex.exec(currentWordHtml)) !== null) {
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

  // Count text-only characters inside active token allocation frame
  const totalLength = $derived(tokenBuffer.filter((t) => t.type === "text").length);

  // Reconstruct structural markup up to current plain-text length limits
  const slicedHtml = $derived.by(() => {
    let output = "";
    let textCount = 0;
    const targetCount = Math.floor(currentCharIndex);
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

  // Determine active cursor element style representation
  const cursorGlyph = $derived.by(() => {
    if (cursorStyle === "block") return "▌";
    if (cursorStyle === "underscore") return "_";
    return "|";
  });

  // Secondary evaluation to show trailing typing pointers
  const shouldShowCursor = $derived(
    showCursor &&
      !(!loop && currentWordIndex === wordsToAnimate.length - 1 && currentCharIndex >= totalLength),
  );

  // Compute delta progress increments across execution phases
  const activeSpeed = $derived.by(() => {
    if (phase === "typing") {
      if (typeSpeed !== null && typeSpeed > 0) return 1 / typeSpeed;

      // Inherited smart-acceleration matrix for chat streams
      const remaining = totalLength - currentCharIndex;
      let baseSpeed = 0.04;
      if (remaining > 150) baseSpeed = 0.2;
      else if (remaining > 50) baseSpeed = 0.1;

      const intensity = motion.isReduced ? 0 : motion.intensity;
      const voiceRateFactor =
        Audio.voice.enabled && Audio.voice.isSpeaking ? Audio.voice.rate : 1.0;
      return baseSpeed * intensity * voiceRateFactor;
    }

    if (phase === "deleting") {
      if (deleteSpeed !== null && deleteSpeed > 0) return 1 / deleteSpeed;
      return 0.08 * (motion.isReduced ? 0 : motion.intensity);
    }

    return 0;
  });

  // Clear timeline counters cleanly whenever content data strings alter
  $effect(() => {
    const _dependencyTrigger = wordsToAnimate.join("||");
    currentCharIndex = 0;
    currentWordIndex = 0;
    phase = "typing";
    pauseAccumulator = 0;
    initialDelayElapsed = 0;
  });

  // High-frequency physics interval loop processing frame updates
  $effect(() => {
    if (wordsToAnimate.length === 0) return;

    let lastTime = performance.now();

    const intervalId = setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTime;
      lastTime = now;

      // Handle the initial start delay prop safely before writing characters
      if (
        currentCharIndex === 0 &&
        phase === "typing" &&
        delay > 0 &&
        initialDelayElapsed < delay
      ) {
        initialDelayElapsed += elapsed;
        return;
      }

      if (phase === "typing") {
        if (currentCharIndex < totalLength) {
          currentCharIndex = Math.min(totalLength, currentCharIndex + elapsed * activeSpeed);
        } else {
          if (hasMultipleWords || loop) {
            phase = "pause";
            pauseAccumulator = 0;
          } else {
            clearInterval(intervalId);
          }
        }
      } else if (phase === "pause") {
        pauseAccumulator += elapsed;
        if (pauseAccumulator >= pauseDelay) {
          if (hasMultipleWords || loop) {
            phase = "deleting";
          } else {
            clearInterval(intervalId);
          }
        }
      } else if (phase === "deleting") {
        if (currentCharIndex > 0) {
          currentCharIndex = Math.max(0, currentCharIndex - elapsed * activeSpeed);
        } else {
          const nextIndex = currentWordIndex + 1;
          if (nextIndex >= wordsToAnimate.length) {
            if (loop) {
              currentWordIndex = 0;
              phase = "typing";
            } else {
              clearInterval(intervalId);
            }
          } else {
            currentWordIndex = nextIndex;
            phase = "typing";
          }
        }
      }
    }, 16);

    return () => clearInterval(intervalId);
  });
</script>

<svelte:element
  this={as}
  class="root {className}"
  class:is-inline={as === "span"}
  style="content-visibility: auto;"
>
  <span use:safe_html={slicedHtml}></span>
  {#if shouldShowCursor}
    <span class="cursor" class:is-blinking={blinkCursor}>
      {cursorGlyph}
    </span>
  {/if}
</svelte:element>

<style>
  .root {
    font-family: inherit;
    letter-spacing: var(--font-spacing-base, 0);
    line-height: var(--font-height-base, 1.5);
  }

  .root.is-inline {
    display: inline-block;
  }

  .cursor {
    display: inline-block;
    margin-left: calc(var(--spacing-pixel) * 2);
    color: var(--signature-color, var(--deep-indigo));
  }

  .cursor.is-blinking {
    animation: blink var(--duration-slow, 500ms) step-end infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0;
    }
  }
</style>
