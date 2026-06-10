<script>
  /**
   * @file DevTelemetryBlock.svelte
   * ðŸ“¡ THE TELEMETRY MODULE
   * Renders internal simulation physics, state changes (deltas), and memory vectors.
   */
  import { DataBox } from "@atoms";

  /**
   * @typedef {Object} TelemetryMeta
   * @property {string} [type] - The type of telemetry event.
   * @property {Object} [ai] - AI character state.
   * @property {Object} [dynamics] - Dynamic simulation state.
   * @property {Object} [snapshot] - State snapshot.
   * @property {Object} [snapshot.ai] - AI snapshot.
   * @property {Object} [snapshot.fractal] - Fractal snapshot.
   * @property {Object} [fractal] - Fractal entity state.
   * @property {Object} [fractal_dynamics] - Fractal dynamic state.
   * @property {Object} [vectors] - Narrative vectors.
   * @property {any[]} [vectors.past] - Past memory vectors.
   * @property {any[]} [vectors.future] - Future intent vectors.
   * @property {any[]|Object} [signals] - Atmospheric signals.
   * @property {any[]} [deltas] - State deltas.
   */
  /**
   * @typedef {Object} Props
   * @property {TelemetryMeta} [meta={}] - The telemetry metadata object.
   * @property {string} [time=""] - Optional timestamp to display.
   */

  /** @type {Props} */
  let { meta = {}, time = "" } = $props();

  // svelte-ignore state_referenced_locally
  let ai = meta.ai || meta.dynamics || meta.snapshot?.ai || {};
  // svelte-ignore state_referenced_locally
  let fractal = meta.fractal || meta.fractal_dynamics || meta.snapshot?.fractal || {};
  // svelte-ignore state_referenced_locally
  let vectors = {
    past: meta.vectors?.past || [],
    future: meta.vectors?.future || [],
  };
  // svelte-ignore state_referenced_locally
  let signals = Array.isArray(meta.signals) ? meta.signals : Object.keys(meta.signals || {});
  // svelte-ignore state_referenced_locally
  let deltas = meta.deltas || [];

  /** @param {number} val */
  function get_pct(val) {
    return Math.max(0, Math.min(100, Math.round(val || 50)));
  }
</script>

<div
  class="
    mb-4
    animate-[slide-in_150ms_cubic-bezier(0.4,0,0.2,1)]

    {meta.type === 'telemetry' ||
  meta.type === 'MEMORY_FORMATION' ||
  meta.type === 'VECTOR_RESOLUTION'
    ? `
      mx-auto
      my-2
      max-w-[85%]
    `
    : ''}
  "
