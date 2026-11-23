<script module>
  /**
   * @file src/ui/organisms/DevBubble.svelte
   * DEVMODE system telemetry card (STORY_START, DYNAMICS_DELTA,
   * CONTINUUM_FORMATION, MEMORY_FORMATION, VECTOR_RESOLUTION).
   */
  import { format_tagged_fields, parse_tagged_fields as parse_bracket_entries } from "@simulation";
  import { get_percentage, safe_html } from "@utils";
  import { parse_message } from "@simulation";

  const ENTITY_KEYS = { AI_CHARACTER: "ai", USER_PERSONA: "user", FRACTAL: "fractal" };
  const DIRECTOR_AXES = ["chaos", "intensity", "openness", "affinity", "velocity", "entropy"];

  export function resolve_entity_name(key, runtime) {
    const map = {
      AI_CHARACTER: () => runtime?.active_ai?.name || "AI CHARACTER",
      USER_PERSONA: () => runtime?.active_user?.name || "USER PERSONA",
      FRACTAL: () => runtime?.active_fractal?.name || "FRACTAL",
      ai: () => runtime?.active_ai?.name || "AI CHARACTER",
      user: () => runtime?.active_user?.name || "USER PERSONA",
      fractal: () => runtime?.active_fractal?.name || "FRACTAL",
    };
    if (map[key]) return map[key]();
    return runtime?.active_npcs?.[key]?.name || String(key ?? "");
  }

  export function get_telemetry_label(meta) {
    if (meta?.type === "STORY_START") return "Simulation initiated";
    if (meta?.type === "MEMORY_FORMATION" || meta?.type === "CONTINUUM_FORMATION") {
      const raw = String(meta.target ?? "ENTITY").toUpperCase();
      return `Caretaker turn: ${raw}${meta.turns_count ? ` from ${meta.turns_count} turns` : ""}`;
    }
    if (meta?.type === "VECTOR_RESOLUTION") return "Vector resolution";
    return "Director turn";
  }

  export function vector_label(type, fallback = "past") {
    if (type == null) return fallback === "memory" || fallback === "past" ? "PAST" : fallback.toUpperCase();
    const t = String(type).toUpperCase();
    if (t === "PAST" || t === "MEMORY") return "PAST";
    if (t === "FUTURE" || t === "AGENDUM") return "FUTURE";
    return t;
  }

  export function clean_text_debris(text) {
    if (text == null) return "";
    return String(text)
      .trim()
      .replace(/^[\s,;]+|[\s,;]+$/g, "")
      .replace(/,(\s*,)+/g, ",")
      .trim();
  }

  /** Kept exported in case external tests/consumers reference it; unused internally. */
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
        has_mods: Boolean(eternal_physical || eternal_non_physical),
      });
    }
    return blocks;
  }
</script>

