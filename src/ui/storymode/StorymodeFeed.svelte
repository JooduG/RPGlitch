<script>
  /**
   * @file StorymodeFeed.svelte
   * THE NARRATIVE CONDUIT
   * Logic:
   * 1. Renders the sequential story log entries.
   * 2. Manages auto-scroll and turn-state visualization.
   * 3. Integrated with Nordic Collection & Chess Grid.
   */
  import Button from "@atoms/Button.svelte";
  import Dialog from "@atoms/Dialog.svelte";
  import { app } from "@state/app.svelte.js";
  import { session } from "@state/session.svelte.js";
  import { simulation_log } from "@state/log.svelte.js";
  import { simulationState } from "@state/status.svelte.js";
  import Message from "@storymode/Message.svelte";

  // --- STATE ---
  /** @type {HTMLDivElement | null} */
  let scroll_ref = $state(null);
  let show_delete_confirm = $state(false);
  /** @type {string | number | null} */
  let delete_target_id = $state(null);
  /** @type {number | null} */
  let editing_index = $state(null);

  // --- DERIVATIONS ---

  // Auto-scroll logic
  $effect(() => {
    if ((simulation_log.feed.length || app.streaming.active) && scroll_ref) {
      const el = scroll_ref;
      // Frame-sync to ensure DOM layout is complete
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  });

  /**
   * Helper to map DB roles to UI sender archetypes
   * @param {string} role
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

  // --- ACTIONS ---

  /** @param {number} index */
  async function handle_delete(index) {
    const entry = simulation_log.feed[index];
    if (entry?.id) {
      delete_target_id = entry.id;
      show_delete_confirm = true;
    }
  }

  /**
   *
   */
  async function execute_delete() {
    if (delete_target_id) {
      await session.delete_log_entry(delete_target_id.toString());
      delete_target_id = null;
    }
  }

  /** @param {number} index */
  function handle_edit(index) {
    editing_index = index;
  }

  /**
   * @param {string|number} id
   * @param {string} updated_text
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

<div class="root scrollbar no-scrollbar" bind:this={scroll_ref}>
  {#each simulation_log.feed as entry, index (entry.id)}
    <Message
      id={entry.id}
      text={entry.text}
      sender={map_role(entry.role)}
      character_name={entry.character_name ||
        (map_role(entry.role) === "ai" ? app.selected_ai?.name : "")}
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
    <div class="fallback">
      <p>
        Establishing context stream... If the screen remains black, please check your network or AI
        plugin settings.
      </p>
      <Button variant="primary" onclick={() => session.retry()} label="Retry Connection" />
    </div>
  {/if}
</div>

<style>
  .root {
    flex: 1;
    min-height: var(--dropdown-max-height);
    overflow: hidden auto;
    padding: var(--padding-standard) 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    scroll-behavior: smooth;
    width: 100%;
  }

  .fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--padding-standard);
    text-align: center;
    color: var(--frozen);
    gap: var(--gap-standard);
    height: 100%;
  }

  .fallback p {
    max-width: calc(var(--column-unit) * 8);
  }
</style>
