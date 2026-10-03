<!--
  @file src/ui/profile/TimelineModal.svelte
  ⏳ PROFILE TIMELINE MODE — Full entity Four-Quadrant historical scrubbing & branching.
  Allows stepping through historical rounds, inspecting state reconstructions,
  and performing "Update from this point" (in-place revert) or "Clone from this point" (timeline branch).
-->
<script>
  import { Modal, Button, tooltip } from "@primitives";
  import { query_entity_history, replay_full_entity_at_round, entities, normalize } from "@data";
  import { runtime, app } from "@state";
  import { format_datetime, generate_uuid } from "@utils";
  import { SvelteSet } from "svelte/reactivity";

  /**
   * @typedef {Object} Props
   * @property {boolean} [open=false]
   * @property {any} entity
   * @property {"character" | "fractal"} [entity_type="character"]
   * @property {() => void} [on_reverted=() => {}]
   */

  /** @type {Props} */
  let { open = $bindable(false), entity, entity_type = "character", on_reverted = () => {} } = $props();

  let is_loading = $state(false);
  let is_performing_action = $state(false);
  /** @type {Array<number>} */
  let available_rounds = $state([]);
  let selected_round = $state(0);
  /** @type {any} */
  let reconstructed_state = $state(null);
  /** @type {Array<any>} */
  let round_events = $state([]);

  $effect(() => {
    if (open && entity?.id) {
      load_timeline();
    }
  });

  async function load_timeline() {
    is_loading = true;
    try {
      const history = await query_entity_history(entity.id);
      const rounds_set = new SvelteSet();
      // Round 0 baseline always exists if any records exist or by default
      rounds_set.add(0);
      for (const entry of history) {
        if (typeof entry.round === "number") {
          rounds_set.add(entry.round);
        }
      }
      available_rounds = Array.from(rounds_set).sort((a, b) => a - b);
      // Default selected round to the highest available round
      selected_round = available_rounds[available_rounds.length - 1] ?? 0;
      await fetch_round_state(selected_round, history);
    } catch (err) {
      console.error("[TimelineModal] Failed to load entity timeline:", err);
      available_rounds = [0];
      selected_round = 0;
    } finally {
      is_loading = false;
    }
  }

  /**
   * Fetches the reconstructed profile state up to the target round.
   * @param {number} round
   * @param {Array<any>} [provided_history]
   */
  async function fetch_round_state(round, provided_history = null) {
    try {
      const history = provided_history || (await query_entity_history(entity.id));
      round_events = history.filter((e) => e.round === round);
      reconstructed_state = await replay_full_entity_at_round(entity.id, round);
    } catch (err) {
      console.error("[TimelineModal] Failed to replay entity at round:", err);
    }
  }

  async function handle_select_round(round) {
    if (round === selected_round) return;
    selected_round = round;
    await fetch_round_state(round);
  }

  /**
   * Reverts the active entity's Four-Quadrant state in-place to this historical snapshot.
   */
  async function handle_update_from_point() {
    if (!reconstructed_state || !entity?.id || is_performing_action) return;
    is_performing_action = true;
    try {
      const updated_entity = {
        ...entity,
        eternal: {
          ...entity.eternal,
          ...reconstructed_state.eternal,
        },
        present: {
          ...entity.present,
          ...reconstructed_state.present,
        },
        past: reconstructed_state.past,
        future: reconstructed_state.future,
      };

      await entities.upsert(entity_type, updated_entity);
      await app.load_entities();

      // If active in runtime, sync back
      if (runtime.active_ai?.id === entity.id) runtime.active_ai = updated_entity;
      if (runtime.active_user?.id === entity.id) runtime.active_user = updated_entity;
      if (runtime.active_fractal?.id === entity.id) runtime.active_fractal = updated_entity;

      on_reverted();
      open = false;
    } catch (err) {
      console.error("[TimelineModal] Failed to revert entity state:", err);
    } finally {
      is_performing_action = false;
    }
  }

  /**
   * Clones a new timeline branch into the census from this historical snapshot.
   */
  async function handle_clone_from_point() {
    if (!reconstructed_state || !entity || is_performing_action) return;
    is_performing_action = true;
    try {
      const branch_id = generate_uuid();
      const branch_name = `${entity.name || "Entity"} (R${selected_round} Branch)`;
      const new_entity = normalize({
        ...entity,
        id: branch_id,
        name: branch_name,
        eternal: {
          ...entity.eternal,
          ...reconstructed_state.eternal,
        },
        present: {
          ...entity.present,
          ...reconstructed_state.present,
        },
        past: reconstructed_state.past,
        future: reconstructed_state.future,
      });

      await entities.upsert(entity_type, new_entity);
      await app.load_entities();
      open = false;
    } catch (err) {
      console.error("[TimelineModal] Failed to clone entity branch:", err);
    } finally {
      is_performing_action = false;
    }
  }
</script>

<Modal
  bind:open
  variant="bare"
  z_index="400"
  class="relative flex max-h-[88vh] w-[clamp(30rem,92vw,54rem)] flex-col rounded-2xl bg-glass-elevated p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] [backdrop-filter:var(--blur-mist)]"
  on_close={() => {
    open = false;
  }}
