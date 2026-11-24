<script>
  /**
   * @file src/ui/organisms/CardHand.svelte
   * Selection fan overlay and entity import modal for the Storyboard stage.
   */
  import { Backdrop, Button, Icon, Toggle, tooltip } from "@atoms";
  import { create_entity as create_new, entities, extract_card_from_png } from "@data";
  import { import_entities } from "@engine";
  import { fly_card_in, fly_card_out, motion, rect_of } from "@media";
  import { Modal, SourceField } from "@molecules";
  import { app, execution } from "@state";
  import { tick } from "svelte";
  import { quartOut } from "svelte/easing";
  import EntityCard from "./EntityCard.svelte";

  const TITLES = { ai: "Select AI Character", user: "Select User Persona", fractal: "Select Fractal" };

  /**
   * @typedef {Object} Props
   * @property {boolean} [is_open=false]
   * @property {"ai" | "user" | "fractal" | null} [card_hand_type=null]
   * @property {number | null} [hovered_index=null]
   */

  /** @type {Props} */
  let { is_open = false, card_hand_type = null, hovered_index = $bindable(null) } = $props();

  let show_import_modal = $state(false);
  let flight_active = $state(false);
  let cursor_x = $state(0);
  let scroll_angle = $state(0);

  // Import modal state
  let import_raw_text = $state("");
  let import_image_data = $state(null);
  let import_character = $state(true);
  let import_fractal = $state(false);
  let import_loading = $state(false);
  let import_error_message = $state("");

  const import_fetch_type = $derived(import_fractal && !import_character ? "fractal" : "character");
  const hand_title = $derived((card_hand_type && TITLES[card_hand_type]) || "Select Entity");
  const entity_list = $derived(
    card_hand_type === "ai" || card_hand_type === "user" ? app.characters
    : card_hand_type === "fractal" ? app.fractal_list
    : [],
  );

  const total_cards = $derived(entity_list.length);
  const card_step = $derived(Math.max(1.8, Math.min(3.2, 45 / Math.max(1, total_cards))));
  const max_fan_tilt = $derived(motion.is_reduced ? 0 : Math.min(35, Math.max(10, total_cards * 1.4)));
  const fan_rotation = $derived(motion.is_reduced ? 0 : -cursor_x * max_fan_tilt + scroll_angle);
  const first_card_angle = $derived(-((total_cards - 1) / 2) * card_step);
  const create_angle = $derived(first_card_angle - card_step);
  const import_angle = $derived(create_angle - card_step);

  $effect(() => {
    if (is_open) {
      cursor_x = 0;
      scroll_angle = 0;
    }
  });

  function card_hand_in() {
    if (motion.is_reduced) return { duration: 0 };
    return { duration: 280, easing: quartOut, css: (t, u) => `transform: translateY(${u * 100}%); opacity: ${t};` };
  }

  function card_hand_out() {
    if (motion.is_reduced || show_import_modal) return { duration: 0 };
    return { duration: 150, easing: quartOut, css: (t, u) => `transform: translateY(${u * 100}%); opacity: ${t};` };
  }

  function get_unavailable_reason(entity) {
    if (!entity || !card_hand_type) return null;
    if (entity.id != null && app.claimed_entity_ids.has(String(entity.id))) return "This entity is already in an active story";
    if (card_hand_type === "fractal") {
      return app.selected_fractal?.id === entity.id ? "This entity is already selected as Fractal" : null;
    }
    if (app.selected_ai?.id === entity.id) return "This entity is already selected as AI Character";
    if (app.selected_user?.id === entity.id) return "This entity is already selected as User Persona";
    return null;
  }

  function handle_import_source(info) {
    if (info.kind === "error") {
      import_error_message = info.message || "Failed to load source.";
      return;
    }
    import_error_message = "";
    if (info.kind === "url") console.info(`Fetched ${info.chars?.toLocaleString()} chars from ${info.url}`);
    else if (info.kind === "file") console.info(`Loaded ${info.name}${info.chars ? ` (${info.chars.toLocaleString()} chars)` : ""}`);
    else if (info.kind === "image") console.info(`Loaded avatar from ${info.name || info.url}`);
  }

  async function execute_entity_import() {
    if (!import_raw_text.trim()) {
      import_error_message = "Please provide raw text to import.";
      return;
    }
    if (!import_character && !import_fractal) {
      import_error_message = "Please select at least one target to import (Character or Fractal).";
      return;
    }

    import_loading = true;
    import_error_message = "";
    execution.set_intent_active(true);

    try {
      const created = await import_entities(import_raw_text, { import_character, import_fractal, image_data: import_image_data });
      if (import_character && created.character) app.select_entity(card_hand_type === "user" ? "user" : "ai", created.character);
      if (import_fractal && created.fractal) app.select_entity("fractal", created.fractal);

      import_raw_text = "";
      import_image_data = null;
      await tick();
      show_import_modal = false;
      app.close_card_hand();
    } catch (err) {
      console.error(err);
      import_error_message = err.message || "Failed to import entities.";
    } finally {
      import_loading = false;
      execution.set_intent_active(false);
    }
  }

  async function handle_create_new() {
    const type = card_hand_type === "fractal" ? "fractal" : "character";
    const plan = create_new(type, { name: `New ${type === "character" ? "Character" : "Fractal"}` });
    try {
      const saved = await entities.upsert(plan);
      await app.load_entities();
      app.select_entity(card_hand_type, saved);
      app.open_profile(saved, card_hand_type);
      app.close_card_hand();
    } catch (err) {
      console.error(`Factory initialization failed: ${err.message}`, err);
    }
  }

  function handle_open_import() {
    import_character = card_hand_type !== "fractal";
    import_fractal = card_hand_type === "fractal";
    import_error_message = "";
    queueMicrotask(() => (show_import_modal = true));
  }

  function handle_select(entity) {
    if (get_unavailable_reason(entity) !== null || flight_active) return;
    hovered_index = null;

    if (motion.is_reduced) {
      app.select_entity(card_hand_type, entity);
      app.close_card_hand();
      return;
    }

    const source = /** @type {HTMLElement | null} */ (document.querySelector(`[data-entity-id="${CSS.escape(String(entity.id))}"] [data-card-root]`));
    const target = /** @type {HTMLElement | null} */ (
      document.querySelector(`[data-slot-type="${card_hand_type}"] [data-card-root]`) || document.querySelector(`[data-slot-type="${card_hand_type}"]`)
    );
    if (!source || !target) {
      app.select_entity(card_hand_type, entity);
      app.close_card_hand();
      return;
    }
    fly_card_to_slot(entity, source, target);
  }

  function fly_card_to_slot(entity, source, target) {
    flight_active = true;
    app.close_card_hand();

    const existing =
      card_hand_type === "ai" ? app.selected_ai
      : card_hand_type === "user" ? app.selected_user
      : card_hand_type === "fractal" ? app.selected_fractal
      : null;

    const source_rect = rect_of(source);
    const target_rect = rect_of(target);
    source.style.transition = "none";
    source.style.opacity = "0";

    /** @type {HTMLElement | null} */
    let old_root = null;
    if (existing && String(existing.id) !== String(entity.id)) {
      old_root = target.matches("[data-card-root]") ? target : target.querySelector("[data-card-root]");
      if (old_root) {
        const out_rect = rect_of(old_root);
        fly_card_out(old_root, {
          left: Math.max(0, window.innerWidth / 2 - (out_rect.width * 0.7) / 2),
          top: Math.max(0, window.innerHeight - out_rect.height * 0.72),
          width: out_rect.width * 0.7,
          height: out_rect.height * 0.7,
        });
        old_root.style.transition = "none";
        old_root.style.opacity = "0";
      }
    }

    fly_card_in(source, source_rect, target_rect, {
      on_land: async () => {
        app.select_entity(card_hand_type, entity);
        await tick();
        if (old_root) {
          old_root.style.opacity = "";
          old_root.style.transition = "";
        }
        // The slot card transitions opacity/border/brightness from its empty state; snap it to final so the opaque clone hands off seamlessly.
        const slot_card = document.querySelector(`[data-slot-type="${card_hand_type}"] [data-card-root]`);
        if (slot_card) {
          const frozen = [slot_card, slot_card.firstElementChild].filter(Boolean);
          frozen.forEach((node) => (node.style.transition = "none"));
          void slot_card.offsetWidth;
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              frozen.forEach((node) => (node.style.transition = ""));
            }),
          );
        }
        if (!motion.is_reduced) {
          target.querySelectorAll("[data-card-text], [data-card-badge]").forEach((node) => {
            node.style.transition = "none";
            node.style.opacity = "0";
            requestAnimationFrame(() => {
              node.style.transition = "opacity 200ms var(--ease-out)";
              node.style.opacity = "";
              setTimeout(() => {
                node.style.transition = "";
              }, 220);
            });
          });
        }
      },
    }).finally(() => {
      flight_active = false;
    });
  }

  function handle_pointer_move(e) {
    if (!is_open || motion.is_reduced) return;
    cursor_x = Math.max(-1, Math.min(1, (e.clientX / (window.innerWidth || 1000)) * 2 - 1));
  }

  function handle_wheel(e) {
    if (!is_open || motion.is_reduced) return;
    const delta = e.deltaY || e.deltaX;
    if (delta) scroll_angle = Math.max(-45, Math.min(45, scroll_angle + (delta > 0 ? 3 : -3)));
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && is_open && app.close_card_hand()} onpointermove={handle_pointer_move} onwheel={handle_wheel} />

