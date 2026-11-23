<script module>
  const SURROGATE_PAIR_REGEX = /[\uD800-\uDFFF]/;
  const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
</script>

<script>
  /**
   * @file src/ui/atoms/Typewriter.svelte
   * HTML-tag-safe typewriter reveal atom with multi-phrase cycling support.
   */
  import { Audio, motion } from "@media";
  import { sanitize } from "@utils";
  import { untrack } from "svelte";

  let {
    target_html = "",
    text = "",
    words = null,
    class: className = "",
    type_speed = null,
    delete_speed = null,
    delay = 0,
    pause_delay = 1000,
    loop = false,
    as = "div",
    show_cursor = false,
    blink_cursor = true,
    cursor_style = "line",
    is_finished = $bindable(false),
  } = $props();

  let current_char_index = $state(0);
  let current_word_index = $state(0);
  let phase = $state("typing"); // 'typing' | 'pause' | 'deleting'
  let pause_accumulator = 0;
  let initial_delay_elapsed = 0;

  const words_to_animate = $derived(
    words?.length ? words
    : text ? [text]
    : target_html ? [target_html]
    : [],
  );
  const has_multiple_words = $derived(words_to_animate.length > 1);
  const current_word_html = $derived(sanitize(words_to_animate[current_word_index] ?? ""));

  const token_buffer = $derived.by(() => {
    const tokens = [];
    const regex = /(<[^>]+>|[^<]+)/g;
    let match;
    while ((match = regex.exec(current_word_html)) !== null) {
      const val = match[0];
      if (val.startsWith("<")) {
        tokens.push({ type: "tag", value: val });
      } else {
        tokens.push({ type: "text", value: val, length: SURROGATE_PAIR_REGEX.test(val) ? [...val].length : val.length });
      }
    }
    return tokens;
  });

  const total_length = $derived(token_buffer.reduce((acc, t) => acc + (t.type === "text" ? t.length : 0), 0));
  const cursor_glyph = $derived(
    cursor_style === "block" ? "▌"
    : cursor_style === "underscore" ? "_"
    : "|",
  );
  const should_show_cursor = $derived(show_cursor && !(!loop && current_word_index === words_to_animate.length - 1 && current_char_index >= total_length));

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
        } else if (tag.startsWith("<") && !tag.endsWith("/>") && !tag.startsWith("<!")) {
          const name = tag.match(/<([a-zA-Z0-9:-]+)/)?.[1]?.toLowerCase();
          if (name && !VOID_TAGS.has(name)) open_tags.push(name);
        }
        output += tag;
      } else {
        const remaining = target_count - text_count;
        if (remaining <= 0) break;

        if (token.length <= remaining) {
          output += token.value;
          text_count += token.length;
        } else if (token.value.length === token.length) {
          output += token.value.slice(0, remaining);
          break;
        } else {
          let idx = 0;
          for (let i = 0; i < remaining && idx < token.value.length; i++) {
            const code = token.value.charCodeAt(idx);
            idx += code >= 0xd800 && code <= 0xdbff ? 2 : 1;
          }
          output += token.value.slice(0, idx);
          break;
        }
      }
    }

    if (should_show_cursor) {
      output += `<span class="ml-0.5 inline text-(--signature-color) ${blink_cursor ? "animate-[blink_var(--transition-duration-slow,500ms)_step-end_infinite]" : ""}">${cursor_glyph}</span>`;
    }

    for (let i = open_tags.length - 1; i >= 0; i--) {
      output += `</${open_tags[i]}>`;
    }
    return output;
  });

  const active_speed = $derived.by(() => {
    if (motion.is_reduced || motion.intensity <= 0) return 0;
    if (phase === "typing") {
      if (type_speed !== null && type_speed > 0) return 1 / type_speed;
      const remaining = total_length - current_char_index;
      const base_speed =
        remaining > 300 ? 0.3
        : remaining > 150 ? 0.15
        : remaining > 50 ? 0.08
        : remaining < 15 ? 0.01
        : 0.02;
      const voice_rate_factor = Audio?.voice?.enabled && Audio.voice.is_speaking ? Audio.voice.rate : 1.0;
      return base_speed * motion.intensity * voice_rate_factor;
    }
    if (phase === "deleting") {
      return delete_speed !== null && delete_speed > 0 ? 1 / delete_speed : 0.08 * motion.intensity;
    }
    return 0;
  });

  // Plain snapshots read inside rAF (avoids extra $state allocations and derived_inert warnings)
  let snap_words = [];
  let snap_multi = false;
  let snap_total = 0;
  let snap_speed = 0;

  $effect(() => {
    snap_words = words_to_animate;
    snap_multi = has_multiple_words;
    snap_total = total_length;
    snap_speed = active_speed;
  });

  $effect(() => {
    if (current_char_index > total_length) current_char_index = total_length;
  });

  // Reveal immediately under reduced motion instead of freezing at 0 chars
  $effect(() => {
    if (words_to_animate.length === 0) return;
    if (motion.is_reduced || motion.intensity <= 0) {
      current_char_index = total_length;
      if (!has_multiple_words && !loop && !is_finished) is_finished = true;
    }
  });

  const needs_animation = $derived(
    words_to_animate.length > 0 && !motion.is_reduced && motion.intensity > 0 && (has_multiple_words || loop || current_char_index < total_length),
  );

  $effect(() => {
    if (!needs_animation) return;
    let raf_id = 0;
    let last_time = performance.now();

    const step = (now) => {
      raf_id = 0;
      let keep_going = true;

      untrack(() => {
        if (snap_words.length === 0) {
          keep_going = false;
          return;
        }
        const elapsed = Math.min(100, now - last_time);
        last_time = now;

        if (current_char_index === 0 && phase === "typing" && delay > 0 && initial_delay_elapsed < delay) {
          initial_delay_elapsed += elapsed;
          return;
        }

        if (phase === "typing") {
          if (current_char_index < snap_total) {
            current_char_index = Math.min(snap_total, current_char_index + elapsed * snap_speed);
            if (is_finished) is_finished = false;
          }
          if (current_char_index >= snap_total) {
            if (snap_multi || loop) {
              phase = "pause";
              pause_accumulator = 0;
            } else {
              if (!is_finished) is_finished = true;
              keep_going = false;
            }
          }
        } else if (phase === "pause") {
          pause_accumulator += elapsed;
          if (pause_accumulator >= pause_delay && (snap_multi || loop)) phase = "deleting";
        } else if (phase === "deleting") {
          if (current_char_index > 0) {
            current_char_index = Math.max(0, current_char_index - elapsed * snap_speed);
          } else {
            const next_index = current_word_index + 1;
            if (next_index >= snap_words.length) {
              if (loop) {
                current_word_index = 0;
                phase = "typing";
              } else {
                keep_going = false;
              }
            } else {
              current_word_index = next_index;
              phase = "typing";
            }
          }
        }
      });

      if (keep_going) raf_id = requestAnimationFrame(step);
    };

    raf_id = requestAnimationFrame(step);
    return () => {
      if (raf_id) cancelAnimationFrame(raf_id);
    };
  });
</script>

<svelte:element this={as} class={["font-[inherit]", as === "span" ? "inline-block" : "block", className]} style="content-visibility: auto;">
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