>
  <div class="flex h-full flex-col gap-4 overflow-hidden font-sans">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <div class="flex flex-col">
        <h4 class="m-0 text-sm font-bold tracking-wider text-cyan-400 uppercase">Profile Timeline Scrubber</h4>
        <span class="font-mono text-xs text-slate-400">
          {entity?.name || "Entity"} &bull; <span class="text-cyan-200">Timeline Branching & Historical Reversion</span>
        </span>
      </div>

      <Button variant="invisible" size="small" square={true} onclick={() => (open = false)} aria-label="Close">
        <svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </Button>
    </div>

    <!-- Scrubber Bar -->
    <div class="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs font-semibold text-slate-300"> SELECT TIMELINE POINT </span>
        <span class="rounded bg-cyan-950/70 px-2 py-0.5 font-mono text-xs font-bold text-cyan-400">
          Round {selected_round}
          {selected_round === 0 ? "(Genesis Baseline)" : ""}
        </span>
      </div>

      <!-- Round Selector Strip -->
      <div class="flex flex-wrap items-center gap-1.5 pt-1">
        {#each available_rounds as r (r)}
          <button
            type="button"
            class="cursor-pointer rounded-lg px-3 py-1 font-mono text-xs font-medium transition-all {selected_round === r
              ? 'bg-cyan-500 font-bold text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
              : 'border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/50 hover:bg-white/10'}"
            onclick={() => handle_select_round(r)}
          >
            R{r}
          </button>
        {/each}
      </div>
    </div>

    <!-- Snapshot Replay Body -->
    <div class="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
      {#if is_loading}
        <div class="flex h-48 animate-pulse items-center justify-center font-mono text-xs text-cyan-400">Reconstructing Four-Quadrant Matrix...</div>
      {:else if reconstructed_state}
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <!-- Present Quadrant -->
          <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/25 p-3">
            <span class="font-mono text-xs font-bold text-cyan-300">PRESENT QUADRANT</span>
            <div class="flex flex-col gap-1.5 font-mono text-xs">
              <span class="text-[10px] text-slate-400 uppercase">Physical:</span>
              <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 text-slate-300">
                {reconstructed_state.present.physical || "<empty>"}
              </div>
              <span class="text-[10px] text-slate-400 uppercase">Non-Physical:</span>
              <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 text-slate-300">
                {reconstructed_state.present.non_physical || "<empty>"}
              </div>
            </div>
          </div>

          <!-- Past & Future Quadrants -->
          <div class="flex flex-col gap-3">
            <!-- Past Quadrant -->
            <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/25 p-3">
              <span class="font-mono text-xs font-bold text-cyan-300">PAST (MEMORIES)</span>
              <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 font-mono text-xs text-slate-300">
                {reconstructed_state.past || "<empty>"}
              </div>
            </div>

            <!-- Future / Standing Trajectory -->
            <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/25 p-3">
              <span class="font-mono text-xs font-bold text-cyan-300">FUTURE (STANDING AGENDA)</span>
              <div class="max-h-24 overflow-y-auto rounded bg-black/40 p-2 font-mono text-xs text-slate-300">
                {reconstructed_state.future || "<empty>"}
              </div>
            </div>
          </div>
        </div>

        <!-- Recorded mutations in this specific round -->
        {#if round_events.length > 0}
          <div class="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-black/20 p-3">
            <span class="font-mono text-[11px] font-semibold text-slate-400">
              Round {selected_round} Mutations ({round_events.length})
            </span>
            <div class="flex max-h-32 flex-col gap-1 overflow-y-auto font-mono text-[11px] text-slate-300">
              {#each round_events as ev (ev.id || `${ev.field}-${ev.round}-${ev.seq || 0}-${ev.timestamp}`)}
                <div class="flex items-center justify-between gap-2 border-b border-white/5 py-0.5">
                  <div class="flex items-center gap-2 truncate">
                    <span class="text-cyan-400">[{ev.field}]</span>
                    {#if ev.key}
                      <span class="text-slate-200">[{ev.key}] &rarr; {ev.new_value ?? "cleared"}</span>
                    {:else}
                      <span class="truncate text-slate-400">{ev.new_value}</span>
                    {/if}
                  </div>
                  <span class="shrink-0 text-[10px] text-slate-500">{format_datetime(ev.timestamp)}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Actions Footer -->
    <div class="flex items-center justify-between border-t border-white/10 pt-3">
      <div class="font-mono text-[11px] text-slate-500">Reverting alters current profile. Cloning branches a separate entity into census.</div>

      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="medium"
          disabled={is_performing_action || is_loading}
          onclick={handle_clone_from_point}
          aria-label="Clone from this point into a new entity"
          actions={[tooltip]}
        >
          {is_performing_action ? "Cloning..." : "Clone from this point"}
        </Button>

        <Button
          variant="primary"
          size="medium"
          disabled={is_performing_action || is_loading}
          onclick={handle_update_from_point}
          aria-label="Revert entity in-place to this historical round"
          actions={[tooltip]}
        >
          {is_performing_action ? "Reverting..." : "Update from this point"}
        </Button>
      </div>
    </div>
  </div>
</Modal>

<!-- CHANGELOG
  - 2026-10-03: Created TimelineModal.svelte for full entity Four-Quadrant historical scrubbing, reversion, and timeline branching.
-->
