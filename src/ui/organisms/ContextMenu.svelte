<script module>
  /**
   * @file src/ui/organisms/ContextMenu.svelte
   * Single sovereign Entity Context Menu organism supporting floating portal mode
   * and embedded 3D card-back preview mode.
   */
  import { set_tooltip_suppressed } from "@atoms";
  import { capture_story_image, run_mock } from "@engine";
  import { Audio } from "@media";
  import { app, execution } from "@state";
  import { open_image_preview } from "./ImagePreview.svelte.js";

  /**
   * @typedef {Object} ContextMenuState
   * @property {boolean} open
   * @property {any | null} entity
   * @property {string} type
   * @property {"storyboard" | "storymode" | "npc" | "preview" | "default"} surface
   * @property {number} x
   * @property {number} y
   * @property {(() => void) | null} on_close
   */

  export const context_menu_state = $state({ open: false, entity: null, type: "ai", surface: "default", x: 0, y: 0, on_close: null });

  /**
   * Opens the floating entity context menu at (x, y).
   * @param {{ entity: any, type?: string, surface?: string, x: number, y: number, on_close?: () => void }} options
   */
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

  /**
   * Closes the floating context menu and restores tooltip hovering.
   */
  export function close_context_menu() {
    if (!context_menu_state.open) return;
    const cb = context_menu_state.on_close;
    context_menu_state.open = false;
    context_menu_state.entity = null;
    context_menu_state.on_close = null;
    set_tooltip_suppressed(false);
    cb?.();
  }

  /**
   * Builds surface-appropriate actions for an entity.
   * @param {any} entity
   * @param {string} surface
   * @param {Object} [deps={}]
   * @returns {Array<{ label: string, onSelect: () => void, disabled?: boolean, separator?: boolean, danger?: boolean, active?: boolean }>}
   */
  export function build_entity_actions(entity, surface, deps = {}) {
    if (!entity) return [];
    const items = [];
    const type = deps.type || context_menu_state.type || (entity.type === "fractal" ? "fractal" : "ai");
    const on_open_profile = deps.on_open_profile || ((ent) => app.toggle_profile(true, ent, type));
    const on_open_image = deps.on_open_image || ((payload) => open_image_preview(payload));

    const portrait_meta =
      entity.modifiers ?
        { prompt: entity.modifiers.prompt, negative_prompt: entity.modifiers.negative_prompt, seed: entity.modifiers.last_generated_seed }
      : null;

    if (surface === "preview") {
      items.push({ label: "Profile", onSelect: () => app.open_profile(entity) });
      if (entity.profile_picture) {
        items.push({ label: "Profile Picture", onSelect: () => on_open_image({ src: entity.profile_picture, metadata: portrait_meta }) });
      }
      return items;
    }

    if (surface === "storyboard") {
      items.push({ label: "Profile", onSelect: () => on_open_profile(entity), disabled: !entity });
      if (entity.profile_picture) {
        items.push({ label: "Profile Picture", onSelect: () => on_open_image({ src: entity.profile_picture, metadata: portrait_meta }) });
      }
      if (type === "ai" || type === "fractal") {
        const voice_role = type === "fractal" ? "fractal" : "ai";
        const voice_noun = type === "fractal" ? "Fractal Voice" : "AI Voice";
        items.push({
          label: Audio.is_role_enabled(voice_role) ? `Disable ${voice_noun}` : `Enable ${voice_noun}`,
          active: Audio.is_role_enabled(voice_role),
          onSelect: () => Audio.toggle_entity_voice(voice_role),
        });
      }
      items.push({ separator: true });
      items.push({ label: "Swap", onSelect: () => app.open_card_hand(type) });
      return items;
    }

    if (surface === "storymode" || surface === "npc") {
      items.push({ label: "Profile", onSelect: () => on_open_profile(entity), disabled: !entity });
      if (entity.profile_picture) {
        items.push({ label: "Profile Picture", onSelect: () => on_open_image({ src: entity.profile_picture, metadata: portrait_meta }) });
      }

      if (type === "ai" || type === "fractal" || surface === "npc") {
        const voice_role = type === "fractal" ? "fractal" : "ai";
        const voice_noun = type === "fractal" ? "Fractal Voice" : "AI Voice";
        items.push({
          label: Audio.is_role_enabled(voice_role) ? `Disable ${voice_noun}` : `Enable ${voice_noun}`,
          active: Audio.is_role_enabled(voice_role),
          onSelect: () => Audio.toggle_entity_voice(voice_role),
        });
      }

      items.push({ separator: true });
      if (surface === "npc") {
        items.push({
          label: "Generate NPC Picture",
          // Fire-and-forget: capture logs + marks the placeholder failed internally; swallow here so a late failure can't surface as an unhandled rejection.
          onSelect: () => void capture_story_image({ subject: "npc", kind: "story_character", target_entity: entity }).catch(() => {}),
          disabled: execution.busy,
        });
        return items;
      }

      const photo_label =
        type === "ai" ? "Generate AI Character Image"
        : type === "user" ? "Generate User Persona Image"
        : "Generate Fractal Image";
      items.push({
        label: photo_label,
        // Fire-and-forget: capture logs + marks the placeholder failed internally; swallow here so a late failure can't surface as an unhandled rejection.
        onSelect: () => void capture_story_image({ subject: type, kind: type === "fractal" ? "story_scene" : "story_character" }).catch(() => {}),
        disabled: execution.busy,
      });

      if (type === "fractal") {
        items.push({
          label: "Generate Story Image",
          onSelect: () =>
            // Fire-and-forget (see above): swallow late failures; placeholder already marked failed.
            void capture_story_image({
              subject: "fractal",
              prompt: "A scene featuring both the AI character and the user persona together",
              kind: "story_entities",
            }).catch(() => {}),
          disabled: execution.busy,
        });
      }

      if (type === "user") {
        items.push({
          label: app.settings.call_mode ? "Disable Microphone" : "Enable Microphone",
          active: app.settings.call_mode,
          onSelect: () => {
            app.settings.call_mode = !app.settings.call_mode;
            app.save_settings();
          },
        });
        items.push({ separator: true });
        items.push({ label: "Ghostwrite", onSelect: () => app.request_ghostwrite(), disabled: execution.busy });
      }

      if (app.settings.dev_mode) {
        items.push({ separator: true }, { label: "Mock Message", onSelect: () => run_mock(type), disabled: execution.busy });
      }

      return items;
    }

    items.push({ label: "Inspect Profile", onSelect: () => app.open_profile(entity) });
    if (entity.profile_picture) {
      items.push({ label: "View Portrait", onSelect: () => on_open_image({ src: entity.profile_picture, metadata: entity.modifiers || null }) });
    }
    return items;
  }
