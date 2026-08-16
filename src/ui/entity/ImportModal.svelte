<script>
  import { Button, Modal, SourceField, Toggle } from "@primitives";
  import { app, runtime, simulation_state } from "@state";
  import { apply_profile_to_entity, sort_into_profile } from "@intelligence";
  import { create_new, detect_card_format, normalize, parse_character_card } from "@data";
  import { generate_uuid } from "@utils";

  let { open = $bindable(false), target_type: _target_type = "character" } = $props();

  // --- INGESTION STATE (fed by SourceField) ---
  let raw_text = $state("");
  let image_data = $state(null);

  // --- TARGET TOGGLES ---
  let import_character = $state(true);
  let import_fractal = $state(false);
  let is_loading = $state(false);
  let error_message = $state("");

  const fetch_type = $derived(import_fractal && !import_character ? "fractal" : "character");

  $effect(() => {
    if (open) {
      import_character = true;
      import_fractal = true;
    }
  });

  /**
   * Surface feedback from SourceField: successful sources log + clear errors,
   * failures surface in the error banner.
   * @param {{kind: string, url?: string, name?: string, chars?: number, message?: string}} info
   */
  function handle_source(info) {
    if (info.kind === "error") {
      error_message = info.message || "Failed to load source.";
      return;
    }
    error_message = "";
    if (info.kind === "url") {
      app.log(`Fetched ${info.chars?.toLocaleString()} chars from ${info.url}`, "system");
    } else if (info.kind === "file") {
      app.log(`Loaded ${info.name}${info.chars ? ` (${info.chars.toLocaleString()} chars)` : ""}`, "system");
    } else if (info.kind === "image") {
      app.log(`Loaded avatar from ${info.name || info.url}`, "system");
    }
  }

  // ---------------------------------------------------------------------------
  // IMPORT STRATEGIES
  // Structured payloads (native JSON / Character Card) decode through the card
  // codec; raw prose runs through the LLM profile sorter. Both produce the same
  // flat profile, applied to a fresh entity by apply_profile_to_entity.
  // ---------------------------------------------------------------------------
  /**
   * Imports a native RPGlitch entity JSON (re-id + normalize + save).
   * @param {'character' | 'fractal'} type
   * @param {Object} parsed
   */
  async function import_native_json(type, parsed) {
    const merged = { ...create_new(type), ...normalize(parsed) };
    merged.id = generate_uuid();
    merged.created_at = Date.now();
    merged.type = type;
    if (image_data) merged.profile_picture = image_data;
    await runtime.save_entity(type, merged);
  }

  /**
   * Imports a standard Character Card V2/V3 payload.
   * @param {'character' | 'fractal'} type
   * @param {Object} parsed
   */
  async function import_card(type, parsed) {
    const flat = parse_character_card(parsed);
    const entity = create_new(type);
    if (image_data) entity.profile_picture = image_data;
    apply_profile_to_entity(entity, flat);
    await runtime.save_entity(type, entity);
  }

  /**
   * Runs the LLM ingestion sorter over raw prose and saves the result.
   * @param {'character' | 'fractal'} type
   * @param {string} raw
   */
  async function import_from_llm(type, raw) {
    const profile = await sort_into_profile(raw, type);
    if (!profile) return; // Lenient: LLM failed to sort — import silently skipped.
    const entity = create_new(type);
    if (image_data) entity.profile_picture = image_data;
    apply_profile_to_entity(entity, profile);
    await runtime.save_entity(type, entity);
  }

  async function handle_import() {
    if (!raw_text.trim()) {
      error_message = "Please provide raw text to import.";
      return;
    }
    if (!import_character && !import_fractal) {
      error_message = "Please select at least one target to import (Character or Fractal).";
      return;
    }

    is_loading = true;
    error_message = "";
    simulation_state.set_intent_active(true);

    try {
      // Structured JSON short-circuit: native RPGlitch or Character Card V2/V3.
      let parsed = null;
      try {
        parsed = JSON.parse(raw_text);
      } catch (_e) {
        /* prose or prose-wrapped card — falls through to the LLM sorter */
      }
      const format = parsed && typeof parsed === "object" ? detect_card_format(parsed) : "unknown";
      const is_structured = format !== "unknown";

      const targets = [];
      if (import_character) targets.push("character");
      if (import_fractal) targets.push("fractal");

      for (const type of targets) {
        if (is_structured) {
          if (format === "rpglitch") await import_native_json(type, parsed);
          else await import_card(type, parsed);
        } else {
          await import_from_llm(type, raw_text);
        }
      }

      app.log(`Import successful.`, "system");
      await app.load_entities();

      // Auto-select the newly imported entities if slots are empty
      if (import_character && !app.selected_ai) {
        const latest_char = app.ai_list[app.ai_list.length - 1];
        if (latest_char) app.selected_ai = latest_char;
      }
      if (import_fractal && !app.selected_fractal) {
        const latest_fractal = app.fractal_list[app.fractal_list.length - 1];
        if (latest_fractal) app.selected_fractal = latest_fractal;
      }

      // Reset and close
      raw_text = "";
      image_data = null;
      open = false;
    } catch (err) {
      console.error(err);
      error_message = err.message || "Failed to import entities.";
      app.log(`Import failed: ${error_message}`, "error");
    } finally {
      is_loading = false;
      simulation_state.set_intent_active(false);
    }
  }
</script>

<Modal
  bind:open
  variant="bare"
  z_index="1000"
  class="relative w-[clamp(26rem,92vw,44rem)] max-w-2xl rounded-2xl bg-glass-elevated p-4 shadow-[0_16px_48px_rgba(0,0,0,0.8)] [backdrop-filter:var(--blur-mist)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay before:content-['']"
  busy={is_loading}
  on_close={() => {
    open = false;
    raw_text = "";
    image_data = null;
    error_message = "";
  }}
>
  <div class="flex h-full flex-col gap-4 font-sans">
    <div class="flex items-center justify-between">
      <h5 class="m-0 text-xs font-bold tracking-widest text-slate-300 uppercase">Import Entity</h5>
      <div class="flex items-center gap-4 font-mono text-xs text-slate-300">
        <Toggle label="Character" bind:value={import_character} disabled={is_loading} />
        <Toggle label="Fractal" bind:value={import_fractal} disabled={is_loading} />
      </div>
    </div>

    <div class="flex flex-1 flex-col">
      {#if error_message}
        <div class="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          {error_message}
        </div>
      {/if}

      <SourceField bind:value={raw_text} bind:image_data type={fetch_type} disabled={is_loading} on_source={handle_source} />
    </div>

    <div class="flex items-center justify-between">
      <span class="text-[10px] text-slate-500 italic"> JSON cards bypass the AI sorter; raw text is schema-sorted by the AI. </span>

      <Button variant="primary" size="small" onclick={handle_import} disabled={is_loading || (!import_character && !import_fractal)}>
        {#if is_loading}
          <span class="text-xs font-bold tracking-widest uppercase">Importing...</span>
        {:else}
          <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span class="text-xs font-bold tracking-widest uppercase">Import Entity</span>
        {/if}
      </Button>
    </div>
  </div>
</Modal>
