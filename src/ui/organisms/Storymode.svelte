<script>
  /**
   * @file Storymode.svelte
   * @description THE STORY MODE FEED
   * Logic:
   * 1. Renders the sequential story log entries.
   * 2. Manages auto-scroll and turn-state visualization.
   * 3. Integrated with design language & Chess Grid.
   * 4. Progressive sentence-by-sentence text-to-speech parsing with cognition shield filters.
   */
  import { tick } from "svelte";
  import { Button, ScrollArea } from "@atoms";
  import { clean_image_prompts } from "@intelligence";
  import { Audio } from "@media";
  import { chrono_engine } from "@engine";
  import { app, runtime, simulation_log, simulation_state } from "@state";
  import { motion, item_in } from "@motion";
  import { Dialog } from "@molecules";
  import { Message } from "@organisms";

  // --- STATE ---
  /** @type {HTMLDivElement | null} */
  let scroll_ref = $state(null);
  let show_delete_confirm = $state(false);
  /** @type {string | number | null} */
  let delete_target_id = $state(null);
  /** @type {number | null} */
  let editing_index = $state(null);
  const UNDO_DELETE_WINDOW_MS = 5000;
  /**
   * Staged deletions awaiting undo. Plain $state object (not a Map): Svelte's
   * $state Map proxy does not invalidate .has()/.get() readers on .set() in
   * svelte@5.56 (live-verified), which silently broke the placeholder swap.
   * @type {Record<string | number, { timer: ReturnType<typeof setTimeout>, expires_at: number }>}
   */
  let pending_deletes = $state({});

  // Streaming trackers for sequential speech queue feeding
  let was_streaming = $state(false);
  let last_streaming_role = $state(null);
  let spoken_character_cursor = $state(0);

  // --- DERIVATIONS ---

  // Reactive Sound Cues & Sentence-by-Sentence Vocal Streaming Loop
  $effect(() => {
    if (app.streaming.active && !was_streaming) {
      spoken_character_cursor = 0;

      const active_role = app.streaming.role;
      // Only hard-stop voice on same-role transitions (e.g., retry).
      // For cross-role transitions (fractal → ai), let the queue drain naturally —
      // the active_message_id mechanism skips old sentences at sentence boundaries.
      if (last_streaming_role === active_role) {
        Audio.voice.stop();
      }
      last_streaming_role = active_role;

      // Resolve the speaking entity and sync the master voice switch to its per-entity toggle.
      // This lets each entity own its own voice activation independently.
      if (active_role === "ai" || active_role === "fractal") {
        const entity = active_role === "ai" ? runtime.active_ai || app.selected_ai : runtime.active_fractal || app.selected_fractal;

        Audio.voice.enabled = !!Audio.voice.entity_voice[active_role];

        if (entity && entity.voice) {
          Audio.voice.selected_voice = entity.voice.uri || Audio.voice.selected_voice;
          Audio.voice.rate = entity.voice.rate ?? 1.0;
        }
      } else if (active_role === "user") {
        Audio.voice.enabled = !!Audio.voice.entity_voice.user;
      }
    }

    if (app.streaming.active) {
      const current_raw_text = app.streaming.text ?? app.streaming.content ?? "";

      const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");

      const fresh_buffer = sanitized_stream_track.slice(spoken_character_cursor);

      const sentence_regex = /[^.!?]+[.!?]+/g;
      let match;
      let highest_match_offset = 0;

      while ((match = sentence_regex.exec(fresh_buffer)) !== null) {
        const structural_sentence = match[0];
        const clean_sentence = clean_image_prompts(structural_sentence).trim();

        if (clean_sentence) {
          Audio.voice.active_message_id = app.streaming.node_id;
          try {
            Audio.voice.speak(clean_sentence, false);
          } catch (tts_err) {
            console.warn("[Storymode] TTS speak error during streaming:", tts_err);
          }
        }

        highest_match_offset = match.index + match[0].length;
      }

      spoken_character_cursor += highest_match_offset;
    }

    if (!app.streaming.active && was_streaming) {
      const errored_node = app.streaming.errored_node_id;

      if (app.streaming.errored && errored_node && Audio.voice.active_message_id === errored_node) {
        Audio.voice.stop();
      } else {
        Audio.play("notification");

        const current_raw_text = app.streaming.text ?? app.streaming.content ?? "";
        const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");

        const remaining_text = sanitized_stream_track.slice(spoken_character_cursor);
        const clean_remainder = clean_image_prompts(remaining_text).trim();

        if (clean_remainder) {
          Audio.voice.active_message_id = app.streaming.node_id;
          Audio.voice.speak(clean_remainder, false);
        }
      }
    }

    was_streaming = app.streaming.active;
  });

  /**
   * Helper to map DB roles to UI sender archetypes
   * @param {string} role
   * @returns {string}
   */
  function map_role(role) {
    if (role === "assistant" || role === "ai") return "ai";
    if (role === "prologue") return "fractal";
    return role;
  }

  // Turn state orchestration
  let is_active_turn = $derived(simulation_state.phase === "generating" || app.streaming.active);
  let active_turn_role = $derived.by(() => {
    if (app.streaming.active) return app.streaming.role;
    // During image generation, always fall back to "ai" so the busy
    // bubble renders left-aligned regardless of intermediate typing roles.
    if (simulation_state.phase === "generating") {
      if (
        simulation_state.role === "selfie" ||
        simulation_state.role === "character" ||
        simulation_state.role === "characters" ||
        simulation_state.role === "setting" ||
        simulation_state.role === "paparazzi" ||
        simulation_state.role === "story_entities" ||
        simulation_state.role === "story_character" ||
        simulation_state.role === "solo_entity" ||
        simulation_state.role === "story_scene"
      )
        return "ai";
      return simulation_state.role ?? "ai";
    }
    return simulation_state.role;
  });
  let active_turn_name = $derived.by(() => {
    if (active_turn_role === "ai") return app.selected_ai?.name;
    if (active_turn_role === "fractal") return app.selected_fractal?.name;
    return "";
  });

  let visible_feed = $derived.by(() => {
    const list = [...simulation_log.feed];
    if (is_active_turn && app.streaming.active) {
      const active_id = app.streaming.node_id ?? "temp";
      if (!list.some((entry) => entry.id === active_id)) {
        list.push({
          id: active_id,
          text: app.streaming.text ?? app.streaming.content ?? "",
          role: active_turn_role ?? "ai",
          character_name: active_turn_name ?? "",
          created_at: Date.now(),
          busy: true,
          meta: { is_prologue: app.streaming.role === "fractal" },
        });
      }
    }
    return list;
  });

  let user_scrolled_up = $state(false);

  $effect(() => {
    if (!scroll_ref) return;
    const el = scroll_ref.querySelector(".scroll-area-viewport");
    if (!el) return;

    const handle_scroll = () => {
      const distance_to_bottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      user_scrolled_up = distance_to_bottom > 10;
    };

    el.addEventListener("scroll", handle_scroll, { passive: true });
    return () => el.removeEventListener("scroll", handle_scroll);
  });

  let last_feed_length = $state(0);

  // Advanced Kinetic Viewport Auto-Scroll Controller
  $effect(() => {
    // Read dependencies to trigger effect
    const _is_active = app.streaming.active;
    const current_len = visible_feed.length;

    if (!scroll_ref) return;
    const el = scroll_ref.querySelector(".scroll-area-viewport");
    if (!el) return;

    const scroll_to_bottom = (smooth = true) => {
      const is_reduced = motion.is_reduced;
      if (is_reduced || !smooth || typeof el.scrollTo !== "function") {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
      }
    };

    // Reset scroll lock when a new message is posted to the feed (e.g. USER message submission)
    if (current_len > last_feed_length) {
      user_scrolled_up = false;
      tick().then(() => scroll_to_bottom(false));
    }
    last_feed_length = current_len;

    // Trigger immediate scroll on major state changes if user hasn't scrolled up manually
    if (!user_scrolled_up) {
      tick().then(() => scroll_to_bottom(true));
    }

    // Track dynamic height expansion (user typing, AI streaming, layout rendering)
    if (!user_scrolled_up) {
      const observer = new MutationObserver(() => {
        if (!user_scrolled_up) {
          scroll_to_bottom(false); // Instant scroll to prevent animation fighting
        }
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true });
      return () => observer.disconnect();
    }
  });

  // --- ACTIONS ---

  /**
   * Triggers the deletion confirmation lifecycle gate for a historic entry.
   * @param {number} index
   * @returns {Promise<void>}
   */
  async function handle_delete(index) {
    const entry = simulation_log.feed[index];
    if (entry?.id) {
      delete_target_id = entry.id;
      show_delete_confirm = true;
    }
  }

  /**
   * Stages the deletion: the entry is visually removed immediately, but the real
   * database erasure waits out the undo window (or is cancelled by Undo).
   * @returns {Promise<void>}
   */
  async function execute_delete() {
    const id = delete_target_id;
    if (id == null) return;
    delete_target_id = null;
    if (Audio.voice.active_message_id === id) {
      Audio.voice.stop();
    }
    const pending = pending_deletes[id];
    if (pending) clearTimeout(pending.timer);
    const timer = setTimeout(async () => {
      delete pending_deletes[id];
      await chrono_engine.delete_log_entry(String(id));
    }, UNDO_DELETE_WINDOW_MS);
    pending_deletes[id] = { timer, expires_at: Date.now() + UNDO_DELETE_WINDOW_MS };
  }

  /**
   * Cancels a staged deletion and restores the entry.
   * @param {string | number} id
   */
  function undo_delete(id) {
    const pending = pending_deletes[id];
    if (pending) {
      clearTimeout(pending.timer);
      delete pending_deletes[id];
    }
  }

  /**
   * Activates editing state limits for a designated stream log index.
   * @param {number} index
   * @returns {void}
   */
  function handle_edit(index) {
    editing_index = index;
  }

  /**
   * Persists client text modifications down across state protocols.
   * @param {string|number} id
   * @param {string} updated_text
   * @returns {Promise<void>}
   */
  async function handle_save_edit(id, updated_text) {
    await chrono_engine.edit_log_entry(id.toString(), updated_text);
    editing_index = null;
  }
