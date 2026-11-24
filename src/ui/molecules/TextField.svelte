<script module>
  let sync_focus_counts = $state({});
</script>

<script>
  /**
   * @file src/ui/molecules/TextField.svelte
   * Reactive text field molecule with edit-mode undo/redo history and lazy AST markdown rendering.
   */
  import { Button, Icon, Shimmer, tooltip } from "@atoms";
  import { motion } from "@media";
  import { auto_resize, parse_markdown } from "@utils";
  import { onDestroy, untrack } from "svelte";
  import { fade } from "svelte/transition";

  let {
    value = $bindable(""),
    placeholder = "Enter text...",
    sync_id = null,
    is_edit = false,
    busy = false,
    disabled = false,
    active = false,
    variant = "default",
    signature_color = "#475569",
    size = "sm",
    class: className = "",
    header_actions = null,
    status = null,
    inline_snippet = null,
    content = null,
    oninput = undefined,
    onfocus = undefined,
    onblur = undefined,
    ...rest
  } = $props();

  /** @type {HTMLElement | undefined} */
  let root_el = $state();
  let is_focused = $state(false);
  /** @type {string[]} */
  let history_stack = $state.raw([]);
  let history_index = $state(0);

  // --- DERIVED ---
  const is_disabled = $derived(disabled || busy);
  const is_sync_focused = $derived(sync_id ? (sync_focus_counts[sync_id] || 0) > 0 : false);
  const can_undo = $derived(is_edit && history_index > 0);
  const can_redo = $derived(is_edit && history_index < history_stack.length - 1);
  const font_size_class = $derived(
    size === "xs" ? "text-xs"
    : size === "md" ? "text-base"
    : "text-sm",
  );
  const paragraphs = $derived(!is_edit && !content && value && String(value).trim() ? parse_markdown(value) : []);
  const is_expanded = $derived(
    (is_focused || is_sync_focused || active || busy || is_edit || Boolean(status)) && (Boolean(header_actions) || Boolean(status) || is_edit),
  );

  // --- FOCUS & SYNC COUNT ---
  function set_focused(next, event = null) {
    if (next === is_focused) return;
    is_focused = next;
    if (sync_id) {
      sync_focus_counts[sync_id] = Math.max(0, (sync_focus_counts[sync_id] || 0) + (next ? 1 : -1));
    }
    if (event) (next ? onfocus : onblur)?.(event);
  }

  /** @param {FocusEvent} e */
  function handle_focus_in(e) {
    if (is_disabled) return;
    set_focused(true, e);
  }

  /** @param {FocusEvent} e */
  function handle_focus_out(e) {
    if (e.relatedTarget && root_el?.contains(/** @type {Node} */ (e.relatedTarget))) return;
    set_focused(false, e);
  }

  onDestroy(() => {
    set_focused(false);
  });

  // Release focus cleanly if mode swaps out from under the active element
  $effect(() => {
    void is_edit;
    const t = setTimeout(() => {
      if (is_focused && (!root_el || !root_el.contains(document.activeElement))) {
        set_focused(false);
      }
    }, 10);
    return () => clearTimeout(t);
  });

  // --- EDIT-MODE UNDO / REDO HISTORY ---
  $effect(() => {
    if (!is_edit) {
      history_stack = [];
      history_index = 0;
      return;
    }
    const current = value;
    untrack(() => {
      if (history_stack.length === 0) {
        history_stack = [current];
        history_index = 0;
        return;
      }
      if (history_stack[history_index] === current) return;
      const next = history_stack.slice(0, history_index + 1);
      next.push(current);
      if (next.length > 50) next.shift();
      history_stack = next;
      history_index = next.length - 1;
    });
  });

  function step_history(delta) {
    const next_idx = history_index + delta;
    if (next_idx < 0 || next_idx >= history_stack.length) return;
    history_index = next_idx;
    value = history_stack[next_idx];
    oninput?.({ target: { value } });
  }

  /** @param {KeyboardEvent} e */
  function handle_textarea_keydown(e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === "z") {
      e.preventDefault();
      step_history(e.shiftKey ? 1 : -1);
    } else if (key === "y") {
      e.preventDefault();
      step_history(1);
    }
  }
</script>