</script>

<script>
  import { Button } from "@atoms";
  import { get_signature_color, on_dismiss_outside } from "@utils";

  let {
    embedded = false,
    open = false,
    x = 0,
    y = 0,
    entity = null,
    surface = "default",
    target_name: explicit_name = "",
    portrait_src = "",
    actions: explicit_actions = null,
    on_close = undefined,
  } = $props();

  const is_visible = $derived(embedded ? open : open || context_menu_state.open);
  const open_x = $derived(embedded ? x : context_menu_state.x);
  const open_y = $derived(embedded ? y : context_menu_state.y);
  const active_entity = $derived(embedded ? entity : context_menu_state.entity);
  const active_surface = $derived(embedded ? surface : context_menu_state.surface);
  const target_name = $derived(explicit_name || active_entity?.name || "");
  const signature_color = $derived(get_signature_color(active_entity, "var(--color-frisk)"));
  const resolved_portrait_src = $derived(portrait_src || active_entity?.profile_picture || "");

  const resolved_actions = $derived(explicit_actions || build_entity_actions(active_entity, active_surface));

  let menu_el = $state(null);

  function portal_and_clamp(node, coords) {
    document.body.appendChild(node);

    const apply_position = ({ x: raw_x, y: raw_y }) => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
      const vh = typeof window !== "undefined" ? window.innerHeight : 768;
      const w = node.offsetWidth || 180;
      const h = node.offsetHeight || 160;
      const clamped_x = Math.max(0, Math.min(raw_x > vw / 2 ? raw_x - w : raw_x, vw - w));
      const clamped_y = Math.max(0, Math.min(raw_y > vh / 2 ? raw_y - h : raw_y, vh - h));
      node.style.left = `${clamped_x}px`;
      node.style.top = `${clamped_y}px`;
    };

    apply_position(coords);

    return {
      update(next_coords) {
        apply_position(next_coords);
      },
      destroy() {
        node.remove();
      },
    };
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
    const teardown = on_dismiss_outside(
      (event) => {
        const target = /** @type {HTMLElement | null} */ (event.target);
        return Boolean(menu_el && target && menu_el.contains(target));
      },
      () => {
        if (context_menu_state.open) {
          close_context_menu();
        } else {
          on_close?.();
        }
      },
    );
    return teardown;
  });
