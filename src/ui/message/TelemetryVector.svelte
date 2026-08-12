<script>
  import { vector_label } from "@intelligence";

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
  <div>
    <div class="mb-4">
      <span class="block text-xs font-bold tracking-tight text-slate-50">Consolidating Temporal Echoes</span>
      <p class="mt-2 text-xs text-slate-400">Merging active impulses into persistent memory vectors.</p>
      <p class="mt-2 font-mono text-xs tracking-widest text-(--color-dev-accent)/60 uppercase">
        Forged for {get_entity_name(meta.target)} · from {meta.turns_count || "?"} turns
      </p>
    </div>

    {#if forged_vectors.length > 0}
      <div class="grid grid-cols-2 gap-4 pt-4">
        <div class="col-span-2 mx-auto flex w-full flex-col">
          <header class="border-b border-(--color-dev-accent)/20 pb-1 text-xs font-bold tracking-widest text-(--color-dev-accent) uppercase">
            NEWLY FORGED MEMORIES
          </header>
          <div class="flex flex-col gap-2 pt-2">
            {#each forged_vectors as v, i (v.id || v.content)}
              <div
                class="flex animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both] gap-4 rounded-sm border border-l-8 border-[color-mix(in_srgb,var(--color-dev-accent),transparent_85%)] border-l-slate-600 bg-[color-mix(in_srgb,var(--color-dev-accent),transparent_95%)] px-2 py-2 text-xs leading-relaxed"
                style="animation-delay: {i * 100}ms"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-slate-500">FORGED</span>
                  <span class="font-mono text-slate-500 uppercase">{vector_label(v.type, "past")}</span>
                </div>
                <span class="line-clamp-2 overflow-hidden text-ellipsis text-slate-50">{v.content}</span>
              </div>
            {/each}
          </div>
        </div>
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
