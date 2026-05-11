<script>
  /**
   * @file MessageToolbar.svelte
   * NARRATIVE CONTROL STRIP
   * Handles message-level actions (Edit, Delete, Reroll) in a context-aware vertical pill.
   */
  import Button from "@atoms/Button.svelte";
  import GlassPill from "@atoms/GlassPill.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} [sender="ai"]
   * @property {boolean} [isLast=false]
   * @property {string} [text=""]
   * @property {Date} [timestamp=new Date()]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [onDelete]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [onRegenerate]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [onContinue]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [onEdit]
   * @property {string} [className=""]
   */

  /** @type {Props} */
  let {
    sender = "ai",
    isLast = false,
    text = "",
    timestamp = new Date(),
    onDelete = undefined,
    onRegenerate = undefined,
    onContinue = undefined,
    onEdit = undefined,
    className = "",
  } = $props();

  let is_ai = $derived(sender === "ai");
</script>

<div class="message-toolbar {className}">
  <GlassPill orientation="vertical">
    <div class="toolbar-actions">
      {#if is_ai && isLast}
        <Button
          variant="invisible"
          size="sm"
          square={true}
          className="toolbar-btn continue"
          aria-label="Continue"
          actions={[tooltip]}
          onclick={onContinue}
        >
          <svg viewBox="0 0 24 24" class="icon-medium"
            ><polygon points="5 3 19 12 5 21 5 3"></polygon></svg
          >
        </Button>
        <Button
          variant="invisible"
          size="sm"
          square={true}
          className="toolbar-btn reroll"
          aria-label="Reroll"
          actions={[tooltip]}
          onclick={onRegenerate}
        >
          <svg viewBox="0 0 24 24" class="icon-medium">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </Button>
      {/if}

      <Button
        variant="invisible"
        size="sm"
        square={true}
        className="toolbar-btn edit"
        aria-label="Edit"
        actions={[tooltip]}
        onclick={onEdit}
      >
        <svg viewBox="0 0 24 24" class="icon-medium">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </Button>

      <Button
        variant="invisible"
        size="sm"
        square={true}
        className="toolbar-btn copy"
        aria-label="Copy"
        actions={[tooltip]}
        onclick={async () => {
          try {
            await navigator.clipboard.writeText(text);
          } catch (e) {
            console.error("Failed to copy text:", e);
          }
        }}
      >
        <svg viewBox="0 0 24 24" class="icon-medium">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </Button>

      <Button
        variant="invisible"
        size="sm"
        square={true}
        className="toolbar-btn delete"
        aria-label="Delete"
        actions={[tooltip]}
        onclick={onDelete}
      >
        <svg viewBox="0 0 24 24" class="icon-medium">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path>
        </svg>
      </Button>
    </div>

    <div class="toolbar-footer">
      <span class="timestamp-label">
        {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
      </span>
    </div>
  </GlassPill>
</div>

<style>
  .message-toolbar {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    opacity: var(--opacity-none);
    pointer-events: none;
    transition: opacity var(--duration-standard);
    z-index: var(--surface-z-index);
    height: max-content;
  }

  /* Anchor Right (AI/Fractal) */
  :global(.ai-row) .message-toolbar,
  :global(.fractal-row) .message-toolbar {
    left: calc(100% + var(--spacing-3));
  }

  /* Anchor Left (User) */
  :global(.user-row) .message-toolbar {
    right: calc(100% + var(--spacing-3));
  }

  /* Interaction: Reveal on row hover (handled via parent class or global style) */
  :global(.message-row:hover) .message-toolbar {
    opacity: var(--opacity-full);
    pointer-events: auto;
  }

  .toolbar-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  :global(.toolbar-btn) {
    background: transparent;
    border: none;
    color: var(--font-color-muted);
    padding: 0; /* Let Button sm/square handle dimensions */
    transition: all var(--duration-standard);
  }

  :global(.toolbar-btn:hover) {
    background: transparent;
    transform: scale(1.1);
  }

  :global(.toolbar-btn.continue:hover) {
    color: var(--color-emerald);
  }

  :global(.toolbar-btn.reroll:hover) {
    color: var(--color-pink);
  }

  :global(.toolbar-btn.edit:hover) {
    color: var(--color-amber);
  }

  :global(.toolbar-btn.copy:hover) {
    color: var(--color-cyan);
  }

  :global(.toolbar-btn.delete:hover) {
    color: var(--color-red);
  }

  .icon-medium {
    width: var(--icon-medium);
    height: var(--icon-medium);
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .toolbar-footer {
    display: flex;
    justify-content: center;
    padding-bottom: var(--spacing-2);
    margin-top: var(--spacing-1);
  }

  .timestamp-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    color: var(--font-color-muted);
    opacity: var(--opacity-muted);
    letter-spacing: var(--font-spacing-s);
  }
</style>
