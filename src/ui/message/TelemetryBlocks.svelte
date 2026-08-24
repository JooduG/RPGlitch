<script>
  import { get_pct } from "@utils";
  import { vector_label } from "./telemetry-format.js";
  import { parse_message } from "./render.js";
  import { safe_html } from "@ui";

  /**
   * @typedef {Object} Props
   * @property {Array<any>} entity_blocks
   * @property {(key: string) => string} get_entity_name
   */
  let { entity_blocks, get_entity_name } = $props();

  const render_text = (txt) => {
    if (!txt) return "";
    return parse_message(txt).displayText;
  };
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
          <div class="flex flex-col gap-1.5 pt-1">
            <!-- 1. ETERNAL -->
            {#if block.eternal_physical.trim()}
              <div class="flex gap-4 rounded-sm border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-2 font-mono text-xs leading-relaxed">
                <span class="w-28 shrink-0 text-(--color-dev-accent) uppercase">ETERNAL PHYSICAL</span>
                <span class="text-slate-200" use:safe_html={render_text(block.eternal_physical)}></span>
              </div>
            {/if}
            {#if block.eternal_non_physical.trim()}
              <div class="flex gap-4 rounded-sm border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-2 font-mono text-xs leading-relaxed">
                <span class="w-28 shrink-0 text-(--color-dev-accent) uppercase">ETERNAL NON&#8209;PHYSICAL</span>
                <span class="text-slate-200" use:safe_html={render_text(block.eternal_non_physical)}></span>
              </div>
            {/if}

            <!-- 2. PRESENT -->
            {#if block.physical.trim()}
              <div class="flex gap-4 rounded-sm border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-2 font-mono text-xs leading-relaxed">
                <span class="w-28 shrink-0 text-(--color-dev-accent) uppercase">PRESENT PHYSICAL</span>
                <span class="text-slate-200" use:safe_html={render_text(block.physical)}></span>
              </div>
            {/if}
            {#if block.non_physical.trim()}
              <div class="flex gap-4 rounded-sm border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-2 font-mono text-xs leading-relaxed">
                <span class="w-28 shrink-0 text-(--color-dev-accent) uppercase">PRESENT NON&#8209;PHYSICAL</span>
                <span class="text-slate-200" use:safe_html={render_text(block.non_physical)}></span>
              </div>
            {/if}

            <!-- 3. FUTURE -->
            {#if block.new_vectors.length > 0}
              {#each block.new_vectors as nv, i (i)}
                <div class="flex gap-4 rounded-sm border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-2 font-mono text-xs leading-relaxed">
                  <span class="w-28 shrink-0 text-(--color-dev-accent) uppercase">{vector_label(nv.type, "future")}</span>
                  <span class="line-clamp-2 overflow-hidden text-ellipsis text-slate-200" use:safe_html={render_text(nv.content)}></span>
                </div>
              {/each}
            {/if}

            <!-- 4. PAST -->
            {#if block.retrieval?.length > 0}
              {#each block.retrieval as rv (rv.id || rv.content)}
                <div class="flex gap-4 rounded-sm border-l-2 border-l-slate-500 bg-black/20 px-3 py-2 font-mono text-xs leading-relaxed">
                  <span class="w-28 shrink-0 text-slate-400 uppercase">{vector_label(rv.type, "past")}</span>
                  <span class="line-clamp-2 overflow-hidden text-ellipsis text-slate-300" use:safe_html={render_text(rv.content)}></span>
                </div>
              {/each}
            {/if}
          </div>
        {/if}
        {#if block.relationships?.length > 0}
          <div class="flex flex-col gap-1.5 pt-1">
            <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">RELATIONAL MUTATIONS</header>
            <div class="flex flex-col gap-1">
              {#each block.relationships as rel, i (i)}
                <div class="flex items-center gap-2 font-mono text-xs text-slate-300">
                  <span class="text-(--color-dev-accent)">{rel.source || "Entity"} → {rel.target || "Target"}:</span>
                  <span class="text-slate-100">{rel.dynamic || rel.content || ""}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
