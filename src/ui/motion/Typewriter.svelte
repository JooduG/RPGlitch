<script>
  /**
   * @file Typewriter.svelte
   * 📝 UNIFIED KINETIC TEXT ENGINE
   * Combines HTML token-safe parsing with multi-word cycling phase loops.
   */
  import { untrack } from "svelte";
  import { motion } from "@motion/engine.svelte.js";
  import { Audio } from "@media";

  // Fast check for Unicode surrogate pairs (e.g. emojis)
  const SURROGATE_PAIR_REGEX = /[\uD800-\uDFFF]/;

  // --- PROP MATRIX BOUNDARIES ---
  let {
    target_html = "",

    // Core parameters
    text = "",
    words = null,
    class: className = "",
    type_speed = null, // ms per char (null falls back to smart engine pacing)
    delete_speed = null, // ms per char (null falls back to fast engine reverse)
    delay = 0, // Delay before initial phrase entry begins
    pause_delay = 1000,
    loop = false,
    as = "div",
    show_cursor = false,
    blink_cursor = true,
    cursor_style = "line",
    is_finished = $bindable(false),
  } = $props();

  let _is_finished = $state(is_finished);
  $effect(() => {
    is_finished = _is_finished;
  });

  // --- UNIFIED REACTIVE TRACKERS ---
  let current_char_index = $state(0);
  let current_word_index = $state(0);
  let phase = $state("typing"); // 'typing' | 'pause' | 'deleting'
  let pause_accumulator = $state(0);
  let initial_delay_elapsed = $state(0);

  // Normalize all input sources into a single array stream dependency
  const words_to_animate = $derived.by(() => {
    if (words && words.length > 0) return words;
    if (text) return [text];
    if (target_html) return [target_html];
    return [];
  });

  const has_multiple_words = $derived(words_to_animate.length > 1);
  const current_word_html = $derived(words_to_animate[current_word_index] ?? "");

  /**
   * Parse active text input stream into structural tag/text tokens.
   * Protects code layout from fracturing mid-way through formatting strings.
   */
  const token_buffer = $derived.by(() => {
    const tokens = [];
    const regex = /(<[^>]+>|[^<]+)/g;
    let match;

    while ((match = regex.exec(current_word_html)) !== null) {
      const val = match[0];
      if (val.startsWith("<")) {
        tokens.push({ type: "tag", value: val });
      } else {
        const has_surrogates = SURROGATE_PAIR_REGEX.test(val);
        tokens.push({ type: "text", value: val, length: has_surrogates ? [...val].length : val.length });
      }
    }
    return tokens;
  });

  // Count text-only characters inside active token allocation frame
  const total_length = $derived(token_buffer.reduce((acc, t) => acc + (t.type === "text" ? t.length : 0), 0));

  // Reconstruct structural markup up to current plain-text length limits
  const sliced_html = $derived.by(() => {
    let output = "";
    let text_count = 0;
    const target_count = Math.floor(current_char_index);
    /** @type {string[]} */
    const open_tags = [];

    for (const token of token_buffer) {
      if (token.type === "tag") {
        const tag = token.value;
        if (tag.startsWith("</")) {
          open_tags.pop();
          output += tag;
        } else if (tag.startsWith("<") && !tag.endsWith("/>") && !tag.startsWith("<!")) {
          const name_match = tag.match(/<([a-zA-Z0-9:-]+)/);
          if (name_match) open_tags.push(name_match[1]);
          output += tag;
        } else {
          output += tag;
        }
      } else {
        const remaining = target_count - text_count;
        if (remaining <= 0) break;

        if (token.length <= remaining) {
          output += token.value;
          text_count += token.length;
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

    const cursor_html = should_show_cursor
      ? `<span class="ml-0.5 inline text-(--signature-color) ${blink_cursor ? "animate-[blink_var(--duration-slow,500ms)_step-end_infinite]" : ""}">${cursor_glyph}</span>`
      : "";

    // Insert cursor before closing open tags so it renders inline with the active paragraph
    output += cursor_html;

    // Auto-close any unclosed tags to guarantee layout safety frames
    for (let i = open_tags.length - 1; i >= 0; i--) {
      output += `</${open_tags[i]}>`;
    }

    return output;
  });

  // Determine active cursor element style representation
  const cursor_glyph = $derived.by(() => {
    if (cursor_style === "block") return "▌";
    if (cursor_style === "underscore") return "_";
    return "|";
  });

  // Secondary evaluation to show trailing typing pointers
  const should_show_cursor = $derived(
    show_cursor && !(!loop && current_word_index === words_to_animate.length - 1 && current_char_index >= total_length),
  );

  // Compute delta progress increments across execution phases
  const active_speed = $derived.by(() => {
    if (phase === "typing") {
      if (type_speed !== null && type_speed > 0) return 1 / type_speed;

      // Inherited smart-acceleration matrix for chat streams
      const remaining = total_length - current_char_index;
      let base_speed = 0.02; // Default typing speed
      if (remaining > 300)
        base_speed = 0.3; // Catching up (fast forward)
      else if (remaining > 150) base_speed = 0.15;
      else if (remaining > 50) base_speed = 0.08;
      else if (remaining < 15) base_speed = 0.01; // Almost caught up to stream (slow down)

      const intensity = motion.is_reduced ? 0 : motion.intensity;
      const voice_rate_factor = Audio.voice.enabled && Audio.voice.is_speaking ? Audio.voice.rate : 1.0;
      return base_speed * intensity * voice_rate_factor;
    }

    if (phase === "deleting") {
      if (delete_speed !== null && delete_speed > 0) return 1 / delete_speed;
      return 0.08 * (motion.is_reduced ? 0 : motion.intensity);
    }

    return 0;
  });

  // Raw state caches to prevent Svelte 5 derived_inert warnings inside async callbacks
  let words_to_animate_raw = $state([]);
  let has_multiple_words_raw = $state(false);
  let total_length_raw = $state(0);
  let active_speed_raw = $state(0);

  $effect(() => {
    words_to_animate_raw = words_to_animate;
    has_multiple_words_raw = has_multiple_words;
    total_length_raw = total_length;
    active_speed_raw = active_speed;
  });

  $effect(() => {
    // When text or length changes mid-stream (e.g. detox_prose replacements), clamp index safely without resetting to 0
    if (current_char_index > total_length) {
      current_char_index = total_length;
    }
  });

  let is_mounted = true;

  // High-frequency physics interval loop processing frame updates
  $effect(() => {
    let last_time = performance.now();

    const interval_id = setInterval(() => {
      untrack(() => {
        if (!is_mounted) return;
        const words = words_to_animate_raw;
        if (words.length === 0) return;

        const now = performance.now();
        const elapsed = now - last_time;
        last_time = now;

        // Handle the initial start delay prop safely before writing characters
        if (current_char_index === 0 && phase === "typing" && delay > 0 && initial_delay_elapsed < delay) {
          initial_delay_elapsed += elapsed;
          return;
        }

        if (phase === "typing") {
          if (current_char_index < total_length_raw) {
            current_char_index = Math.min(total_length_raw, current_char_index + elapsed * active_speed_raw);
            if (_is_finished) _is_finished = false;
          } else {
            if (!_is_finished && !has_multiple_words_raw && !loop) _is_finished = true;
            if (has_multiple_words_raw || loop) {
              phase = "pause";
              pause_accumulator = 0;
            }
          }
        } else if (phase === "pause") {
          pause_accumulator += elapsed;
          if (pause_accumulator >= pause_delay) {
            if (has_multiple_words_raw || loop) {
              phase = "deleting";
            }
          }
        } else if (phase === "deleting") {
          if (current_char_index > 0) {
            current_char_index = Math.max(0, current_char_index - elapsed * active_speed_raw);
          } else {
            const next_index = current_word_index + 1;
            if (next_index >= words.length) {
              if (loop) {
                current_word_index = 0;
                phase = "typing";
              }
            } else {
              current_word_index = next_index;
              phase = "typing";
            }
          }
        }
      });
    }, 16);

    return () => {
      is_mounted = false;
      clearInterval(interval_id);
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
  {@html sliced_html}
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
