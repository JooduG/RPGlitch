<script>
  import { vector_label } from "./telemetry-format.js";
  import { parse_message } from "./render.js";
  import { safe_html } from "@ui";

  /**
   * @typedef {Object} Props
   * @property {any} meta
   * @property {Array<any>} forged_vectors
   * @property {(key: string) => string} get_entity_name
   */
  let { meta, forged_vectors, get_entity_name } = $props();

  const render_text = (txt) => {
    if (!txt) return "";
    return parse_message(txt).displayText;
  };
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
        <header class="font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase">Future</header>
        <div class="leading-relaxed text-slate-200" use:safe_html={render_text(meta.future)}></div>
      </div>
    {/if}

    {#if meta.present?.non_physical || meta.present?.physical}
      <div class="flex flex-col gap-2 rounded-sm border border-slate-800 bg-slate-900/40 p-2.5 text-xs">
        <header class="font-mono text-[10px] font-bold tracking-widest text-slate-400 uppercase">Present</header>
        {#if meta.present.non_physical}
          <div class="text-slate-300">
            <span class="font-mono text-slate-500">Non-physical:</span> <span use:safe_html={render_text(meta.present.non_physical)}></span>
          </div>
        {/if}
        {#if meta.present.physical}
          <div class="text-slate-300">
            <span class="font-mono text-slate-500">Physical:</span> <span use:safe_html={render_text(meta.present.physical)}></span>
          </div>
        {/if}
      </div>
    {/if}

    {#if forged_vectors.length > 0}
      <div class="flex flex-col gap-2 pt-1">
        <header
          class="border-b border-(--color-dev-accent)/20 pb-1 font-mono text-[10px] font-bold tracking-widest text-(--color-dev-accent) uppercase"
        >
          Past
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
              <div class="flex-1 text-slate-100" use:safe_html={render_text(v.content)}></div>
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
  <!-- [#] VECTOR RESOLVED (Archival Event) -->
  <div class="flex flex-col gap-2">
    <div>
      <span class="block text-xs font-bold tracking-tight text-slate-50">Memory Vector Resolved</span>
      <p class="mt-1 text-xs text-slate-400">An active intent or temporal anchor has reached narrative fruition.</p>
    </div>

    {#if meta.vector}
      <div
        class="flex gap-2 rounded-sm border border-l-4 border-slate-700 border-l-slate-400 bg-slate-900/60 px-2.5 py-2 text-xs leading-relaxed opacity-60"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-mono text-slate-500 uppercase">{vector_label(meta.vector.type, "past")}</span>
        </div>
        <div class="flex-1 text-slate-300" use:safe_html={render_text(meta.vector.content)}></div>
      </div>
    {/if}

    {#if meta.resolution}
      <p class="font-mono text-[10px] tracking-wide text-slate-400">
        <span class="text-slate-500">RESOLUTION:</span> <span use:safe_html={render_text(meta.resolution)}></span>
      </p>
    {/if}
  </div>
{/if}