>
  <DataBox
    label={meta.type === "MEMORY_FORMATION"
      ? "[#] MEMORY_WEAVE"
      : meta.type === "VECTOR_RESOLUTION"
        ? "[A] VECTOR_ANCHOR"
        : meta.type === "telemetry"
          ? "[S] DYNAMICS_LOG"
          : "[S] Simulation Telemetry"}
    height="auto"
    class={meta.type === "MEMORY_FORMATION" || meta.type === "VECTOR_RESOLUTION"
      ? `
        animate-[pulse-resonance_3s_infinite_cubic-bezier(0.4,0,0.2,1)]
        border-(--signature-color)
      `
      : ""}
  >
    <div
      class="
        flex
        flex-col
        gap-4
        p-2
      "
    >
      {#if time}
        <div
          class="
            -mb-4
            flex
            justify-end
            opacity-15
          "
        >
          <span
            class="
              text-[10px]
              font-(--font-family-mono)
              text-slate-600
            ">{time}</span
          >
        </div>
      {/if}

      {#if meta.type === "MEMORY_FORMATION"}
        <!-- [#] WEAVED STATE (Memory Consolidation) -->
        <div
          class="
          
          
        "
        >
          <div class="mb-4">
            <span
              class="
                block
                text-xs
                font-bold
                tracking-tight
                text-slate-50
              ">Consolidating Temporal Echoes</span
            >
            <p
              class="
                mt-2
                text-[10px]
                text-slate-600
              "
            >
              Merging active impulses into persistent memory vectors.
            </p>
          </div>

          <div
            class="
              grid
              grid-cols-2
              gap-4
              pt-4
            "
          >
            <div
              class="
                col-span-2
                mx-auto
                flex
                w-full
                flex-col
              "
            >
              <header
                class="
                  mb-2
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-(--signature-color)
                  uppercase
                  opacity-15
                "
              >
                NEWLY_WEAVED_MEMORIES
              </header>
              <div
                class="
                  flex
                  flex-col
                  gap-2
                "
              >
                {#each vectors.past as v, i (v.id || v.text)}
                  <div
                    class="
                      flex
                      animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both]
                      gap-4
                      rounded-sm
                      border
                      border-l-8
                      border-[color-mix(in_srgb,var(--signature-color),transparent_85%)]
                      border-l-slate-600
                      bg-[color-mix(in_srgb,var(--signature-color),transparent_95%)]
                      px-2
                      py-2
                      text-xs
                      leading-relaxed
                    "
                    style="animation-delay: {i * 100}ms"
                  >
                    <span
                      class="
                        font-(--font-family-mono)
                        text-(--signature-color)
                        opacity-15
                      ">WEAVED</span
                    >
                    <span
                      class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.text}</span
                    >
                  </div>
                {:else}
                  <div
                    class="
                      text-[10px]
                      text-slate-600
                      opacity-15
                      font-(--font-family-mono)
                    "
                  >
                    NO_MEMORIES_WEAVED
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {:else if meta.type === "VECTOR_RESOLUTION"}
        <!-- [A] ANCHORED STATE (Vector Engine) -->
        <div
          class="
          
          
        "
        >
          <div class="mb-4">
            <span
              class="
                block
                text-xs
                font-bold
                tracking-tight
                text-slate-50
              ">Aligning Future Intent</span
            >
            <p
              class="
                mt-2
                text-[10px]
                text-slate-600
              "
            >
              Resolving state deltas into directed narrative vectors.
            </p>
          </div>

          <div
            class="
              grid
              grid-cols-2
              gap-4
              pt-4
            "
          >
            <div
              class="
                flex
                flex-col
              "
            >
              <header
                class="
                  mb-2
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-(--signature-color)
                  uppercase
                  opacity-15
                "
              >
                RESOLVED_IMPULSES
              </header>
              <div
                class="
                  flex
                  flex-col
                  gap-2
                "
              >
                {#each vectors.future.slice(0, 5) as v, i (v.id || v.text)}
                  <div
                    class="
                      flex
                      animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both]
                      gap-4
                      rounded-sm
                      border
                      border-l-8
                      border-[color-mix(in_srgb,var(--signature-color),transparent_85%)]
                      border-l-(--signature-color)
                      bg-[color-mix(in_srgb,var(--signature-color),transparent_95%)]
                      px-2
                      py-2
                      text-xs
                      leading-relaxed
                    "
                    style="animation-delay: {i * 100}ms"
                  >
                    <span
                      class="
                        font-(--font-family-mono)
                        text-(--signature-color)
                        opacity-15
                      ">ANCHOR</span
                    >
                    <span
                      class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.text}</span
                    >
                  </div>
                {:else}
                  <div
                    class="
                      text-[10px]
                      text-slate-600
                      opacity-15
                      font-(--font-family-mono)
                    "
                  >
                    NO_IMPULSES_RESOLVED
                  </div>
                {/each}
              </div>
            </div>

            <div
              class="
                flex
                flex-col
              "
            >
              <header
                class="
                  mb-2
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-(--signature-color)
                  uppercase
                  opacity-15
                "
              >
                ACTIVE_CONTEXT
              </header>
              <div
                class="
                  flex
                  flex-col
                  gap-2
                "
              >
                {#each vectors.past.slice(0, 3) as v (v.id || v.text)}
                  <div
                    class="
                      flex
                      gap-4
                      rounded-sm
                      border-l-8
                      border-transparent
                      border-l-slate-600
                      bg-black/15
                      px-2
                      py-2
                      text-xs
                      leading-relaxed
                    "
                  >
                    <span
                      class="
                        font-(--font-family-mono)
                        text-(--signature-color)
                        opacity-15
                      ">{v._relevance?.toFixed(1) || v.base_weight}</span
                    >
                    <span
                      class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.text}</span
                    >
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- [S] DEFAULT SIMULATION TELEMETRY -->
        <!-- [D] STATE CHANGES (DELTAS) -->
        {#if deltas.length > 0}
          <div class="pb-2">
            <header
              class="
                mb-2
                text-[10px]
                font-bold
                tracking-widest
                text-(--signature-color)
                uppercase
                opacity-15
              "
            >
              STATE_MUTATIONS
            </header>
            <div
              class="
                flex
                flex-wrap
                gap-4
              "
            >
              {#each deltas as delta (delta)}
                <div
                  class="
                    rounded-sm
                    border
                    p-2
                    text-[10px]
                    font-(--font-family-mono)
                    whitespace-nowrap
                    transition-all
                    duration-150

                    {delta.includes('(+')
                    ? `
                      border-(--signature-color)/15
                      bg-black/15
                      text-(--signature-color)
                    `
                    : ''}
                    {delta.includes('(-') ? 'border-slate-600/15 bg-black/15 text-slate-600' : ''}
                    {!delta.includes('(+') && !delta.includes('(-')
                    ? `
                      border-transparent
                      bg-black/15
                      text-slate-50
                    `
                    : ''}
                  "
                >
                  <span class="opacity-100">{delta}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- [T] DYNAMICS GRID -->
        <div
          class="
            grid
            grid-cols-2
            gap-4
          "
        >
          {#if Object.keys(ai).length > 0}
            <div
              class="
                flex
                flex-col
                gap-2
              "
            >
              <header
                class="
                  mb-2
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-(--signature-color)
                  uppercase
                  opacity-15
                "
              >
                AI_SOMATICS
              </header>
              {#each Object.entries(ai) as [axis, val] (axis)}
                <div
                  class="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <span
                    class="
                      min-w-20
                      text-xs
                      text-slate-600
                      lowercase
                    ">{axis}</span
                  >
                  <div
                    class="
                      flex
                      flex-1
                      items-center
                      gap-4
                    "
                  >
                    <div
                      class="
                        relative
                        h-1
                        flex-1
                        overflow-hidden
                        rounded-full
                        bg-white/5

                        after:absolute
                        after:top-0
                        after:bottom-0
                        after:left-1/2
                        after:z-10
                        after:w-px
                        after:bg-white/15
                        after:content-['']
                      "
                    >
                      <div
                        class="
                          absolute
                          h-full
                          rounded-full
                          transition-all
                          duration-300
                        "
                        style="
                          left: {Math.min(50, get_pct(val))}%;
                          width: {Math.abs(get_pct(val) - 50)}%;
                          background: {get_pct(val) > 50
                          ? 'var(--signature-color)'
                          : 'var(--color-slate-600)'}
                        "
                      ></div>
                    </div>
                    <span
                      class="
                        min-w-6
                        text-right
                        text-[10px]
                        font-(--font-family-mono)
                        text-slate-50
                      ">{get_pct(val)}</span
                    >
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          {#if Object.keys(fractal).length > 0}
            <div
              class="
                flex
                flex-col
                gap-2
              "
            >
              <header
                class="
                  mb-2
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-(--signature-color)
                  uppercase
                  opacity-15
                "
              >
                FRACTAL_PHYSICS
              </header>
              {#each Object.entries(fractal) as [axis, val] (axis)}
                <div
                  class="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <span
                    class="
                      min-w-20
                      text-xs
                      text-slate-600
                      lowercase
                    ">{axis}</span
                  >
                  <div
                    class="
                      flex
                      flex-1
                      items-center
                      gap-4
                    "
                  >
                    <div
                      class="
                        relative
                        h-1
                        flex-1
                        overflow-hidden
                        rounded-full
                        bg-white/5

                        after:absolute
                        after:top-0
                        after:bottom-0
                        after:left-1/2
                        after:z-10
                        after:w-px
                        after:bg-white/15
                        after:content-['']
                      "
                    >
                      <div
                        class="
                          absolute
                          h-full
                          rounded-full
                          transition-all
                          duration-300
                        "
                        style="
                          left: {Math.min(50, get_pct(val))}%;
                          width: {Math.abs(get_pct(val) - 50)}%;
                          background: {get_pct(val) > 50
                          ? 'var(--signature-color)'
                          : 'var(--color-slate-600)'}
                        "
                      ></div>
                    </div>
                    <span
                      class="
                        min-w-6
                        text-right
                        text-[10px]
                        font-(--font-family-mono)
                        text-slate-50
                      ">{get_pct(val)}</span
                    >
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- VECTOR FABRIC -->
        {#if vectors.future.length > 0 || vectors.past.length > 0}
          <div
            class="
              grid
              grid-cols-2
              gap-4
              pt-4
            "
          >
            <div
              class="
                flex
                flex-col
              "
            >
              <header
                class="
                  mb-2
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-(--signature-color)
                  uppercase
                  opacity-15
                "
              >
                ACTIVE_IMPULSES (FUTURE)
              </header>
              <div
                class="
                  flex
                  flex-col
                  gap-2
                "
              >
                {#each vectors.future.slice(0, 3) as v (v.id || v.text)}
                  <div
                    class="
                      flex
                      gap-4
                      rounded-sm
                      border-l-8
                      border-transparent
                      border-l-(--signature-color)
                      bg-black/15
                      px-2
                      py-2
                      text-xs
                      leading-relaxed
                    "
                  >
                    <span
                      class="
                        font-(--font-family-mono)
                        text-(--signature-color)
                        opacity-15
                      ">{v._relevance?.toFixed(1) || v.base_weight}</span
                    >
                    <span
                      class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.text}</span
                    >
                  </div>
                {:else}
                  <div
                    class="
                      text-[10px]
                      text-slate-600
                      opacity-15
                      font-(--font-family-mono)
                    "
                  >
                    NO_ACTIVE_IMPULSES
                  </div>
                {/each}
              </div>
            </div>

            <div
              class="
                flex
                flex-col
              "
            >
              <header
                class="
                  mb-2
                  text-[10px]
                  font-bold
                  tracking-widest
                  text-(--signature-color)
                  uppercase
                  opacity-15
                "
              >
                HISTORICAL_ANCHORS (PAST)
              </header>
              <div
                class="
                  flex
                  flex-col
                  gap-2
                "
              >
                {#each vectors.past.slice(0, 3) as v (v.id || v.text)}
                  <div
                    class="
                      flex
                      gap-4
                      rounded-sm
                      border-l-8
                      border-transparent
                      border-l-slate-600
                      bg-black/15
                      px-2
                      py-2
                      text-xs
                      leading-relaxed
                    "
                  >
                    <span
                      class="
                        font-(--font-family-mono)
                        text-(--signature-color)
                        opacity-15
                      ">{v._relevance?.toFixed(1) || v.base_weight}</span
                    >
                    <span
                      class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.text}</span
                    >
                  </div>
                {:else}
                  <div
                    class="
                      text-[10px]
                      text-slate-600
                      opacity-15
                      font-(--font-family-mono)
                    "
                  >
                    NO_HISTORICAL_ANCHORS
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        <!-- [!] SIGNALS -->
        {#if signals.length > 0}
          <div class="pt-4">
            <header
              class="
                mb-2
                text-[10px]
                font-bold
                tracking-widest
                text-(--signature-color)
                uppercase
                opacity-15
              "
            >
              TRIGGERED_SIGNALS
            </header>
            <div
              class="
                flex
                flex-wrap
                gap-4
              "
            >
              {#each signals as signal (signal)}
                <span
                  class="
                    rounded-full
                    border
                    border-(--signature-color)/15
                    bg-white/5
                    p-2
                    text-[10px]
                    font-(--font-family-mono)
                    text-(--signature-color)
                    uppercase
                  ">{signal}</span
                >
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </DataBox>
</div>

<style>
  @keyframes pulse-resonance {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--signature-color) 15%, transparent);
    }

    70% {
      box-shadow: 0 0 0 calc(var(--spacing-unit) * 3)
        color-mix(in srgb, var(--signature-color) 0%, transparent);
    }

    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--signature-color) 0%, transparent);
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(var(--kinetic-slide-y));
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