</script>

<Dialog
  type="confirm"
  bind:open={show_delete_confirm}
  title="Delete Entry?"
  message="Delete this log entry? It will be removed in 5 seconds unless you undo."
  confirm_label="Delete"
  on_confirm={execute_delete}
/>

<div
  class="
    flex
    min-h-80
    w-full
    flex-1
    flex-col
    gap-0
    overflow-hidden
    px-0
  "
  bind:this={scroll_ref}
>
  <ScrollArea data-id="storymode-scroll-area" style="height: 100%; width: 100%;">
    {#each visible_feed as entry, index (entry.id)}
      {#if pending_deletes[entry.id]}
        <div
          role="status"
          class="relative mx-(--spacing-padding-standard) flex items-center gap-(--spacing-gap-tight) overflow-hidden rounded-(--radius-standard) bg-glass-sunken px-(--spacing-padding-tight) py-(--spacing-padding-tight) text-sm text-frozen"
        >
          <span class="flex-1 opacity-80">Message deleted</span>
          <button
            class="cursor-pointer rounded-(--radius-standard) bg-(--color-electric-cyan) px-[calc(var(--spacing-unit)*3)] py-1.5 text-xs font-semibold text-(--color-void-black) transition-[filter] duration-150 hover:brightness-[1.15]"
            onclick={() => undo_delete(entry.id)}>Undo</button
          >
          <span
            aria-hidden="true"
            class="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-(--color-electric-cyan)"
            style="animation: undo-countdown-shrink {UNDO_DELETE_WINDOW_MS}ms linear forwards;"
          ></span>
        </div>
      {:else}
        <div class="w-full shrink-0" in:item_in>
          <Message
            id={entry.id}
            text={entry.text}
            sender={map_role(entry.role)}
            character_name={entry.character_name || (map_role(entry.role) === "ai" ? app.selected_ai?.name : "")}
            timestamp={entry.created_at ? new Date(entry.created_at) : new Date()}
            attachments={entry.attachments}
            is_last={index === visible_feed.length - 1}
            on_delete={() => handle_delete(index)}
            on_regenerate={() => chrono_engine.retry()}
            on_continue={() => chrono_engine.continue()}
            on_edit={() => handle_edit(index)}
            is_editing={index === editing_index}
            on_save={(new_text) => entry.id && handle_save_edit(entry.id, new_text)}
            on_cancel={() => {
              editing_index = null;
            }}
            meta={entry.meta}
            busy={entry.busy}
          />
        </div>
      {/if}
    {/each}

    {#if visible_feed.length === 0}
      <div
        class="
          flex
          h-full
          flex-col
          items-center
          justify-center
          gap-4
          p-4
          text-center
          text-slate-600

          [&>p]:max-w-[calc(var(--spacing-column-unit)*8)]
        "
      >
        <p>Establishing context stream... If the screen remains black, please check your network or AI plugin settings.</p>
        <Button variant="primary" onclick={() => chrono_engine.retry()} disabled={simulation_state.busy} label="Retry Connection" />
      </div>
    {/if}

    <!-- SPACER for UnifiedConsole overlap -->
    <div class="h-[calc(var(--spacing-row-unit)*2)] w-full shrink-0"></div>
  </ScrollArea>
</div>

<style>
  :global([data-id="storymode-scroll-area"] > [data-orientation="vertical"]) {
    position: fixed !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    height: 100dvh !important;
  }
</style>
