<script>
  /**
   * @file src/ui/devmode/DevWing.svelte
   * DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { DataBox, DynamicsMeter } from "@atoms";
  import { DYNAMICS_META } from "@intelligence";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/profile.svelte.js').ProfileState} profileState - The profile state controller
   */

  /** @type {Props} */
  let { profileState } = $props();

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
    const entity = profileState.char;
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
      <DynamicsMeter {profileState} {dynamic} />
    {/each}
  </div>

  <!-- RAW EXPLORER -->
  <div
    class="
      flex
      w-full
      flex-col
      gap-2
    "
  >
    <details>
      <summary
        class="
          cursor-pointer
          font-mono
          text-[10px]
          tracking-widest
          text-cyan-400
          uppercase
          transition-[filter]
          duration-150
          ease-in-out

          hover:brightness-125
        ">View JSON Data</summary
      >
      <DataBox maxHeight="calc(var(--spacing-spacing-unit) * 60)">
        <pre class="font-mono">{JSON.stringify(profileState.char, null, 2)}</pre>
      </DataBox>
    </details>
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
      <span class="text-slate-50">{format_timestamp(profileState.char.created_at)}</span>
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
      <span class="text-slate-50">{format_timestamp(profileState.char.updated_at)}</span>
    </div>
  </footer>
</section>
