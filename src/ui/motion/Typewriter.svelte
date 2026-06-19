<script>
  /**
   * @file Typewriter.svelte
   * 📝 UNIFIED KINETIC TEXT ENGINE
   * Combines HTML token-safe parsing with multi-word cycling phase loops.
   */
  import { untrack } from "svelte";
  import { motion } from "./engine.svelte.js";
  import { Audio } from "@media";

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
    isFinished = $bindable(false),
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
        tokens.push({ type: "text", value: val, length: [...val].length });
      }
    }
    return tokens;
  });

  // Count text-only characters inside active token allocation frame
  const totalLength = $derived(tokenBuffer.reduce((acc, t) => acc + (t.type === "text" ? t.length : 0), 0));

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
        const remaining = targetCount - textCount;
        if (remaining <= 0) break;

        if (token.length <= remaining) {
          output += token.value;
          textCount += token.length;
        } else {
          const codePoints = [...token.value];
          output += codePoints.slice(0, remaining).join("");
          textCount += remaining;
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
  const shouldShowCursor = $derived(showCursor && !(!loop && currentWordIndex === wordsToAnimate.length - 1 && currentCharIndex >= totalLength));

  // Compute delta progress increments across execution phases
  const activeSpeed = $derived.by(() => {
    if (phase === "typing") {
      if (typeSpeed !== null && typeSpeed > 0) return 1 / typeSpeed;

      // Inherited smart-acceleration matrix for chat streams
      const remaining = totalLength - currentCharIndex;
      let baseSpeed = 0.02; // Default typing speed
      if (remaining > 300)
        baseSpeed = 0.3; // Catching up (fast forward)
      else if (remaining > 150) baseSpeed = 0.15;
      else if (remaining > 50) baseSpeed = 0.08;
      else if (remaining < 15) baseSpeed = 0.01; // Almost caught up to stream (slow down)

      const intensity = motion.isReduced ? 0 : motion.intensity;
      const voiceRateFactor = Audio.voice.enabled && Audio.voice.isSpeaking ? Audio.voice.rate : 1.0;
      return baseSpeed * intensity * voiceRateFactor;
    }

    if (phase === "deleting") {
      if (deleteSpeed !== null && deleteSpeed > 0) return 1 / deleteSpeed;
      return 0.08 * (motion.isReduced ? 0 : motion.intensity);
    }

    return 0;
  });

  // Raw state caches to prevent Svelte 5 derived_inert warnings inside async callbacks
  let wordsToAnimateRaw = $state([]);
  let hasMultipleWordsRaw = $state(false);
  let totalLengthRaw = $state(0);
  let activeSpeedRaw = $state(0);

  $effect(() => {
    wordsToAnimateRaw = wordsToAnimate;
    hasMultipleWordsRaw = hasMultipleWords;
    totalLengthRaw = totalLength;
    activeSpeedRaw = activeSpeed;
  });

  // Clear timeline counters cleanly whenever content data strings alter
  let lastText = "";

  /**
   * Normalize text to detect clean appends during stream generation.
   * Strips HTML tags, markdown formatting markers, and collapses whitespace.
   * @param {string} val
   * @returns {string}
   */
  function normalize(val) {
    return val
      .replace(/<[^>]*>/g, "")
      .replace(/[*_`~"“”'‘’]/g, "")
      .replace(/&[a-z0-9]+;/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  $effect(() => {
    const currentText = wordsToAnimate.join("||");

    const cleanCurrent = normalize(currentText);
    const cleanLast = normalize(lastText);
    const isAppend = cleanLast && (cleanCurrent.startsWith(cleanLast) || cleanCurrent.length >= cleanLast.length);

    if (!isAppend && lastText !== "") {
      currentCharIndex = 0;
      currentWordIndex = 0;
      phase = "typing";
      pauseAccumulator = 0;
      initialDelayElapsed = 0;
    }

    lastText = currentText;
  });

  let isMounted = true;

  // High-frequency physics interval loop processing frame updates
  $effect(() => {
    let lastTime = performance.now();

    const intervalId = setInterval(() => {
      untrack(() => {
        if (!isMounted) return;
        const words = wordsToAnimateRaw;
        if (words.length === 0) return;

        const now = performance.now();
        const elapsed = now - lastTime;
        lastTime = now;

        // Handle the initial start delay prop safely before writing characters
        if (currentCharIndex === 0 && phase === "typing" && delay > 0 && initialDelayElapsed < delay) {
          initialDelayElapsed += elapsed;
          return;
        }

        if (phase === "typing") {
          if (currentCharIndex < totalLengthRaw) {
            currentCharIndex = Math.min(totalLengthRaw, currentCharIndex + elapsed * activeSpeedRaw);
            if (isFinished) isFinished = false;
          } else {
            if (!isFinished && !hasMultipleWordsRaw && !loop) isFinished = true;
            if (hasMultipleWordsRaw || loop) {
              phase = "pause";
              pauseAccumulator = 0;
            }
          }
        } else if (phase === "pause") {
          pauseAccumulator += elapsed;
          if (pauseAccumulator >= pauseDelay) {
            if (hasMultipleWordsRaw || loop) {
              phase = "deleting";
            }
          }
        } else if (phase === "deleting") {
          if (currentCharIndex > 0) {
            currentCharIndex = Math.max(0, currentCharIndex - elapsed * activeSpeedRaw);
          } else {
            const nextIndex = currentWordIndex + 1;
            if (nextIndex >= words.length) {
              if (loop) {
                currentWordIndex = 0;
                phase = "typing";
              }
            } else {
              currentWordIndex = nextIndex;
              phase = "typing";
            }
          }
        }
      });
    }, 16);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  });
</script>

<svelte:element
  this={as}
  class="
    font-[inherit]
    leading-normal
    tracking-normal
    {as === 'span' ? 'inline-block' : 'block'}
    {className}"
  style="content-visibility: auto;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html slicedHtml}

  {#if shouldShowCursor}
    <span class="ml-0.5 inline-block text-(--signature-color) {blinkCursor ? 'animate-[blink_var(--duration-slow,500ms)_step-end_infinite]' : ''}">
      {cursorGlyph}
    </span>
  {/if}
</svelte:element>

<style>
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
