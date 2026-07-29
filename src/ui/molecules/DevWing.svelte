<script>
  /**
   * @file src/ui/devmode/DevWing.svelte
   * DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch UI.
   */
  import { Accordion, DataBox, Meter } from "@atoms";
  import { DYNAMICS_META } from "@intelligence";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  /**
   * Formats timestamps to a standard Swedish/ISO-adjacent format.
   * @param {string | number | null} ts
   */
  function format_timestamp(ts) {
    if (!ts) return "---";
    return new Date(ts).toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

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
          label: DYNAMICS_META[key]?.label || key.charAt(0).toUpperCase() + key.slice(1),
          desc: DYNAMICS_META[key]?.desc || "Metric",
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

  <!-- RAW EXPLORER -->
  <Accordion label="View JSON Data">
    <DataBox maxHeight="calc(var(--spacing-spacing-unit) * 60)">
      <pre class="font-mono">{JSON.stringify(profile_state.char, null, 2)}</pre>
    </DataBox>
  </Accordion>

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
      <span class="text-slate-50">{format_timestamp(profile_state.char.created_at)}</span>
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
      <span class="text-slate-50">{format_timestamp(profile_state.char.updated_at)}</span>
    </div>
  </footer>
</section>
