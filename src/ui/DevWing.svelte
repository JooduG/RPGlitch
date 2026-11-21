<script>
  /**
   * @file src/ui/DevWing.svelte
   * DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch UI.
   */
  import { DYNAMICS } from "@config";
  import { Accordion } from "@primitives";
  import Meter from "./Meter.svelte";
  import { format_datetime } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {import('./Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  /**
   * Dynamically computes which dynamics are available on the current character.
   */
  let active_dynamics = $derived.by(() => {
    const list = [];
    const entity = profile_state.char;
    if (entity?.dynamics) {
      for (const key of Object.keys(entity.dynamics)) {
        const axis = DYNAMICS[key.toUpperCase()];
        list.push({
          source: "dynamics",
          key: key,
          label: axis?.label || key.charAt(0).toUpperCase() + key.slice(1),
          desc: axis?.low && axis?.high ? `${axis.low} → ${axis.high}` : "",
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
    gap-standard
    rounded-standard
    bg-glass-elevated
    p-standard
    [backdrop-filter:var(--blur-mist)]
  "
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
  style:--signature-color="var(--color-electric-cyan)">
  <!-- DYNAMICS GRID -->
  <div
    class="
      grid
      grid-cols-2
      gap-standard
    ">
    {#each active_dynamics as dynamic (dynamic.source + "-" + dynamic.key)}
      <Meter {profile_state} {dynamic} />
    {/each}
  </div>

  <!-- RAW EXPLORER -->
  <Accordion label="View JSON Data">
    <div class="terminal-box max-h-60 overflow-y-auto bg-black/10 p-standard text-sm">
      <pre class="m-0 font-[inherit] text-xs whitespace-pre-wrap">{JSON.stringify(profile_state.char, null, 2)}</pre>
    </div>
  </Accordion>

  <!-- META FOOTER -->
  <footer
    class="
      flex
      flex-col
      gap-tight
    ">
    <div
      class="
        flex
        justify-between
        gap-standard
        font-mono
        text-[10px]
        tracking-widest
        uppercase
      ">
      <span
        class="
          text-cyan-400
          opacity-60
        ">Born:</span>
      <span class="text-slate-50">{format_datetime(profile_state.char.created_at)}</span>
    </div>
    <div
      class="
        flex
        justify-between
        gap-standard
        font-mono
        text-[10px]
        tracking-widest
        uppercase
      ">
      <span
        class="
          text-cyan-400
          opacity-60
        ">Sync:</span>
      <span class="text-slate-50">{format_datetime(profile_state.char.updated_at)}</span>
    </div>
  </footer>
</section>

<!--
CHANGELOG:
- 2026-10-18: Phase V Sub-item 5.5 - Added Token Budget HUD badge and collapsible slot/entity breakdown popover in DevWing.
- 2026-10-03: Added Mutation Ledger history inspector trigger and embedded `FieldHistoryModal` in DevWing.
-->
