<!--
  src/ui/message/TelemetryCard.svelte
  =============================================================================
  📊 UNIFIED TELEMETRY MODULE — Simulation Physics & Memory Vectors
  =============================================================================
  Renders internal simulation physics, dynamics deltas, and memory vectors
  across Quick Shot, Back Shot, and Vector Resolution events using standardized
  sleek left-accented rows and bar gauges.
-->
<script>
  import { Accordion, DataBox } from "@primitives";
  import { runtime } from "@state";
  import { get_percentage } from "@utils";
  import { safe_html } from "@ui";
  import { strip_bracket_engine_flags } from "@intelligence";
  import { parse_message } from "./render.js";
  import {
    get_telemetry_label,
    process_entity_blocks,
    resolve_entity_name,
    vector_label,
    parse_relationship_edge,
    clean_text_debris,
  } from "./telemetry-format.js";

  /**
   * @typedef {Object} TelemetryMeta
   * @property {string} [type] - The type of telemetry event.
   * @property {Object} [updates] - Normalized per-entity state updates.
   * @property {string} [thoughts] - Director think content.
   * @property {boolean} [trigger_image] - Whether image generation was triggered this tick.
   * @property {boolean} [image_trigger] - Whether an image beat fired this tick.
   * @property {string} [image_tier] - The active 4-tier image target.
   * @property {string} [image_source] - Which source fired the trigger.
   * @property {Object} [image_signals] - Dynamics-gate signal details.
   * @property {Object} [vectors] - Forged memory vectors for MEMORY_FORMATION events.
   * @property {Array} [memories] - Alternate carrier for memory vectors.
   * @property {string} [target] - Entity key targeted by a MEMORY_FORMATION event.
   * @property {string} [future] - Rewritten standing trajectory for MEMORY_FORMATION events.
   * @property {Object} [present] - Consolidated present conditions for MEMORY_FORMATION events.
   * @property {Object} [eternal] - Consolidated eternal attributes for MEMORY_FORMATION events.
   * @property {Array} [relationships] - Direct relational mutations.
   * @property {string} [thought_process] - Thought process for MEMORY_FORMATION events.
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

  let forged_vectors = $derived(Array.isArray(meta.vectors) ? meta.vectors : Array.isArray(meta.memories) ? meta.memories : []);

  let entity_blocks = $derived(process_entity_blocks(meta));

  let card_label = $derived(get_telemetry_label(meta, runtime));

  let back_shot_relationships = $derived(
    Array.isArray(meta.relationships)
      ? meta.relationships.map(parse_relationship_edge).filter((r) => r !== null && (r.source !== "Entity" || r.target !== "Target" || r.dynamic))
      : [],
  );

  const get_entity_name = (key) => {
    return resolve_entity_name(key, runtime);
  };

  const render_text = (txt) => {
    if (!txt) return "";
    return parse_message(strip_bracket_engine_flags(clean_text_debris(txt))).displayText;
  };
</script>

{#snippet temporalRow(label, content, isMuted = false)}
  {#if clean_text_debris(content)}
    <div
      class="flex gap-4 rounded-sm border-l-2 px-3 py-2 font-mono text-xs leading-relaxed {isMuted
        ? 'border-l-slate-500 bg-black/20'
        : 'border-l-(--color-dev-accent) bg-black/40'}"
    >
      <span class="w-28 shrink-0 uppercase {isMuted ? 'text-slate-400' : 'text-(--color-dev-accent)'}">{label}</span>
      <span class="flex-1 {isMuted ? 'text-slate-300' : 'text-slate-200'}" use:safe_html={render_text(content)}></span>
    </div>
  {/if}
{/snippet}

<div class="w-full animate-[slide-in_150ms_cubic-bezier(0.4,0,0.2,1)]">
  {#if meta.type === "STORY_START"}
    <div class="rounded-sm border border-(--color-dev-accent)/20 bg-(--color-dev-accent)/5 p-4 [backdrop-filter:var(--blur-mist)]">
      <div class="flex items-center gap-2">
        <div class="h-2 w-2 animate-pulse rounded-full bg-(--color-dev-accent) shadow-[0_0_8px_var(--color-dev-accent)]"></div>
        <span class="text-sm font-bold tracking-widest text-(--color-dev-accent) uppercase">Simulation Initiated</span>
      </div>
      <p class="mt-2 font-mono text-xs text-slate-300">The simulation engine has anchored a new narrative sequence.</p>
    </div>
  {:else}
    <DataBox label={card_label} height="auto" isResonating={meta.type === "MEMORY_FORMATION" || meta.type === "VECTOR_RESOLUTION"}>
      <div class="flex flex-col gap-4">
        <!-- 1. IMAGE TRIGGER INDICATOR -->
        {#if meta.trigger_image === true || meta.image_trigger === true}
          <div class="flex flex-wrap items-center gap-2 rounded-sm border border-(--color-dev-accent)/20 bg-black/40 px-3 py-2 text-xs">
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-(--color-dev-accent) shadow-[0_0_6px_var(--color-dev-accent)]"></span>
            <span class="font-mono font-bold tracking-widest text-(--color-dev-accent) uppercase">Trigger Image</span>
            {#if meta.image_tier}
              <span
                class="rounded-sm bg-(--color-dev-accent)/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase"
              >
                {meta.image_tier}
              </span>
            {/if}
            {#if meta.image_source}
              <span class="font-mono text-[10px] tracking-widest text-slate-400 uppercase">({meta.image_source})</span>
            {/if}
            {#if meta.image_signals?.band_entry}
              <span class="font-mono text-[10px] text-slate-400">
                · Band: {meta.image_signals.band_entry.axis}
                {meta.image_signals.band_entry.from} → {meta.image_signals.band_entry.to} ({meta.image_signals.band_entry.band})
              </span>
            {/if}
            {#if (meta.image_signals?.displacement || 0) > 0 && (meta.image_signals?.displacement || 0) >= (meta.image_signals?.displacement_threshold || 60)}
              <span class="font-mono text-[10px] text-slate-400">
                · Displacement: {meta.image_signals.displacement}/{meta.image_signals.displacement_threshold}
              </span>
            {/if}
          </div>
        {/if}

        <!-- 2. QUICK SHOT: PER-ENTITY STATE CHANGES -->
        {#if entity_blocks.length > 0}
          <div class="flex flex-col gap-4">
            {#each entity_blocks as block (block.key)}
              <div class="flex flex-col gap-2">
                <header class="text-xs font-bold tracking-widest text-(--color-dev-accent) uppercase">
                  {block.name || get_entity_name(block.key)}
                </header>

                <!-- DYNAMICS BAR GAUGES -->
                {#if block.dynamics.length > 0}
                  <div class="grid grid-cols-2 gap-4">
                    {#each block.dynamics as delta (delta.axis)}
                      {@const fill_width = delta.has_delta
                        ? Math.min(get_percentage(delta.old_value), get_percentage(delta.new_value))
                        : get_percentage(delta.value)}
                      {@const delta_width = delta.has_delta ? Math.abs(get_percentage(delta.new_value) - get_percentage(delta.old_value)) : 0}
                      <div class="flex items-center justify-between gap-4">
                        <span class="min-w-20 text-xs text-slate-400 lowercase">{delta.axis}</span>
                        <div class="flex flex-1 items-center gap-4">
                          <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                            <div
                              class="absolute h-full transition-all duration-300"
                              style="left: 0%; width: {fill_width}%; background: var(--color-dev-accent);"
                            ></div>
                            {#if delta.has_delta}
                              <div
                                class="absolute z-10 h-full opacity-40 transition-all duration-300"
                                style="left: {fill_width}%; width: {delta_width}%; background: var(--color-dev-accent);"
                              ></div>
                            {/if}
                          </div>
                          <div class="flex flex-col items-end gap-0.5">
                            <div class="flex min-w-16 items-center justify-end gap-2 font-mono text-xs">
                              <span class="text-slate-50">{delta.has_delta ? get_percentage(delta.new_value) : get_percentage(delta.value)}</span>
                              {#if delta.has_delta}
                                <span class={delta.diff > 0 ? "text-(--color-dev-accent)" : "text-slate-500"}>
                                  ({delta.diff > 0 ? "+" : ""}{delta.diff})
                                </span>
                              {/if}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}

                <!-- TEMPORAL ROWS -->
                {#if block.physical || block.non_physical || block.eternal_physical || block.eternal_non_physical || block.new_vectors.length > 0 || block.retrieval?.length > 0}
                  <div class="flex flex-col gap-1.5 pt-1">
                    {@render temporalRow("ETERNAL PHYSICAL", block.eternal_physical)}
                    {@render temporalRow("ETERNAL NON-PHYSICAL", block.eternal_non_physical)}
                    {@render temporalRow("PRESENT PHYSICAL", block.physical)}
                    {@render temporalRow("PRESENT NON-PHYSICAL", block.non_physical)}

                    {#if block.new_vectors.length > 0}
                      {#each block.new_vectors as nv, i (i)}
                        {@render temporalRow(vector_label(nv.type, "memory"), nv.content)}
                      {/each}
                    {/if}

                    {#if block.retrieval?.length > 0}
                      {#each block.retrieval as rv (rv.id || rv.content)}
                        {@render temporalRow(vector_label(rv.type, "past"), rv.content, true)}
                      {/each}
                    {/if}
                  </div>
                {/if}

                <!-- RELATIONAL MUTATIONS -->
                {#if block.relationships?.length > 0}
                  <div class="flex flex-col gap-1.5 pt-1">
                    <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">RELATIONAL MUTATIONS</header>
                    <div class="flex flex-col gap-1">
                      {#each block.relationships as rel, i (i)}
                        <div class="flex items-center gap-2 font-mono text-xs text-slate-300">
                          <span class="text-(--color-dev-accent)">{rel.source} → {rel.target}:</span>
                          <span class="text-slate-100">{rel.dynamic}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <!-- 3. BACK SHOT: MEMORY FORMATION -->
        {#if meta.type === "MEMORY_FORMATION"}
          <div class="flex flex-col gap-1.5 pt-1">
            {@render temporalRow("ETERNAL PHYSICAL", meta.eternal?.physical)}
            {@render temporalRow("ETERNAL NON-PHYSICAL", meta.eternal?.non_physical)}
            {@render temporalRow("PRESENT PHYSICAL", meta.present?.physical)}
            {@render temporalRow("PRESENT NON-PHYSICAL", meta.present?.non_physical)}
            {@render temporalRow("FUTURE AGENDUM", meta.future)}

            {#if forged_vectors.length > 0}
              {#each forged_vectors as v, i (v.id || v.content || i)}
                {@render temporalRow(vector_label(v.type, "past"), v.content || v.directive)}
              {/each}
            {/if}

            {#if back_shot_relationships.length > 0}
              <div class="flex flex-col gap-1.5 pt-2">
                <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">RELATIONAL MUTATIONS</header>
                <div class="flex flex-col gap-1">
                  {#each back_shot_relationships as rel, i (i)}
                    <div class="flex items-center gap-2 font-mono text-xs text-slate-300">
                      <span class="text-(--color-dev-accent)">{rel.source} → {rel.target}:</span>
                      <span class="text-slate-100">{rel.dynamic}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- 4. VECTOR RESOLUTION -->
        {#if meta.type === "VECTOR_RESOLUTION"}
          <div class="flex flex-col gap-1.5 pt-1">
            {#if meta.vector}
              {@render temporalRow(vector_label(meta.vector.type, "past"), meta.vector.content, true)}
            {/if}
            {#if meta.resolution}
              <div class="flex gap-4 rounded-sm border-l-2 border-l-slate-500 bg-black/20 px-3 py-2 font-mono text-xs leading-relaxed">
                <span class="w-28 shrink-0 text-slate-400 uppercase">RESOLUTION</span>
                <span class="flex-1 text-slate-300" use:safe_html={render_text(meta.resolution)}></span>
              </div>
            {/if}
          </div>
        {/if}

        <!-- 5. RAW DATA ACCORDION -->
        <Accordion label="View Raw Data">
          <DataBox maxHeight="calc(var(--spacing-unit) * 60)">
            <pre class="font-mono">{JSON.stringify(meta, null, 2)}</pre>
          </DataBox>
        </Accordion>
      </div>
    </DataBox>
  {/if}
</div>

<!--
  CHANGELOG
  - 2026-10-28: Consolidated TelemetryCard — merged TelemetryBlocks and TelemetryVector into a unified component using standardized left-accented rows for all temporal quadrants; added edge parsing and debris stripping.
-->

<style>
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
