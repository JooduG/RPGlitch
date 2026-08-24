<script>
  import { vector_label } from "./telemetry-format.js";
  import { parse_message } from "./render.js";
  import { safe_html } from "@ui";

  /**
   * @typedef {Object} Props
   * @property {any} meta
   * @property {Array<any>} forged_vectors
   * @property {(key: string) => string} [get_entity_name]
   */
  let { meta, forged_vectors } = $props();

  const render_text = (txt) => {
    if (!txt) return "";
    return parse_message(txt).displayText;
  };
</script>

{#if meta.type === "MEMORY_FORMATION"}
  <!-- [#] WEAVED STATE (Back Shot Consolidation) -->
  <div class="flex flex-col gap-2.5">
    <!-- 1. ETERNAL -->
    {#if meta.eternal?.physical?.trim() || meta.eternal?.non_physical?.trim()}
      <div class="flex flex-col gap-1.5 rounded-sm border border-electric-cyan/15 bg-black/40 p-2.5 font-mono text-xs">
        <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">ETERNAL</header>
        {#if meta.eternal?.physical?.trim()}
          <div class="text-slate-200">
            <span class="text-slate-400">Physical:</span> <span use:safe_html={render_text(meta.eternal.physical)}></span>
          </div>
        {/if}
        {#if meta.eternal?.non_physical?.trim()}
          <div class="text-slate-200">
            <span class="text-slate-400">Non-physical:</span> <span use:safe_html={render_text(meta.eternal.non_physical)}></span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- 2. PRESENT -->
    {#if meta.present?.physical?.trim() || meta.present?.non_physical?.trim()}
      <div class="flex flex-col gap-1.5 rounded-sm border border-electric-cyan/15 bg-black/40 p-2.5 font-mono text-xs">
        <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">PRESENT</header>
        {#if meta.present?.physical?.trim()}
          <div class="text-slate-200">
            <span class="text-slate-400">Physical:</span> <span use:safe_html={render_text(meta.present.physical)}></span>
          </div>
        {/if}
        {#if meta.present?.non_physical?.trim()}
          <div class="text-slate-200">
            <span class="text-slate-400">Non-physical:</span> <span use:safe_html={render_text(meta.present.non_physical)}></span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- 3. FUTURE -->
    {#if meta.future?.trim()}
      <div class="flex flex-col gap-1.5 rounded-sm border border-electric-cyan/15 bg-black/40 p-2.5 font-mono text-xs">
        <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">FUTURE</header>
        <div class="leading-relaxed text-slate-200" use:safe_html={render_text(meta.future)}></div>
      </div>
    {/if}

    <!-- 4. PAST -->
    {#if forged_vectors.length > 0}
      <div class="flex flex-col gap-1.5 rounded-sm border border-electric-cyan/15 bg-black/40 p-2.5 font-mono text-xs">
        <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">PAST</header>
        <div class="flex flex-col gap-1.5">
          {#each forged_vectors as v, i (v.id || v.content)}
            <div
              class="flex animate-[slide-in_300ms_cubic-bezier(0.4,0,0.2,1)_both] gap-2 rounded-sm border-l-2 border-l-(--color-dev-accent) bg-white/5 px-2 py-1.5 leading-relaxed"
              style="animation-delay: {i * 100}ms"
            >
              <span class="shrink-0 text-slate-400 uppercase">{vector_label(v.type, "past")}:</span>
              <span class="flex-1 text-slate-200" use:safe_html={render_text(v.content)}></span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 5. RELATIONAL MUTATIONS -->
    {#if meta.relationships?.length > 0}
      <div class="flex flex-col gap-1.5 rounded-sm border border-electric-cyan/15 bg-black/40 p-2.5 font-mono text-xs">
        <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">RELATIONAL MUTATIONS</header>
        <div class="flex flex-col gap-1">
          {#each meta.relationships as rel, i (i)}
            <div class="flex items-center gap-2 text-slate-300">
              <span class="text-(--color-dev-accent)">{rel.source || "Entity"} → {rel.target || "Target"}:</span>
              <span class="text-slate-100">{rel.dynamic || rel.content || ""}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{:else if meta.type === "VECTOR_RESOLUTION"}
  <!-- [#] VECTOR RESOLVED (Archival Event) -->
  <div class="flex flex-col gap-2 rounded-sm border border-electric-cyan/15 bg-black/40 p-2.5 font-mono text-xs">
    <div class="flex items-center gap-2">
      <span class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">Memory Vector Resolved</span>
    </div>

    {#if meta.vector}
      <div class="flex gap-2 rounded-sm border-l-2 border-l-slate-500 bg-white/5 px-2 py-1.5 leading-relaxed text-slate-300">
        <span class="shrink-0 text-slate-400 uppercase">{vector_label(meta.vector.type, "past")}:</span>
        <span class="flex-1" use:safe_html={render_text(meta.vector.content)}></span>
      </div>
    {/if}

    {#if meta.resolution}
      <p class="text-[10px] text-slate-400">
        <span class="text-slate-500">RESOLUTION:</span> <span use:safe_html={render_text(meta.resolution)}></span>
      </p>
    {/if}
  </div>
{/if}
