<script>
  /**
   * @file src/ui/organisms/ChatBubble.svelte
   * Unified message chassis for headers, narrative prose, thoughts, dormant TTS wires, edits, and prologue/epilogue cards.
   */
  import { resolve_entity_style_tiles } from "@definitions";
  import { app, execution, session } from "@state";
  import { Audio, get_cadence_rate, motion, resolve_voice_uri } from "@media";
  import { StoryboardTitle, TextField } from "@molecules";
  import { open_context_menu } from "./ContextMenu.svelte";
  import EntityCard from "./EntityCard.svelte";
  import { Avatar, Button, Icon, StyleTile, Typewriter, tooltip, Accordion } from "@atoms";
  import { parse_message, render_think_html, resolve_speaking_style } from "@simulation";
  import { entity_avatar_props, get_signature_color, safe_html } from "@utils";

  let {
    id = "",
    text = "",
    sender = "system",
    character_name = "",
    timestamp = new Date(),
    on_delete = undefined,
    on_regenerate = undefined,
    on_continue = undefined,
    on_edit = undefined,
    busy = false,
    meta = {},
    is_editing = false,
    on_save = undefined,
    on_cancel = undefined,
    is_pinned = false,
    on_toggle_pin = undefined,
  } = $props();

  let is_focused = $state(false);
  let local_text = $state("");
  let is_typing_finished = $state(false);
  let was_streaming = $state(false);

  const is_user = $derived(sender === "user");
  const is_ai = $derived(sender === "ai");
  const is_npc = $derived(sender === "npc");
  const is_fractal = $derived(sender === "fractal");
  const is_bookend = $derived(Boolean(meta?.is_prologue || meta?.is_epilogue));

  const speak_role = $derived(
    is_user ? "user"
    : is_fractal ? "fractal"
    : "ai",
  );
  const voice_audible = $derived(Boolean(Audio.is_role_enabled(speak_role)));
  const is_speaking_this = $derived(Boolean(Audio.voice.is_speaking && Audio.voice.active_message_id === id));

  const entity = $derived(session.resolve_feed_entity(sender, character_name));

  const signature_color = $derived(get_signature_color(entity, sender === "system" ? "var(--color-slate-600)" : "var(--color-slate-700)"));
  const is_extended = $derived(is_pinned || is_focused || is_editing);

  const speaking_style = $derived(resolve_speaking_style(entity, session.active_fractal?.narrative_style || ""));
  const is_streaming_target = $derived(
    Boolean(execution.stream.active && (execution.stream.node_id === id || (meta?.id && execution.stream.node_id === meta.id))),
  );
  const active_text = $derived(is_streaming_target ? execution.stream.content : text);
  const parsed = $derived(parse_message(active_text, speaking_style));
  const display_text = $derived(parsed.displayText);
  const think_block = $derived(parsed.think || meta?.think || null);
  const has_display_text = $derived(Boolean(display_text && display_text !== "<p></p>"));
  const clean_markdown = $derived((parsed.detoxedText || "").trim());
  const time_label = $derived(timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  const entity_display_name = $derived(entity?.name || character_name || (is_fractal ? "Fractal" : sender));
  const should_use_typewriter = $derived(is_streaming_target || (was_streaming && !is_typing_finished));

  // Only compute director think split when DevMode is actually open
  const director_split = $derived.by(() => {
    if (!app.settings.dev_mode || !think_block) return null;
    const seed = (meta?.director_staging?.directors_note || meta?.director_staging?.director_note || "").trim();
    if (!seed) return null;
    const plain = String(parsed.rawThink || meta?.think || "").trimStart();
    if (!plain.startsWith(seed)) return null;
    const seed_html = render_think_html(seed, speaking_style);
    if (!seed_html) return null;
    const remainder = plain.slice(seed.length).replace(/^\n+/, "");
    return { seed_html, remainder_html: render_think_html(remainder, speaking_style) };
  });

  $effect(() => {
    if (is_streaming_target) was_streaming = true;
  });

  $effect(() => {
    if (execution.stream.active && !is_streaming_target && was_streaming && !is_typing_finished) {
      is_typing_finished = true;
    }
  });

  $effect(() => {
    if (is_editing) local_text = clean_markdown;
  });

  function handle_message_click(e) {
    if (window.getSelection()?.toString()) return;
    if (/** @type {HTMLElement | null} */ (e.target)?.closest("button, input, textarea, a, select, [role='button']")) return;
    on_toggle_pin?.();
  }

  function handle_focus_out(e) {
    if (e.relatedTarget && e.currentTarget.contains(/** @type {Node} */ (e.relatedTarget))) return;
    is_focused = false;
  }

  async function handle_copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }

  function handle_speak() {
    if (!clean_markdown || !Audio.voice || !Audio.is_role_enabled(speak_role)) return;
    Audio.voice.active_message_id = id;
    if (entity?.voice) {
      Audio.voice.selected_voice = resolve_voice_uri(entity.voice.name || entity.voice.uri);
      const dyn_val =
        is_user ? 50
        : is_ai || is_npc ? (entity.dynamics?.intensity ?? 50)
        : (entity.dynamics?.velocity ?? 50);
      Audio.voice.rate = get_cadence_rate(entity.voice.cadence, dyn_val);
    }
    Audio.voice.speak(clean_markdown, true, true);
  }

  function handle_badge_contextmenu(e) {
    if (!entity) return;
    e.preventDefault();
    e.stopPropagation();
    open_context_menu({
      entity,
      type:
        is_user ? "user"
        : is_fractal ? "fractal"
        : is_npc ? "npc"
        : "ai",
      surface: is_npc ? "npc" : "storymode",
      x: e.clientX,
      y: e.clientY,
    });
  }
