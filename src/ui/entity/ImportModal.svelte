<script>
  import { Button, Modal, TextField, Toggle } from "@primitives";
  import { app, runtime, simulation_state } from "@state";
  import { parse_profile_json, prompt_builder, temporal_engine } from "@intelligence";
  import { create_new, detect_card_format, normalize, parse_character_card } from "@data";
  import { fetch_web_content, llm_service, validate_image } from "@platform";
  import { generate_uuid } from "@utils";

  let { open = $bindable(false), target_type: _target_type = "character" } = $props();

  // --- INGESTION STATE ---
  let active_tab = $state("url"); // "url" | "file" | "text"
  let raw_text = $state("");
  let image_data = $state(null);
  let url_input = $state("");
  let ingest_source = $state("");
  let is_fetching = $state(false);
  let is_dragging = $state(false);

  // --- TARGET TOGGLES ---
  let import_character = $state(true);
  let import_fractal = $state(false);
  let is_loading = $state(false);
  let error_message = $state("");

  const tabs = [
    { id: "url", label: "Web URL" },
    { id: "file", label: "File" },
    { id: "text", label: "Raw Text" },
  ];

  $effect(() => {
    if (open) {
      import_character = true;
      import_fractal = true;
    }
  });

  // ---------------------------------------------------------------------------
  // TAB 1: Web URL fetch
  // ---------------------------------------------------------------------------
  async function handle_fetch_url() {
    const url = url_input.trim();
    if (!url) return;
    error_message = "";
    is_fetching = true;
    simulation_state.set_intent_active(true);
    try {
      const { text } = await fetch_web_content(url, { type: import_fractal && !import_character ? "fractal" : "character" });
      raw_text = text;
      ingest_source = url;
      image_data = null;
      app.log(`Fetched ${text.length.toLocaleString()} chars from ${url}`, "system");
      active_tab = "text";
    } catch (err) {
      console.error(err);
      error_message = err.message || "Failed to fetch the page.";
    } finally {
      is_fetching = false;
      simulation_state.set_intent_active(false);
    }
  }

  // ---------------------------------------------------------------------------
  // TAB 2: File upload / dropzone (.json cards, .png chara cards, images)
  // ---------------------------------------------------------------------------
  /**
   * @param {File} file
   */
  async function process_file(file) {
    if (!file) return;
    error_message = "";
    is_loading = true;
    try {
      if (file.name.endsWith(".json")) {
        raw_text = await file.text();
        image_data = null;
        ingest_source = "";
      } else {
        // Validate image constraints
        await validate_image(file);

        // Read file to get base64 DataURL for the image
        const reader = new globalThis.FileReader();
        const data_url_promise = new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target?.result || null);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(file);

        const data_url = await data_url_promise;
        image_data = data_url;

        // If PNG, attempt to extract tEXt chara chunks
        if (file.name.endsWith(".png")) {
          const array_buffer = await file.arrayBuffer();
          const buffer = new Uint8Array(array_buffer);
          let offset = 8;
          let found_text = false;
          while (offset < buffer.length) {
            const length = new DataView(buffer.buffer).getUint32(offset, false);
            const type_str = String.fromCharCode(...buffer.slice(offset + 4, offset + 8));

            if (type_str === "tEXt") {
              const chunk_data = buffer.slice(offset + 8, offset + 8 + length);
              const null_idx = chunk_data.indexOf(0);
              if (null_idx !== -1) {
                const keyword = String.fromCharCode(...chunk_data.slice(0, null_idx));
                if (keyword === "chara") {
                  const base64_data = String.fromCharCode(...chunk_data.slice(null_idx + 1));
                  raw_text = atob(base64_data);
                  found_text = true;
                  break;
                }
              }
            }
            offset += 12 + length;
          }
          if (!found_text) {
            error_message = "No character data found inside PNG. The image was loaded, but you must manually paste the prompt.";
          }
        }
      }
    } catch (err) {
      console.error(err);
      error_message = err.message || "Failed to process file.";
    } finally {
      is_loading = false;
    }
  }

  /**
   * @param {Event} e
   */
  async function handle_file_upload(e) {
    const file = e.target.files?.[0];
    await process_file(file);
    // Clear input so it can be selected again
    e.target.value = "";
  }

  function trigger_file_input() {
    const file_input = document.createElement("input");
    file_input.type = "file";
    file_input.accept = ".json,.png,.jpg,.jpeg,.webp,.txt";
    file_input.onchange = handle_file_upload;
    file_input.click();
  }

  /**
   * @param {DragEvent} e
   */
  async function handle_drop(e) {
    const file = e.dataTransfer?.files?.[0];
    if (file) await process_file(file);
  }

  // ---------------------------------------------------------------------------
  // IMPORT ORCHESTRATION
  // ---------------------------------------------------------------------------
  /**
   * Applies a flat sorted profile (from the LLM sorter or a Character Card) onto
   * a freshly created entity, mapping flat keys onto the nested Twin-Cylinder schema.
   * @param {any} entity
   * @param {Object} profile
   */
  function apply_profile(entity, profile) {
    if (!profile || typeof profile !== "object") return entity;
    const FLAT_LEAF_MAP = {
      appearance: "eternal.physical",
      personality: "eternal.non_physical",
      current_look: "present.physical",
      state_of_mind: "present.non_physical",
    };
    for (const [key, val] of Object.entries(profile)) {
      if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

      if (key === "past") {
        if (Array.isArray(val)) {
          const new_vectors = val
            .map((text_str) => {
              const vector_str = typeof text_str === "string" ? text_str : text_str.content || text_str.directive || JSON.stringify(text_str);
              if (!vector_str || !String(vector_str).trim()) return null;
              return {
                ...temporal_engine.create(vector_str, key),
                id: generate_uuid(),
                emotional_weight: 5,
              };
            })
            .filter(Boolean);
          entity.past = [...(entity.past || []), ...new_vectors];
        }
      } else if (key === "future" && typeof val === "string") {
        // FUTURE is a prose field — import the flat text.
        entity.future = val.trim();
      } else if (key === "tags" && Array.isArray(val)) {
        entity.tags = val
          .map((t) => String(t).trim())
          .filter(Boolean)
          .slice(0, 30);
      } else if (typeof val === "object" && !Array.isArray(val)) {
        for (const [sub_key, subVal] of Object.entries(val)) {
          if (typeof subVal === "string") {
            if (!entity[key]) entity[key] = {};
            entity[key][sub_key] = subVal;
          }
        }
      } else if (typeof val === "string") {
        // Map flat LLM keys to nested DB schema
        if (FLAT_LEAF_MAP[key]) {
          const [main_key, sub_key] = FLAT_LEAF_MAP[key].split(".");
          if (!entity[main_key]) entity[main_key] = {};
          entity[main_key][sub_key] = val;
        } else if (key === "name") {
          entity.name = val.trim().slice(0, 80);
        } else {
          entity[key] = val;
        }
      }
    }
    return entity;
  }

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
    apply_profile(entity, flat);
    await runtime.save_entity(type, entity);
  }

  /**
   * Runs the LLM ingestion sorter over raw prose and saves the result.
   * @param {'character' | 'fractal'} type
   * @param {string} raw
   */
  async function import_from_llm(type, raw) {
    const payload = prompt_builder.build_profile_sorting_prompt(raw, type, { ingestion: true });
    const result = await llm_service.enhance(payload);
    const profile = parse_profile_json(result);
    if (!profile) return; // Lenient: LLM failed to sort — import silently skipped.
    const entity = create_new(type);
    if (image_data) entity.profile_picture = image_data;
    apply_profile(entity, profile);
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
      url_input = "";
      ingest_source = "";
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
  class="relative w-[clamp(26rem,92vw,44rem)] max-w-2xl rounded-2xl bg-glass-elevated p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] [backdrop-filter:var(--blur-mist)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(--noise-url) before:opacity-10 before:mix-blend-overlay before:content-['']"
  busy={is_loading}
  on_close={() => (open = false)}
>
  <div class="flex h-full flex-col gap-6 font-sans">
    <div class="flex items-center justify-between">
      <h5 class="m-0 text-xs font-bold tracking-widest text-slate-300 uppercase">Import Entity</h5>
      <div class="flex items-center gap-6 font-mono text-xs text-slate-300">
        <Toggle label="Character" bind:value={import_character} disabled={is_loading} />
        <Toggle label="Fractal" bind:value={import_fractal} disabled={is_loading} />
      </div>
    </div>

    <!-- Tab Bar -->
    <div class="flex gap-1 self-start rounded-lg border border-white/10 bg-black/30 p-1" role="tablist" aria-label="Import source">
      {#each tabs as tab (tab.id)}
        <button
          role="tab"
          aria-selected={active_tab === tab.id}
          class="
            cursor-pointer
            rounded-md
            px-3
            py-1.5
            text-[11px]
            font-bold
            tracking-widest
            uppercase
            transition-all
            duration-200
            disabled:pointer-events-none
            disabled:opacity-30
            {active_tab === tab.id ? 'bg-(--signature-color)/25 text-slate-50 shadow-sm' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}
          "
          disabled={is_loading}
          onclick={() => (active_tab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="flex flex-1 flex-col gap-4">
      {#if error_message}
        <div class="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          {error_message}
        </div>
      {/if}

      {#if active_tab === "url"}
        <div class="flex flex-col gap-3">
          <TextField
            is_edit={true}
            size="md"
            bind:value={url_input}
            placeholder="https://example.com/wiki/Character or lore page..."
            disabled={is_loading || is_fetching}
          />
          <div class="flex items-center gap-3">
            <Button variant="secondary" size="small" onclick={handle_fetch_url} disabled={is_loading || is_fetching || !url_input.trim()}>
              {#if is_fetching}
                <span class="animate-pulse text-xs font-bold tracking-widest uppercase">Fetching...</span>
              {:else}
                <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M2 12h8" />
                  <path d="M18 4l4 4-4 4" />
                  <path d="M22 8h-8" />
                </svg>
                <span class="text-xs font-bold tracking-widest uppercase">Fetch Page</span>
              {/if}
            </Button>
            <span class="text-[10px] text-slate-500 italic"> Fetches clean readable text from any https page (wikis, fandom, bios, lore). </span>
          </div>
          {#if ingest_source}
            <div class="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
              <div class="flex items-center justify-between gap-2">
                <span class="truncate font-mono text-[10px] text-(--signature-color)">{ingest_source}</span>
                <span class="shrink-0 font-mono text-[10px] text-slate-400">{raw_text.length.toLocaleString()} chars</span>
              </div>
              <p class="m-0 max-h-24 overflow-y-auto text-xs text-slate-300 select-text">
                {raw_text.slice(0, 320)}{raw_text.length > 320 ? "…" : ""}
              </p>
              <Button variant="invisible" size="small" class="self-start text-slate-400" onclick={() => (active_tab = "text")}>
                <span class="text-[10px] font-bold tracking-widest uppercase">Review / Edit Text</span>
              </Button>
            </div>
          {/if}
        </div>
      {/if}

      {#if active_tab === "file"}
        <div
          class="
            flex
            cursor-pointer
            flex-col
            items-center
            justify-center
            gap-3
            rounded-xl
            border
            border-dashed
            border-white/20
            bg-white/5
            p-10
            text-center
            transition-all
            duration-200
            {is_dragging
            ? 'scale-[1.01] border-(--signature-color)/70 bg-(--signature-color)/10'
            : 'hover:border-(--signature-color)/60 hover:bg-(--signature-color)/10'}
          "
          role="button"
          tabindex="0"
          aria-label="Upload a Character Card file"
          onclick={trigger_file_input}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              trigger_file_input();
            }
          }}
          ondragover={(e) => {
            e.preventDefault();
            is_dragging = true;
          }}
          ondragleave={() => (is_dragging = false)}
          ondrop={(e) => {
            e.preventDefault();
            is_dragging = false;
            handle_drop(e);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            class="size-8 fill-none stroke-current stroke-2 text-slate-400"
            style="stroke-linecap: round; stroke-linejoin: round;"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div class="flex flex-col gap-1">
            <span class="text-sm font-bold text-slate-200">Drop a Character Card here</span>
            <span class="text-[11px] text-slate-400">
              .json cards (Tavern / Chub / Janitor) · .png cards (embedded chara data) · native RPGlitch .json
            </span>
          </div>
        </div>
      {/if}

      {#if active_tab === "text"}
        <div class="flex flex-col gap-2">
          <TextField
            is_edit={true}
            bind:value={raw_text}
            placeholder="Paste raw text, lore, character descriptions, or raw entity JSON here, or use the Web URL / File tabs above..."
            disabled={is_loading}
            class="min-h-52"
          />
          {#if raw_text.length > 0}
            <span class="self-end font-mono text-[10px] text-slate-500">{raw_text.length.toLocaleString()} chars</span>
          {/if}
        </div>
      {/if}

      {#if image_data}
        <div class="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3">
          <img src={image_data} alt="Import Avatar" class="h-12 w-12 rounded-lg border border-white/10 object-cover shadow-md" />
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-slate-200">Avatar Image Detected</span>
            <span class="text-[10px] text-slate-400">Image will be attached as the primary entity profile picture.</span>
          </div>
        </div>
      {/if}
    </div>

    <div class="flex items-center justify-between pt-2">
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
