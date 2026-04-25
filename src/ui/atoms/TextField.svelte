<script>
  import { auto_resize } from "@ui/utils/actions/auto-resize.js";
  import { parse_markdown } from "@ui/utils/markdown.js";

  let {
    value = $bindable(""),
    is_edit = false,
    placeholder = "Enter text...",
    syncId = null,
    busy = false,
    disabled = false,
    oninput = undefined,
    onfocus = undefined,
    class: className = "",
  } = $props();

  let paragraphs = $derived(parse_markdown(value));
</script>

{#if is_edit}
  <textarea
    class="field-foundation {className}"
    class:busy
    class:disabled
    bind:value
    {placeholder}
    {oninput}
    {onfocus}
    disabled={disabled || busy}
    use:auto_resize={{ syncId }}
    data-sync-id={syncId}
  ></textarea>
{:else}
  <div class="readonly-field {className}" data-sync-id={syncId} use:auto_resize={{ syncId }}>
    {#if paragraphs.length > 0}
      {#each paragraphs as tokens, i (i)}
        <div class="paragraph" class:mt={i > 0}>
          {#each tokens as token, j (token.content + j)}
            {#if token.type === "text"}{token.content}{:else if token.type === "strong"}<strong
                >{token.content}</strong
              >{:else if token.type === "em"}<em>{token.content}</em
              >{:else if token.type === "strong-em"}<strong><em>{token.content}</em></strong>{/if}
          {/each}
        </div>
      {/each}
    {:else}
      <span class="placeholder">{placeholder}</span>
    {/if}
  </div>
{/if}

<style>
  .field-foundation {
    width: 100%;
    background: var(--glass-xs);
    border: var(--border-l);
    color: var(--color-white);
    font-family: var(--font-family-body);
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--border-radius-m);
    resize: none;
    overflow: hidden;
    text-align: left;
    transition:
      background var(--motion-l) var(--motion-elastic),
      border-color var(--motion-l) var(--motion-elastic),
      box-shadow var(--motion-l) var(--motion-elastic);
  }

  .field-foundation::placeholder {
    color: var(--color-frisk);
    font-style: italic;
    font-weight: var(--font-weight-m);
    opacity: 1; /* Override browser defaults */
  }

  .field-foundation:hover:not(:disabled) {
    background: var(--glass-xs);
    border-color: var(--border-l);
  }

  .field-foundation:focus {
    outline: none;
    background: var(--glass-xs);
    border-color: var(--border-xl);
  }

  .field-foundation.busy {
    cursor: wait;
    opacity: var(--opacity-m);
  }

  .field-foundation.disabled {
    cursor: not-allowed;
    opacity: var(--opacity-s);
  }

  .readonly-field {
    width: 100%;
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    padding: var(--spacing-xs) var(--spacing-s);
    white-space: normal;
    background: var(--glass-xs);
    border: var(--border-l);
    color: var(--color-white);
    font-family: var(--font-family-body);
    border-radius: var(--border-radius-m);
    height: inherit;
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .paragraph {
    width: 100%;
    text-align: left;
  }

  .paragraph.mt {
    margin-top: var(--spacing-s);
  }

  .placeholder {
    color: var(--color-frisk);
    font-style: italic;
  }
</style>
