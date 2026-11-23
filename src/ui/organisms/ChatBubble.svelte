<script module>
  import { clean_generated_prose, clean_image_prompts, format_tagged_fields, parse_think_block, strip_covert_directives } from "@simulation";
  import { sanitize } from "@utils";
  import MarkdownIt from "markdown-it";

  const markdown = new MarkdownIt({ html: false, breaks: true, linkify: true });

  /**
   * Stateful parser to wrap text inside double quotes with a `<span class="dialogue">` tag.
   * @param {string} html
   * @returns {string}
   */
  export function wrap_dialogue(html) {
    if (!html) return "";
    const parts = html.split(/(<[^>]+>)/);
    let in_quote = false;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith("<")) {
        continue;
      }

      const text = parts[i].replace(/&quot;/g, '"');
      let new_text = "";
      let last_index = 0;

      for (let j = 0; j < text.length; j++) {
        if (text[j] === '"') {
          new_text += text.substring(last_index, j);
          if (!in_quote) {
            new_text += '<span class="dialogue">&ldquo;';
            in_quote = true;
          } else {
            new_text += "&rdquo;</span>";
            in_quote = false;
          }
          last_index = j + 1;
        }
      }
      new_text += text.substring(last_index);
      parts[i] = new_text;
    }

    let result = parts.join("");
    if (in_quote) {
      result += "</span>";
    }
    return result;
  }

  /**
   * Master parser that runs image prompt stripping, think block extraction,
   * cliché detox, markdown rendering, sanitization, and dialogue quote wrapping.
   * @param {string|null|undefined} rawText
   * @param {"plain"|"ornate"|"raw"|"clinical"} [register="plain"]
   * @returns {{ displayText: string, think: string|null, detoxedText: string }}
   */
  export function parse_message(rawText, register = "plain") {
    let text = clean_image_prompts(rawText || "");

    const think_result = parse_think_block(text);
    text = think_result.content;

    text = clean_generated_prose(text, register);
    text = format_tagged_fields(strip_covert_directives(text), { see_hidden: "none" });
    const detoxed_think = think_result.think ? clean_generated_prose(think_result.think, register) : null;
    const detoxed_text = text;

    let rendered = sanitize(markdown.render(text).trim());
    rendered = rendered.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    rendered = wrap_dialogue(rendered);

    const rendered_think = detoxed_think ? sanitize(markdown.render(detoxed_think).trim()) : null;

    return { displayText: rendered, think: rendered_think, detoxedText: detoxed_text };
  }
</script>

