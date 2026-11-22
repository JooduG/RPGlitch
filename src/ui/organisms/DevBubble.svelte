<script module>
  /**
   * @file src/ui/organisms/DevBubble.svelte
   * DEVMODE system telemetry card (STORY_START, DYNAMICS_DELTA,
   * CONTINUUM_FORMATION, MEMORY_FORMATION, VECTOR_RESOLUTION).
   */
  import { format_tagged_fields, parse_tagged_fields as parse_bracket_entries } from "@simulation";
  import { get_percentage, safe_html } from "@utils";
  import { parse_message } from "./ChatBubble.svelte";

  const ENTITY_KEYS = { AI_CHARACTER: "ai", USER_PERSONA: "user", FRACTAL: "fractal" };

  /**
   * Resolves a telemetry entity key to its display name - the runtime's active
   * entity when available, otherwise a static label. Unknown keys pass through.
   * @param {string} key
   * @param {{ active_ai?: any, active_user?: any, active_fractal?: any, active_npcs?: Record<string, any> }} [runtime]
   * @returns {string}
   */
  export function resolve_entity_name(key, runtime) {
    const map = {
      AI_CHARACTER: () => runtime?.active_ai?.name || "AI CHARACTER",
      USER_PERSONA: () => runtime?.active_user?.name || "USER PERSONA",
      FRACTAL: () => runtime?.active_fractal?.name || "FRACTAL",
      ai: () => runtime?.active_ai?.name || "AI CHARACTER",
      user: () => runtime?.active_user?.name || "USER PERSONA",
      fractal: () => runtime?.active_fractal?.name || "FRACTAL",
    };
    const resolver = map[key];
    if (resolver) return resolver();
    if (runtime?.active_npcs?.[key]?.name) {
      return runtime.active_npcs[key].name;
    }
    return String(key ?? "");
  }

  /**
   * Derives the title label for a telemetry card based on event type and metadata.
   * @param {any} meta
   * @param {{ active_ai?: any, active_user?: any, active_fractal?: any, active_npcs?: Record<string, any> }} [_runtime]
   * @returns {string}
   */
  export function get_telemetry_label(meta, _runtime) {
    if (meta?.type === "STORY_START") {
      return "Simulation initiated";
    }
    if (meta?.type === "MEMORY_FORMATION" || meta?.type === "CONTINUUM_FORMATION") {
      const raw = String(meta.target ?? "ENTITY").toUpperCase();
      const turns = meta.turns_count ? ` from ${meta.turns_count} turns` : "";
      return `Caretaker turn: ${raw}${turns}`;
    }
    if (meta?.type === "VECTOR_RESOLUTION") {
      return "Vector resolution";
    }
    return "Director turn";
  }

  export function vector_label(type, fallback = "past") {
    if (type == null) return fallback === "memory" || fallback === "past" ? "PAST" : fallback.toUpperCase();
    const t = String(type).toUpperCase();
    if (t === "PAST" || t === "MEMORY") return "PAST";
    if (t === "FUTURE" || t === "AGENDUM") return "FUTURE";
    if (t === "PRESENT") return "PRESENT";
    if (t === "ETERNAL") return "ETERNAL";
    return t;
  }

  /**
   * Cleans comma debris, double commas, and leading/trailing punctuation from prose strings.
   * @param {any} text
   * @returns {string}
   */
  export function clean_text_debris(text) {
    if (text == null) return "";
    let s = String(text).trim();
    s = s.replace(/^[\s,;]+/g, "");
    s = s.replace(/,(\s*,)+/g, ",");
    s = s.replace(/[\s,;]+$/g, "");
    return s.trim();
  }

  /**
   * Projects a DYNAMICS_DELTA `updates` map into renderable per-entity blocks.
   * @param {any} meta
   * @returns {Array<any>}
   */
  export function process_entity_blocks(meta) {
    const updates = meta?.updates && typeof meta.updates === "object" ? meta.updates : {};
    const blocks = [];
    for (const [key, raw] of Object.entries(updates)) {
      if (!raw || typeof raw !== "object") continue;
      const block_key = ENTITY_KEYS[key];
      if (!block_key) continue;

      const dynamics = (Array.isArray(raw.dynamics) ? raw.dynamics : []).map((d) => ({
        axis: d.axis,
        value: d.new_value,
        old_value: d.old_value,
        new_value: d.new_value,
        diff: d.diff,
        has_delta: true,
      }));

      const new_vectors = (Array.isArray(raw.vectors?.new) ? raw.vectors.new : []).map((v) => ({
        type: v.type,
        weight: v.emotional_weight,
        ...(v.id ? { id: v.id } : {}),
        content: clean_text_debris(v.content),
      }));

      const retrieval = (Array.isArray(raw.vectors?.retrieval) ? raw.vectors.retrieval : []).map((v) => ({
        type: v.type,
        id: v.id,
        content: clean_text_debris(v.content),
        relevance: v._relevance,
      }));

      const physical = clean_text_debris(raw.present_mutations?.physical ?? "");
      const non_physical = clean_text_debris(raw.present_mutations?.non_physical ?? "");
      const eternal_physical = clean_text_debris(raw.eternal_mutations?.physical ?? "");
      const eternal_non_physical = clean_text_debris(raw.eternal_mutations?.non_physical ?? "");
      const has_mods = !!eternal_physical || !!eternal_non_physical;

      if (!dynamics.length && !new_vectors.length && !retrieval.length && !physical && !non_physical && !eternal_physical && !eternal_non_physical) {
        continue;
      }

      blocks.push({
        key: block_key,
        name: raw.name || resolve_entity_name(key, {}),
        physical,
        non_physical,
        eternal_physical,
        eternal_non_physical,
        dynamics,
        new_vectors,
        retrieval,
        has_mods,
      });
    }
    return blocks;
  }