{#snippet token_content(token_text)}
  {#if inline_snippet}
    {@render inline_snippet(token_text)}
  {:else}
    {token_text}
  {/if}
{/snippet}

{#snippet HistoryBtn(icon, label, enabled, delta)}
  <Button
    variant="invisible"
    size="small"
    square={true}
    aria-label={label}
    actions={[tooltip]}
    disabled={!enabled || is_disabled}
    onclick={() => step_history(delta)}
    class="h-5! w-5! rounded p-0.5! text-white/70 transition duration-150 hover:bg-white/20 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-40">
    <Icon name={icon} class="size-4" />
  </Button>
{/snippet}

<div
  bind:this={root_el}
  class={[
    "group/textfield relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-solid border-transparent transition-[border-color,background] duration-300 ease-in-out before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:mask-border-solid before:p-px before:transition-opacity before:duration-300 before:content-['']!",
    variant === "bare" && "border-none! bg-transparent! shadow-none! before:hidden!",
    is_expanded ?
      "overflow-visible! bg-[color-mix(in_srgb,var(--color-dev-accent)_10%,rgb(23_23_23/0.65))] before:bg-[linear-gradient(to_bottom,var(--color-dev-accent),color-mix(in_srgb,var(--color-dev-accent),transparent_60%)_30%,transparent_80%)] before:opacity-100"
    : "bg-[color-mix(in_srgb,var(--color-dev-accent)_4%,rgb(23_23_23/0.6))] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--color-dev-accent)_60%),transparent_50%)] before:opacity-20",
    is_disabled && "cursor-not-allowed opacity-30",
    busy && "cursor-wait *:pointer-events-none",
    className,
  ]}
  data-expanded={is_expanded ? "true" : undefined}
  data-busy={busy ? "true" : undefined}
  data-variant={variant}
  data-disabled={is_disabled ? "true" : undefined}
  style="--color-dev-accent: {signature_color};"
  onfocusin={handle_focus_in}
  onfocusout={handle_focus_out}
  aria-busy={busy}
  aria-disabled={is_disabled}>
  {#if variant !== "bare"}
    <div
      class="relative top-0 z-10 flex h-auto min-h-6 cursor-default flex-nowrap items-center justify-between overflow-hidden rounded-t-xl bg-(--color-dev-accent) px-3 py-1 whitespace-nowrap">
      {#if busy}
        <Shimmer color={signature_color || "var(--color-electric-cyan)"} class="rounded-t-xl" />
      {/if}
      {#if is_expanded}
        {#if status}
          <div class="mr-tight flex min-w-0 flex-1 items-center overflow-hidden" in:fade={{ duration: motion.is_reduced ? 0 : 200 }}>
            {@render status()}
          </div>
        {/if}
        <div class="ml-auto flex h-full shrink-0 items-center gap-tight">
          {#if is_edit}
            <div class={["mr-tight flex items-center gap-0.5", !can_undo && !can_redo && "invisible"]} in:fade={{ duration: motion.is_reduced ? 0 : 150 }}>
              {@render HistoryBtn("undo", "Undo (Ctrl+Z)", can_undo, -1)}
              {@render HistoryBtn("redo", "Redo (Ctrl+Y)", can_redo, 1)}
            </div>
          {/if}
          {#if header_actions}
            {@render header_actions()}
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <div class="overflow-hidden">
    {#if is_edit}
      <textarea
        {...rest}
        class={[
          "relative z-10 m-0 box-border block min-h-10 w-full resize-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent overflow-x-hidden overflow-y-auto border-none bg-transparent p-standard text-left type-body text-wrap text-frisk outline-none placeholder:text-slate-400/60 placeholder:italic [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-xl [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb:hover]:bg-slate-50 [&::-webkit-scrollbar-track]:bg-transparent",
          font_size_class,
          busy && "cursor-wait",
        ]}
        data-mode="edit"
        bind:value
        {placeholder}
        onkeydown={handle_textarea_keydown}
        {oninput}
        disabled={is_disabled}
        use:auto_resize={{ sync_id }}
        data-sync-id={sync_id}></textarea>
    {:else}
      <div
        {...rest}
        class={[
          "relative z-10 box-border min-h-10 w-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent overflow-x-hidden overflow-y-auto p-standard text-left type-body text-wrap text-slate-200 outline-none select-text",
          font_size_class,
          busy ? "cursor-wait" : "cursor-text",
        ]}
        data-mode="view"
        tabindex="0"
        role="textbox"
        aria-readonly="true">
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
                  <strong class="font-extrabold text-(--color-dev-accent)"><em class="italic opacity-30">{@render token_content(token.content)}</em></strong>
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
    {/if}
  </div>
</div>