<script>
  /**
   * @file src/ui/organisms/ChatBubble.svelte
   * 💬 THE SOVEREIGN CHAT BUBBLE
   * Unified message chassis consolidating message headers, narrative prose,
   * thinking cognition blocks, audio playback, edit controls, prologue, and epilogue cards.
   */
  import { resolve_entity_style_tiles } from "@definitions";
  import { app, execution, session } from "@state";
  import { Audio, get_cadence_rate, resolve_voice_uri } from "@media";
  import { Accordion, Avatar, Button, Icon, Shimmer, Typewriter, tooltip } from "@atoms";
  import { StoryboardTitle, TextField } from "@molecules";
  import { open_context_menu } from "./ContextMenu.svelte";
  import EntityCard from "./EntityCard.svelte";
  import { resolve_speaking_style } from "@simulation";
  import { entity_avatar_props, safe_html, get_signature_color } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {string|number} [id=""]
   * @property {string} [text=""]
   * @property {string} [sender="system"]
   * @property {string} [character_name=""]
   * @property {Date} [timestamp=new Date()]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_delete]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_regenerate]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_continue]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_edit]
   * @property {boolean} [is_last=false]
   * @property {boolean} [busy=false]
   * @property {Record<string, any>} [meta={}]
   * @property {boolean} [is_editing=false]
   * @property {(new_text: string) => any} [on_save]
   * @property {() => any} [on_cancel]
   * @property {boolean} [is_pinned=false]
   * @property {() => any} [on_toggle_pin]
   */

  /** @type {Props} */
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
    is_last: _is_last = false,
    busy = false,
    meta = {},
    is_editing = false,
    on_save = undefined,
    on_cancel = undefined,
    is_pinned = false,
    on_toggle_pin = undefined,
  } = $props();

  // --- LOCAL INTERACTION STATE ---
  let is_focused = $state(false);
  let local_text = $state("");
  let is_typing_finished = $state(false);
  let was_streaming = $state(false);

  // --- ENTITY & ROLE DERIVATIONS ---
  let is_user = $derived(sender === "user");
  let is_ai = $derived(sender === "ai");
  let is_npc = $derived(sender === "npc");
  let is_fractal = $derived(sender === "fractal");

  /** Voice-flag role for this message (npc speech is covered by the ai flag). */
  let speak_role = $derived(
    is_user ? "user"
    : is_fractal ? "fractal"
    : "ai",
  );
  /** Effective audibility: master switch AND per-role flag. Reactive - menu labels and the Read button follow toggles. */
  let voice_audible = $derived(Audio.is_role_enabled(speak_role));

  let entity = $derived(
    is_user ? session.active_user || app.selected_user
    : is_ai ? session.active_ai || app.selected_ai
    : is_npc ? Object.values(session.active_npcs || {}).find((n) => String(n.name) === character_name) || null
    : is_fractal ?
      session.active_fractal && session.active_fractal.id !== "active_fractal" ?
        session.active_fractal
      : app.selected_fractal || session.active_fractal
    : null,
  );

  let signature_color = $derived(get_signature_color(entity, sender === "system" ? "var(--color-slate-600)" : "var(--color-slate-700)"));
  let is_extended = $derived(is_pinned || is_focused || is_editing);

  let active_style = $derived(session.active_fractal?.narrative_style || "");
  let speaking_style = $derived(resolve_speaking_style(entity, active_style));
  let is_streaming_target = $derived(!!(execution.stream.active && (execution.stream.node_id === id || (meta?.id && execution.stream.node_id === meta.id))));
  let active_text = $derived(is_streaming_target ? execution.stream.content : text);
  let parsed = $derived(parse_message(active_text, speaking_style));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think || meta?.think || null);
  let director_seed_raw = $derived((meta?.director_staging?.directors_note || meta?.director_staging?.director_note || "").trim());
  let raw_think_plain = $derived.by(() => {
    try {
      const from_text = parse_think_block(active_text || "")?.think || "";
      if (from_text && from_text.trim()) return from_text;
    } catch {
      /* fall through to meta.think */
    }
    return meta?.think || "";
  });
  let director_seed_active = $derived.by(() => {
    if (!director_seed_raw) return "";
    const plain = String(raw_think_plain || "").trimStart();
    if (plain.startsWith(director_seed_raw)) return director_seed_raw;
    return "";
  });
  let think_remainder_raw = $derived.by(() => {
    if (!director_seed_active) return "";
    const plain = String(raw_think_plain || "").trimStart();
    return plain.slice(director_seed_active.length).replace(/^\n+/, "");
  });
  let director_think_html = $derived.by(() => {
    if (!director_seed_active) return null;
    try {
      return parse_message(`<think>${director_seed_active}</think>`, speaking_style)?.think || null;
    } catch {
      return null;
    }
  });
  let remainder_think_html = $derived.by(() => {
    if (!director_seed_active) return null;
    const rem = String(think_remainder_raw || "").trim();
    if (!rem) return null;
    try {
      return parse_message(`<think>${rem}</think>`, speaking_style)?.think || null;
    } catch {
      return null;
    }
  });
  let show_director_split = $derived(!!(director_seed_active && director_think_html));
  let should_use_typewriter = $derived(is_streaming_target || (was_streaming && !is_typing_finished));

  $effect(() => {
    if (is_streaming_target) {
      was_streaming = true;
    }
  });

  $effect(() => {
    if (execution.stream.active && !is_streaming_target && was_streaming && !is_typing_finished) {
      is_typing_finished = true;
    }
  });

  let has_display_text = $derived(!!(display_text && display_text !== "<p></p>"));
  let clean_markdown = $derived((parsed.detoxedText || "").trim());
  let time_label = $derived(timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  let entity_display_name = $derived(entity?.name || character_name || (is_fractal ? "Fractal" : sender));

  // --- ACTIONS & UTILITIES ---
  function handle_message_click(e) {
    const target = /** @type {HTMLElement | null} */ (e.target);
    if (target?.closest("button, input, textarea, a, select, [role='button']")) {
      return;
    }
    on_toggle_pin?.();
  }

  function handle_focus() {
    is_focused = true;
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
    if (!clean_markdown) return;
    if (!Audio.is_role_enabled(speak_role)) {
      console.warn(`${entity_display_name || "This voice"} is muted - enable it from the message menu to hear it read aloud.`);
      return;
    }
    Audio.voice.active_message_id = id;

    if (entity && entity.voice) {
      const v_id = entity.voice.name || entity.voice.uri;
      Audio.voice.selected_voice = resolve_voice_uri(v_id);
      const dyn_val =
        is_user ? 50
        : is_ai || is_npc ? (entity.dynamics?.intensity ?? 50)
        : (entity.dynamics?.velocity ?? 50);
      Audio.voice.rate = get_cadence_rate(entity.voice.cadence, dyn_val);
    }

    Audio.voice.speak(clean_markdown, true, true);
  }

  function open_menu_at(x, y) {
    if (entity) {
      open_context_menu({
        entity,
        type:
          is_user ? "user"
          : is_fractal ? "fractal"
          : is_npc ? "npc"
          : "ai",
        surface: is_npc ? "npc" : "storymode",
        x,
        y,
      });
    }
  }

  function handle_badge_click(e) {
    e.stopPropagation();
    if (!entity) return;
    app.toggle_profile(true, entity);
  }

  function handle_badge_contextmenu(e) {
    if (!entity) return;
    e.preventDefault();
    e.stopPropagation();
    open_menu_at(e.clientX, e.clientY);
  }

  $effect(() => {
    if (is_editing) {
      local_text = clean_markdown;
    }
  });
</script>

{#snippet header_bar()}
  {#if is_extended}
    <div
      class="relative flex h-9 w-full items-center justify-between overflow-hidden rounded-t-[15px] border-b border-white/10 bg-(--signature-color) px-standard opacity-100 transition-opacity duration-standard ease-out">
      <div class="flex items-center gap-tight overflow-hidden">
        <span class="type-uppercase-label whitespace-nowrap text-pure-white">
          {entity_display_name}
        </span>
        <span class="type-data text-pure-white/60">
          {time_label}
        </span>
      </div>

      <!-- HEADER ACTIONS -->
      <div class="flex items-center gap-tight opacity-100 transition-opacity duration-200">
        {#if is_editing}
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Save"
            actions={[tooltip]}
            onclick={() => on_save?.(local_text)}
            class="text-white/85 transition-colors hover:text-white">
            <Icon name="check" class="size-4" />
          </Button>
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Cancel"
            actions={[tooltip]}
            onclick={on_cancel}
            class="text-white/85 transition-colors hover:text-white">
            <Icon name="close" class="size-4" />
          </Button>
        {:else}
          {#if is_ai}
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Continue"
              actions={[tooltip]}
              onclick={on_continue}
              disabled={execution.busy}
              class="text-white/85 transition-colors hover:text-white">
              <Icon name="play" class="size-4" />
            </Button>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Regenerate"
              actions={[tooltip]}
              onclick={on_regenerate}
              disabled={execution.busy}
              class="text-white/85 transition-colors hover:text-white">
              <Icon name="refresh" class="size-4" />
            </Button>
          {/if}

          {#if Audio.voice.is_speaking && Audio.voice.active_message_id === id}
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label={Audio.voice.is_paused ? "Resume Audio" : "Pause Audio"}
              actions={[tooltip]}
              onclick={() => Audio.voice.toggle_pause()}
              class="text-white/85 transition-colors hover:text-white">
              {#if Audio.voice.is_paused}
                <Icon name="play" class="size-4" />
              {:else}
                <Icon name="pause" class="size-4" />
              {/if}
            </Button>
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Interrupt Audio"
              actions={[tooltip]}
              onclick={() => Audio.voice.stop()}
              class="text-white/85 transition-colors hover:text-white">
              <Icon name="stop" class="size-4" />
            </Button>
          {:else}
            <Button
              variant="invisible"
              size="small"
              square={true}
              aria-label="Read Message"
              actions={[tooltip]}
              onclick={handle_speak}
              disabled={!clean_markdown || !voice_audible}
              class="text-white/85 transition-colors hover:text-white disabled:opacity-30">
              <Icon name="volume" class="size-4" />
            </Button>
          {/if}
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Edit"
            actions={[tooltip]}
            onclick={on_edit}
            class="text-white/85 transition-colors hover:text-white">
            <Icon name="edit" class="size-4" />
          </Button>
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Copy"
            actions={[tooltip]}
            onclick={handle_copy}
            class="text-white/85 transition-colors hover:text-white">
            <Icon name="copy" class="size-4" />
          </Button>
          <Button
            variant="invisible"
            size="small"
            square={true}
            aria-label="Delete"
            actions={[tooltip]}
            onclick={on_delete}
            class="text-white/85 transition-colors hover:text-white">
            <Icon name="trash" class="size-4" />
          </Button>
        {/if}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet body_content()}
  {#if app.settings.dev_mode && think_block}
    <div class="mb-standard">
      <Accordion label="Thoughts">
        {#if show_director_split}
          <div
            class="terminal-box max-h-75 overflow-y-auto p-standard type-data text-pretty text-[#f2f7fa] [&_.think-block-container]:font-mono! [&_.think-block-container_*]:font-mono! [&_em]:italic [&_em]:opacity-75 [&_p]:mb-standard">
            <div class="mb-tight border-l-2 border-cyan-400 bg-cyan-400/10 px-tight py-1 text-cyan-200">
              <div class="think-block-container contents" use:safe_html={director_think_html}></div>
            </div>
            {#if remainder_think_html}
              <div class="think-block-container contents" use:safe_html={remainder_think_html}></div>
            {/if}
          </div>
        {:else}
          <div
            class="terminal-box max-h-75 overflow-y-auto p-standard type-data text-pretty text-[#f2f7fa] [&_.think-block-container]:font-mono! [&_.think-block-container_*]:font-mono! [&_em]:italic [&_em]:opacity-75 [&_p]:mb-standard">
            <div class="think-block-container contents" use:safe_html={think_block}></div>
          </div>
        {/if}
      </Accordion>
    </div>
  {/if}

  {#if is_editing}
    <TextField bind:value={local_text} is_edit={true} {signature_color} variant="bare" placeholder="Edit message..." />
  {:else if has_display_text || busy}
    <div
      class="text-left type-body text-pretty text-pure-white [&_.dialogue]:text-[1.12em] [&_.dialogue]:font-medium [&_em]:italic [&_em]:opacity-75 [&_p]:mb-standard [&_p:last-child]:mb-0 [&_strong]:font-bold [&_strong]:text-(--signature-color,var(--color-slate-400)) [&_strong]:[text-shadow:0_0_8px_color-mix(in_srgb,var(--signature-color,var(--color-slate-400)),transparent_85%)] {(
        is_fractal
      ) ?
        'text-center'
      : ''}"
      style={!should_use_typewriter ? "content-visibility: auto;" : ""}>
      {#if should_use_typewriter}
        {#if has_display_text}
          <Typewriter target_html={display_text} bind:is_finished={is_typing_finished} show_cursor={true} cursor_style="block" />
        {:else if busy}
          <div class="relative h-6 w-24 overflow-hidden rounded">
            <Shimmer color={signature_color || "var(--color-electric-cyan)"} />
          </div>
        {/if}
      {:else if has_display_text}
        <div class="display-text-container contents" use:safe_html={display_text}></div>
      {:else if busy}
        <div class="relative h-6 w-24 overflow-hidden rounded">
          <Shimmer color={signature_color || "var(--color-electric-cyan)"} />
        </div>
      {/if}
    </div>
  {/if}
{/snippet}

{#snippet entity_trio()}
  <div class="my-tight flex h-character-card-height w-full items-stretch gap-tight max-md:overflow-x-auto md:gap-standard" data-msg-trio>
    {#if session.active_ai || app.selected_ai}
      {@const a = session.active_ai || app.selected_ai}
      <div class="min-w-0 grow max-md:min-w-28" data-msg-card="ai">
        <EntityCard entity={a} type="ai" variant="message" onclick={() => app.open_profile(a, "ai")} />
      </div>
    {/if}
    {#if session.active_fractal || app.selected_fractal}
      {@const f = session.active_fractal || app.selected_fractal}
      {@const f_tiles = resolve_entity_style_tiles(f)}
      <div class="min-w-0 grow-[2] max-md:min-w-56" data-msg-card="fractal">
        <div class="flex h-full w-full flex-col gap-tight md:gap-standard">
          <div class="min-h-0 flex-1">
            <EntityCard entity={f} type="fractal" variant="message" onclick={() => app.open_profile(f, "fractal")} />
          </div>
          {#if f_tiles.narrative || f_tiles.visual}
            {@const f_color = get_signature_color(f, "var(--color-gunmetal)")}
            <div class="flex w-full shrink-0 justify-center gap-tight md:gap-standard" data-msg-style-badge>
              <div class="pointer-events-none flex w-full justify-center gap-tight md:gap-standard">
                {#each [f_tiles.narrative, f_tiles.visual].filter(Boolean) as tile (tile.name)}
                  <div
                    class="group/badge pointer-events-auto relative flex aspect-square min-w-0 flex-1 transform-gpu items-center justify-center overflow-hidden rounded-[clamp(0.5rem,9cqi,1rem)] border border-solid border-(--signature-color) bg-black/40 opacity-100 shadow-md transition duration-300 ease-in-out hover:scale-lift hover:brightness-glow">
                    <Avatar
                      src={tile.portrait}
                      alt={tile.name}
                      initials={tile.fallback}
                      signature_color={f_color}
                      fallback_class="text-[clamp(0.75rem,8cqi,1.1rem)]"
                      class="rounded-[inherit]">
                      {#snippet overlay()}
                        <div
                          class="pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex flex-col items-center justify-end overflow-hidden rounded-b-[inherit] bg-linear-to-t from-black/95 via-black/75 via-45% to-transparent px-1 pt-standard pb-tight text-center opacity-0 transition-opacity duration-standard ease-in-out group-hover/badge:opacity-100">
                          <span
                            class="line-clamp-2 w-full text-center type-uppercase-label wrap-break-word text-(--signature-color,var(--color-frisk)) [text-shadow:0_2px_4px_var(--color-void-black)]"
                            >{tile.name}</span>
                        </div>
                      {/snippet}
                    </Avatar>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
    {#if session.active_user || app.selected_user}
      {@const u = session.active_user || app.selected_user}
      <div class="min-w-0 grow max-md:min-w-28" data-msg-card="user">
        <EntityCard entity={u} type="user" variant="message" onclick={() => app.open_profile(u, "user")} />
      </div>
    {/if}
  </div>
{/snippet}

{#snippet cursive_title()}
  <StoryboardTitle title={app.story_title} parts={app.story_title_parts} />
{/snippet}

{#snippet speaker_gutter(side, aria_label)}
  <div
    class={[
      "absolute top-1/2 m-0 flex w-column-unit -translate-y-1/2 items-center justify-center p-0 select-none",
      side === "right" ? "right-[calc(var(--spacing-column-unit)*0.5)]" : "left-[calc(var(--spacing-column-unit)*0.5)]",
    ]}
    style="--signature-color: {signature_color};">
    <button
      type="button"
      onclick={handle_badge_click}
      oncontextmenu={handle_badge_contextmenu}
      class="group/badge relative isolate m-0 aspect-3/4 w-column-unit transform-[translateZ(0)] cursor-pointer overflow-hidden rounded-xl border border-solid border-(--signature-color,rgba(255,255,255,0.25)) bg-black/60 p-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition duration-300 ease-out hover:scale-[1.02] hover:border-(--signature-color) hover:shadow-[0_0_calc(var(--spacing-unit)*4)_color-mix(in_srgb,var(--signature-color)_20%,transparent)] focus-visible:outline-none"
      aria-label={aria_label}>
      <Avatar
        {...entity_avatar_props(entity)}
        alt=""
        class="h-full w-full rounded-[inherit] [&_img]:h-full [&_img]:w-full [&_img]:rounded-[inherit] [&_img]:object-cover [&_img]:object-top" />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-20 transition-opacity duration-200 group-hover/badge:opacity-0"
        style="background-color: {signature_color}; mix-blend-mode: color;">
      </div>
    </button>
  </div>
{/snippet}

{#if sender === "system" && !app.settings.dev_mode}
  <!-- System / Director messages are purely internal background data and never render in normal mode -->
{:else if !has_display_text && !think_block && !busy && !is_editing && !meta?.is_prologue && !meta?.is_epilogue}
  <!-- Empty ghost row suppressed: no DOM node emitted -->
{:else}
  <div
    class="relative flex w-full items-start p-standard transition duration-200 {is_user ? 'justify-end pr-[calc(var(--spacing-column-unit)*2)]'
    : is_ai || is_npc ? 'justify-start pl-[calc(var(--spacing-column-unit)*2)]'
    : 'justify-center'}">
    {#if (is_ai || is_npc || is_fractal) && entity && !meta?.is_prologue && !meta?.is_epilogue}
      {@render speaker_gutter("left", `${is_fractal ? "Fractal" : "Character"} Menu`)}
    {/if}

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="group relative flex min-w-0 flex-col rounded-2xl border border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.5)] [backdrop-filter:var(--blur-mist)] transition duration-300 ease-out outline-none before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:mask-border-solid before:p-px before:transition before:duration-300 before:content-['']! {(
        !is_extended
      ) ?
        'bg-[color-mix(in_srgb,var(--signature-color)_5%,rgba(15,15,15,0.7))] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)] before:opacity-30'
      : 'bg-[color-mix(in_srgb,var(--signature-color)_10%,rgba(15,15,15,0.75))] shadow-[0_8px_32px_color-mix(in_srgb,var(--signature-color),transparent_95%)] before:bg-[linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)] before:opacity-100'} w-[calc(var(--spacing-column-unit)*5)]"
      style="--signature-color: {signature_color};"
      tabindex="0"
      onclick={handle_message_click}
      onfocusin={handle_focus}
      onfocusout={handle_focus_out}
      role="region"
      aria-label="Message Context">
      <!-- HEADER BAR -->
      {@render header_bar()}

      <!-- CARD BODY -->
      <div class="relative p-standard">
        {#if meta?.is_prologue}
          <div data-msg-prologue>
            {@render cursive_title()}
            {@render entity_trio()}
          </div>
        {:else if meta?.is_epilogue}
          <div class="flex flex-col items-center gap-standard text-center" data-msg-epilogue>
            {@render cursive_title()}
            {@render entity_trio()}
          </div>
        {/if}

        {@render body_content()}
      </div>
    </div>

    {#if is_user && entity && !meta?.is_prologue && !meta?.is_epilogue}
      {@render speaker_gutter("right", "User Persona Menu")}
    {/if}
  </div>
{/if}
