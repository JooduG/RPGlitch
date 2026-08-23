<script>
  /**
   * src/ui/Storymode.svelte
   * Displays the continuous message feed (AI, user, fractal roles).
   */
  import { app, simulation_log, simulation_state } from "@state";
  import { Feed } from "@message";

  // --- STATE ---
  let { card_actions } = $props();

  // --- DERIVATIONS ---
  // Turn state orchestration
  let is_active_turn = $derived(simulation_state.phase === "generating" || app.streaming.active);
  let active_turn_role = $derived.by(() => {
    if (app.streaming.active) return app.streaming.role;
    // During image generation, always fall back to "ai" so the busy
    // bubble renders left-aligned regardless of intermediate typing roles.
    if (simulation_state.phase === "generating") {
      if (
        simulation_state.role === "selfie" ||
        simulation_state.role === "character" ||
        simulation_state.role === "characters" ||
        simulation_state.role === "setting" ||
        simulation_state.role === "paparazzi" ||
        simulation_state.role === "story_entities" ||
        simulation_state.role === "story_character" ||
        simulation_state.role === "solo_entity" ||
        simulation_state.role === "story_scene"
      )
        return "ai";
      return simulation_state.role ?? "ai";
    }
    return simulation_state.role;
  });

  let active_turn_name = $derived.by(() => {
    // Director delegation identity (AI / Fractal / NPC) beats the static
    // selection whenever the Director hands the turn to a different entity.
    if (simulation_state.generating_entity_name) return simulation_state.generating_entity_name;
    if (active_turn_role === "ai") return app.selected_ai?.name;
    if (active_turn_role === "fractal") return app.selected_fractal?.name;
    return "";
  });

  let visible_feed = $derived.by(() => {
    let list = [...simulation_log.feed];
    // Director/system messages are purely internal background processes
    if (!app.settings.dev_mode) {
      list = list.filter((entry) => entry.role !== "system");
    }
    if (is_active_turn && app.streaming.active) {
      const active_id = app.streaming.node_id ?? "temp";
      // Never render a transient system/director card in the UI stream
      const stream_role = simulation_state.generating_entity_type ?? active_turn_role ?? "ai";
      if (stream_role !== "system" && !list.some((entry) => entry.id === active_id)) {
        list.push({
          id: active_id,
          text: app.streaming.content ?? "",
          // Director delegation identity: the busy bubble renders under the
          // delegated entity's role so Message.svelte resolves its signature
          // color (NPC → cast color, fractal → world color), not the AI's.
          role: stream_role,
          character_name: active_turn_name ?? "",
          created_at: Date.now(),
          busy: true,
          meta: { is_prologue: app.streaming.role === "fractal" },
        });
      }
    }
    return list;
  });
</script>

<Feed {visible_feed} {card_actions} />
