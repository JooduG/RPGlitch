<script>
  import Button from "@ui/atoms/Button.svelte";
  import { parse_markdown } from "@ui/utils/markdown.js";
  let {
    vector,
    is_editing,
    on_update,
    on_delete,
    signature_color,
    unit_label = "Vector",
  } = $props();
  // Create a stable local state for editing
  let local_text = $state("");
  // Sync from props only when not in active edit mode or on mount
  $effect(() => {
    const text = vector?.text || vector?.summary || (typeof vector === "string" ? vector : "");
    local_text = text;
  });
  function handle_input(e) {
    local_text = e.target.value;
    on_update(local_text);
  }
</script>

<div class="vector-card" class:editing={is_editing} style="--accent-color: {signature_color}">
  <div class="card-inner">
    {#if is_editing}
      <div class="edit-area">
        <textarea
          value={local_text}
          oninput={handle_input}
          placeholder="Enter {unit_label.toLowerCase()} detail..."
        ></textarea>
        <div class="actions">
          <Button
            variant="danger"
            className="vector-delete-btn"
            onclick={on_delete}
            title="Remove {unit_label}"
          >
            <span class="icon">×</span>
          </Button>
        </div>
      </div>
    {:else}
      <div class="display-area">
        <div class="content">
          {#each parse_markdown(local_text) as paragraph, i (i)}
            <p class="markdown-paragraph">
              {#each paragraph as token, j (j)}
                {#if token.type === "strong"}
                  <strong>{token.content}</strong>
                {:else if token.type === "strong-em"}
                  <strong><em>{token.content}</em></strong>
                {:else if token.type === "em"}
                  <em>{token.content}</em>
                {:else}
                  {token.content}
                {/if}
              {/each}
            </p>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .vector-card {
    position: relative;
    width: 100%;
    transition: transform var(--motion-fast) var(--motion-elastic);
  }

  .vector-card:hover {
    transform: translateX(var(--spacing-xxs));
  }

  .vector-card.editing:hover {
    transform: none;
  }

  .card-inner {
    background: var(--glass-xs);
    box-shadow: var(--shadow-s);
    border-radius: var(--border-radius-m);
    padding: var(--spacing-s) var(--spacing-m);
    position: relative;
    overflow: hidden;
    transition: all var(--motion-fast) ease;
  }

  .display-area .content {
    font-family: inherit;
    font-size: var(--font-size-s);
    color: var(--font-color-m);
    line-height: var(--line-height-m);
    opacity: var(--opacity-full);
    overflow-wrap: anywhere;
  }

  .edit-area {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-s);
    align-items: stretch;
  }

  .edit-area textarea {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--font-color-m);
    font-family: inherit;
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    resize: vertical;
    min-height: var(--spacing-xl);
    width: 100%;
    outline: none;
    padding: 0;
  }

  .edit-area textarea::placeholder {
    color: var(--text-dim);
    opacity: var(--opacity-m);
  }

  .edit-area .actions {
    display: flex;
    align-items: flex-start;
    margin-top: 0;
  }

  :global(.vector-delete-btn.btn) {
    background: transparent;
    color: var(--font-color-s);
    box-shadow: inset 0 0 0 var(--spacing-px) var(--signature-color), var(--glass-edge-l);
    width: var(--spacing-xl);
    height: var(--spacing-xl);
    padding: 0;
    border-radius: var(--spacing-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--motion-fast) var(--motion-elastic);
  }

  :global(.vector-delete-btn.btn):hover {
    background: var(--color-del);
    box-shadow: var(--shadow-m);
    color: var(--font-color-m);
    filter: brightness(1.2);
    transform: translateY(var(--motion-btn-hover-y));
  }

  :global(.vector-delete-btn.btn) .icon {
    font-size: var(--font-size-xxl);
    line-height: 1;
    font-weight: var(--font-weight-xl);
    margin-bottom: 2px;
  }

  .display-area .content .markdown-paragraph {
    margin: 0;
  }

  .display-area .content .markdown-paragraph + .markdown-paragraph {
    margin-top: var(--spacing-m);
  }
</style>
