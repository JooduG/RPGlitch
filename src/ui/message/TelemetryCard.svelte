<script>
  /**
   * @file src/ui/message/TelemetryCard.svelte
   * 📊 THE TELEMETRY MODULE
   * Renders internal simulation physics, state changes (deltas), and memory vectors.
   */
  import { Accordion, DataBox } from "@primitives";
  import { runtime } from "@state";
  import { process_entity_blocks, resolve_entity_name } from "./telemetry-format.js";
  import TelemetryBlocks from "./TelemetryBlocks.svelte";
  import TelemetryVector from "./TelemetryVector.svelte";

  /**
   * @typedef {Object} TelemetryMeta
   * @property {string} [type] - The type of telemetry event.
   * @property {Object} [updates] - Normalized per-entity state updates ({ AI_CHARACTER | USER_PERSONA | FRACTAL: { name, present_mutations, eternal_mutations, vectors, dynamics } }).
   * @property {string} [thoughts] - Director think content (markdown; leading `##` headings stripped for display).
   * @property {boolean} [trigger_image] - Whether image generation was triggered this tick.
   * @property {boolean} [image_trigger] - Whether an image beat fired this tick (dynamics gate OR director).
   * @property {string} [image_tier] - The active 4-tier image target (story_entities | story_character | solo_entity | story_scene).
   * @property {string} [image_source] - Which source fired the trigger ("dynamics" | "director").
   * @property {Object} [image_signals] - Dynamics-gate signal details (band_entry, displacement).
   * @property {Object} [vectors] - Forged memory vectors for MEMORY_FORMATION events.
   * @property {string} [target] - Entity key targeted by a MEMORY_FORMATION event.
   * @property {string} [future] - Rewritten standing trajectory for MEMORY_FORMATION events.
   * @property {Object} [present] - Consolidated present conditions for MEMORY_FORMATION events.
   * @property {Object} [eternal] - Consolidated eternal attributes for MEMORY_FORMATION events.
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

  const get_entity_name = (key) => {
    return resolve_entity_name(key, runtime);
  };
</script>

<div
  class="
    w-full
    animate-[slide-in_150ms_cubic-bezier(0.4,0,0.2,1)]
  "
>
  {#if meta.type === "STORY_START"}
    <div class="rounded-sm border border-(--color-dev-accent)/20 bg-(--color-dev-accent)/5 p-4 [backdrop-filter:var(--blur-mist)]">
      <div class="flex items-center gap-2">
        <div class="h-2 w-2 animate-pulse rounded-full bg-(--color-dev-accent) shadow-[0_0_8px_var(--color-dev-accent)]"></div>
        <span class="text-sm font-bold tracking-widest text-(--color-dev-accent) uppercase">Simulation Initiated</span>
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
        {#if meta.type === "MEMORY_FORMATION" || meta.type === "VECTOR_RESOLUTION"}
          <TelemetryVector {meta} {forged_vectors} {get_entity_name} />
        {:else}
          <!-- [S] DEFAULT SIMULATION TELEMETRY -->

          {#if meta.trigger_image === true || meta.image_trigger === true}
            <div class="flex items-center gap-2 rounded-sm border border-(--color-dev-accent)/40 bg-(--color-dev-accent)/10 px-3 py-2">
              <span class="h-2 w-2 animate-pulse rounded-full bg-(--color-dev-accent) shadow-[0_0_8px_var(--color-dev-accent)]"></span>
              <span class="font-mono text-xs font-bold tracking-widest text-(--color-dev-accent) uppercase">Trigger Image</span>
              {#if meta.image_tier}
                <span
                  class="rounded-sm bg-(--color-dev-accent)/20 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase"
                >
                  {meta.image_tier}
                </span>
              {/if}
              {#if meta.image_source}
                <span class="font-mono text-[10px] tracking-widest text-(--color-dev-accent)/60 uppercase">{meta.image_source}</span>
              {/if}
            </div>
          {/if}

          {#if meta.image_signals?.band_entry}
            <div class="flex items-center gap-2 rounded-sm border border-(--color-dev-accent)/30 bg-black/30 px-3 py-1.5">
              <span class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent)/70 uppercase">Band Entry</span>
              <span class="font-mono text-[10px] text-slate-400">
                {meta.image_signals.band_entry.axis}
                {meta.image_signals.band_entry.from} → {meta.image_signals.band_entry.to}
                ({meta.image_signals.band_entry.band})
              </span>
            </div>
          {/if}

          {#if (meta.image_signals?.displacement || 0) > 0 && (meta.image_signals?.displacement || 0) >= (meta.image_signals?.displacement_threshold || 60)}
            <div class="flex items-center gap-2 rounded-sm border border-(--color-dev-accent)/30 bg-black/30 px-3 py-1.5">
              <span class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent)/70 uppercase">Displacement</span>
              <span class="font-mono text-[10px] text-slate-400">{meta.image_signals.displacement}/{meta.image_signals.displacement_threshold}</span>
            </div>
          {/if}

          <!-- [T] PER-ENTITY STATE CHANGES -->
          <TelemetryBlocks {entity_blocks} {get_entity_name} />
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
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-dev-accent) 15%, transparent);
    }

    70% {
      box-shadow: 0 0 0 calc(var(--spacing-unit) * 3) color-mix(in srgb, var(--color-dev-accent) 0%, transparent);
    }

    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-dev-accent) 0%, transparent);
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
