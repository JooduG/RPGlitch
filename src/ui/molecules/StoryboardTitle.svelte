<script>
  /**
   * @file src/ui/molecules/StoryboardTitle.svelte
   * Stateless prop-driven colored and editable story title shared by Storyboard and ChatBubble.
   */
  import { tooltip } from "@atoms";

  /**
   * @typedef {Object} TitlePart
   * @property {string} text
   * @property {string} [color]
   */

  /**
   * @typedef {Object} Props
   * @property {string} [title=""]
   * @property {TitlePart[]} [parts=[]]
   * @property {boolean} [editable=false]
   * @property {boolean} [is_custom=false]
   * @property {string} [custom_title=""]
   * @property {(new_text: string) => void} [oninput]
   * @property {() => void} [onreset]
   * @property {string} [class]
   */

  /** @type {Props} */
  let {
    title = "",
    parts = [],
    editable = false,
    is_custom = false,
    custom_title = "",
    oninput = undefined,
    onreset = undefined,
    class: className = "",
  } = $props();

  /** @param {Event & { currentTarget: EventTarget & HTMLElement }} e */
  function handle_input(e) {
    oninput?.(e.currentTarget.textContent || "");
  }

  /** @param {ClipboardEvent & { currentTarget: EventTarget & HTMLElement }} e */
  function handle_paste(e) {
    e.preventDefault();
    const plain = e.clipboardData?.getData("text/plain") || "";
    const target = e.currentTarget;
    target.textContent = plain;
    oninput?.(plain);
  }
</script>

{#if editable}
  <h1
    class={[
      "pointer-events-none z-sticky inline-block max-w-[90vw] cursor-text px-standard text-center font-display text-[clamp(2rem,4.2vw,3.4rem)] font-normal text-balance transition-[background-color,box-shadow] duration-standard select-none hover:rounded-md hover:bg-white/5 focus:rounded-md focus:bg-black/20 focus:shadow-md focus:outline-none [&>span]:pointer-events-auto",
      className,
    ]}
    use:tooltip={{ text: "Double-click to regenerate title" }}
    contenteditable="true"
    aria-label="Story Title"
    oninput={handle_input}
    onpaste={handle_paste}
    ondblclick={() => onreset?.()}>
    {#if is_custom}
      <span class="text-shadow-[0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--color-void-black)]"
        >{custom_title}</span>
    {:else}
      {#each parts as part, i (i)}
        {#if part.color}
          <span
            class="inline px-tight font-display whitespace-nowrap text-(--signature-color) [text-shadow:0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--signature-color),0_0_calc(var(--spacing-unit)*4)_rgb(from_var(--signature-color)_r_g_b/var(--opacity-whisper))]"
            style:--signature-color={part.color}>{part.text}</span>
        {:else}
          <span
            class="inline px-tight font-display whitespace-normal text-shadow-[0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--color-void-black)]"
            >{part.text}</span>
        {/if}
      {/each}
    {/if}
  </h1>
{:else if title || parts.length > 0}
  <h2 class={["mb-standard text-center font-display text-[clamp(1.7rem,3.6vw,2.9rem)] font-normal text-balance", className]} data-msg-title>
    {#if parts.length > 0}
      {#each parts as part, i (i)}
        {#if part.color}
          <span
            class="inline px-1 whitespace-nowrap text-(--signature-color) text-shadow-[0_0_var(--spacing-unit)_var(--signature-color),0_0_calc(var(--spacing-unit)*4)_rgb(from_var(--signature-color)_r_g_b/var(--opacity-whisper))]"
            style:--signature-color={part.color}>{part.text}</span>
        {:else}
          <span class="inline px-1 text-shadow-[0_0_var(--spacing-unit)_var(--color-void-black)]">{part.text}</span>
        {/if}
      {/each}
    {:else}
      {title}
    {/if}
  </h2>
{/if}
