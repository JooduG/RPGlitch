<script>
  /**
   * @file DevTelemetryBlock.svelte
   * ðŸ“¡ THE TELEMETRY MODULE
   * Renders internal simulation physics, state changes (deltas), and memory vectors.
   */
  import { Accordion, DataBox } from "@atoms";
  import { runtime } from "@state";

  /**
   * @typedef {Object} TelemetryMeta
   * @property {string} [type] - The type of telemetry event.
   * @property {Object} [updates] - Normalized per-entity state updates ({ AI_CHARACTER | USER_PERSONA | FRACTAL: { name, present_mutations, eternal_mutations, vectors, dynamics } }).
   * @property {string} [thoughts] - Director think content (markdown; leading `##` headings stripped for display).
   * @property {boolean} [trigger_image] - Whether image generation was triggered this tick.
   * @property {Object} [vectors] - Forged memory vectors for MEMORY_FORMATION events.
   * @property {any[]} [vectors] - The forged memory vector.
   * @property {string} [target] - Entity key targeted by a MEMORY_FORMATION event.
   * @property {number} [turns_count] - Turns consolidated by a MEMORY_FORMATION event.
   * @property {Object} [vector] - Resolved vector detail for VECTOR_RESOLUTION events.
   * @property {string} [resolution] - Resolution summary for VECTOR_RESOLUTION events.
   */
  /**
   * @typedef {Object} Props
   * @property {TelemetryMeta} [meta={}] - The telemetry metadata object.
   */

  /** @type {Props} */
  let { meta = {} } = $props();

  let forged_vectors = $derived(Array.isArray(meta.vectors) ? meta.vectors : []);

  let entity_blocks = $derived.by(() => {
    const mutation_keys = { ai: "AI_CHARACTER", fractal: "FRACTAL", user: "USER_PERSONA" };
    if (!meta.updates || typeof meta.updates !== "object") return [];

    const blocks = [];
    for (const [target, mutation_key] of Object.entries(mutation_keys)) {
      const upd = meta.updates[mutation_key];
      if (!upd) continue;
      const dynamics = (Array.isArray(upd.dynamics) ? upd.dynamics : []).map((d) => ({
        axis: d.axis,
        value: d.new_value,
        old_value: d.old_value,
        new_value: d.new_value,
        diff: d.diff,
        has_delta: true,
      }));
      const new_vectors = (Array.isArray(upd.vectors?.new) ? upd.vectors.new : []).map((v) => ({
        type: v.type || "future",
        weight: v.emotional_weight ?? v.weight ?? 5,
        id: v.id,
        content: v.content || v.directive || "",
      }));
      const retrieval = (Array.isArray(upd.vectors?.retrieval) ? upd.vectors.retrieval : []).map((v) => ({
        type: v.type || "past",
        id: v.id,
        content: v.content || v.directive || "",
        relevance: v._relevance,
      }));
      const physical = upd.present_mutations?.physical || "";
      const non_physical = upd.present_mutations?.non_physical || "";
      const eternal_physical = upd.eternal_mutations?.physical || "";
      const eternal_non_physical = upd.eternal_mutations?.non_physical || "";
      const has_dynamics = dynamics.length > 0;
      const has_mods = !!(
        physical.trim() ||
        non_physical.trim() ||
        eternal_physical.trim() ||
        eternal_non_physical.trim() ||
        new_vectors.length > 0 ||
        retrieval.length > 0
      );
      if (has_dynamics || has_mods) {
        blocks.push({
          key: target,
          name: upd.name,
          dynamics,
          physical,
          non_physical,
          eternal_physical,
          eternal_non_physical,
          new_vectors,
          retrieval,
          has_dynamics,
          has_mods,
        });
      }
    }
    return blocks;
  });

  let display_thoughts = $derived((meta.thoughts || "").replace(/^##\s+.*$/gm, "").trim());

  /** @param {number} val */
  function get_pct(val) {
    return Math.max(0, Math.min(100, Math.round(val || 50)));
  }

  const get_entity_name = (key) => {
    if (key === "ai" || key === "AI_CHARACTER") return runtime.active_ai?.name || "AI CHARACTER";
    if (key === "fractal" || key === "FRACTAL") return runtime.active_fractal?.name || "FRACTAL";
    if (key === "user" || key === "USER_PERSONA") return runtime.active_user?.name || "USER PERSONA";
    return key;
  };

  /**
   * Human-readable label for a memory/vector type.
   * @param {string} [type]
   * @param {string} [fallback]
   * @returns {string}
   */
  const vector_label = (type, fallback) => {
    const t = type || fallback;
    if (t === "future") return "FUTURE VECTOR";
    if (t === "past") return "PAST MEMORY";
    return String(t).toUpperCase();
  };
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
              <p
                class="
                mt-2
                font-mono
                text-xs
                tracking-widest
                text-(--state-dev-accent)/60
                uppercase
              "
              >
                Forged for {get_entity_name(meta.target)} · from {meta.turns_count || "?"} turns
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
                  NEWLY FORGED MEMORIES
                </header>
                <div
                  class="
                  flex
                  flex-col
                  gap-2
                "
                >
                  {#each forged_vectors as v, i (v.id || v.content)}
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
                      <div class="flex flex-wrap items-center gap-2">
                        <span
                          class="
                          font-mono
                          text-slate-500
                        ">FORGED</span
                        >
                        <span
                          class="
                          font-mono
                          text-slate-500
                          uppercase
                        ">{vector_label(v.type, "past")}</span
                        >
                      </div>
                      <span
                        class="
                        line-clamp-2
                        overflow-hidden
                        text-ellipsis
                        text-slate-50
                      ">{v.content}</span
                      >
                      {#if v.tags?.length}
                        <div class="flex flex-wrap gap-2">
                          {#each v.tags as tag (tag)}
                            <span
                              class="
                              rounded-sm
                              bg-white/5
                              px-2
                              py-0.5
                              font-mono
                              text-xs
                              {tag === 'eternal-shift' ? 'text-(--state-dev-accent)' : 'text-slate-400'}
                            ">{tag === "eternal-shift" ? "◇ eternal shift" : tag}</span
                            >
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <div
                      class="
                      text-xs
                      text-slate-400
                      
                      font-mono
                    "
                    >
                      NO MEMORIES FORGED
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
            ">{meta.vector?.emotional_weight || 0}</span
            >
            <span
              class="
              text-slate-50
            ">{meta.vector?.content}</span
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

          {#if meta.thoughts}
            <div class="flex flex-col gap-2">
              <header class="text-xs font-bold tracking-widest text-(--state-dev-accent) uppercase">Thoughts</header>
              <div
                class="rounded-sm border-l-8 border-transparent border-l-(--state-dev-accent) bg-black/40 px-3 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-50"
              >
                {display_thoughts}
              </div>
            </div>
          {/if}

          {#if meta.trigger_image === true}
            <div class="flex items-center gap-2 rounded-sm border border-(--state-dev-accent)/40 bg-(--state-dev-accent)/10 px-3 py-2">
              <span class="h-2 w-2 animate-pulse rounded-full bg-(--state-dev-accent) shadow-[0_0_8px_var(--state-dev-accent)]"></span>
              <span class="font-mono text-xs font-bold tracking-widest text-(--state-dev-accent) uppercase">Trigger Image</span>
            </div>
          {/if}

          <!-- [T] PER-ENTITY STATE CHANGES -->
          {#if entity_blocks.length > 0}
            <div class="flex flex-col gap-6">
              {#each entity_blocks as block (block.key)}
                <div class="flex flex-col gap-2">
                  <header class="text-xs font-bold tracking-widest text-(--state-dev-accent) uppercase">
                    {block.name || get_entity_name(block.key)}
                  </header>
                  {#if block.dynamics.length > 0}
                    <div class="grid grid-cols-2 gap-4">
                      {#each block.dynamics as delta (delta.axis)}
                        {@const fill_width = delta.has_delta ? Math.min(get_pct(delta.old_value), get_pct(delta.new_value)) : get_pct(delta.value)}
                        {@const delta_width = delta.has_delta ? Math.abs(get_pct(delta.new_value) - get_pct(delta.old_value)) : 0}
                        <div class="flex items-center justify-between gap-4">
                          <span class="min-w-20 text-xs text-slate-400 lowercase">{delta.axis}</span>
                          <div class="flex flex-1 items-center gap-4">
                            <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                              <div
                                class="absolute h-full transition-all duration-300"
                                style="left: 0%; width: {fill_width}%; background: var(--state-dev-accent);"
                              ></div>
                              {#if delta.has_delta}
                                <div
                                  class="absolute z-10 h-full opacity-40 transition-all duration-300"
                                  style="left: {fill_width}%; width: {delta_width}%; background: var(--state-dev-accent);"
                                ></div>
                              {/if}
                            </div>
                            <div class="flex flex-col items-end gap-0.5">
                              <div class="flex min-w-16 items-center justify-end gap-1.5 font-mono text-xs">
                                <span class="text-slate-50">{delta.has_delta ? get_pct(delta.new_value) : get_pct(delta.value)}</span>
                                {#if delta.has_delta}
                                  <span class={delta.diff > 0 ? "text-(--state-dev-accent)" : "text-slate-500"}>
                                    ({delta.diff > 0 ? "+" : ""}{delta.diff})
                                  </span>
                                {/if}
                              </div>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else if !block.has_mods}
                    <div class="font-mono text-xs text-slate-400">NO DYNAMICS UPDATED</div>
                  {/if}
                  {#if block.physical.trim() || block.non_physical.trim() || block.eternal_physical.trim() || block.eternal_non_physical.trim() || block.new_vectors.length > 0 || block.retrieval?.length > 0}
                    <div class="flex flex-col gap-2 pt-1">
                      {#if block.physical.trim()}
                        <div
                          class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--state-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
                        >
                          <span class="w-24 shrink-0 font-mono text-(--state-dev-accent)">PRESENT PHYSICAL</span>
                          <span class="text-slate-50">{block.physical}</span>
                        </div>
                      {/if}
                      {#if block.non_physical.trim()}
                        <div
                          class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--state-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
                        >
                          <span class="w-24 shrink-0 font-mono text-(--state-dev-accent)">PRESENT NON&#8209;PHYSICAL</span>
                          <span class="text-slate-50">{block.non_physical}</span>
                        </div>
                      {/if}
                      {#if block.eternal_physical.trim()}
                        <div
                          class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--state-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
                        >
                          <span class="w-24 shrink-0 font-mono text-(--state-dev-accent)">ETERNAL PHYSICAL</span>
                          <span class="text-slate-50">{block.eternal_physical}</span>
                        </div>
                      {/if}
                      {#if block.eternal_non_physical.trim()}
                        <div
                          class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--state-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
                        >
                          <span class="w-24 shrink-0 font-mono text-(--state-dev-accent)">ETERNAL NON&#8209;PHYSICAL</span>
                          <span class="text-slate-50">{block.eternal_non_physical}</span>
                        </div>
                      {/if}
                      {#if block.new_vectors.length > 0}
                        <div class="flex flex-col gap-2 pt-1">
                          {#each block.new_vectors as nv, i (i)}
                            <div
                              class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--state-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
                            >
                              <div class="flex flex-wrap items-center gap-2">
                                <span class="w-24 shrink-0 font-mono text-(--state-dev-accent) uppercase">{vector_label(nv.type, "future")}</span>
                              </div>
                              <span class="line-clamp-2 overflow-hidden text-ellipsis text-slate-50">{nv.content}</span>
                            </div>
                          {/each}
                        </div>
                      {/if}
                      {#if block.retrieval?.length > 0}
                        <div class="flex flex-col gap-2 pt-1">
                          {#each block.retrieval as rv (rv.id || rv.content)}
                            <div
                              class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-slate-500 bg-black/20 px-3 py-3 text-xs leading-relaxed"
                            >
                              <div class="flex flex-wrap items-center gap-2">
                                <span class="w-24 shrink-0 font-mono text-slate-500 uppercase">{vector_label(rv.type, "past")}</span>
                              </div>
                              <span class="line-clamp-2 overflow-hidden text-ellipsis text-slate-50">{rv.content}</span>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {:else if meta.type === "DYNAMICS_DELTA"}
            <div class="font-mono text-xs text-slate-400">NO DYNAMICS UPDATED</div>
          {/if}
        {/if}
        <Accordion label="View Raw Data">
          <DataBox maxHeight="calc(var(--spacing-unit) * 60)">
            <pre class="font-mono">{JSON.stringify(meta, null, 2)}</pre>
          </DataBox>
        </Accordion>
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
      box-shadow: 0 0 0 calc(var(--spacing-unit) * 3) color-mix(in srgb, var(--state-dev-accent) 0%, transparent);
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