</script>

{#snippet HeaderBtn(icon, label, onclick, disabled = false)}
  <Button
    variant="invisible"
    size="small"
    square={true}
    aria-label={label}
    actions={[tooltip]}
    {onclick}
    {disabled}
    class="text-white/85 transition-colors hover:text-white disabled:opacity-30">
    <Icon name={icon} class="size-4" />
  </Button>
{/snippet}

{#snippet entity_trio()}
  {@const a = session.active_ai || app.selected_ai}
  {@const f = session.active_fractal || app.selected_fractal}
  {@const u = session.active_user || app.selected_user}
  <div class="my-tight flex h-character-card-height w-full items-stretch gap-tight max-md:overflow-x-auto md:gap-standard" data-msg-trio>
    {#if a}
      <div class="min-w-0 grow max-md:min-w-28" data-msg-card="ai">
        <EntityCard entity={a} type="ai" variant="message" onclick={() => app.open_profile(a, "ai")} />
      </div>
    {/if}
    {#if f}
      {@const f_tiles = resolve_entity_style_tiles(f)}
      {@const active_tiles = [f_tiles.narrative, f_tiles.visual].filter(Boolean)}
      <div class="flex min-w-0 grow-2 flex-col gap-tight max-md:min-w-56 md:gap-standard" data-msg-card="fractal">
        <div class="min-h-0 flex-1">
          <EntityCard entity={f} type="fractal" variant="message" onclick={() => app.open_profile(f, "fractal")} />
        </div>
        {#if active_tiles.length > 0}
          {@const f_color = get_signature_color(f, "var(--color-gunmetal)")}
          <div class="pointer-events-none flex w-full shrink-0 justify-center gap-tight md:gap-standard" data-msg-style-badge>
            {#each active_tiles as tile (tile.name)}
              <StyleTile
                {tile}
                signature_color={f_color}
                show_label_overlay={true}
                fallback_class="text-[clamp(0.75rem,8cqi,1.1rem)]"
                class="aspect-square min-w-0 flex-1 transform-gpu rounded-[clamp(0.5rem,9cqi,1rem)] hover:scale-lift hover:brightness-glow" />
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    {#if u}
      <div class="min-w-0 grow max-md:min-w-28" data-msg-card="user">
        <EntityCard entity={u} type="user" variant="message" onclick={() => app.open_profile(u, "user")} />
      </div>
    {/if}
  </div>
{/snippet}

{#snippet speaker_gutter(side, aria_label)}
  <button
    type="button"
    onclick={(e) => {
      e.stopPropagation();
      if (entity) app.toggle_profile(true, entity);
    }}
    oncontextmenu={handle_badge_contextmenu}
    style:--signature-color={signature_color}
    class={[
      "pointer-events-auto absolute top-1/2 isolate z-10 m-0 aspect-3/4 w-column-unit -translate-y-1/2 transform-[translateZ(0)] cursor-pointer overflow-hidden rounded-xl border border-solid border-(--signature-color,rgba(255,255,255,0.25)) bg-black/60 p-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition duration-300 ease-out select-none hover:scale-[1.02] hover:border-(--signature-color) hover:shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_20%,transparent)] focus-visible:outline-none",
      side === "right" ? "right-[calc(var(--spacing-column-unit)*0.5)]" : "left-[calc(var(--spacing-column-unit)*0.5)]",
    ]}
    aria-label={aria_label}>
    <Avatar
      {...entity_avatar_props(entity)}
      alt=""
      class="h-full w-full rounded-[inherit] [&_img]:h-full [&_img]:w-full [&_img]:rounded-[inherit] [&_img]:object-cover [&_img]:object-top" />
  </button>
{/snippet}

{#if (sender !== "system" || app.settings.dev_mode) && (has_display_text || think_block || busy || is_editing || is_bookend)}
  <div
    class={[
      "pointer-events-none relative flex w-full items-start p-standard transition duration-200",
      is_user ? "justify-end pr-[calc(var(--spacing-column-unit)*2)]"
      : is_ai || is_npc ? "justify-start pl-[calc(var(--spacing-column-unit)*2)]"
      : "justify-center",
    ]}>
    {#if (is_ai || is_npc || is_fractal) && entity && !is_bookend}
      {@render speaker_gutter("left", `${is_fractal ? "Fractal" : "Character"} Menu`)}
    {/if}

    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      data-active={is_extended}
      class="group glass-panel pointer-events-auto relative flex w-[calc(var(--spacing-column-unit)*5)] min-w-0 flex-col rounded-2xl transition duration-300 ease-out outline-none"
      style:--signature-color={signature_color}
      tabindex="0"
      onclick={handle_message_click}
      onfocusin={() => (is_focused = true)}
      onfocusout={handle_focus_out}
      role="region"
      aria-label="Message Context">
      {#if is_extended}
        <div
          class="relative flex h-9 w-full items-center justify-between overflow-hidden rounded-t-[15px] border-b border-white/10 bg-(--signature-color) px-standard transition-opacity duration-standard ease-out">
          <div class="flex items-center gap-tight overflow-hidden">
            <span class="type-uppercase-label whitespace-nowrap text-pure-white">{entity_display_name}</span>
            <span class="type-data text-pure-white/60">{time_label}</span>
          </div>

          <div class="flex items-center gap-tight">
            {#if is_editing}
              {@render HeaderBtn("check", "Save", () => on_save?.(local_text))}
              {@render HeaderBtn("close", "Cancel", on_cancel)}
            {:else}
              {#if is_ai}
                {@render HeaderBtn("play", "Continue", on_continue, execution.busy)}
                {@render HeaderBtn("refresh", "Regenerate", on_regenerate, execution.busy)}
              {/if}
              {#if is_speaking_this}
                {@render HeaderBtn(Audio.voice.is_paused ? "play" : "pause", Audio.voice.is_paused ? "Resume Audio" : "Pause Audio", () =>
                  Audio.voice.toggle_pause(),
                )}
                {@render HeaderBtn("stop", "Interrupt Audio", () => Audio.voice.stop())}
              {:else}
                {@render HeaderBtn("volume", "Read Message", handle_speak, !clean_markdown || !voice_audible)}
              {/if}
              {@render HeaderBtn("edit", "Edit", on_edit)}
              {@render HeaderBtn("copy", "Copy", handle_copy)}
              {@render HeaderBtn("trash", "Delete", on_delete)}
            {/if}
          </div>
        </div>
      {/if}

      <div class="relative p-standard">
        {#if is_bookend}
          <div
            class={meta?.is_epilogue ? "flex flex-col items-center gap-standard text-center" : undefined}
            data-msg-prologue={meta?.is_prologue ? "" : undefined}
            data-msg-epilogue={meta?.is_epilogue ? "" : undefined}>
            <StoryboardTitle title={app.story_title} parts={app.story_title_parts} />
            {@render entity_trio()}
          </div>
        {/if}

        {#if app.settings.dev_mode && think_block}
          <div class="mb-standard">
            <Accordion label="Thoughts">
              <div
                class="terminal-box max-h-75 overflow-y-auto p-standard type-data text-pretty text-[#f2f7fa] [&_.think-block-container]:font-mono! [&_.think-block-container_*]:font-mono! [&_em]:italic [&_em]:opacity-75 [&_p]:mb-standard">
                {#if director_split}
                  <div class="mb-tight border-l-2 border-cyan-400 bg-cyan-400/10 px-tight py-1 text-cyan-200">
                    <div class="think-block-container contents" use:safe_html={director_split.seed_html}></div>
                  </div>
                  {#if director_split.remainder_html}
                    <div class="think-block-container contents" use:safe_html={director_split.remainder_html}></div>
                  {/if}
                {:else}
                  <div class="think-block-container contents" use:safe_html={think_block}></div>
                {/if}
              </div>
            </Accordion>
          </div>
        {/if}

        {#if is_editing}
          <TextField bind:value={local_text} is_edit={true} {signature_color} variant="bare" placeholder="Edit message..." />
        {:else if has_display_text || busy}
          <div
            class="type-body text-pretty text-pure-white [&_.dialogue]:text-[1.12em] [&_.dialogue]:font-medium [&_em]:italic [&_em]:opacity-75 [&_p]:mb-standard [&_p:last-child]:mb-0 [&_strong]:font-bold [&_strong]:text-(--signature-color,var(--color-slate-400)) [&_strong]:[text-shadow:0_0_8px_color-mix(in_srgb,var(--signature-color,var(--color-slate-400)),transparent_85%)]"
            style:content-visibility={!should_use_typewriter ? "auto" : undefined}>
            {#if !has_display_text}
              <span
                role="status"
                aria-label="Generating response"
                data-blink={!motion.is_reduced ? "true" : undefined}
                class="inline-block text-(--signature-color)">▌</span>
            {:else if should_use_typewriter}
              <Typewriter target_html={display_text} bind:is_finished={is_typing_finished} show_cursor={true} cursor_style="block" />
            {:else}
              <div class="display-text-container contents" use:safe_html={display_text}></div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if is_user && entity && !is_bookend}
      {@render speaker_gutter("right", "User Persona Menu")}
    {/if}
  </div>
{/if}

<style>
  [data-blink="true"] {
    animation: blink var(--transition-duration-slow, 500ms) step-end infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0;
    }
  }
</style>
