<script>
  import { Audio } from "@media";
  import { CardSkeleton, StoryboardTitle } from "@molecules";
  import { CardHand, EntityCard, open_image_preview } from "@organisms";
  import { app, session } from "@state";
  import { get_signature_color, pick_random } from "@utils";
  import { untrack } from "svelte";

  // ============================================
  // TITLE HEADER STATE & CONSTANTS
  // ============================================
  let custom_title = $state("");
  let is_custom = $state(false);

  const PREFIXES = {
    STANDARD: ["The Story of", "The Adventures of", "The Tale of", "The Legend of", "The Saga of", "Chronicles of", "The Journey of"],
    FRACTAL: ["Adventures in", "Tales from", "The Fractal of", "Journey to"],
  };

  /** @param {any} entity */
  const get_color = (entity) => get_signature_color(entity);

  let prefix_roll = $state(roll_prefix());
  let last_roll_key = $state(app.card_hand.regenerate_count);

  function roll_prefix() {
    return untrack(() => {
      const has_entities = !!(app.selected_ai || app.selected_user);
      const has_fractal = !!app.selected_fractal;
      return pick_random(has_fractal && !has_entities ? PREFIXES.FRACTAL : PREFIXES.STANDARD);
    });
  }

  $effect(() => {
    const key = app.card_hand.regenerate_count;
    if (key === last_roll_key) return;
    last_roll_key = key;
    prefix_roll = roll_prefix();
  });

  let title_parts = $derived.by(() => {
    if (is_custom && custom_title) return [{ text: custom_title }];

    const { selected_ai: ai, selected_user: user, selected_fractal: fractal } = app;
    const has_entities = ai || user;
    const has_fractal = !!fractal;

    if (has_entities && has_fractal) {
      const prefix = prefix_roll || pick_random(PREFIXES.STANDARD);
      /** @type {Array<{text: string, color?: string, no_gap?: boolean}>} */
      const parts = [{ text: `${prefix} ` }];

      if (ai && user && ai.id === user.id) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (ai && user) {
        parts.push({ text: ai.name, color: get_color(ai) });
        parts.push({ text: " & " });
        parts.push({ text: user.name, color: get_color(user) });
      } else if (ai) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (user) {
        parts.push({ text: user.name, color: get_color(user) });
      }

      parts.push({ text: " in " });
      parts.push({ text: fractal.name, color: get_color(fractal) });

      return parts;
    }

    if (has_entities) {
      const prefix = prefix_roll || pick_random(PREFIXES.STANDARD);
      /** @type {Array<{text: string, color?: string, no_gap?: boolean}>} */
      const parts = [{ text: `${prefix} ` }];

      if (ai && user && ai.id === user.id) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else if (ai && user) {
        parts.push({ text: ai.name, color: get_color(ai) });
        parts.push({ text: " & " });
        parts.push({ text: user.name, color: get_color(user) });
      } else if (ai) {
        parts.push({ text: ai.name, color: get_color(ai) });
      } else {
        parts.push({ text: user.name, color: get_color(user) });
      }
      return parts;
    }

    if (has_fractal) {
      const prefix = prefix_roll || pick_random(PREFIXES.FRACTAL);
      const parts = [{ text: `${prefix} ` }, { text: fractal.name, color: get_color(fractal) }];
      return parts;
    }

    return [{ text: "Your story begins here..." }];
  });

  $effect(() => {
    app.story_title = title_parts
      .map((p) => p.text)
      .join("")
      .trim();
    app.story_title_parts = is_custom ? [{ text: custom_title }] : title_parts.map((p) => ({ ...p }));
  });

  /** @param {string} new_text */
  function handle_input(new_text) {
    custom_title = new_text;
    is_custom = true;
  }

  function handle_reset() {
    is_custom = false;
    custom_title = "";
    app.regenerate_title();
  }

  // ============================================
  // STAGE LAYOUT GRID CLASSES (STORYBOARD MODE)
  // ============================================
  let header_class = $derived(
    app.viewport.mobile ?
      "relative inset-auto col-start-1 col-end-13 row-start-1 row-end-3 self-end items-center justify-center"
    : "col-start-2 col-end-12 row-start-1 row-end-4 self-end pb-[calc(var(--spacing-row-unit)*0.5)]",
  );

  let left_class = $derived(
    app.viewport.mobile ?
      "relative inset-auto col-start-1 col-end-7 row-start-6 row-end-12 h-full items-center justify-center"
    : "col-start-2 col-end-4 row-start-3 row-end-11 h-full items-center",
  );

  let center_class = $derived(
    app.viewport.mobile ?
      "relative inset-auto col-start-1 col-end-13 row-start-3 row-end-6 h-full items-center justify-center"
    : "col-start-4 col-end-10 row-start-3 row-end-11 h-full items-center",
  );

  let right_class = $derived(
    app.viewport.mobile ?
      "relative inset-auto col-start-7 col-end-13 row-start-6 row-end-12 h-full items-center justify-center"
    : "col-start-10 col-end-12 row-start-3 row-end-11 h-full items-center",
  );

  // ============================================
  // ENTITY SLOT CONTEXT ACTIONS
  // ============================================
  /**
   * Factory: builds the context-menu action list for an entity slot in Storyboard.
   * @param {"ai" | "user" | "fractal"} type
   * @returns {any[]}
   */
  function build_actions(type) {
    const entity_map = {
      ai: app.selected_ai || session.active_ai,
      user: app.selected_user || session.active_user,
      fractal: app.selected_fractal || session.active_fractal,
    };
    const entity = entity_map[type];

    const items = [{ label: "Profile", onSelect: () => app.toggle_profile(true, entity, type), disabled: !entity }];

    if (entity?.profile_picture) {
      items.push({
        label: "Profile Picture",
        onSelect: () =>
          open_image_preview({
            src: entity.profile_picture,
            metadata:
              entity.modifiers ?
                { prompt: entity.modifiers.prompt, negative_prompt: entity.modifiers.negative_prompt, seed: entity.modifiers.last_generated_seed }
              : null,
          }),
      });
    }

    if (type === "ai" || type === "fractal") {
      const voice_role = type === "fractal" ? "fractal" : "ai";
      const voice_noun = type === "fractal" ? "Fractal Voice" : "AI Voice";
      const voice_label = Audio.is_role_enabled(voice_role) ? `Disable ${voice_noun}` : `Enable ${voice_noun}`;
      items.push({ label: voice_label, active: Audio.is_role_enabled(voice_role), onSelect: () => Audio.toggle_entity_voice(voice_role) });
    }

    items.push({ separator: true });
    items.push({ label: "Swap", onSelect: () => app.open_card_hand(type) });

    return items;
  }

  let ai_actions = $derived(build_actions("ai"));
  let user_actions = $derived(build_actions("user"));
  let fractal_actions = $derived(build_actions("fractal"));