<script>
  import { Accordion, Icon } from "@atoms";
  import { MacroText } from "@molecules";
  import { app, session } from "@state";

  let { meta = {}, timestamp = new Date() } = $props();

  const time_label = $derived(timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
  const telemetry_card_label = $derived(meta ? get_telemetry_label(meta) : "");
  const consolidated_vectors = $derived(
    Array.isArray(meta?.vectors) ? meta.vectors
    : Array.isArray(meta?.past) ? meta.past
    : Array.isArray(meta?.memories) ? meta.memories
    : [],
  );

  const director_rows = $derived.by(() => {
    const deltas = meta?.deltas && typeof meta.deltas === "object" ? meta.deltas : null;
    if (!deltas) return [];
    const levels = meta?.levels && typeof meta.levels === "object" ? meta.levels : null;
    return DIRECTOR_AXES.filter((axis) => deltas[axis] !== undefined).map((axis) => {
      const delta = Number(deltas[axis]) || 0;
      const level = levels?.[axis] !== undefined ? Number(levels[axis]) : null;
      const fill = level != null && Number.isFinite(level) ? get_percentage(level) : Math.min(100, Math.abs(delta) * 10);
      return { axis, delta, level, fill };
    });
  });

  const render_telemetry_text = (txt) => (txt ? parse_message(format_tagged_fields(clean_text_debris(txt), { see_hidden: "all" })).displayText : "");

  function extract_bracket_items(text_or_obj) {
    if (!text_or_obj) return [];
    const raw = typeof text_or_obj === "string" ? text_or_obj : `${text_or_obj.physical || ""} ${text_or_obj.non_physical || ""}`.trim();
    if (!raw) return [];
    const entries = parse_bracket_entries(raw);
    if (!entries.length) return [{ key: "", value: raw }];
    return entries
      .filter((e) => !(e.visibility === "hide" || e.flags?.hide || e.hide))
      .map((e) => ({ key: String(e.key || "").toUpperCase(), value: String(e.value ?? "").trim() }))
      .filter((it) => it.key || it.value);
  }
</script>

{#snippet InfoRow(label, text, { muted = false, html = false } = {})}
  <div
    class={[
      "flex gap-standard rounded border-l-2 px-3 py-tight type-data",
      muted ? "border-l-slate-500 bg-black/20" : "border-l-(--color-dev-accent) bg-black/40",
    ]}>
    <span class={["w-28 shrink-0 uppercase", muted ? "text-slate-400" : "text-dev-accent"]}>{label}</span>
    {#if html}
      <span class={["flex-1", muted ? "text-slate-300" : "text-slate-200"]} use:safe_html={text}></span>
    {:else}
      <span class={["flex-1", muted ? "text-slate-300" : "text-slate-200"]}>{text}</span>
    {/if}
  </div>
{/snippet}

{#snippet temporal_quadrant(label, items, isMuted = false)}
  {@const chip_items = (Array.isArray(items) ? items : [items])
    .filter(Boolean)
    .map((it) =>
      typeof it === "string" ? { key: "", value: it }
      : it.key !== undefined || it.value !== undefined ? { key: it.key || "", value: it.value ?? "" }
      : { key: "", value: it.content || it.directive || "" },
    )
    .filter((it) => clean_text_debris(it.value))}
  {#if chip_items.length > 0}
    <div
      class={[
        "flex gap-standard rounded border-l-2 px-3 py-tight type-data",
        isMuted ? "border-l-slate-500 bg-black/20" : "border-l-(--color-dev-accent) bg-black/40",
      ]}>
      <span class={["inline-flex w-28 shrink-0 items-center gap-1.5 uppercase", isMuted ? "text-slate-400" : "text-dev-accent"]}>
        <Icon name={label.toLowerCase().startsWith("past") ? "past" : label.toLowerCase()} class="size-3.5 shrink-0" />
        {label}
      </span>
      <div class={["flex flex-1 flex-wrap gap-tight", isMuted ? "text-slate-300" : "text-slate-200"]}>
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
              <MacroText text={item.value} entities={session.display_entities} on_select={(ent) => app.open_profile(ent)} />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
{/snippet}

{#if app.settings.dev_mode}
  <div class="relative flex w-full justify-center p-standard transition duration-200" data-testid="dev-bubble">
    <div
      class="group glass-panel relative flex w-[calc(var(--spacing-column-unit)*6)] min-w-0 flex-col overflow-hidden rounded"
      style:--signature-color="var(--color-dev-accent)">
      {#if telemetry_card_label}
        <div class="flex min-h-10 items-center gap-tight border-b border-white/10 px-standard py-tight type-uppercase-label text-dev-accent">
          <span class="size-1.5 shrink-0 animate-pulse rounded-full bg-dev-accent shadow-[0_0_6px_var(--color-dev-accent)]"></span>
          <span class="min-w-0 translate-y-px truncate">{telemetry_card_label}</span>
          <span class="ml-auto shrink-0 translate-y-px type-data text-white/40">{time_label}</span>
        </div>
      {/if}

      <div class="flex flex-col gap-standard p-standard">
        {#if meta.type === "STORY_START"}
          <p class="type-data text-slate-300">The simulation engine has anchored a new narrative sequence.</p>
        {:else}
          {#if meta.trigger_image === true || meta.image_trigger === true}
            {@const disp = meta.image_signals?.displacement || 0}
            {@const disp_thresh = meta.image_signals?.displacement_threshold || 50}
            <div class="flex flex-wrap items-center gap-tight rounded border border-(--color-dev-accent)/20 bg-black/40 px-3 py-tight text-xs">
              <span class="size-1.5 animate-pulse rounded-full bg-dev-accent shadow-[0_0_6px_var(--color-dev-accent)]"></span>
              <span class="type-uppercase-label text-dev-accent">Trigger Image</span>
              {#if meta.image_tier}
                <span class="rounded bg-dev-accent/15 px-1.5 py-0.5 type-uppercase-label text-dev-accent">{meta.image_tier}</span>
              {/if}
              {#if meta.image_source}
                <span class="type-uppercase-label text-slate-400">({meta.image_source})</span>
              {/if}
              {#if meta.image_signals?.band_entry}
                {@const be = meta.image_signals.band_entry}
                <span class="type-data text-slate-400">· Band: {be.axis} {be.from} → {be.to} ({be.band})</span>
              {/if}
              {#if disp > 0 && disp >= disp_thresh}
                <span class="type-data text-slate-400">· Displacement: {disp}/{meta.image_signals.displacement_threshold}</span>
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
                      <div class="absolute left-0 h-full bg-dev-accent" style:width="{row.fill}%"></div>
                    </div>
                    <div class="flex min-w-16 items-center justify-end gap-tight type-data">
                      <span class="text-frisk">{row.level != null ? get_percentage(row.level) : `${row.delta > 0 ? "+" : ""}${row.delta}`}</span>
                      {#if row.level != null}
                        <span class={row.delta > 0 ? "text-dev-accent" : "text-slate-500"}>({row.delta > 0 ? "+" : ""}{row.delta})</span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          {#if meta.thoughts}{@render InfoRow("Thoughts", meta.thoughts)}{/if}
          {#if meta.camera_note}{@render InfoRow("Camera", meta.camera_note)}{/if}

          {#if meta.type === "CONTINUUM_FORMATION" || meta.type === "MEMORY_FORMATION"}
            <p class="type-data text-slate-400">
              Updated brackets merged into {resolve_entity_name(meta.target, session) || String(meta.target || "target entity")}’s profile fields.
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
                {@render InfoRow("RESOLUTION", render_telemetry_text(meta.resolution), { muted: true, html: true })}
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
{/if}
