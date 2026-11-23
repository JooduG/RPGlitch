<script module>
  let sync_focus_counts = $state({});
</script>

<script>
  /**
   * @file src/ui/molecules/TextField.svelte
   * Reactive text field molecule with undo/redo history and AST markdown rendering.
   */
  import { Button, Icon, ScrollArea, Shimmer, tooltip } from "@atoms";
  import { motion } from "@media";
  import { auto_resize, parse_markdown, use_actions } from "@utils";
  import { onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";

  let {
    value = $bindable(""),
    placeholder = "Enter text...",
    sync_id = null,
    is_edit = false,
    busy = false,
    disabled = false,
    active = false,
    weight = 0,
    always_expanded = false,
    collapsed = false,
    variant = "default",
    signature_color = "#475569",
    size = "sm",
    class: className = "",
    style = "",
    header_actions = null,
    status = null,
    inline_snippet = null,
    content = null,
    actions = [],
    oninput = undefined,
    onfocus = undefined,
    onblur = undefined,
    onheaderclick = undefined,
    ...rest
  } = $props();

  let is_focused = $state(false);
  let history_stack = $state([value]);
  let history_index = $state(0);
  let is_internal_change = false;

  $effect(() => {
    const current = value;
    if (is_internal_change) return;
    if (history_stack[history_index] !== current) {
      const next_stack = history_stack.slice(0, history_index + 1);
      next_stack.push(current);
      if (next_stack.length > 50) next_stack.shift();
      history_stack = next_stack;
      history_index = history_stack.length - 1;
    }
  });

  function undo() {
    if (history_index > 0) {
      history_index--;
      is_internal_change = true;
      value = history_stack[history_index];
      oninput?.({ target: { value } });
      setTimeout(() => {
        is_internal_change = false;
      }, 0);
    }
  }

  function redo() {
    if (history_index < history_stack.length - 1) {
      history_index++;
      is_internal_change = true;
      value = history_stack[history_index];
      oninput?.({ target: { value } });
      setTimeout(() => {
        is_internal_change = false;
      }, 0);
    }
  }

  const can_undo = $derived(history_index > 0);
  const can_redo = $derived(history_index < history_stack.length - 1);

  /** @param {KeyboardEvent} e */
  function handle_textarea_keydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      if (e.shiftKey) {
        e.preventDefault();
        redo();
      } else {
        e.preventDefault();
        undo();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    }
  }

  let is_disabled = $derived(disabled || busy);
  let is_sync_focused = $derived(sync_id ? (sync_focus_counts[sync_id] || 0) > 0 : false);
  const font_size_class = $derived(
    size === "xs" ? "text-xs"
    : size === "md" ? "text-base"
    : "text-sm",
  );
  const paragraphs = $derived(parse_markdown(value));
  const is_expanded = $derived(
    (is_focused || is_sync_focused || active || busy || always_expanded || is_edit || !!status) && (!!header_actions || !!status || is_edit),
  );
  const intensity = $derived(weight / 10);
  const header_opacity = $derived(weight > 0 ? 0.2 + intensity * 0.8 : 0.8);

  /** @param {FocusEvent} e */
  function handle_focus(e) {
    if (is_disabled || busy) return;
    is_focused = true;
    if (sync_id) {
      sync_focus_counts[sync_id] = (sync_focus_counts[sync_id] || 0) + 1;
    }
    onfocus?.(e);
  }

  /** @param {FocusEvent} e */
  function handle_blur(e) {
    const root = /** @type {HTMLElement} */ (e.currentTarget);
    if (e.relatedTarget && root.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_focused = false;
    if (sync_id) {
      sync_focus_counts[sync_id] = Math.max(0, (sync_focus_counts[sync_id] || 0) - 1);
    }
    onblur?.(e);
  }

  onDestroy(() => {
    if (is_focused && sync_id) {
      sync_focus_counts[sync_id] = Math.max(0, (sync_focus_counts[sync_id] || 0) - 1);
    }
  });

  $effect(() => {
    if (is_edit !== undefined) {
      setTimeout(() => {
        if (is_focused && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "DIV") {
          is_focused = false;
        }
      }, 10);
    }
  });
</script>

{#snippet token_content(token_text)}
  {#if inline_snippet}
    {@render inline_snippet(token_text)}
  {:else}
    {token_text}
  {/if}
{/snippet}

<div
  class={[
    "group/textfield relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-solid border-transparent transition-[border-color,background] duration-300 ease-in-out before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:mask-border-solid before:p-px before:transition-opacity before:duration-300 before:content-['']!",
    variant === "bare" && "border-none! bg-transparent! shadow-none! before:hidden!",
    !is_expanded ?
      "bg-[color-mix(in_srgb,var(--color-dev-accent)_calc(4%+16%*var(--state-weight-intensity)),rgb(23_23_23/0.6))] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--color-dev-accent)_60%),transparent_50%)] before:opacity-[calc(0.2+0.6*var(--state-weight-intensity))]"
    : "overflow-visible! border-transparent bg-[color-mix(in_srgb,var(--color-dev-accent)_calc(10%+22%*var(--state-weight-intensity)),rgb(23_23_23/0.65))] before:bg-[linear-gradient(to_bottom,var(--color-dev-accent),color-mix(in_srgb,var(--color-dev-accent),transparent_60%)_30%,transparent_80%)] before:opacity-100",
    is_disabled && "cursor-not-allowed opacity-30",
    busy && "cursor-wait *:pointer-events-none",
    className,
  ]}
  data-expanded={is_expanded ? "true" : undefined}
  data-busy={busy ? "true" : undefined}
  data-variant={variant}
  data-disabled={is_disabled || busy ? "true" : undefined}
  style="{style}; --color-dev-accent: {signature_color}; --state-weight-intensity: {intensity}; --header-opacity: {header_opacity};"
  onfocusout={handle_blur}
  use:use_actions={actions}
  aria-busy={busy}
  aria-disabled={is_disabled || busy}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <header
    onclick={onheaderclick}
    style="display: flex; flex-wrap: nowrap;"
    class={[
      "relative top-0 z-10 flex! h-auto min-h-6 flex-nowrap items-center justify-between overflow-hidden rounded-t-xl bg-(--color-dev-accent) px-3 py-1 whitespace-nowrap opacity-100",
      collapsed && "rounded-b-xl",
      variant === "bare" && "hidden!",
      onheaderclick ? "cursor-pointer" : "cursor-default",
    ]}>
    {#if busy}
      <Shimmer color={signature_color || "var(--color-electric-cyan)"} class={collapsed ? "rounded-xl" : "rounded-t-xl"} />
    {/if}
    {#if is_expanded}
      {#if status}
        <div class="mr-tight flex min-w-0 flex-1 items-center overflow-hidden" in:fade={{ duration: motion.is_reduced ? 0 : 200, delay: 0 }}>
          {@render status()}
        </div>
      {/if}
      <div class="ml-auto flex h-full shrink-0 items-center gap-tight">
        {#if is_edit}
          <div class="mr-tight flex items-center gap-0.5" in:fade={{ duration: motion.is_reduced ? 0 : 150 }}>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Undo (Ctrl+Z)"
              actions={[tooltip]}
              tooltip="Undo (Ctrl+Z)"
              disabled={!can_undo || is_disabled}
              onclick={undo}
              class="h-5! w-5! rounded p-0.5! text-slate-400 transition duration-150 hover:bg-white/20 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-20">
              <Icon name="undo" class="size-3.5" />
            </Button>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Redo (Ctrl+Y)"
              actions={[tooltip]}
              tooltip="Redo (Ctrl+Y)"
              disabled={!can_redo || is_disabled}
              onclick={redo}
              class="h-5! w-5! rounded p-0.5! text-slate-400 transition duration-150 hover:bg-white/20 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-20">
              <Icon name="redo" class="size-3.5" />
            </Button>
          </div>
        {/if}
        {#if header_actions}
          <div class="flex h-full items-center">
            {@render header_actions()}
          </div>
        {/if}
      </div>
    {/if}
  </header>

  {#if !collapsed}
    <div transition:slide={{ duration: motion.is_reduced ? 0 : 250 }} class="overflow-hidden">
      {#if is_edit}
        <textarea
          {...rest}
          class={[
            "relative z-10 m-0 box-border block min-h-10 w-full resize-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent overflow-x-hidden overflow-y-auto border-none bg-transparent p-standard text-left type-body text-wrap text-frisk outline-none placeholder:text-slate-400/60 placeholder:italic focus:outline-none [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-xl [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb:hover]:bg-slate-50 [&::-webkit-scrollbar-track]:bg-transparent",
            font_size_class,
            busy && "cursor-wait",
          ]}
          data-mode="edit"
          bind:value
          {placeholder}
          onfocus={handle_focus}
          onblur={handle_blur}
          onkeydown={handle_textarea_keydown}
          {oninput}
          use:use_actions={actions}
          disabled={is_disabled}
          use:auto_resize={{ sync_id }}
          data-sync-id={sync_id}></textarea>
      {:else}
        <ScrollArea class="w-full">
          <div
            {...rest}
            class={[
              "relative z-10 box-border min-h-10 w-full p-standard text-left type-body text-wrap text-slate-200 outline-none select-text",
              font_size_class,
              busy ? "cursor-wait" : "cursor-text",
            ]}
            data-mode="view"
            tabindex="0"
            role="textbox"
            aria-readonly="true"
            onfocus={handle_focus}
            onblur={handle_blur}
            use:use_actions={actions}>
            {#if content}
              {@render content()}
            {:else if value && String(value).trim()}
              {#each paragraphs as p, pIdx (pIdx)}
                <p class="m-0 mb-tight last:mb-0">
                  {#each p as token, tIdx (tIdx)}
                    {#if token.type === "text"}
                      {@render token_content(token.content)}
                    {:else if token.type === "strong"}
                      <strong class="font-bold text-(--color-dev-accent)">{@render token_content(token.content)}</strong>
                    {:else if token.type === "em"}
                      <em class="italic opacity-30">{@render token_content(token.content)}</em>
                    {:else if token.type === "strong-em"}
                      <strong class="font-extrabold text-(--color-dev-accent)"
                        ><em class="italic opacity-30">{@render token_content(token.content)}</em></strong>
                    {:else if token.type === "quote"}
                      <span class="type-body">"{@render token_content(token.content)}"</span>
                    {/if}
                  {/each}
                </p>
              {/each}
            {:else}
              <span class="font-normal text-slate-400/60 italic">{placeholder}</span>
            {/if}
          </div>
        </ScrollArea>
      {/if}
    </div>
  {/if}
</div>
