<script>
  import { sanitize } from "@core/security.js";
  import { auto_resize } from "@ui/utils/actions/auto-resize.js";

  let {
    value = $bindable(""),
    is_edit = false,
    placeholder = "Enter text...",
    render_markdown = undefined,
    syncId = null,
    busy = false,
    disabled = false,
    oninput = undefined,
    onfocus = undefined,
    class: className = ""
  } = $props();

  function default_render_markdown(text) {
    if (!text) return "";
    let source = Array.isArray(text) ? text.join("\n\n") : text;
    let html = source.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/\n\s*\n/g, "<br><br>");
    html = html.replace(/\n/g, " ");
    return sanitize(html);
  }

  let final_html = $derived(
    render_markdown ? render_markdown(value) : default_render_markdown(value)
  );
</script>

{#if is_edit}
  <textarea
    class="seamless-field {className}"
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
  <div class="readonly-field {className}" data-sync-id={syncId}>
    {#if value && String(value).trim().length > 0}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html final_html}
    {:else}
      <span class="placeholder">{placeholder}</span>
    {/if}
  </div>
{/if}

<style>
  .seamless-field {
    width: 100%;
    background: transparent;
    border: 1px solid transparent;
    color: var(--color-chalk);
    font-family: var(--font-family-body);
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    padding: var(--spacing-xs) var(--spacing-s);
    border-radius: var(--border-radius-m);
    resize: none;
    overflow: hidden;
    transition:
      background var(--motion-fast) var(--motion-elastic),
      border-color var(--motion-fast) var(--motion-elastic),
      box-shadow var(--motion-fast) var(--motion-elastic);
  }

  .seamless-field:hover:not(:disabled) {
    background: var(--glass-xs);
    border-color: rgb(255 255 255 / 5%);
  }

  .seamless-field:focus {
    outline: none;
    background: var(--glass-s);
    border-color: var(--signature-color, var(--color-frozen));
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--signature-color, var(--color-frozen)) 20%, transparent);
  }

  .seamless-field.busy {
    cursor: wait;
    opacity: var(--opacity-m);
  }

  .seamless-field.disabled {
    cursor: not-allowed;
    opacity: var(--opacity-s);
  }

  .readonly-field {
    width: 100%;
    color: var(--color-chalk);
    font-family: var(--font-family-body);
    font-size: var(--font-size-s);
    line-height: var(--line-height-m);
    padding: var(--spacing-xs) var(--spacing-s);
    white-space: normal;
  }

  .placeholder {
    color: var(--color-frisk);
    font-style: italic;
  }
</style>
