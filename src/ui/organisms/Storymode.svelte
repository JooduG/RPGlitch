<script>
  /**
   * src/ui/organisms/Storymode.svelte
   * Displays the continuous message feed (AI, user, fractal roles).
   */
  import { app, simulation_log, simulation_state } from "@state";
  import StoryFeed from "./StoryFeed.svelte";

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
    if (active_turn_role === "ai") return app.selected_ai?.name;
    if (active_turn_role === "fractal") return app.selected_fractal?.name;
    return "";
  });

  let visible_feed = $derived.by(() => {
    const list = [...simulation_log.feed];
    if (is_active_turn && app.streaming.active) {
      const active_id = app.streaming.node_id ?? "temp";
      if (!list.some((entry) => entry.id === active_id)) {
        list.push({
          id: active_id,
          text: app.streaming.text ?? app.streaming.content ?? "",
          role: active_turn_role ?? "ai",
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

<StoryFeed {visible_feed} {card_actions} />
