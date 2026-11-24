<script module>
  /**
   * @file src/ui/organisms/ContextMenu.svelte
   * Entity Context Menu supporting floating portal mode and embedded 3D card-back preview mode.
   */
  import { set_tooltip_suppressed } from "@atoms";
  import { capture_story_image, run_mock } from "@engine";
  import { Audio } from "@media";
  import { app, execution } from "@state";
  import { open_image_preview } from "./ImagePreview.svelte.js";
  import { get_signature_color, on_dismiss_outside } from "@utils";

  const context_menu_state = $state({ open: false, entity: null, type: "ai", surface: "default", x: 0, y: 0, on_close: null });

  /** @param {{ entity: any, type?: string, surface?: string, x: number, y: number, on_close?: () => void }} options */
  export function open_context_menu(options) {
    if (!options?.entity) return;
    context_menu_state.entity = options.entity;
    context_menu_state.type = options.type || options.entity.type || "ai";
    context_menu_state.surface = options.surface || "default";
    context_menu_state.x = options.x;
    context_menu_state.y = options.y;
    context_menu_state.on_close = options.on_close || null;
    context_menu_state.open = true;
    set_tooltip_suppressed(true);
  }

  function close_context_menu() {
    if (!context_menu_state.open) return;
    const cb = context_menu_state.on_close;
    context_menu_state.open = false;
    context_menu_state.entity = null;
    context_menu_state.on_close = null;
    set_tooltip_suppressed(false);
    cb?.();
  }

  const PHOTO_LABELS = { ai: "Generate AI Character Image", user: "Generate User Persona Image", fractal: "Generate Fractal Image" };

  /** Fire-and-forget capture wrapper: swallows late rejections after internal failure marking. */
  const fire_capture = (opts) => () => void capture_story_image(opts).catch(() => {});

  /**
   * Builds surface-appropriate actions for an entity.
   * @param {any} entity
   * @param {string} surface
   */
  function build_entity_actions(entity, surface) {
    if (!entity) return [];
    const type = context_menu_state.type || (entity.type === "fractal" ? "fractal" : "ai");
    const on_open_profile = (ent) => app.toggle_profile(true, ent, type);
    const on_open_image = (payload) => open_image_preview(payload);

    const m = entity?.modifiers;
    const portrait_meta = m ? { prompt: m.prompt, negative_prompt: m.negative_prompt, seed: m.last_generated_seed } : null;
    const push_voice_toggle = (items) => {
      const role = type === "fractal" ? "fractal" : "ai";
      const noun = role === "fractal" ? "Fractal Voice" : "AI Voice";
      const enabled = Boolean(Audio?.is_role_enabled?.(role));
      items.push({ label: `${enabled ? "Disable" : "Enable"} ${noun}`, active: enabled, onSelect: () => Audio?.toggle_entity_voice?.(role) });
    };

    const push_portrait = (items, label = "Profile Picture", meta = portrait_meta) => {
      if (entity.profile_picture) items.push({ label, onSelect: () => on_open_image({ src: entity.profile_picture, metadata: meta }) });
    };

    if (surface === "preview") {
      const items = [{ label: "Profile", onSelect: () => app.open_profile(entity) }];
      push_portrait(items);
      return items;
    }

    if (surface === "storyboard") {
      const items = [{ label: "Profile", onSelect: () => on_open_profile(entity) }];
      push_portrait(items);
      if (type === "ai" || type === "fractal") push_voice_toggle(items);
      items.push({ separator: true }, { label: "Swap", onSelect: () => app.open_card_hand(type) });
      return items;
    }

    if (surface === "storymode" || surface === "npc") {
      const items = [{ label: "Profile", onSelect: () => on_open_profile(entity) }];
      push_portrait(items);
      if (type === "ai" || type === "fractal" || surface === "npc") push_voice_toggle(items);
      items.push({ separator: true });

      if (surface === "npc") {
        items.push({
          label: "Generate NPC Picture",
          onSelect: fire_capture({ subject: "npc", kind: "story_character", target_entity: entity }),
          disabled: execution.busy,
        });
        return items;
      }

      items.push({
        label: PHOTO_LABELS[type] || PHOTO_LABELS.fractal,
        onSelect: fire_capture({ subject: type, kind: type === "fractal" ? "story_scene" : "story_character" }),
        disabled: execution.busy,
      });

      if (type === "fractal") {
        items.push({
          label: "Generate Story Image",
          onSelect: fire_capture({
            subject: "fractal",
            prompt: "A scene featuring both the AI character and the user persona together",
            kind: "story_entities",
          }),
          disabled: execution.busy,
        });
      }

      if (type === "user") {
        items.push(
          {
            label: app.settings.call_mode ? "Disable Microphone" : "Enable Microphone",
            active: app.settings.call_mode,
            onSelect: () => {
              app.settings.call_mode = !app.settings.call_mode;
              app.save_settings();
            },
          },
          { separator: true },
          { label: "Ghostwrite", onSelect: () => (app.ghostwrite_request += 1), disabled: execution.busy },
        );
      }

      if (app.settings.dev_mode) {
        items.push({ separator: true }, { label: "Mock Message", onSelect: () => run_mock(type), disabled: execution.busy });
      }
      return items;
    }

    const items = [{ label: "Inspect Profile", onSelect: () => app.open_profile(entity) }];
    push_portrait(items, "View Portrait", entity.modifiers || null);
    return items;
  }
