<!--
  @file src/ui/profile/FieldHistoryModal.svelte
  📜 FIELD HISTORY INSPECTOR — Read-side timeline audit & reconstructed field snapshot.
  Powered by query_entity_history and replay_entity_field from @data.
-->
<script>
  import { Modal, Button } from "@primitives";
  import { query_entity_history, replay_entity_field } from "@data";
  import { format_datetime } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {boolean} [open=false]
   * @property {string} entity_id
   * @property {string} [entity_name]
   * @property {string} [field="present.non_physical"]
   */

  /** @type {Props} */
  let { open = $bindable(false), entity_id, entity_name = "Entity", field = "present.non_physical" } = $props();

  let is_loading = $state(false);
  /** @type {Array<any>} */
  let history_records = $state([]);
  let reconstructed_brackets = $state("");
  let reconstructed_prose = $state("");
  let active_tab = $state("timeline"); // "timeline" | "reconstructed"

  $effect(() => {
    if (open && entity_id) {
      load_history();
    }
  });

  async function load_history() {
    is_loading = true;
    try {
      const records = await query_entity_history(entity_id, field);
      history_records = records.reverse(); // newest first

      const replay_result = await replay_entity_field(entity_id, field);
      reconstructed_brackets = replay_result.reconstructed_brackets;
      reconstructed_prose = replay_result.raw_prose;
    } catch (err) {
      console.error("[FieldHistoryModal] Failed to load history:", err);
      history_records = [];
    } finally {
      is_loading = false;
    }
  }
</script>

<Modal
  bind:open
  variant="bare"
  z_index="400"
  class="relative flex max-h-[85vh] w-[clamp(28rem,90vw,48rem)] flex-col rounded-2xl bg-glass-elevated p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] [backdrop-filter:var(--blur-mist)]"
  on_close={() => {
    open = false;
  }}
>
  <div class="flex h-full flex-col gap-4 overflow-hidden font-sans">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <div class="flex flex-col">
        <h4 class="m-0 text-sm font-bold tracking-wider text-cyan-400 uppercase">Mutation Ledger Inspector</h4>
        <span class="font-mono text-xs text-slate-400">
          {entity_name} &bull; <span class="text-cyan-200">{field}</span>
        </span>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex rounded-lg bg-black/40 p-0.5">
          <button
            type="button"
            class="cursor-pointer rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors {active_tab === 'timeline'
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'}"
            onclick={() => (active_tab = "timeline")}
          >
            Timeline ({history_records.length})
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors {active_tab === 'reconstructed'
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'}"
            onclick={() => (active_tab = "reconstructed")}
          >
            Reconstructed State
          </button>
        </div>

        <Button variant="invisible" size="small" square={true} onclick={() => (open = false)} aria-label="Close">
          <svg viewBox="0 0 24 24" class="size-4 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-1 flex-col overflow-y-auto pr-1">
      {#if is_loading}
        <div class="flex h-48 animate-pulse items-center justify-center font-mono text-xs text-cyan-400">Replaying ledger stream...</div>
      {:else if active_tab === "timeline"}
        {#if history_records.length === 0}
          <div class="flex h-48 flex-col items-center justify-center gap-1 font-mono text-xs text-slate-500">
            <span>No ledger events recorded for this field.</span>
            <span class="text-[10px] text-slate-600">Mutations during genesis or turns will appear here.</span>
          </div>
        {:else}
          <div class="flex flex-col gap-2.5 py-1">
            {#each history_records as record (record.id || record.timestamp + "-" + record.round + "-" + record.seq)}
              <div class="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-black/25 p-3 text-xs transition-colors hover:border-cyan-500/20">
                <div class="flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <div class="flex items-center gap-2">
                    <span class="rounded bg-cyan-950/60 px-1.5 py-0.5 font-bold text-cyan-400">
                      R{record.round}:S{record.seq}
                    </span>
                    <span class="text-slate-300 capitalize">{record.writer}</span>
                    {#if record.decider && record.decider !== record.writer}
                      <span class="text-slate-500">via {record.decider}</span>
                    {/if}
                  </div>
                  <span>{format_datetime(record.timestamp)}</span>
                </div>

                <div class="flex items-start gap-2 pt-0.5">
                  {#if record.key}
                    <span class="shrink-0 font-mono text-xs font-semibold text-cyan-300">
                      [{record.key}]
                    </span>
                  {/if}

                  <div class="flex flex-1 flex-col gap-1">
                    {#if record.new_value === null}
                      <span class="font-mono text-xs text-red-400 italic">cleared (null)</span>
                    {:else}
                      <span class="font-mono text-xs text-slate-200">
                        {record.new_value}
                      </span>
                    {/if}

                    {#if record.old_value != null && record.old_value !== record.new_value}
                      <span class="font-mono text-[10px] text-slate-500 line-through">
                        was: {record.old_value}
                      </span>
                    {/if}
                  </div>

                  {#if record.visibility || record.weight}
                    <div class="flex shrink-0 items-center gap-1.5 font-mono text-[10px]">
                      {#if record.visibility === "hide"}
                        <span class="rounded bg-red-950/40 px-1.5 py-0.5 text-red-400">hide</span>
                      {/if}
                      {#if record.weight && record.weight !== 5}
                        <span class="rounded bg-amber-950/40 px-1.5 py-0.5 text-amber-300">w:{record.weight}</span>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <!-- Reconstructed Tab -->
        <div class="flex flex-col gap-3 py-1">
          <div class="flex flex-col gap-1">
            <span class="font-mono text-[11px] font-bold tracking-wider text-slate-300 uppercase"> Replayed Bracket Predicates </span>
            <div class="min-h-24 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed break-words text-cyan-200">
              {reconstructed_brackets || "(empty state)"}
            </div>
          </div>

          {#if reconstructed_prose}
            <div class="flex flex-col gap-1">
              <span class="font-mono text-[11px] font-bold tracking-wider text-slate-300 uppercase"> Replayed Raw Prose </span>
              <div class="min-h-16 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-300">
                {reconstructed_prose}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</Modal>

<!--
CHANGELOG:
- 2026-10-03: Created `FieldHistoryModal.svelte` to provide read-side timeline inspection and reconstructed state display via `query_entity_history` and `replay_entity_field`.
-->
