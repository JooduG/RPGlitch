<script>
  /**
   * @file TextField.svelte
   * 🕹️ SOTA ATOMIC TEXT INSTRUMENT
   * High-performance, reactive text field with markdown rendering and atmospheric effects.
   * RUTHLESSLY FLATTENED: Zero design drift, maximum architectural clarity.
   */
  import { ScrollArea } from "@atoms";
  import { parse_markdown } from "@components";
  import { controlState } from "@state";
  import { auto_resize, use_actions } from "@actions";
  import { fade } from "svelte/transition";

  let {
    // Data
    value = $bindable(""),
    placeholder = "Enter text...",
    syncId = null,

    // State
    is_edit = false,
    busy = false,
    disabled = false,
    weight = 0, // 0-10 for line prominence and atmospheric glow
    always_expanded = false,

    // Design
    no_background = false,
    signature_color = "#475569",
    class: className = "",
    style = "",

    // Snippets
    header_actions = null,
    status = null,
    actions = [],

    // Events
    oninput = undefined,
    onfocus = undefined,
    onblur = undefined,
    ...rest
  } = $props();

  // --- LOCAL STATE ---
  let is_focused = $state(false);

  // --- DERIVED LOGIC ---
  let is_disabled = $derived(disabled || controlState.intent_active);
  const paragraphs = $derived(parse_markdown(value));
  const is_expanded = $derived(
    (is_focused || busy || always_expanded) && (!!header_actions || !!status),
  );
  const intensity = $derived(weight / 10);
  const header_opacity = $derived(weight > 0 ? 0.2 + intensity * 0.8 : 0.8);

  // --- HANDLERS ---
  /** @param {FocusEvent} e */
  function handle_focus(e) {
    if (is_disabled || busy) return;
    is_focused = true;
    onfocus?.(e);
  }

  /** @param {FocusEvent} e */
  function handle_blur(e) {
    const root = /** @type {HTMLElement} */ (e.currentTarget);
    if (e.relatedTarget && root.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_focused = false;
    onblur?.(e);
  }
</script>

<div
  class="
    relative
    flex
    w-full
    flex-col
    overflow-hidden
    rounded-xl
    border
    border-solid
    border-transparent
    transition-[border-color,background]
    duration-300
    ease-in-out

    before:pointer-events-none
    before:absolute
    before:inset-0
    before:rounded-[inherit]
    before:mask-border-solid
    before:p-px
    before:transition-opacity
    before:duration-300
    before:content-['']!

    {is_expanded ? '' : ''}
    {no_background
    ? `
      border-none!
      bg-transparent!
      shadow-none!

      before:hidden!
    `
    : ''}
    {!is_expanded
    ? `
      bg-[color-mix(in_srgb,var(--state-dev-accent)_8%,rgba(23,23,23,0.6))]

      before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--state-dev-accent)_40%),transparent_40%)]
      before:opacity-30
    `
    : `
      overflow-visible!
      border-transparent
      bg-[color-mix(in_srgb,var(--state-dev-accent)_12%,rgba(23,23,23,0.6))]

      before:bg-[linear-gradient(to_bottom,var(--state-dev-accent),color-mix(in_srgb,var(--state-dev-accent),transparent_60%)_30%,transparent_80%)]
      before:opacity-100
    `}
    {is_disabled || busy
    ? `
      cursor-not-allowed
      opacity-30
    `
    : ''}
    {busy
    ? `
      cursor-wait
      brightness-90
      grayscale-50

      *:pointer-events-none
    `
    : ''}
    {className}"
  data-expanded={is_expanded}
  data-busy={busy}
  data-no-bg={no_background}
  data-disabled={is_disabled || busy}
  style="{style}; --state-dev-accent: {signature_color}; --state-weight-intensity: {intensity}; --header-opacity: {header_opacity};"
  onfocusout={handle_blur}
  use:use_actions={actions}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}
