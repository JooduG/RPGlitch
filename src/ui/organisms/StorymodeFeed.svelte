<script>
  /**
   * @file StorymodeFeed.svelte
   * @description THE NARRATIVE CONDUIT
   * Logic:
   * 1. Renders the sequential story log entries.
   * 2. Manages auto-scroll and turn-state visualization.
   * 3. Integrated with Nordic Collection & Chess Grid.
   * 4. Progressive sentence-by-sentence text-to-speech parsing with cognition shield filters.
   */
  import { tick } from "svelte";
  import { Button, ScrollArea } from "@atoms";
  import { clean_image_prompts } from "@intelligence";
  import { Audio } from "@media";
  import { app, runtime, session, simulation_log, simulationState } from "@state";
  import { motion } from "@motion";
  import { Message, Dialog } from "@molecules";

  // --- STATE ---
  /** @type {HTMLDivElement | null} */
  let scroll_ref = $state(null);
  let show_delete_confirm = $state(false);
  /** @type {string | number | null} */
  let delete_target_id = $state(null);
  /** @type {number | null} */
  let editing_index = $state(null);

  // Streaming trackers for sequential speech queue feeding
  let was_streaming = $state(false);
  let spoken_character_cursor = $state(0);

  // --- DERIVATIONS ---

  // Reactive Sound Cues & Sentence-by-Sentence Vocal Streaming Loop
  $effect(() => {
    if (app.streaming.active && !was_streaming) {
      spoken_character_cursor = 0;

      const activeRole = app.streaming.role;
      if (activeRole === "ai" || activeRole === "fractal") {
        const entity = activeRole === "ai" ? runtime.active_ai || app.selected_ai : runtime.active_fractal || app.selected_fractal;

        if (entity && entity.voice) {
          Audio.voice.selectedVoice = entity.voice.uri || Audio.voice.selectedVoice;
          Audio.voice.rate = entity.voice.rate ?? 1.0;
          Audio.voice.pitch = entity.voice.pitch ?? 1.0;
        }
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
          Audio.voice.activeMessageId = app.streaming.nodeId ?? app.streaming.node_id;
          Audio.voice.speak(clean_sentence, false);
        }

        highest_match_offset = match.index + match[0].length;
      }

      spoken_character_cursor += highest_match_offset;
    }

    if (!app.streaming.active && was_streaming) {
      Audio.play("notification");

      const current_raw_text = app.streaming.text ?? app.streaming.content ?? "";
      const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");

      const remaining_text = sanitized_stream_track.slice(spoken_character_cursor);
      const clean_remainder = clean_image_prompts(remaining_text).trim();

      if (clean_remainder) {
        Audio.voice.activeMessageId = app.streaming.nodeId ?? app.streaming.node_id;
        Audio.voice.speak(clean_remainder, false);
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
  let is_active_turn = $derived(simulationState.phase === "generating" || app.streaming.active);
  let active_turn_role = $derived(app.streaming.active ? app.streaming.role : simulationState.role);
  let active_turn_name = $derived.by(() => {
    if (active_turn_role === "ai") return app.selected_ai?.name;
    if (active_turn_role === "fractal") return app.selected_fractal?.name;
    return "";
  });

  // Advanced Kinetic Viewport Auto-Scroll Controller
  $effect(() => {
    if ((simulation_log.feed.length || app.streaming.active) && scroll_ref) {
      const el = scroll_ref.querySelector(".scroll-area-viewport");
      if (!el) return;

      // Unwind layout calculations safely inside framework execution ticks
      tick().then(() => {
        if (motion.isReduced || typeof el.scrollTo !== "function") {
          el.scrollTop = el.scrollHeight;
        } else {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: "smooth",
          });
        }
      });
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
   * Excutes the true database erasure operation via session stream handlers.
   * @returns {Promise<void>}
   */
  async function execute_delete() {
    if (delete_target_id) {
      await session.delete_log_entry(delete_target_id.toString());
      delete_target_id = null;
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
    await session.edit_log_entry(id.toString(), updated_text);
    editing_index = null;
  }
</script>

<Dialog
  type="confirm"
  bind:open={show_delete_confirm}
  title="Delete Entry?"
  message="Permanently delete this log entry? This cannot be undone."
  confirm_label="Delete"
  on_confirm={execute_delete}
/>

<div
  class="
    flex
    min-h-dropdown-max-height
    w-full
    flex-1
    flex-col
    gap-0
    overflow-hidden
    px-0
    py-4
  "
  bind:this={scroll_ref}
>
  <ScrollArea style="height: 100%; width: 100%;">
    {#each simulation_log.feed as entry, index (entry.id)}
      <Message
        id={entry.id}
        text={entry.text}
        sender={map_role(entry.role)}
        character_name={entry.character_name || (map_role(entry.role) === "ai" ? app.selected_ai?.name : "")}
        timestamp={entry.created_at ? new Date(entry.created_at) : new Date()}
        attachments={entry.attachments}
        is_last={index === simulation_log.feed.length - 1}
        on_delete={() => handle_delete(index)}
        on_regenerate={() => session.retry()}
        on_continue={() => session.continue()}
        on_edit={() => handle_edit(index)}
        is_editing={index === editing_index}
        on_save={(new_text) => entry.id && handle_save_edit(entry.id, new_text)}
        on_cancel={() => {
          editing_index = null;
        }}
        meta={entry.meta}
      />
    {/each}

    {#if is_active_turn}
      <Message
        id={app.streaming.nodeId ?? app.streaming.node_id ?? "temp"}
        text={app.streaming.text ?? app.streaming.content ?? ""}
        sender={active_turn_role ?? "ai"}
        character_name={active_turn_name ?? ""}
        timestamp={new Date()}
        is_last={true}
        busy={true}
      />
    {:else if simulation_log.feed.length === 0}
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
        <Button variant="primary" onclick={() => session.retry()} label="Retry Connection" />
      </div>
    {/if}
  </ScrollArea>
</div>
