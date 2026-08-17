<script>
  import { get_pct } from "@utils";
  import { vector_label } from "./telemetry-format.js";

  /**
   * @typedef {Object} Props
   * @property {Array<any>} entity_blocks
   * @property {(key: string) => string} get_entity_name
   */
  let { entity_blocks, get_entity_name } = $props();
</script>

{#if entity_blocks.length > 0}
  <div class="flex flex-col gap-4">
    {#each entity_blocks as block (block.key)}
      <div class="flex flex-col gap-2">
        <header class="text-xs font-bold tracking-widest text-(--color-dev-accent) uppercase">
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
                      <span class="text-slate-50">{delta.has_delta ? get_pct(delta.new_value) : get_pct(delta.value)}</span>
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
        {#if block.physical.trim() || block.non_physical.trim() || block.eternal_physical.trim() || block.eternal_non_physical.trim() || block.new_vectors.length > 0 || block.retrieval?.length > 0}
          <div class="flex flex-col gap-2 pt-1">
            {#if block.physical.trim()}
              <div
                class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--color-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
              >
                <span class="w-24 shrink-0 font-mono text-(--color-dev-accent)">PRESENT PHYSICAL</span>
                <span class="text-slate-50">{block.physical}</span>
              </div>
            {/if}
            {#if block.non_physical.trim()}
              <div
                class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--color-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
              >
                <span class="w-24 shrink-0 font-mono text-(--color-dev-accent)">PRESENT NON&#8209;PHYSICAL</span>
                <span class="text-slate-50">{block.non_physical}</span>
              </div>
            {/if}
            {#if block.eternal_physical.trim()}
              <div
                class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--color-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
              >
                <span class="w-24 shrink-0 font-mono text-(--color-dev-accent)">ETERNAL PHYSICAL</span>
                <span class="text-slate-50">{block.eternal_physical}</span>
              </div>
            {/if}
            {#if block.eternal_non_physical.trim()}
              <div
                class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--color-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
              >
                <span class="w-24 shrink-0 font-mono text-(--color-dev-accent)">ETERNAL NON&#8209;PHYSICAL</span>
                <span class="text-slate-50">{block.eternal_non_physical}</span>
              </div>
            {/if}
            {#if block.new_vectors.length > 0}
              <div class="flex flex-col gap-2 pt-1">
                {#each block.new_vectors as nv, i (i)}
                  <div
                    class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-(--color-dev-accent) bg-black/40 px-3 py-3 text-xs leading-relaxed"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="w-24 shrink-0 font-mono text-(--color-dev-accent) uppercase">{vector_label(nv.type, "future")}</span>
                    </div>
                    <span class="line-clamp-2 overflow-hidden text-ellipsis text-slate-50">{nv.content}</span>
                  </div>
                {/each}
              </div>
            {/if}
            {#if block.retrieval?.length > 0}
              <div class="flex flex-col gap-2 pt-1">
                {#each block.retrieval as rv (rv.id || rv.content)}
                  <div class="flex gap-4 rounded-sm border-l-8 border-transparent border-l-slate-500 bg-black/20 px-3 py-3 text-xs leading-relaxed">
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
{/if}
