<script>
  /**
   * @file Typewriter.svelte
   * 📝 UNIFIED KINETIC TEXT ENGINE
   * Combines HTML token-safe parsing with multi-word cycling phase loops.
   */
  import { untrack } from "svelte";
  import { motion } from "@motion";
  import { Audio } from "@media";

  // Fast check for Unicode surrogate pairs (e.g. emojis)
  const SURROGATE_PAIR_REGEX = /[\uD800-\uDFFF]/;

  // --- PROP MATRIX BOUNDARIES ---
  let {
    // Legacy single-string input (supports backwards compatibility with Svelte actions)
    target_html = "",
    // Legacy alias
    targetHtml = null,

    // Core parameters
    text = "",
    words = null,
    class: className = "",
    type_speed = null, // ms per char (null falls back to smart engine pacing)
    // Legacy alias
    typeSpeed = null,
    delete_speed = null, // ms per char (null falls back to fast engine reverse)
    // Legacy alias
    deleteSpeed = null,
    delay = 0, // Delay before initial phrase entry begins
    pause_delay = 1000,
    // Legacy alias
    pauseDelay = null,
    loop = false,
    as = "div",
    show_cursor = false,
    // Legacy alias
    showCursor = null,
    blink_cursor = true,
    // Legacy alias
    blinkCursor = null,
    cursor_style = "line",
    // Legacy alias
    cursorStyle = null,
    is_finished = $bindable(false),
  } = $props();

  // Normalize legacy camelCase props to snake_case
  const _target_html = $derived(targetHtml ?? target_html);
  const _type_speed = $derived(typeSpeed ?? type_speed);
  const _delete_speed = $derived(deleteSpeed ?? delete_speed);
  const _pause_delay = $derived(pauseDelay ?? pause_delay);
  const _show_cursor = $derived(showCursor ?? show_cursor);
  const _blink_cursor = $derived(blinkCursor ?? blink_cursor);
  const _cursor_style = $derived(cursorStyle ?? cursor_style);
  let _is_finished = $state(is_finished);

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
    if (_target_html) return [_target_html];
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
        const hasSurrogates = SURROGATE_PAIR_REGEX.test(val);
        tokens.push({ type: "text", value: val, length: hasSurrogates ? [...val].length : val.length });
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
          let sliced;
          if (token.value.length === token.length) {
            sliced = token.value.slice(0, remaining);
          } else {
            let index = 0;
            const len = token.value.length;
            for (let i = 0; i < remaining && index < len; i++) {
              const code = token.value.charCodeAt(index);
              index += code >= 0xd800 && code <= 0xdbff ? 2 : 1;
            }
            sliced = token.value.slice(0, index);
          }
          output += sliced;
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
    if (_cursor_style === "block") return "▌";
    if (_cursor_style === "underscore") return "_";
    return "|";
  });

  // Secondary evaluation to show trailing typing pointers
  const shouldShowCursor = $derived(_show_cursor && !(!loop && currentWordIndex === wordsToAnimate.length - 1 && currentCharIndex >= totalLength));

  // Compute delta progress increments across execution phases
  const activeSpeed = $derived.by(() => {
    if (phase === "typing") {
      if (_type_speed !== null && _type_speed > 0) return 1 / _type_speed;

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
      if (_delete_speed !== null && _delete_speed > 0) return 1 / _delete_speed;
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
            if (_is_finished) _is_finished = false;
          } else {
            if (!_is_finished && !hasMultipleWordsRaw && !loop) _is_finished = true;
            if (hasMultipleWordsRaw || loop) {
              phase = "pause";
              pauseAccumulator = 0;
            }
          }
        } else if (phase === "pause") {
          pauseAccumulator += elapsed;
          if (pauseAccumulator >= _pause_delay) {
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
    {as === 'span' ? 'inline-block' : 'block'}
    {className}"
  style="content-visibility: auto;"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html slicedHtml}

  {#if shouldShowCursor}
    <span class="ml-0.5 inline-block text-(--signature-color) {_blink_cursor ? 'animate-[blink_var(--duration-slow,500ms)_step-end_infinite]' : ''}">
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
