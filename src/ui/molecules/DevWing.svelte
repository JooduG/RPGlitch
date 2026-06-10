<script>
  /**
   * @file src/ui/devmode/DevWing.svelte
   * âš™ï¸ DYNAMIC DEVELOPER CONSOLE
   * Dynamically renders and binds to all entity dynamics (Somatic or Environmental).
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { Button, DataBox, Meter, tooltip } from "@atoms";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/profile.svelte.js').ProfileState} profileState - The profile state controller
   */

  /** @type {Props} */
  let { profileState } = $props();
  const is_editing = $derived(profileState.is_editing);

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
   * Dictionary for human-readable labels and descriptions.
   * @type {Record<string, { label: string; desc: string }>}
   */
  const DYNAMICS_META = {
    // Character (Somatic) axes
    chaos: { label: "Chaos", desc: "Randomness vs Control" },
    intensity: { label: "Intensity", desc: "Internal Energy / Adrenaline" },
    openness: { label: "Openness", desc: "Receptivity vs Guardedness" },
    affinity: { label: "Affinity", desc: "Inter-Entity Bond / Empathy" },
    // Fractal (Environmental) axes
    velocity: { label: "Velocity", desc: "Environmental Pacing / Speed" },
    entropy: { label: "Entropy", desc: "Structural Reality / Weirdness" },
  };

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
    gap-4
    rounded-md
    border
    border-white/5
    bg-black/25
    p-4
    shadow-md
    backdrop-blur-sm
    [--dev-accent:var(--color-cyan-400)]
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
      <div
        class="
          group
          relative
          flex
          min-h-16
          flex-col
          items-center
          justify-center
          overflow-hidden
          rounded-sm
          border
          border-transparent
          bg-black/40
          p-4
          transition-all
          duration-300
          ease-in-out
          select-none

          after:absolute
          after:right-0
          after:bottom-0
          after:left-0
          after:h-px
          after:bg-cyan-400
          after:opacity-10

          {is_editing
          ? `
            cursor-pointer

            focus-within:z-10
            focus-within:border-cyan-400
            focus-within:bg-black/15
            focus-within:shadow-md

            hover:z-10
            hover:border-cyan-400
            hover:bg-black/15
            hover:shadow-md
          `
          : ''}
        "
        data-editable={is_editing}
      >
        <span
          class="
            z-10
            mb-2
            cursor-help
            text-[10px]
            font-(--font-family-mono)
            tracking-widest
            text-cyan-400
            uppercase
            transition-[filter]
            duration-150
            ease-in-out

            group-hover:brightness-125
          "
          use:tooltip={dynamic.desc}>{dynamic.label}</span
        >
        <div
          class="
            relative
            z-10
            flex
            w-full
            items-center
            justify-center
          "
        >
          {#if is_editing}
            <input
              type="number"
              class="
                w-full
                appearance-none
                bg-transparent
                py-1
                text-center
                text-base
                font-(--font-family-mono)
                text-slate-50
                outline-none

                [&::-webkit-inner-spin-button]:m-0
                [&::-webkit-inner-spin-button]:appearance-none

                [&::-webkit-outer-spin-button]:m-0
                [&::-webkit-outer-spin-button]:appearance-none
              "
              value={profileState.char[dynamic.source][dynamic.key]}
              oninput={(e) => {
                const val = Number(e.currentTarget.value);
                if (!isNaN(val)) {
                  profileState.char[dynamic.source][dynamic.key] = val;
                }
              }}
              min="0"
              max="100"
            />
            <div
              class="
                pointer-events-none
                absolute
                -right-4
                z-20
                flex
                translate-x-2
                flex-col
                gap-px
                opacity-0
                transition-all
                duration-150
                ease-in-out

                group-focus-within:pointer-events-auto
                group-focus-within:translate-x-0
                group-focus-within:opacity-100

                group-hover:pointer-events-auto
                group-hover:translate-x-0
                group-hover:opacity-100
              "
            >
              <Button
                variant="secondary"
                size="small"
                square
                actions={[[tooltip, "Increase"]]}
                onclick={() =>
                  (profileState.char[dynamic.source][dynamic.key] = Math.min(
                    100,
                    profileState.char[dynamic.source][dynamic.key] + 1,
                  ))}
                aria-label="Increase"
              >
                <svg viewBox="0 0 24 24" class="size-(--icon-small)"
                  ><path d="M7 14l5-5 5 5H7z" fill="currentColor" /></svg
                >
              </Button>
              <Button
                variant="secondary"
                size="small"
                square
                actions={[[tooltip, "Decrease"]]}
                onclick={() =>
                  (profileState.char[dynamic.source][dynamic.key] = Math.max(
                    0,
                    profileState.char[dynamic.source][dynamic.key] - 1,
                  ))}
                aria-label="Decrease"
              >
                <svg viewBox="0 0 24 24" class="size-(--icon-small)"
                  ><path d="M7 10l5 5 5-5H7z" fill="currentColor" /></svg
                >
              </Button>
            </div>
          {:else}
            <span
              class="
                py-1
                text-base
                font-(--font-family-mono)
                text-slate-50
              "
            >
              {profileState.char[dynamic.source][dynamic.key]}%
            </span>
          {/if}
        </div>
        {#key is_editing}
          <Meter
            class="
              absolute
              bottom-0
              left-0
              z-0
              h-px
              w-full
            "
            value={profileState.char[dynamic.source][dynamic.key]}
            min={0}
            max={100}
          />
        {/key}
      </div>
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
          text-[10px]
          font-(--font-family-mono)
          tracking-widest
          text-cyan-400
          uppercase
          transition-[filter]
          duration-150
          ease-in-out

          hover:brightness-125
        ">View JSON Data</summary
      >
      <DataBox maxHeight="calc(var(--spacing-unit) * 60)">
        <pre class="font-(--font-family-mono)">{JSON.stringify(profileState.char, null, 2)}</pre>
      </DataBox>
    </details>
  </div>

  <!-- META FOOTER -->
  <footer
    class="
      mt-2
      flex
      flex-col
      gap-2
      border-t
      border-white/5
      pt-2
    "
  >
    <div
      class="
        flex
        justify-between
        gap-4
        text-[10px]
        font-(--font-family-mono)
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
        text-[10px]
        font-(--font-family-mono)
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
