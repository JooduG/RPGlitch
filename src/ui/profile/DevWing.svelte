<script>
  /**
   * @file src/ui/profile/DevWing.svelte
   * DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch UI.
   */
  import { Accordion, Button, DataBox, Meter, tooltip } from "@primitives";
  import { DYNAMICS_AXES } from "@intelligence";
  import { format_datetime } from "@utils";
  import { runtime } from "@state";
  import FieldHistoryModal from "./FieldHistoryModal.svelte";

  /**
   * @typedef {Object} Props
   * @property {import('@profile/Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  let show_history_modal = $state(false);
  let inspector_field = $state("present.non_physical");
  let show_token_details = $state(false);

  /**
   * Dynamically computes which dynamics are available on the current character.
   */
  let active_dynamics = $derived.by(() => {
    const list = [];
    const entity = profile_state.char;
    if (entity?.dynamics) {
      for (const key of Object.keys(entity.dynamics)) {
        list.push({
          source: "dynamics",
          key: key,
          label: DYNAMICS_AXES[key]?.label || key.charAt(0).toUpperCase() + key.slice(1),
          desc: DYNAMICS_AXES[key]?.desc || "Metric",
        });
      }
    }
    return list;
  });

  const snapshot = $derived(runtime.last_prompt_token_snapshot);
  const total_tokens = $derived(snapshot?.total ?? 0);
  const cliff_limit = $derived(snapshot?.cliff_limit ?? 6000);
  const cliff_percent = $derived(Math.min(100, Math.round((total_tokens / cliff_limit) * 100)));
  const status_color = $derived(
    cliff_percent >= 90
      ? "text-rose-400 bg-rose-950/40 border-rose-500/30"
      : cliff_percent >= 75
        ? "text-amber-400 bg-amber-950/40 border-amber-500/30"
        : "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
  );
</script>

<section
  class="
    flex
    w-full
    flex-col
    gap-gap-standard
    rounded-standard
    bg-glass-elevated
    p-padding-standard
    [backdrop-filter:var(--blur-mist)]
  "
>
  <!-- PROMPT TOKEN CLIFF HUD BADGE -->
  <div class="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/40 p-2.5">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">Token Budget</span>
        <span
          class="rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold {status_color}"
          use:tooltip
          aria-label={`Current compile token load against ${cliff_limit.toLocaleString()} cliff threshold`}
        >
          ⚡ {total_tokens.toLocaleString()} / {cliff_limit.toLocaleString()} tok ({cliff_percent}%){snapshot?.mode
            ? ` [${snapshot.mode.toUpperCase()}]`
            : ""}
        </span>
      </div>
      <Button
        variant="invisible"
        size="small"
        onclick={() => (show_token_details = !show_token_details)}
        class="cursor-pointer font-mono text-[10px] text-cyan-400 hover:text-cyan-200"
      >
        {show_token_details ? "Hide Breakdown ▲" : "Breakdown ▼"}
      </Button>
    </div>

    <!-- Progress bar -->
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        class="h-full transition-[width] duration-300 {cliff_percent >= 90 ? 'bg-rose-500' : cliff_percent >= 75 ? 'bg-amber-400' : 'bg-emerald-400'}"
        style="width: {cliff_percent}%;"
      ></div>
    </div>

    {#if show_token_details && snapshot}
      <div class="mt-2 flex flex-col gap-1.5 border-t border-white/5 pt-2 text-[10px]">
        <div class="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-slate-300">
          <span class="text-slate-400">Mode:</span>
          <span class="text-right font-bold text-white uppercase">{snapshot.mode || "prose"}</span>
          <span class="text-slate-400">System Slot:</span>
          <span class="text-right text-cyan-300">{snapshot.layers?.system?.toLocaleString() ?? 0} tok</span>
          <span class="text-slate-400">Entities Slot:</span>
          <span class="text-right text-purple-300">{snapshot.layers?.entities?.toLocaleString() ?? 0} tok</span>
          <span class="text-slate-400">History Slot:</span>
          <span class="text-right text-sky-300">{snapshot.layers?.history?.toLocaleString() ?? 0} tok</span>
          <span class="text-slate-400">Task Slot:</span>
          <span class="text-right text-amber-300">{snapshot.layers?.task?.toLocaleString() ?? 0} tok</span>
        </div>
        {#if snapshot.entities_breakdown}
          <div class="mt-1 flex flex-col gap-0.5 border-t border-white/5 pt-1 font-mono text-[9px] text-slate-400">
            <span class="font-bold tracking-wider text-slate-300 uppercase">Entities Sub-Allocation:</span>
            <div class="flex justify-between">
              <span>Actors:</span>
              <span class="text-slate-200">{snapshot.entities_breakdown.actors?.toLocaleString() ?? 0} tok</span>
            </div>
            <div class="flex justify-between">
              <span>Cast / NPCs:</span>
              <span class="text-slate-200">{snapshot.entities_breakdown.cast?.toLocaleString() ?? 0} tok</span>
            </div>
            <div class="flex justify-between">
              <span>Past:</span>
              <span class="text-slate-200">{snapshot.entities_breakdown.past?.toLocaleString() ?? 0} tok</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- DYNAMICS GRID -->
  <div
    class="
      grid
      grid-cols-2
      gap-4
    "
  >
    {#each active_dynamics as dynamic (dynamic.source + "-" + dynamic.key)}
      <Meter {profile_state} {dynamic} />
    {/each}
  </div>

  <!-- RAW EXPLORER & HISTORY INSPECTOR -->
  <Accordion label="View JSON Data">
    <DataBox maxHeight="calc(var(--spacing-unit) * 60)">
      <pre class="font-mono">{JSON.stringify(profile_state.char, null, 2)}</pre>
    </DataBox>
  </Accordion>

  <div class="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-3">
    <div class="flex items-center justify-between">
      <span class="font-mono text-[10px] font-bold tracking-widest text-cyan-400 uppercase"> Mutation Ledger </span>
      <Button
        variant="bare"
        size="small"
        onclick={() => {
          inspector_field = "present.non_physical";
          show_history_modal = true;
        }}
        class="cursor-pointer font-mono text-[11px] text-cyan-300 hover:text-cyan-200"
      >
        Inspect History &rarr;
      </Button>
    </div>
  </div>

  <!-- META FOOTER -->
  <footer
    class="
      flex
      flex-col
      gap-2
    "
  >
    <div
      class="
        flex
        justify-between
        gap-4
        font-mono
        text-[10px]
        tracking-widest
        uppercase
      "
    >
      <span
        class="
          text-cyan-400
          opacity-60
        ">Born:</span
      >
      <span class="text-slate-50">{format_datetime(profile_state.char.created_at)}</span>
    </div>
    <div
      class="
        flex
        justify-between
        gap-4
        font-mono
        text-[10px]
        tracking-widest
        uppercase
      "
    >
      <span
        class="
          text-cyan-400
          opacity-60
        ">Sync:</span
      >
      <span class="text-slate-50">{format_datetime(profile_state.char.updated_at)}</span>
    </div>
  </footer>
</section>

{#if show_history_modal && profile_state.char?.id}
  <FieldHistoryModal bind:open={show_history_modal} entity_id={profile_state.char.id} entity_name={profile_state.char.name} field={inspector_field} />
{/if}

<!--
CHANGELOG:
- 2026-10-18: Phase V Sub-item 5.5 — Added Token Budget HUD badge and collapsible slot/entity breakdown popover in DevWing.
- 2026-10-03: Added Mutation Ledger history inspector trigger and embedded `FieldHistoryModal` in DevWing.
-->
