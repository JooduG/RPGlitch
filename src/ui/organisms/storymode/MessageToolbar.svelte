<script>
  /**
   * @file MessageToolbar.svelte
   * 🛠️ NARRATIVE CONTROL STRIP
   * Handles message-level actions (Edit, Delete, Reroll) in a context-aware vertical pill.
   */
  import GlassPill from "@ui/atoms/GlassPill.svelte";

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
        <button
          class="toolbar-btn continue"
          type="button"
          title="Continue"
          onclick={(e) => onContinue?.(e)}
        >
          <svg viewBox="0 0 24 24" class="icon-m"
            ><polygon points="5 3 19 12 5 21 5 3"></polygon></svg
          >
        </button>
        <button
          class="toolbar-btn reroll"
          type="button"
          title="Reroll"
          onclick={(e) => onRegenerate?.(e)}
        >
          <svg viewBox="0 0 24 24" class="icon-m">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      {/if}

      <button class="toolbar-btn edit" type="button" title="Edit" onclick={(e) => onEdit?.(e)}>
        <svg viewBox="0 0 24 24" class="icon-m">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>

      <button
        class="toolbar-btn copy"
        type="button"
        title="Copy"
        onclick={async () => {
          try {
            await navigator.clipboard.writeText(text);
          } catch (e) {
            console.error("Failed to copy text:", e);
          }
        }}
      >
        <svg viewBox="0 0 24 24" class="icon-m">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>

      <button
        class="toolbar-btn delete"
        type="button"
        title="Delete"
        onclick={(e) => onDelete?.(e)}
      >
        <svg viewBox="0 0 24 24" class="icon-m">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path>
        </svg>
      </button>
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
    transition: opacity var(--motion-fast);
    z-index: var(--z-index-l);
    height: max-content;
  }

  /* Anchor Right (AI/Fractal) */
  :global(.ai-row) .message-toolbar,
  :global(.fractal-row) .message-toolbar {
    left: calc(100% + var(--spacing-s));
  }

  /* Anchor Left (User) */
  :global(.user-row) .message-toolbar {
    right: calc(100% + var(--spacing-s));
  }

  /* Interaction: Reveal on row hover (handled via parent class or global style) */
  :global(.message-row:hover) .message-toolbar {
    opacity: var(--opacity-full);
    pointer-events: auto;
  }

  .toolbar-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
  }

  .toolbar-btn {
    background: transparent;
    border: none;
    color: var(--font-color-s);
    cursor: pointer;
    padding: var(--spacing-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--motion-fast);
  }

  .toolbar-btn:hover {
    background: transparent;
    transform: scale(1.1);
  }

  .toolbar-btn.continue:hover {
    color: var(--color-emerald);
  }

  .toolbar-btn.reroll:hover {
    color: var(--color-pink);
  }

  .toolbar-btn.edit:hover {
    color: var(--color-amber);
  }

  .toolbar-btn.copy:hover {
    color: var(--color-cyan);
  }

  .toolbar-btn.delete:hover {
    color: var(--color-red);
  }

  .icon-m {
    width: 1.125rem;
    height: 1.125rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .toolbar-footer {
    display: flex;
    justify-content: center;
    padding-bottom: var(--spacing-xs);
    margin-top: var(--spacing-xxs);
  }

  .timestamp-label {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxs);
    color: var(--font-color-s);
    opacity: var(--opacity-m);
    letter-spacing: var(--letter-spacing-s);
  }
</style>
