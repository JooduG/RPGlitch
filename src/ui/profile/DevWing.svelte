<script>
  /**
   * @file src/ui/profile/DevWing.svelte
   * DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch UI.
   */
  import { Accordion, Button, DataBox, Meter } from "@primitives";
  import { DYNAMICS_AXES } from "@intelligence";
  import { format_datetime } from "@utils";
  import FieldHistoryModal from "./FieldHistoryModal.svelte";

  /**
   * @typedef {Object} Props
   * @property {import('@profile/Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  let show_history_modal = $state(false);
  let inspector_field = $state("present.non_physical");

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
      <span class="font-mono text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
        Mutation Ledger
      </span>
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
  <FieldHistoryModal
    bind:open={show_history_modal}
    entity_id={profile_state.char.id}
    entity_name={profile_state.char.name}
    field={inspector_field}
  />
{/if}

<!--
CHANGELOG:
- 2026-10-03: Added Mutation Ledger history inspector trigger and embedded `FieldHistoryModal` in DevWing.
-->
