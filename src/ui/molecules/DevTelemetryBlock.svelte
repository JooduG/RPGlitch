<script>
  /**
   * @file DevTelemetryBlock.svelte
   * ðŸ“¡ THE TELEMETRY MODULE
   * Renders internal simulation physics, state changes (deltas), and memory vectors.
   */
  import { DataBox, tooltip } from "@atoms";

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
   */

  /** @type {Props} */
  let { meta = {} } = $props();

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
  let active_dynamics = Array.from(new Set([...signals, ...deltas.flatMap((d) => (d?.cause ? d.cause.split(", ") : []))]));

  /** @param {number} val */
  function get_pct(val) {
    return Math.max(0, Math.min(100, Math.round(val || 50)));
  }

  /**
   * @param {string} target
   * @param {string} axis
   * @returns {any}
   */
  function get_delta(target, axis) {
    return deltas.find((d) => d?.target === target && d?.axis === axis);
  }

  function get_explanation(signal_id) {
    return `Active Signal: ${signal_id}`;
  }
</script>

<div
  class="
    w-full
    animate-[slide-in_150ms_cubic-bezier(0.4,0,0.2,1)]
  "
>
  {#if meta.type === "STORY_START"}
    <div class="rounded-sm border border-(--state-dev-accent)/20 bg-(--state-dev-accent)/5 p-4 [backdrop-filter:var(--blur-mist)]">
      <div class="flex items-center gap-2">
        <div class="h-2 w-2 animate-pulse rounded-full bg-(--state-dev-accent) shadow-[0_0_8px_var(--state-dev-accent)]"></div>
        <span class="text-sm font-bold tracking-widest text-(--state-dev-accent) uppercase">Story Initiated</span>
      </div>
      <p class="mt-2 font-mono text-xs text-slate-300">The simulation engine has anchored a new narrative sequence.</p>
    </div>
  {:else}
    <DataBox
      label={meta.type === "MEMORY_FORMATION" ? "Memory Forged" : meta.type === "DYNAMICS_DELTA" ? "System Update" : "Simulation Telemetry"}
      height="auto"
      isResonating={meta.type === "MEMORY_FORMATION" || meta.type === "VECTOR_RESOLUTION"}
    >
      <div
        class="
        flex
        flex-col
        gap-4
      "
      >
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
                text-xs
                text-slate-400
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
                  border-b
                  border-(--state-dev-accent)/20
                  pb-1
                  text-xs
                  font-bold
                  tracking-widest
                  text-(--state-dev-accent)
                  uppercase
                  
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
                  {#each vectors.past as v, i (v.id || v.directive)}
                    <div
                      class="
                      flex
                      animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both]
                      gap-4
                      rounded-sm
                      border
                      border-l-8
                      border-[color-mix(in_srgb,var(--state-dev-accent),transparent_85%)]
                      border-l-slate-600
                      bg-[color-mix(in_srgb,var(--state-dev-accent),transparent_95%)]
                      px-2
                      py-2
                      text-xs
                      leading-relaxed
                    "
                      style="animation-delay: {i * 100}ms"
                    >
                      <span
                        class="
                        font-mono
                        text-(--state-dev-accent)
                        
                      ">WEAVED</span
                      >
                      <span
                        class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.directive}</span
                      >
                    </div>
                  {:else}
                    <div
                      class="
                      text-xs
                      text-slate-400
                      
                      font-mono
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
          <!-- [#] VECTOR RESOLUTION -->
          <div class="mb-4">
            <span
              class="
              block
              text-xs
              font-bold
              tracking-tight
              text-slate-50
            ">Vector Resolution</span
            >
            <p
              class="
              mt-2
              text-xs
              text-slate-400
            "
            >
              A vector has met its fulfillment criteria and been anchored into memory.
            </p>
          </div>
          <div
            class="
            flex
            animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both]
            gap-4
            rounded-sm
            border
            border-l-8
            border-[color-mix(in_srgb,var(--state-dev-accent),transparent_85%)]
            border-l-(--state-dev-accent)
            bg-[color-mix(in_srgb,var(--state-dev-accent),transparent_95%)]
            px-3
            py-3
            text-xs
            leading-relaxed
          "
          >
            <span
              class="
              font-mono
              text-(--state-dev-accent)
            ">{meta.vector?.emotional_weight || meta.vector?.base_weight || 0}</span
            >
            <span
              class="
              text-slate-50
            ">{meta.vector?.directive}</span
            >
            {#if meta.resolution}
              <span
                class="
                ml-auto
                font-mono
                text-xs
                text-(--state-dev-accent)/50
              ">[{meta.resolution}]</span
              >
            {/if}
          </div>
        {:else}
          <!-- [S] DEFAULT SIMULATION TELEMETRY -->

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
                  border-b
                  border-(--state-dev-accent)/20
                  pb-1
                  text-xs
                  font-bold
                  tracking-widest
                  text-(--state-dev-accent)
                  uppercase
                  
                "
                >
                  AI CHARACTER
                </header>
                {#each Object.entries(ai) as [axis, val] (axis)}
                  {@const delta = get_delta("ai", axis)}
                  <div class="relative flex flex-col gap-1">
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
                      text-slate-400
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
                        h-1.5
                        flex-1
                        overflow-hidden
                        rounded-full
                        bg-white/5
                      "
                        >
                          <div
                            class="
                          absolute
                          h-full
                          transition-all
                          duration-300
                        "
                            style="
                          left: 0%;
                          width: {delta ? Math.min(get_pct(delta.old_val), get_pct(delta.new_val)) : get_pct(val)}%;
                          background: var(--state-dev-accent);
                        "
                          ></div>
                          {#if delta}
                            <div
                              class="
                            absolute
                            z-10
                            h-full
                            opacity-40
                            transition-all
                            duration-300
                          "
                              style="
                            left: {Math.min(get_pct(delta.old_val), get_pct(delta.new_val))}%;
                            width: {Math.abs(get_pct(delta.new_val) - get_pct(delta.old_val))}%;
                            background: var(--state-dev-accent);
                          "
                            ></div>
                          {/if}
                        </div>
                        <div class="flex flex-col items-end gap-0.5">
                          <div class="flex min-w-16 items-center justify-end gap-1.5 font-mono text-xs">
                            <span class="text-slate-50">{get_pct(val)}</span>
                            {#if delta}
                              <span class={delta.diff > 0 ? "text-(--state-dev-accent)" : "text-slate-500"}>
                                ({delta.diff > 0 ? "+" : ""}{delta.diff})
                              </span>
                            {/if}
                          </div>
                        </div>
                      </div>
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
                  border-b
                  border-(--state-dev-accent)/20
                  pb-1
                  text-xs
                  font-bold
                  tracking-widest
                  text-(--state-dev-accent)
                  uppercase
                  
                "
                >
                  FRACTAL
                </header>
                {#each Object.entries(fractal) as [axis, val] (axis)}
                  {@const delta = get_delta("fractal", axis)}
                  <div class="relative flex flex-col gap-1">
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
                      text-slate-400
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
                        h-1.5
                        flex-1
                        overflow-hidden
                        rounded-full
                        bg-white/5
                      "
                        >
                          <div
                            class="
                          absolute
                          h-full
                          transition-all
                          duration-300
                        "
                            style="
                          left: 0%;
                          width: {delta ? Math.min(get_pct(delta.old_val), get_pct(delta.new_val)) : get_pct(val)}%;
                          background: var(--state-dev-accent);
                        "
                          ></div>
                          {#if delta}
                            <div
                              class="
                            absolute
                            z-10
                            h-full
                            opacity-40
                            transition-all
                            duration-300
                          "
                              style="
                            left: {Math.min(get_pct(delta.old_val), get_pct(delta.new_val))}%;
                            width: {Math.abs(get_pct(delta.new_val) - get_pct(delta.old_val))}%;
                            background: var(--state-dev-accent);
                          "
                            ></div>
                          {/if}
                        </div>
                        <div class="flex flex-col items-end gap-0.5">
                          <div class="flex min-w-16 items-center justify-end gap-1.5 font-mono text-xs">
                            <span class="text-slate-50">{get_pct(val)}</span>
                            {#if delta}
                              <span class={delta.diff > 0 ? "text-(--state-dev-accent)" : "text-slate-500"}>
                                ({delta.diff > 0 ? "+" : ""}{delta.diff})
                              </span>
                            {/if}
                          </div>
                        </div>
                      </div>
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
                  border-b
                  border-(--state-dev-accent)/20
                  pb-1
                  text-xs
                  font-bold
                  tracking-widest
                  text-(--state-dev-accent)
                  uppercase
                  
                "
                >
                  PAST MEMORIES
                </header>
                <div
                  class="
                  flex
                  flex-col
                  gap-2
                "
                >
                  {#each vectors.past.slice(0, 3) as v (v.id || v.directive)}
                    <div
                      class="
                      flex
                      gap-4
                      rounded-sm
                      border-l-8
                      border-transparent
                      border-l-slate-600
                      bg-black/40
                      px-3
                      py-3
                      text-xs
                      leading-relaxed
                    "
                    >
                      <span
                        class="
                        font-mono
                        text-(--state-dev-accent)
                        
                      ">{v._relevance?.toFixed(1) || v.base_weight}</span
                      >
                      <span
                        class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.directive}</span
                      >
                    </div>
                  {:else}
                    <div
                      class="
                      text-xs
                      text-slate-400
                      
                      font-mono
                    "
                    >
                      NO_PAST_MEMORIES
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
                  border-b
                  border-(--state-dev-accent)/20
                  pb-1
                  text-xs
                  font-bold
                  tracking-widest
                  text-(--state-dev-accent)
                  uppercase
                  
                "
                >
                  FUTURE VECTORS
                </header>
                <div
                  class="
                  flex
                  flex-col
                  gap-2
                "
                >
                  {#each vectors.future.slice(0, 3) as v (v.id || v.directive)}
                    <div
                      class="
                      flex
                      gap-4
                      rounded-sm
                      border-l-8
                      border-transparent
                      border-l-(--state-dev-accent)
                      bg-black/40
                      px-3
                      py-3
                      text-xs
                      leading-relaxed
                    "
                    >
                      <span
                        class="
                        font-mono
                        text-(--state-dev-accent)
                        
                      ">{v._relevance?.toFixed(1) || v.base_weight}</span
                      >
                      <span
                        class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.directive}</span
                      >
                    </div>
                  {:else}
                    <div
                      class="
                      text-xs
                      text-slate-400
                      
                      font-mono
                    "
                    >
                      NO_FUTURE_VECTORS
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- [!] ACTIVE DYNAMICS -->
          {#if active_dynamics.length > 0}
            <div class="pt-4">
              <div
                class="
                flex
                flex-wrap
                gap-4
              "
              >
                {#each active_dynamics as signal (signal)}
                  <span
                    use:tooltip={get_explanation(signal)}
                    class="
                    cursor-help
                    rounded-full
                    border
                    border-(--state-dev-accent)/15
                    bg-white/5
                    p-2
                    font-mono
                    text-xs
                    text-(--state-dev-accent)
                    uppercase
                  ">{signal}</span
                  >
                {/each}
              </div>
            </div>
          {/if}
          {#if Object.keys(meta).length > 0 && deltas.length === 0 && Object.keys(ai).length === 0 && Object.keys(fractal).length === 0 && vectors.future.length === 0 && vectors.past.length === 0 && active_dynamics.length === 0}
            <div class="overflow-x-auto pt-4 font-mono text-xs text-slate-400">
              <pre>{JSON.stringify(meta, null, 2)}</pre>
            </div>
          {/if}
        {/if}
      </div>
    </DataBox>
  {/if}
</div>

<style>
  @keyframes pulse-resonance {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--state-dev-accent) 15%, transparent);
    }

    70% {
      box-shadow: 0 0 0 calc(var(--spacing-spacing-unit) * 3) color-mix(in srgb, var(--state-dev-accent) 0%, transparent);
    }

    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--state-dev-accent) 0%, transparent);
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(var(--spacing-kinetic-slide-y));
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