</script>

<script>
  import { Accordion, Icon } from "@atoms";
  import { MacroText } from "@molecules";
  import { app, session } from "@state";

  /**
   * @typedef {Object} Props
   * @property {Record<string, any>} [meta={}]
   * @property {Date} [timestamp=new Date()]
   */

  /** @type {Props} */
  let { meta = {}, timestamp = new Date() } = $props();

  let time_label = $derived(timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  let telemetry_card_label = $derived(meta ? get_telemetry_label(meta, session) : "");
  let consolidated_vectors = $derived(
    Array.isArray(meta?.vectors) ? meta.vectors
    : Array.isArray(meta?.past) ? meta.past
    : Array.isArray(meta?.memories) ? meta.memories
    : [],
  );

  const DIRECTOR_AXES = ["chaos", "intensity", "openness", "affinity", "velocity", "entropy"];
  let director_deltas = $derived(meta?.deltas && typeof meta.deltas === "object" ? meta.deltas : null);
  let director_levels = $derived(meta?.levels && typeof meta.levels === "object" ? meta.levels : null);
  let director_rows = $derived.by(() => {
    if (!director_deltas) return [];
    return DIRECTOR_AXES.filter((axis) => director_deltas[axis] !== undefined).map((axis) => {
      const delta = Number(director_deltas[axis]) || 0;
      const level = director_levels?.[axis] !== undefined ? Number(director_levels[axis]) : null;
      const fill = level != null && Number.isFinite(level) ? get_percentage(level) : Math.min(100, Math.abs(delta) * 10);
      return { axis, delta, level, fill };
    });
  });

  const get_entity_name = (key) => resolve_entity_name(key, session);

  const render_telemetry_text = (txt) => {
    if (!txt) return "";
    return parse_message(format_tagged_fields(clean_text_debris(txt), { see_hidden: "all" })).displayText;
  };

  function extract_bracket_items(text_or_obj) {
    if (!text_or_obj) return [];
    const raw = typeof text_or_obj === "string" ? text_or_obj : `${text_or_obj.physical || ""} ${text_or_obj.non_physical || ""}`.trim();
    if (!raw) return [];
    const entries = parse_bracket_entries(raw);
    if (entries.length > 0) {
      return entries
        .filter((e) => {
          const vis = e.visibility || (e.flags?.hide ? "hide" : null);
          if (vis === "hide" || e.flags?.hide || e.hide) return false;
          return true;
        })
        .map((e) => ({ key: String(e.key || "").toUpperCase(), value: String(e.value ?? "").trim() }))
        .filter((it) => it.key || it.value);
    }
    return [{ key: "", value: raw }];
  }
</script>

{#snippet temporal_quadrant(label, items, isMuted = false)}
  {@const list = Array.isArray(items) ? items : [items]}
  {@const chip_items = list
    .filter(Boolean)
    .map((it) => {
      if (typeof it === "string") return { key: "", value: it };
      if (it.key !== undefined || it.value !== undefined) return { key: it.key || "", value: it.value ?? "" };
      return { key: "", value: it.content || it.directive || "" };
    })
    .filter((it) => clean_text_debris(it.value))}
  {#if chip_items.length > 0}
    <div
      class="flex gap-standard rounded border-l-2 px-3 py-tight type-data {isMuted ? 'border-l-slate-500 bg-black/20' : (
        'border-l-(--color-dev-accent) bg-black/40'
      )}">
      <span class="inline-flex w-28 shrink-0 items-center gap-1.5 uppercase {isMuted ? 'text-slate-400' : 'text-dev-accent'}">
        <Icon name={label.toLowerCase().startsWith("past") ? "past" : label.toLowerCase()} class="size-3.5 shrink-0" />
        {label}
      </span>
      <div class="flex flex-1 flex-wrap gap-tight {isMuted ? 'text-slate-300' : 'text-slate-200'}">
        {#each chip_items as item, i (i)}
          {#if item.key}
            <span class="inline-flex max-w-full items-baseline gap-tight rounded border border-white/10 bg-white/5 px-2.5 py-1">
              <span class="shrink-0 type-uppercase-label text-dev-accent">{item.key}</span>
              <span class="min-w-0 text-slate-100">
                <MacroText text={item.value} entities={session.display_entities} on_select={(ent) => app.open_profile(ent)} />
              </span>
            </span>
          {:else}
            <div class="w-full">
              <span><MacroText text={item.value} entities={session.display_entities} on_select={(ent) => app.open_profile(ent)} /></span>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
{/snippet}

{#if app.settings.dev_mode}
  <div class="relative flex w-full justify-center p-standard transition duration-200" data-testid="dev-bubble">
    <div class="w-[calc(var(--spacing-column-unit)*6)]">
      <div
        class="group relative flex w-full min-w-0 flex-col overflow-hidden rounded border border-transparent bg-[color-mix(in_srgb,var(--signature-color)_5%,rgba(15,15,15,0.7))] shadow-[0_8px_32px_rgba(0,0,0,0.5)] [backdrop-filter:var(--blur-mist)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)] before:mask-border-solid before:p-px before:opacity-30 before:content-['']!"
        style="--signature-color: var(--color-dev-accent);">
        {#if telemetry_card_label}
          <!-- display:flex inline: unlayered normalize.css v3 resets header to block, defeating Tailwind's layered flex utility -->
          <header
            style="display: flex;"
            class="flex min-h-10 items-center gap-tight border-b border-white/10 px-standard py-tight type-uppercase-label text-dev-accent">
            <span class="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-dev-accent shadow-[0_0_6px_var(--color-dev-accent)]"></span>
            <span class="min-w-0 translate-y-[1px] truncate">{telemetry_card_label}</span>
            <span class="ml-auto shrink-0 translate-y-[1px] type-data text-white/40">{time_label}</span>
          </header>
        {/if}
        <div class="p-standard">
          <div class="flex flex-col gap-standard">
            {#if meta.type === "STORY_START"}
              <p class="type-data text-slate-300">The simulation engine has anchored a new narrative sequence.</p>
            {:else}
              {#if meta.trigger_image === true || meta.image_trigger === true}
                <div class="flex flex-wrap items-center gap-tight rounded border border-(--color-dev-accent)/20 bg-black/40 px-3 py-tight text-xs">
                  <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-dev-accent shadow-[0_0_6px_var(--color-dev-accent)]"></span>
                  <span class="type-uppercase-label text-dev-accent">Trigger Image</span>
                  {#if meta.image_tier}
                    <span class="rounded bg-dev-accent/15 px-1.5 py-0.5 type-uppercase-label text-dev-accent">
                      {meta.image_tier}
                    </span>
                  {/if}
                  {#if meta.image_source}
                    <span class="type-uppercase-label text-slate-400">({meta.image_source})</span>
                  {/if}
                  {#if meta.image_signals?.band_entry}
                    <span class="type-data text-slate-400">
                      · Band: {meta.image_signals.band_entry.axis}
                      {meta.image_signals.band_entry.from} → {meta.image_signals.band_entry.to} ({meta.image_signals.band_entry.band})
                    </span>
                  {/if}
                  {#if (meta.image_signals?.displacement || 0) > 0 && (meta.image_signals?.displacement || 0) >= (meta.image_signals?.displacement_threshold || 50)}
                    <span class="type-data text-slate-400">
                      · Displacement: {meta.image_signals.displacement}/{meta.image_signals.displacement_threshold}
                    </span>
                  {/if}
                </div>
              {/if}

              {#if director_rows.length > 0}
                <div class="grid grid-cols-2 gap-standard">
                  {#each director_rows as row (row.axis)}
                    <div class="flex items-center justify-between gap-standard">
                      <span class="min-w-20 text-xs text-slate-400 lowercase">{row.axis}</span>
                      <div class="flex flex-1 items-center gap-standard">
                        <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                          <div class="absolute h-full" style="left: 0%; width: {row.fill}%; background: var(--color-dev-accent);"></div>
                        </div>
                        <div class="flex min-w-16 items-center justify-end gap-tight type-data">
                          <span class="text-frisk">{row.level != null ? get_percentage(row.level) : `${row.delta > 0 ? "+" : ""}${row.delta}`}</span>
                          {#if row.level != null}
                            <span
                              class={row.delta > 0 ? "text-dev-accent"
                              : row.delta < 0 ? "text-slate-500"
                              : "text-slate-500"}>
                              ({row.delta > 0 ? "+" : ""}{row.delta})
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}

              {#if meta.thoughts}
                <div class="flex gap-standard rounded border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-tight type-data">
                  <span class="w-28 shrink-0 text-dev-accent uppercase">Thoughts</span>
                  <span class="flex-1 text-slate-200">{meta.thoughts}</span>
                </div>
              {/if}
              {#if meta.camera_note}
                <div class="flex gap-standard rounded border-l-2 border-l-(--color-dev-accent) bg-black/40 px-3 py-tight type-data">
                  <span class="w-28 shrink-0 text-dev-accent uppercase">Camera</span>
                  <span class="flex-1 text-slate-200">{meta.camera_note}</span>
                </div>
              {/if}

              {#if meta.type === "CONTINUUM_FORMATION" || meta.type === "MEMORY_FORMATION"}
                <p class="type-data text-slate-400">
                  Updated brackets merged into {get_entity_name(meta.target) || String(meta.target || "target entity")}’s profile fields.
                </p>
                <div class="flex flex-col gap-tight pb-tight">
                  {@render temporal_quadrant("ETERNAL", extract_bracket_items(meta.eternal))}
                  {@render temporal_quadrant("PRESENT", extract_bracket_items(meta.present))}
                  {@render temporal_quadrant("FUTURE", extract_bracket_items(meta.future))}

                  {#if consolidated_vectors.length > 0}
                    {@render temporal_quadrant(
                      "PAST",
                      consolidated_vectors.map((v) => v.content || v.directive),
                    )}
                  {/if}
                </div>
              {/if}

              {#if meta.type === "VECTOR_RESOLUTION"}
                <div class="flex flex-col gap-tight pb-tight">
                  {#if meta.vector}
                    {@render temporal_quadrant(vector_label(meta.vector.type, "past"), [meta.vector.content], true)}
                  {/if}
                  {#if meta.resolution}
                    <div class="flex gap-standard rounded border-l-2 border-l-slate-500 bg-black/20 px-3 py-tight type-data">
                      <span class="w-28 shrink-0 text-slate-400 uppercase">RESOLUTION</span>
                      <span class="flex-1 text-slate-300" use:safe_html={render_telemetry_text(meta.resolution)}></span>
                    </div>
                  {/if}
                </div>
              {/if}

              <Accordion label="View Raw Data">
                <div class="terminal-box max-h-60 overflow-y-auto bg-black/10 p-standard text-sm">
                  <pre class="m-0 font-[inherit] text-xs whitespace-pre-wrap">{JSON.stringify(meta, null, 2)}</pre>
                </div>
              </Accordion>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
