<script>
  import { Button, Modal, TextField, Toggle } from "@primitives";
  import { app, runtime, simulation_state } from "@state";
  import { prompt_builder, strip_cognition_blocks, temporal_engine } from "@intelligence";
  import { create_new } from "@data";
  import { llm_service, validate_image } from "@platform";
  import { generate_uuid } from "@utils";

  let { open = $bindable(false), target_type: _target_type = "character" } = $props();

  let raw_text = $state("");
  let image_data = $state(null);
  let import_character = $state(true);
  let import_fractal = $state(false);
  let is_loading = $state(false);
  let error_message = $state("");

  $effect(() => {
    if (open) {
      import_character = true;
      import_fractal = true;
    }
  });

  async function handle_file_upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    error_message = "";
    is_loading = true;

    try {
      if (file.name.endsWith(".json")) {
        raw_text = await file.text();
        image_data = null;
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
          const array_buffer = await file.array_buffer();
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
      const promises = [];
      if (import_character) {
        const char_payload = prompt_builder.build_profile_sorting_prompt(raw_text, "character");
        promises.push(llm_service.enhance(char_payload).then((res) => finalize_import("character", res)));
      }
      if (import_fractal) {
        const frac_payload = prompt_builder.build_profile_sorting_prompt(raw_text, "fractal");
        promises.push(llm_service.enhance(frac_payload).then((res) => finalize_import("fractal", res)));
      }

      await Promise.all(promises);

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

  async function finalize_import(type, result) {
    if (!result) return;

    const clean_json_text = strip_cognition_blocks(result).trim();
    const start_idx = clean_json_text.indexOf("{");
    const end_idx = clean_json_text.lastIndexOf("}");
    if (start_idx >= 0 && end_idx >= 0) {
      const clean_json = JSON.parse(clean_json_text.substring(start_idx, end_idx + 1));
      const entity = create_new(type);

      // Preserve the image extracted from upload if available
      if (image_data) {
        entity.profile_picture = image_data;
      }

      for (const [key, val] of Object.entries(clean_json)) {
        if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

        if (key === "past") {
          if (Array.isArray(val)) {
            const new_vectors = val.map((text_str) => {
              const vector_str = typeof text_str === "string" ? text_str : text_str.content || text_str.directive || JSON.stringify(text_str);
              return {
                ...temporal_engine.create(vector_str, key),
                id: generate_uuid(),
                emotional_weight: 5,
              };
            });
            entity[key] = [...(entity[key] || []), ...new_vectors];
          }
        } else if (key === "future" && typeof val === "string") {
          // FUTURE is a prose field — import the flat text.
          entity.future = val.trim();
        } else if (typeof val === "object" && !Array.isArray(val)) {
          for (const [sub_key, subVal] of Object.entries(val)) {
            if (typeof subVal === "string") {
              if (!entity[key]) entity[key] = {};
              entity[key][sub_key] = subVal;
            }
          }
        } else if (typeof val === "string") {
          // Map flat LLM keys to nested DB schema
          const FLAT_LEAF_MAP = {
            appearance: "eternal.physical",
            personality: "eternal.non_physical",
            current_look: "present.physical",
            state_of_mind: "present.non_physical",
          };
          if (FLAT_LEAF_MAP[key]) {
            const [mainKey, sub_key] = FLAT_LEAF_MAP[key].split(".");
            if (!entity[mainKey]) entity[mainKey] = {};
            entity[mainKey][sub_key] = val;
          } else {
            entity[key] = val;
          }
        }
      }

      await runtime.save_entity(type, entity);
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
      <h5 class="m-0 text-xs font-bold tracking-widest text-slate-300 uppercase">IMPORT ENTITY</h5>
      <div class="flex items-center gap-6 font-mono text-xs text-slate-300">
        <Toggle label="Character" bind:value={import_character} disabled={is_loading} />
        <Toggle label="Fractal" bind:value={import_fractal} disabled={is_loading} />
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-4">
      {#if error_message}
        <div class="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
          {error_message}
        </div>
      {/if}

      <div class="flex flex-col gap-2">
        <TextField
          is_edit={true}
          bind:value={raw_text}
          placeholder="Paste raw text, lore, character descriptions, or raw entity JSON here, or click Upload File to parse a Character Card PNG / JSON file..."
          disabled={is_loading}
          class="min-h-52"
        />
      </div>

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
      <Button onclick={trigger_file_input} variant="secondary" size="small" disabled={is_loading}>
        <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span class="text-xs font-bold tracking-widest uppercase">Upload File</span>
      </Button>

      <Button variant="primary" size="small" onclick={handle_import} disabled={is_loading || (!import_character && !import_fractal)}>
        {#if is_loading}
          <span class="text-xs font-bold tracking-widest uppercase">Importing...</span>
        {:else}
          <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2" style="stroke-linecap: round; stroke-linejoin: round;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span class="text-xs font-bold tracking-widest uppercase">Import Entity</span>
        {/if}
      </Button>
    </div>
  </div>
</Modal>
