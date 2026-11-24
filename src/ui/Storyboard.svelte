<script>
  import { CardSkeleton, StoryboardTitle } from "@molecules";
  import { CardHand, EntityCard } from "@organisms";
  import { app, session } from "@state";
  import { get_signature_color, pick_random } from "@utils";

  const PREFIXES = {
    STANDARD: ["The Story of", "The Adventures of", "The Tale of", "The Legend of", "The Saga of", "Chronicles of", "The Journey of"],
    FRACTAL: ["Adventures in", "Tales from", "The Fractal of", "Journey to"],
  };

  /** @type {Array<{ type: "ai" | "fractal" | "user"; role_label: string; mobile_grid: string; desktop_grid: string; extra_class?: string; panel_card?: string }>} */
  const SLOTS = [
    {
      type: "ai",
      role_label: "AI Character",
      mobile_grid: "col-start-1 col-end-7 row-start-6 row-end-12",
      desktop_grid: "col-start-2 col-end-4 row-start-3 row-end-11",
    },
    {
      type: "fractal",
      role_label: "Fractal",
      mobile_grid: "col-start-1 col-end-13 row-start-3 row-end-6",
      desktop_grid: "col-start-4 col-end-10 row-start-3 row-end-11",
      extra_class: "pointer-events-none",
    },
    {
      type: "user",
      role_label: "User Persona",
      mobile_grid: "col-start-7 col-end-13 row-start-6 row-end-12",
      desktop_grid: "col-start-10 col-end-12 row-start-3 row-end-11",
      panel_card: "user",
    },
  ];

  let custom_title = $state("");
  let is_custom = $state(false);
  const is_mobile = $derived(app.viewport.mobile);

  const rolled_prefixes = $derived.by(() => {
    void app.card_hand.regenerate_count;
    return { standard: pick_random(PREFIXES.STANDARD), fractal: pick_random(PREFIXES.FRACTAL) };
  });

  const title_parts = $derived.by(() => {
    if (is_custom && custom_title) return [{ text: custom_title }];

    const { selected_ai: ai, selected_user: user, selected_fractal: fractal } = app;
    if (!ai && !user && !fractal) return [{ text: "Your story begins here..." }];

    if (!ai && !user) {
      return [{ text: `${rolled_prefixes.fractal} ` }, { text: fractal.name, color: get_signature_color(fractal) }];
    }

    /** @type {Array<{ text: string; color?: string }>} */
    const parts = [{ text: `${rolled_prefixes.standard} ` }];
    const lead = ai || user;
    parts.push({ text: lead.name, color: get_signature_color(lead) });

    if (ai && user && ai.id !== user.id) {
      parts.push({ text: " & " }, { text: user.name, color: get_signature_color(user) });
    }
    if (fractal) {
      parts.push({ text: " in " }, { text: fractal.name, color: get_signature_color(fractal) });
    }
    return parts;
  });

  $effect(() => {
    app.story_title = title_parts
      .map((p) => p.text)
      .join("")
      .trim();
    app.story_title_parts = title_parts.map((p) => ({ ...p }));
  });

  function get_slot_entity(type) {
    if (type === "ai") return app.selected_ai || session.active_ai;
    if (type === "fractal") return app.selected_fractal || session.active_fractal;
    return app.selected_user || session.active_user;
  }
</script>

{#if app.entities_loaded}
  <div
    role="banner"
    class={[
      "pointer-events-none z-sticky flex justify-center self-end",
      is_mobile ?
        "col-start-1 col-end-13 row-start-1 row-end-3 items-center"
      : "col-start-2 col-end-12 row-start-1 row-end-4 pb-[calc(var(--spacing-row-unit)*0.5)]",
    ]}>
    <StoryboardTitle
      editable={true}
      {is_custom}
      {custom_title}
      parts={title_parts}
      oninput={(text) => {
        custom_title = text;
        is_custom = true;
      }}
      onreset={() => {
        is_custom = false;
        custom_title = "";
        app.card_hand.regenerate_count++;
      }} />
  </div>
{/if}

{#each SLOTS as slot (slot.type)}
  {@const entity = get_slot_entity(slot.type)}
  <div
    data-slot-type={app.entities_loaded ? slot.type : undefined}
    data-panel-card={app.entities_loaded ? slot.panel_card : undefined}
    class={["relative z-10 flex h-full min-h-0 items-center justify-center", slot.extra_class, is_mobile ? slot.mobile_grid : slot.desktop_grid]}>
    {#if !app.entities_loaded}
      <CardSkeleton />
    {:else}
      <EntityCard
        variant={entity ? "panel" : "slot"}
        type={slot.type}
        {entity}
        role_label={slot.role_label}
        on_select={() => (entity ? app.toggle_profile(true, entity, slot.type) : app.open_card_hand(slot.type))} />
    {/if}
  </div>
{/each}

{#if app.entities_loaded}
  <CardHand is_open={app.card_hand.open} card_hand_type={app.card_hand.type} />
{/if}
