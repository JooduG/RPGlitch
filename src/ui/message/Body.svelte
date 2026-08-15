<script>
  import { DataBox, TextField } from "@primitives";
  import TelemetryCard from "./TelemetryCard.svelte";
  import { Typewriter } from "@motion";
  import { safe_html } from "@ui";
  import { app } from "@state";

  /**
   * @typedef {Object} Props
   * @property {boolean} is_editing
   * @property {string} local_text
   * @property {string} signature_color
   * @property {string} think_block
   * @property {boolean} should_use_typewriter
   * @property {boolean} is_typing_finished
   * @property {any} meta
   * @property {boolean} has_display_text
   * @property {boolean} busy
   * @property {number} attachments_length
   * @property {string} display_text
   * @property {boolean} is_fractal
   */

  /** @type {Props} */
  let {
    is_editing,
    local_text = $bindable(),
    signature_color,
    think_block,
    should_use_typewriter,
    is_typing_finished = $bindable(),
    meta,
    has_display_text,
    busy,
    attachments_length,
    display_text,
    is_fractal,
  } = $props();
</script>

{#if app.settings.dev_mode && think_block}
  <DataBox label="Thoughts" isCode={false} isProse={true} class="mb-4 [&_.think-block-container]:font-mono! [&_.think-block-container_*]:font-mono!">
    <div class="think-block-container" style="display: contents" use:safe_html={think_block}></div>
  </DataBox>
{/if}

{#if !should_use_typewriter}
  {#if app.settings.dev_mode}
    {#if meta && (meta.dynamics || meta.vectors || meta.deltas || meta.updates)}
      <div class="mb-4">
        <TelemetryCard {meta} />
      </div>
    {/if}
  {/if}
{/if}

{#if is_editing}
  <TextField bind:value={local_text} is_edit={true} {signature_color} variant="bare" placeholder="Edit message..." />
{:else if has_display_text || (busy && attachments_length === 0)}
  <div
    class="
      text-left
      text-base
      leading-relaxed
      text-pretty
      text-white

      [&_.dialogue]:text-[1.12em]
      [&_.dialogue]:font-medium

      [&_em]:italic
      [&_em]:opacity-75

      [&_p]:mb-4
      [&_p:last-child]:mb-0

      [&_strong]:font-bold
      [&_strong]:text-(--signature-color,var(--color-slate-400))
      [&_strong]:[text-shadow:0_0_8px_color-mix(in_srgb,var(--signature-color,var(--color-slate-400)),transparent_85%)]

      {is_fractal ? 'text-center' : ''}
      {meta?.is_prologue || meta?.is_epilogue ? '' : ''}
    "
    style={!should_use_typewriter ? "content-visibility: auto;" : ""}
  >
    {#if should_use_typewriter}
      {#if has_display_text}
        <Typewriter target_html={display_text} bind:is_finished={is_typing_finished} />
      {:else if busy}
        <div class="flex items-center gap-2 p-2 opacity-60 {is_fractal ? 'justify-center' : ''}">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
        </div>
      {/if}
    {:else if has_display_text}
      <div class="display-text-container" style="display: contents" use:safe_html={display_text}></div>
    {:else if busy}
      <div class="flex items-center gap-2 p-2 opacity-60 {is_fractal ? 'justify-center' : ''}">
        <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 0ms"></div>
        <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 150ms"></div>
        <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--signature-color,white)" style="animation-delay: 300ms"></div>
      </div>
    {/if}
  </div>
{/if}