</script>

<!-- STORYBOARD TITLE HEADER -->
{#if app.entities_loaded}
  <!-- display:flex inline: unlayered normalize.css v3 resets semantic elements to block, defeating Tailwind's layered flex utility -->
  <header style="display: flex;" class="pointer-events-none z-sticky flex justify-center {header_class}">
    <div class="flex w-full justify-center">
      <StoryboardTitle editable={true} {is_custom} {custom_title} parts={title_parts} oninput={handle_input} onreset={handle_reset} />
    </div>
  </header>
{/if}

<!-- LEFT SLOT: AI CHARACTER -->
<aside style="display: flex;" class="relative z-10 flex min-h-0 flex-col justify-center {left_class}">
  {#if !app.entities_loaded}
    <CardSkeleton />
  {:else}
    {@const entity = app.selected_ai || session.active_ai}
    <div class="flex h-full w-full items-center justify-center" data-slot-type="ai">
      <EntityCard
        variant={entity ? "panel" : "slot"}
        type="ai"
        {entity}
        role_label="AI Character"
        actions={ai_actions}
        on_select={() => {
          if (entity) {
            app.toggle_profile(true, entity, "ai");
          } else {
            app.open_card_hand("ai");
          }
        }} />
    </div>
  {/if}
</aside>

<!-- CENTER SLOT: FRACTAL -->
<section style="display: flex;" class="pointer-events-none relative z-10 flex min-h-0 flex-col justify-center {center_class}">
  {#if !app.entities_loaded}
    <CardSkeleton />
  {:else}
    {@const entity = app.selected_fractal || session.active_fractal}
    <div class="flex h-full w-full items-center justify-center" data-slot-type="fractal">
      <EntityCard
        variant={entity ? "panel" : "slot"}
        type="fractal"
        {entity}
        role_label="Fractal"
        actions={fractal_actions}
        on_select={() => {
          if (entity) {
            app.toggle_profile(true, entity, "fractal");
          } else {
            app.open_card_hand("fractal");
          }
        }} />
    </div>
  {/if}
</section>

<!-- RIGHT SLOT: USER PERSONA -->
<aside style="display: flex;" class="relative z-10 flex min-h-0 flex-col justify-center {right_class}">
  {#if !app.entities_loaded}
    <CardSkeleton />
  {:else}
    {@const entity = app.selected_user || session.active_user}
    <div class="flex h-full w-full items-center justify-center" data-slot-type="user" data-panel-card="user">
      <EntityCard
        variant={entity ? "panel" : "slot"}
        type="user"
        {entity}
        role_label="User Persona"
        actions={user_actions}
        on_select={() => {
          if (entity) {
            app.toggle_profile(true, entity, "user");
          } else {
            app.open_card_hand("user");
          }
        }} />
    </div>
  {/if}
</aside>

<!-- CARD HAND OVERLAY -->
{#if app.entities_loaded}
  <CardHand is_open={app.card_hand.open} card_hand_type={app.card_hand.type} />
{/if}

<style>
  /* Ensure Satisfy loads even if index.html is bypassed */
  @import "https://fonts.googleapis.com/css2?family=Satisfy&display=swap";
</style>