</script>

{#snippet menu_shell_layers()}
  {#if embedded && resolved_portrait_src}
    <div class="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <img src={resolved_portrait_src} alt="" class="h-full w-full scale-110 -scale-x-100 object-cover opacity-whisper blur-md brightness-muted" />
      <div class="absolute inset-0 bg-[color-mix(in_srgb,var(--signature-color)_10%,var(--color-background-gradient-1))]/80"></div>
    </div>
  {/if}
  <div class="pointer-events-none absolute inset-0 bg-(image:--noise-url) opacity-ghost mix-blend-overlay" aria-hidden="true"></div>
{/snippet}

{#snippet menu_content()}
  {@render menu_shell_layers()}
  {#if target_name}
    <header class="relative z-10 border-b border-white/10 px-standard py-tight text-left">
      <h5 class="truncate pb-0.5 text-(--signature-color)">
        {target_name}
      </h5>
    </header>
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
            class={[
              "flex min-h-9 w-full! shrink-0 cursor-pointer items-center justify-start gap-tight rounded-none px-standard py-2 text-left type-interact transition-[background-color,color,transform] duration-fast ease-out outline-none select-none active:scale-sink disabled:cursor-not-allowed disabled:opacity-30",
              item.danger ? "text-crimson-red/90 hover:bg-crimson-red/15 hover:text-crimson-red"
              : item.active ? "text-(--signature-color) hover:bg-[color-mix(in_srgb,var(--signature-color)_16%,transparent)] hover:text-pure-white"
              : "text-frisk/90 hover:bg-[color-mix(in_srgb,var(--signature-color)_16%,transparent)] hover:text-pure-white",
            ]}
            disabled={item.disabled}
            onclick={() => handle_select(item)}
            role="menuitem">
            {#if item.active}
              <span class="size-1.5 shrink-0 rounded-full bg-(--signature-color) shadow-(--signature-glow)"></span>
            {/if}
            <span class="truncate">{item.label}</span>
          </Button>
        {/if}
      {/each}
    </div>
  {/if}
{/snippet}

{#if embedded}
  {#if is_visible}
    <div
      bind:this={menu_el}
      class="pointer-events-auto relative isolate flex h-full w-full flex-col overflow-hidden rounded-standard bg-[color-mix(in_srgb,var(--signature-color)_7%,var(--color-glass-sunken))] shadow-standard [backdrop-filter:var(--blur-mist)] outline-none before:pointer-events-none before:absolute before:inset-0 before:z-20 before:rounded-[inherit] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--signature-color)_65%,transparent),rgb(from_var(--color-frisk)_r_g_b/0.12)_35%,transparent_85%)] before:mask-border-solid before:p-px before:content-['']"
      style:--signature-color={signature_color}
      role="menu"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.key === "Escape" && on_close?.()}>
      {@render menu_content()}
    </div>
  {/if}
{:else if is_visible}
  <div
    bind:this={menu_el}
    use:portal_and_clamp={{ x: open_x, y: open_y }}
    class="pointer-events-auto fixed isolate flex max-w-72 min-w-48 flex-col overflow-hidden rounded-standard bg-[color-mix(in_srgb,var(--signature-color)_7%,var(--color-glass-sunken))] shadow-standard [backdrop-filter:var(--blur-mist)] outline-none before:pointer-events-none before:absolute before:inset-0 before:z-20 before:rounded-[inherit] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--signature-color)_65%,transparent),rgb(from_var(--color-frisk)_r_g_b/0.12)_35%,transparent_85%)] before:mask-border-solid before:p-px before:content-['']"
    style:z-index="var(--z-index-tooltip)"
    style:--signature-color={signature_color}
    role="menu"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === "Escape" && (context_menu_state.open ? close_context_menu() : on_close?.())}>
    {@render menu_content()}
  </div>
{/if}
