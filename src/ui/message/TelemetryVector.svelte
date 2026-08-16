<script>
  import { vector_label } from "./telemetry.js";

  /**
   * @typedef {Object} Props
   * @property {any} meta
   * @property {Array<any>} forged_vectors
   * @property {(key: string) => string} get_entity_name
   */
  let { meta, forged_vectors, get_entity_name } = $props();
</script>

{#if meta.type === "MEMORY_FORMATION"}
  <!-- [#] WEAVED STATE (Memory Consolidation) -->
  <div class="flex flex-col gap-4">
    <div>
      <span class="block text-xs font-bold tracking-tight text-slate-50">Consolidating Temporal Echoes</span>
      <p class="mt-1 text-xs text-slate-400">Merging active impulses into persistent memory vectors and updated trajectory.</p>
      <p class="mt-1 font-mono text-xs tracking-widest text-(--color-dev-accent)/60 uppercase">
        Forged for {get_entity_name(meta.target)} · from {meta.turns_count || "?"} turns
      </p>
    </div>

    {#if meta.future}
      <div
        class="flex flex-col gap-2 rounded-sm border border-[color-mix(in_srgb,var(--color-dev-accent),transparent_80%)] bg-[color-mix(in_srgb,var(--color-dev-accent),transparent_95%)] p-2.5 text-xs"
      >
        <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">Standing Trajectory (Agenda)</header>
        <p class="leading-relaxed text-slate-200">{meta.future}</p>
      </div>
    {/if}

    {#if meta.present?.non_physical || meta.present?.physical}
      <div class="flex flex-col gap-2 rounded-sm border border-slate-800 bg-slate-900/40 p-2.5 text-xs">
        <header class="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">Consolidated State</header>
        {#if meta.present.non_physical}
          <p class="text-slate-300"><span class="font-mono text-slate-500">Mind:</span> {meta.present.non_physical}</p>
        {/if}
        {#if meta.present.physical}
          <p class="text-slate-300"><span class="font-mono text-slate-500">Look/Body:</span> {meta.present.physical}</p>
        {/if}
      </div>
    {/if}

    {#if forged_vectors.length > 0}
      <div class="flex flex-col gap-2 pt-1">
        <header
          class="border-b border-(--color-dev-accent)/20 pb-1 font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase"
        >
          Historical Memory Anchors
        </header>
        <div class="flex flex-col gap-2">
          {#each forged_vectors as v, i (v.id || v.content)}
            <div
              class="flex animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both] gap-2 rounded-sm border border-l-4 border-[color-mix(in_srgb,var(--color-dev-accent),transparent_85%)] border-l-(--color-dev-accent) bg-[color-mix(in_srgb,var(--color-dev-accent),transparent_95%)] px-2.5 py-2 text-xs leading-relaxed"
              style="animation-delay: {i * 100}ms"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-slate-500 uppercase">{vector_label(v.type, "past")}</span>
              </div>
              <span class="text-slate-200">{v.content}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="font-mono text-[10px] tracking-wide text-slate-500">
        No new permanent historical anchors minted · Active trajectory synchronized with narrative.
      </div>
    {/if}
  </div>
{:else if meta.type === "VECTOR_RESOLUTION"}
  <!-- [#] VECTOR RESOLUTION -->
  <div class="mb-4">
    <span class="block text-xs font-bold tracking-tight text-slate-50">Vector Resolution</span>
    <p class="mt-2 text-xs text-slate-400">A vector has met its fulfillment criteria and been anchored into memory.</p>
  </div>
  <div
    class="flex animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both] gap-4 rounded-sm border border-l-8 border-[color-mix(in_srgb,var(--color-dev-accent),transparent_85%)] border-l-(--color-dev-accent) bg-[color-mix(in_srgb,var(--color-dev-accent),transparent_95%)] px-3 py-3 text-xs leading-relaxed"
  >
    <span class="font-mono text-(--color-dev-accent)">{meta.vector?.emotional_weight || 0}</span>
    <span class="text-slate-50">{meta.vector?.content}</span>
    {#if meta.resolution}
      <span class="ml-auto font-mono text-xs text-(--color-dev-accent)/50">[{meta.resolution}]</span>
    {/if}
  </div>
{/if}
