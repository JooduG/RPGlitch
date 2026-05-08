<script>
  import { app } from "@state/app.svelte.js";
  import { session } from "@state/session.svelte.js";
  import { simulation_log } from "@state/simulation-log.svelte.js";
  import { simulationState } from "@state/status.svelte.js";
  import Button from "@atoms/Button.svelte";
  import Dialog from "@atoms/Dialog.svelte";
  import Message from "@storymode/Message.svelte";

  // --- STATE ---
  /** @type {HTMLDivElement | null} */
  let scroll_ref = $state(null);

  // Derived

  // Auto-scroll logic
  $effect(() => {
    if ((simulation_log.feed.length || app.streaming.active) && scroll_ref) {
      // Small timeout to allow DOM render
      setTimeout(() => {
        if (scroll_ref) {
          scroll_ref.scrollTop = scroll_ref.scrollHeight;
        }
      }, 0);
    }
  });

  // Helper to map DB role to UI sender
  /**
   * @param {string} role
   */
  function map_role(role) {
    if (role === "assistant" || role === "ai") return "ai";
    if (role === "prologue") return "fractal";
    return role;
  }

  // Derived turn state
  let is_active_turn = $derived(simulationState.phase === "generating" || app.streaming.active);
  let active_turn_role = $derived(app.streaming.active ? app.streaming.role : simulationState.role);
  let active_turn_name = $derived.by(() => {
    if (active_turn_role === "ai") return app.selected_ai?.name;
    if (active_turn_role === "fractal") return app.selected_fractal?.name;
    return "";
  });

  let show_delete_confirm = $state(false);
  /** @type {string | number | null} */
  let delete_target_id = $state(null);

  // --- ACTIONS ---
  /**
   * @param {number} index
   */
  async function handle_delete(index) {
    const entry = simulation_log.feed[index];
    if (entry && entry.id) {
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

  /**
   *
   */
  async function handle_regenerate() {
    await session.retry();
  }

  /**
   *
   */
  async function handle_continue() {
    await session.continue();
  }

  /**
   * @param {number} index
   */
  async function handle_edit(index) {
    const entry = simulation_log.feed[index];
    if (!entry) return;
    const new_text = prompt("Edit log entry:", entry.text);
    if (new_text !== null && new_text !== entry.text && entry.id !== undefined) {
      await session.edit_log_entry(entry.id.toString(), new_text);
    }
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
<div class="storymode-feed custom-scrollbar" bind:this={scroll_ref}>
  {#each simulation_log.feed as entry, index (entry.id)}
    <Message
      text={entry.text}
      sender={map_role(entry.role)}
      character_name={entry.character_name ||
        (map_role(entry.role) === "ai" ? app.selected_ai?.name : "")}
      timestamp={entry.created_at ? new Date(entry.created_at) : new Date()}
      attachments={entry.attachments}
      is_last={index === simulation_log.feed.length - 1}
      on_delete={() => handle_delete(index)}
      on_regenerate={() => handle_regenerate()}
      on_continue={() => handle_continue()}
      on_edit={() => handle_edit(index)}
      meta={entry.meta}
    />
  {/each}

  {#if is_active_turn}
    <Message
      text={app.streaming.content ?? ""}
      sender={active_turn_role ?? "ai"}
      character_name={active_turn_name ?? ""}
      timestamp={new Date()}
      is_last={true}
      busy={true}
    />
  {:else if simulation_log.feed.length === 0}
    <div class="empty-feed-fallback">
      <p>
        Establishing context stream... If the screen remains black, please check your network or AI
        plugin settings.
      </p>
      <Button variant="primary" onclick={() => session.retry()} label="Retry Connection" />
    </div>
  {/if}
</div>

<style>
  .storymode-feed {
    flex: 1;
    min-height: 12.5rem;
    overflow: hidden auto;
    padding: var(--spacing-m) 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    scroll-behavior: smooth;
  }

  .empty-feed-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xxl) var(--spacing-l);
    text-align: center;
    color: var(--font-color-s);
    gap: var(--spacing-m);
  }

  .empty-feed-fallback p {
    max-width: 25rem;
  }
</style>
