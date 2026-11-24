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

  let is_focused = $state(false);
  let draft = $state("");
  /** @type {HTMLElement | undefined} */
  let edit_el = $state();

  const plain_text = $derived(is_custom ? custom_title : parts.map((p) => p.text).join(""));

  function enter_edit() {
    if (is_focused) return;
    draft = plain_text;
    is_focused = true;
  }

  $effect(() => {
    if (is_focused && edit_el) edit_el.focus();
  });

  function handle_input() {
    const cleaned = draft.replace(/\r?\n/g, " ");
    if (cleaned !== draft) draft = cleaned;
    oninput?.(cleaned);
  }

  function handle_blur() {
    is_focused = false;
    if (is_custom && !draft.trim()) onreset?.();
  }

  /** @param {MouseEvent} e */
  function handle_edit_click(e) {
    if (e.detail >= 2) handle_reset();
  }

  /** @param {KeyboardEvent} e */
  function handle_keydown(e) {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      edit_el?.blur();
    }
  }

  /** @param {ClipboardEvent} e */
  function handle_paste(e) {
    e.preventDefault();
    draft = (e.clipboardData?.getData("text/plain") || "").replace(/\r?\n/g, " ");
    oninput?.(draft);
  }

  function handle_reset() {
    is_focused = false;
    onreset?.();
  }
</script>

{#snippet PartSpans(is_display)}
  {#each parts as part, i (i)}
    {#if part.color}
      <span
        class={[
          "inline whitespace-nowrap text-(--signature-color)",
          is_display ?
            "px-tight font-display [text-shadow:0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--signature-color),0_0_calc(var(--spacing-unit)*4)_rgb(from_var(--signature-color)_r_g_b/var(--opacity-whisper))]"
          : "px-1 text-shadow-[0_0_var(--spacing-unit)_var(--signature-color),0_0_calc(var(--spacing-unit)*4)_rgb(from_var(--signature-color)_r_g_b/var(--opacity-whisper))]",
        ]}
        style:--signature-color={part.color}>{part.text}</span>
    {:else}
      <span
        class={[
          "inline",
          is_display ?
            "px-tight font-display whitespace-normal text-shadow-[0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--color-void-black)]"
          : "px-1 text-shadow-[0_0_var(--spacing-unit)_var(--color-void-black)]",
        ]}>{part.text}</span>
    {/if}
  {/each}
{/snippet}

{#if editable}
  <!-- normalize shield: h1 font-size/margin MUST be inline — platform normalize.css v3 (unlayered h1{font-size:2em;margin:.67em 0}) beats all layered Tailwind (see check-typography.mjs rule 1 carve-out) -->
  <!-- ignore-next-line -->
  <h1
    style="/* stylelint-disable-line property-disallowed-list */ font-size: clamp(2rem, 5vw, 4rem); margin: 0;"
    data-storyboard-title
    aria-label="Story Title"
    class={[
      "pointer-events-none z-sticky inline-block max-w-[90vw] px-standard text-center font-display text-[clamp(2rem,5vw,4rem)] font-normal text-balance transition-[background-color,box-shadow] duration-standard focus-within:rounded-md focus-within:bg-black/20 focus-within:shadow-md hover:rounded-md hover:bg-white/5",
      className,
    ]}>
    {#if is_focused}
      <span
        bind:this={edit_el}
        contenteditable="plaintext-only"
        role="textbox"
        tabindex="0"
        aria-label="Story Title"
        class="pointer-events-auto inline-block min-w-8 cursor-text outline-none text-shadow-[0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--color-void-black)]"
        bind:textContent={draft}
        onclick={handle_edit_click}
        oninput={handle_input}
        onblur={handle_blur}
        onkeydown={handle_keydown}
        onpaste={handle_paste}></span>
    {:else}
      <button
        type="button"
        aria-label="Edit Story Title"
        use:tooltip={{ text: "Double-click to regenerate title" }}
        class="pointer-events-auto m-0 inline cursor-text border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] font-normal text-balance text-inherit outline-none select-none"
        onclick={enter_edit}
        ondblclick={handle_reset}>
        {#if is_custom}
          <span class="text-shadow-[0_var(--spacing-pixel)_var(--spacing-pixel)_var(--color-void-black),0_0_var(--spacing-unit)_var(--color-void-black)]"
            >{custom_title}</span>
        {:else}
          {@render PartSpans(true)}
        {/if}
      </button>
    {/if}
  </h1>
{:else if title || parts.length > 0}
  <!-- normalize shield: h1 font-size/margin MUST be inline — platform normalize.css v3 beats layered Tailwind -->
  <!-- ignore-next-line -->
  <h1
    style="/* stylelint-disable-line property-disallowed-list */ font-size: clamp(1.75rem, 3.5vw, 2.75rem); margin: 0;"
    data-msg-title
    class={["w-full text-center font-display leading-[1.15] font-normal text-balance", className]}>
    {#if parts.length > 0}
      {@render PartSpans(false)}
    {:else}
      {title}
    {/if}
  </h1>
{/if}
