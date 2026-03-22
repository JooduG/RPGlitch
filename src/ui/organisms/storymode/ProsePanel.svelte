<script>
  import { app } from "@state/app.svelte.js";
  import { session } from "@state/session.svelte.js";
  import { simulation_log } from "@state/simulation_log.svelte.js";
  import { engineState } from "@state/status.svelte.js";
  import Button from "@ui/atoms/Button.svelte";
  import Message from "./Message.svelte";

  // --- STATE ---
  let scroll_ref = $state(null);

  // Derived
  let is_thinking = $derived(engineState.phase === "generating");

  // Auto-scroll logic
  $effect(() => {
    if ((simulation_log.feed.length || app.streaming.active) && scroll_ref) {
      // Small timeout to allow DOM render
      setTimeout(() => {
        if (scroll_ref) scroll_ref.scrollTop = scroll_ref.scrollHeight;
      }, 0);
    }
  });

  // Helper to map DB role to UI sender
  function map_role(role) {
    if (role === "assistant" || role === "ai") return "ai";
    if (role === "prologue") return "fractal";
    return role;
  }

  // --- ACTIONS ---
  async function handle_delete(index) {
    const entry = simulation_log.feed[index];
    if (entry && entry.id && confirm("Permanently delete this entry?")) {
      await session.delete_log_entry(entry.id);
    }
  }

  async function handle_regenerate() {
    await session.retry();
  }

  async function handle_continue() {
    await session.continue();
  }

  async function handle_edit(index) {
    const entry = simulation_log.feed[index];
    if (!entry) return;
    const new_text = prompt("Edit log entry:", entry.text);
    if (new_text !== null && new_text !== entry.text) {
      await session.edit_log_entry(entry.id, new_text);
    }
  }
</script>

<div class="prose-panel" bind:this={scroll_ref}>
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
    />
  {/each}

  {#if app.streaming?.active}
    <Message text={app.streaming.content} sender="ai" timestamp={new Date()} is_last={true} />
  {:else if is_thinking}
    <Message sender={engineState.role} is_thinking={true} />
  {:else if simulation_log.feed.length === 0}
    <div class="empty-feed-fallback">
      <p>
        Establishing context stream... If the screen remains black, please check your network or AI
        plugin settings.
      </p>
      <Button
        className="btn-retry"
        variant="ghost"
        onclick={() => session.retry()}
        label="Retry Connection"
      />
    </div>
  {/if}
</div>

<style>
  .prose-panel {
    flex: 1;
    min-height: 12.5rem;
    overflow: hidden auto;
    padding: var(--spacing-m) 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    scroll-behavior: smooth;
  }

  .prose-panel::-webkit-scrollbar {
    width: var(--spacing-xxs);
  }

  .prose-panel::-webkit-scrollbar-thumb {
    background: var(--surface-sunken);
    border-radius: var(--border-radius-full);
  }

  .empty-feed-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xxl) var(--spacing-l);
    text-align: center;
    color: var(--font-muted);
    gap: var(--spacing-m);
  }

  .empty-feed-fallback p {
    max-width: 25rem;
  }

  .empty-feed-fallback :global(.btn-retry) {
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-s);
    border-radius: var(--border-radius);
    color: var(--font-muted);
  }

  .empty-feed-fallback :global(.btn-retry):hover {
    background: var(--surface-sunken);
    color: var(--font-color);
  }
</style>