</script>

<script>
  import { Button } from "@atoms";

  let {
    embedded = false,
    open = false,
    entity = null,
    surface = "default",
    target_name: explicit_name = "",
    portrait_src = "",
    signature_color: explicit_signature_color = "",
    on_close = undefined,
  } = $props();

  /** @type {HTMLElement | null} */
  let menu_el = $state(null);

  const is_visible = $derived(embedded ? open : open || context_menu_state.open);
  const open_x = $derived(embedded ? 0 : context_menu_state.x);
  const open_y = $derived(embedded ? 0 : context_menu_state.y);
  const active_entity = $derived(embedded ? entity : context_menu_state.entity);
  const active_surface = $derived(embedded ? surface : context_menu_state.surface);
  const target_name = $derived(explicit_name || active_entity?.name || "");
  const signature_color = $derived(explicit_signature_color || get_signature_color(active_entity, "var(--color-frisk)"));
  const resolved_portrait_src = $derived(portrait_src || active_entity?.profile_picture || "");
  const resolved_actions = $derived(is_visible ? build_entity_actions(active_entity, active_surface) : []);

  function portal_and_clamp(node, params) {
    if (!params.enabled) return {};
    document.body.appendChild(node);

    const apply_position = ({ x: raw_x, y: raw_y }) => {
      const vw = window.innerWidth || 1024;
      const vh = window.innerHeight || 768;
      const w = node.offsetWidth || 180;
      const h = node.offsetHeight || 160;
      node.style.left = `${Math.max(0, Math.min(raw_x > vw / 2 ? raw_x - w : raw_x, vw - w))}px`;
      node.style.top = `${Math.max(0, Math.min(raw_y > vh / 2 ? raw_y - h : raw_y, vh - h))}px`;
    };

    apply_position(params);
    return {
      update(next) {
        if (next.enabled) apply_position(next);
      },
      destroy() {
        node.remove();
      },
    };
  }

  function dismiss() {
    if (embedded) on_close?.();
    else if (context_menu_state.open) close_context_menu();
    else on_close?.();
  }

  function handle_select(item) {
    if (embedded) {
      item.onSelect?.();
      on_close?.();
    } else {
      close_context_menu();
      item.onSelect?.();
    }
  }

  $effect(() => {
    if (embedded || !is_visible) return;
    return on_dismiss_outside((event) => Boolean(menu_el && event.target instanceof Node && menu_el.contains(event.target)), dismiss);
  });
</script>

{#if is_visible}
  <div
    bind:this={menu_el}
    use:portal_and_clamp={{ enabled: !embedded, x: open_x, y: open_y }}
    data-active="true"
    class={[
      "glass-panel pointer-events-auto isolate flex flex-col overflow-hidden rounded-standard outline-none",
      embedded ? "relative h-full w-full" : "fixed max-w-72 min-w-48",
    ]}
    style:z-index={embedded ? undefined : "var(--z-index-tooltip)"}
    style:--signature-color={signature_color}
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && dismiss()}>
    {#if embedded && resolved_portrait_src}
      <img
        src={resolved_portrait_src}
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1.1] scale-y-110 object-cover opacity-whisper blur-md brightness-muted" />
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--signature-color)_10%,var(--color-background-gradient-1))]/80">
      </div>
    {/if}
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-(image:--noise-url) opacity-ghost mix-blend-overlay"></div>

    {#if target_name}
      <h5 class="relative z-10 m-0 truncate border-b border-white/10 px-standard py-tight text-left text-(--signature-color)">
        {target_name}
      </h5>
    {/if}

    {#if resolved_actions.length === 0}
      <div
        class={[
          "relative z-10 flex type-data text-frisk/50 select-none",
          embedded ? "flex-1 items-center justify-center p-standard text-center" : "items-center px-standard py-3 text-left",
        ]}>
        No actions available
      </div>
    {:else}
      <div class="relative z-10 flex min-h-0 flex-1 scrollbar-none flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {#each resolved_actions as item, i (i)}
          {#if item.separator}
            <div class="block h-px shrink-0 bg-white/10"></div>
          {:else}
            <Button
              variant="bare"
              role="menuitem"
              disabled={item.disabled}
              onclick={() => handle_select(item)}
              class={[
                "flex min-h-9 w-full! shrink-0 cursor-pointer items-center justify-start gap-tight rounded-none px-standard py-2 text-left type-interact transition-[background-color,color,transform] duration-fast ease-out outline-none select-none active:scale-sink disabled:cursor-not-allowed disabled:opacity-30",
                item.active ?
                  "text-(--signature-color) hover:bg-[color-mix(in_srgb,var(--signature-color)_16%,transparent)] hover:text-pure-white"
                : "text-frisk/90 hover:bg-[color-mix(in_srgb,var(--signature-color)_16%,transparent)] hover:text-pure-white",
              ]}>
              {#if item.active}
                <span class="size-1.5 shrink-0 rounded-full bg-(--signature-color) shadow-(--signature-glow)"></span>
              {/if}
              <span class="truncate">{item.label}</span>
            </Button>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}
