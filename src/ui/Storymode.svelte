<script>
  /**
   * src/ui/Storymode.svelte
   * Displays the continuous message feed (AI, user, fractal roles).
   */
  import { app, simulation_log, simulation_state, runtime } from "@state";
  import { get_signature_color } from "@media";
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
    if (!app.settings.dev_mode) {
      list = list.filter((entry) => entry.role !== "system");
    }
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

  // Stage Spotlight roster — in-scene NPCs displayed as clickable chips (opens
  // the NPC's read-only profile).
  let in_scene_npcs = $derived((runtime.in_scene_npc_ids || []).map((id) => runtime.active_npcs?.[id]).filter(Boolean));
</script>

<!-- Stage Spotlight roster bar: who is in the room right now. -->
{#if in_scene_npcs.length > 0}
  <div class="flex w-full flex-wrap items-center justify-center gap-2 px-4 pt-2">
    <span class="text-[10px] font-semibold tracking-widest uppercase opacity-60">In Scene</span>
    {#each in_scene_npcs as npc (npc.id)}
      <button
        class="rounded-full border border-(--signature-color)/40 bg-(--signature-color)/10 px-3 py-1 text-xs font-medium text-(--signature-color) transition-all hover:brightness-125 focus:outline-none"
        style:--signature-color={get_signature_color(npc)}
        onclick={() => app.open_profile(npc)}
        type="button"
      >
        {npc.name}
      </button>
    {/each}
  </div>
{/if}

<Feed {visible_feed} {card_actions} />
