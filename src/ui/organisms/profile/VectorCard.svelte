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
  <div class="card-inner seamless-field">
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
            square={true}
            size="sm"
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
    /* Standardized hover handled by .card-inner .seamless-field */
  }

  .vector-card.editing:hover {
    transform: none;
  }

  .card-inner {
    padding: var(--spacing-s) var(--spacing-m);
    position: relative;
    overflow: hidden;

    /* transition and foundation handled by .seamless-field */
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
    resize: none;
    min-height: var(--spacing-xl);
    width: 100%;
    outline: none;
    padding: 0;
  }

  .edit-area .actions {
    display: flex;
    align-items: center;
    margin-top: 0;
  }

  :global(.vector-card .button .icon) {
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