>
  <header
    class="
      relative
      top-0
      z-10
      flex
      items-center
      justify-between
      overflow-hidden
      rounded-t-xl
      bg-(--state-dev-accent)
      px-4
      opacity-60
      transition-[height,opacity,background]
      duration-300
      ease-out

      {no_background ? 'hidden!' : ''}
      {!is_expanded ? 'h-2' : 'h-6 border-b border-solid border-white/10 opacity-100!'}"
  >
    {#if is_expanded}
      {#if status}
        <div
          class="
            mr-4
            flex
            h-full
            min-w-0
            flex-1
            items-center
            overflow-hidden
            text-ellipsis
            whitespace-nowrap
          "
          in:fade={{ duration: 200, delay: 0 }}
        >
          {@render status()}
        </div>
      {/if}
      {#if header_actions}
        <div
          class="
            ml-auto
            flex
            h-full
            shrink-0
            items-center
          "
          in:fade={{ duration: 200, delay: 50 }}
        >
          {@render header_actions()}
        </div>
      {/if}
    {/if}
  </header>

  {#if is_edit}
    <textarea
      {...rest}
      class="
        relative
        z-10
        m-0
        box-border
        block
        min-h-[48px]
        w-full
        resize-none
        scrollbar-thin
        scrollbar-thumb-slate-700
        scrollbar-track-transparent
        overflow-x-hidden
        overflow-y-auto
        border-none
        bg-transparent
        p-4
        text-left
        font-sans
        text-(length:--font-size-base)
        leading-normal
        text-wrap
        text-slate-50
        outline-none

        placeholder:font-normal
        placeholder:text-slate-600/30
        placeholder:italic

        focus:outline-none

        [&::-webkit-scrollbar]:h-2
        [&::-webkit-scrollbar]:w-2

        [&::-webkit-scrollbar-thumb]:rounded-xl
        [&::-webkit-scrollbar-thumb]:bg-slate-700

        [&::-webkit-scrollbar-thumb:hover]:bg-slate-50

        [&::-webkit-scrollbar-track]:bg-transparent

        {busy ? 'cursor-wait' : ''}"
      data-mode="edit"
      bind:value
      {placeholder}
      {oninput}
      onfocus={handle_focus}
      disabled={is_disabled || busy}
      use:auto_resize={{ syncId }}
      data-sync-id={syncId}
    ></textarea>
  {:else}
    <ScrollArea>
      <div
        {...rest}
        class="
          relative
          z-10
          m-0
          box-border
          flex
          min-h-[48px]
          w-full
          flex-col
          overflow-visible
          border-none
          bg-transparent
          p-4
          text-left
          font-sans
          text-(length:--font-size-base)
          leading-normal
          text-pretty
          text-slate-50
          outline-none

          focus:outline-none

          {busy ? 'cursor-wait' : ''}"
        data-mode="readonly"
        data-sync-id={syncId}
        use:auto_resize={{ syncId }}
        tabindex={is_disabled ? -1 : 0}
        onfocus={handle_focus}
        role="textbox"
        aria-readonly="true"
        aria-placeholder={placeholder}
      >
        {#if paragraphs.length > 0}
          {#each paragraphs as tokens, i (i)}
            <p
              class="
                m-0
                w-full

                {i > 0 ? 'mt-4' : ''}"
              data-spaced={i > 0}
            >
              {#each tokens as token, j (j)}
                {#if token.type === "text"}
                  {token.content}
                {:else if token.type === "strong"}
                  <strong
                    class="
                      font-extrabold
                      text-white
                    ">{token.content}</strong
                  >
                {:else if token.type === "em"}
                  <em
                    class="
                      italic
                      opacity-30
                    ">{token.content}</em
                  >
                {:else if token.type === "strong-em"}
                  <strong
                    class="
                      font-extrabold
                      text-white
                    "
                    ><em
                      class="
                        italic
                        opacity-30
                      ">{token.content}</em
                    ></strong
                  >
                {/if}
              {/each}
            </p>
          {/each}
        {:else}
          <span
            class="
              font-normal
              text-slate-600/30
              italic
            ">{placeholder}</span
          >
        {/if}
      </div>
    </ScrollArea>
  {/if}
</div>