{#snippet FanSlot({ index, angle, z_index, entity = undefined, role_label = "", reason = null, lift = -0.6, scale = 1.08, dim_unhovered = false, onclick })}
  {@const is_hovered = hovered_index === index}
  {@const disabled = reason !== null}
  <div
    role="presentation"
    data-entity-id={entity?.id}
    class="pointer-events-auto absolute bottom-0 left-1/2 ml-[calc(-0.425*var(--spacing-column-unit))] h-[calc(var(--spacing-row-unit)*2.8)] w-[calc(var(--spacing-column-unit)*0.85)]"
    style:transform="rotate({angle + fan_rotation}deg) translateY(0)"
    style:transform-origin="center calc(100% + calc(var(--spacing-row-unit) * 25))"
    style:z-index={is_hovered ? total_cards + 10 : z_index}
    onmouseenter={() => (hovered_index = index)}
    onmouseleave={() => (hovered_index = null)}>
    <div
      use:tooltip={reason}
      class={[
        "relative z-10 h-full w-full rounded-md transition-[transform,filter,opacity] duration-300 ease-in-out will-change-transform",
        disabled && "opacity-85 grayscale-[0.6]",
        dim_unhovered && hovered_index !== null && !is_hovered && !disabled && "blur-[1px] brightness-[0.35] grayscale-[0.4]",
      ]}
      style:transform={is_hovered && !disabled ?
        `rotate(${-(angle + fan_rotation)}deg) translateY(calc(var(--spacing-row-unit) * ${lift})) scale(${scale})`
      : "none"}>
      <EntityCard variant="library" {entity} type={card_hand_type ?? undefined} {role_label} {disabled} launch_gesture={false} {onclick} />
    </div>
  </div>
{/snippet}

{#if is_open}
  <Backdrop onclick={() => app.close_card_hand()} layer="cardhand">
    <div
      in:card_hand_in
      out:card_hand_out
      class="pointer-events-none fixed right-0 bottom-0 left-0 isolate z-overlay flex h-dvh w-screen flex-col items-center justify-end overflow-hidden pb-[calc(var(--spacing-row-unit)*0.1)]"
      role="dialog"
      aria-labelledby="hand-title">
      <h2 id="hand-title" class="pointer-events-auto z-20 -mb-standard text-center text-slate-600 text-shadow-(--shadow-standard)">
        {hand_title}
      </h2>

      <div
        class="relative h-[calc(var(--spacing-row-unit)*3.5)] w-full max-w-(--grid-width-max) origin-bottom pb-[calc(var(--spacing-row-unit)*0.2)] transition-transform duration-standard">
        {@render FanSlot({ index: -2, angle: import_angle, z_index: 0, role_label: "Import", onclick: handle_open_import })}
        {@render FanSlot({ index: -1, angle: create_angle, z_index: 0, role_label: "Create New", onclick: handle_create_new })}

        {#each entity_list as entity, idx (entity.id)}
          {@render FanSlot({
            index: idx,
            angle: (idx - (total_cards - 1) / 2) * card_step,
            z_index: idx + 1,
            entity,
            reason: get_unavailable_reason(entity),
            lift: -0.85,
            scale: 1.18,
            dim_unhovered: true,
            onclick: () => handle_select(entity),
          })}
        {/each}
      </div>
    </div>
  </Backdrop>
{/if}

<Modal
  bind:open={show_import_modal}
  variant="bare"
  class="relative max-h-[92dvh] w-[clamp(26rem,92vw,44rem)] max-w-2xl overflow-y-auto rounded-standard shadow-standard"
  on_close={() => {
    show_import_modal = false;
    import_error_message = "";
  }}>
  <div class="flex flex-col gap-tight font-sans">
    {#if import_error_message}
      <div class="rounded-standard border border-red-500/20 bg-red-500/10 p-standard text-xs text-red-400">
        {import_error_message}
      </div>
    {/if}

    <SourceField
      bind:value={import_raw_text}
      bind:image_data={import_image_data}
      type={import_fetch_type}
      disabled={import_loading}
      decode_png_card={extract_card_from_png}
      on_source={handle_import_source}>
      {#snippet status()}
        <div class="flex items-center gap-standard">
          <span class="type-uppercase-label text-frisk">Source Payload</span>
          <div class="flex items-center gap-tight type-data text-slate-200" style="--signature-color: rgb(255 255 255 / 0.28);">
            <Toggle size="small" label="Character" bind:value={import_character} disabled={import_loading} />
            <Toggle size="small" label="Fractal" bind:value={import_fractal} disabled={import_loading} />
          </div>
        </div>
      {/snippet}
      {#snippet header_actions()}
        <Button
          variant="invisible"
          size="small"
          square
          aria-label="Import entity"
          actions={[tooltip]}
          onclick={execute_entity_import}
          busy={import_loading}
          disabled={import_loading || (!import_character && !import_fractal)}>
          <Icon name="download" class="size-icon-small" />
        </Button>
      {/snippet}
    </SourceField>
  </div>
</Modal>
