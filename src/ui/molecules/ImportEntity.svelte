<script>
  import { Button, Modal, TextField, Toggle } from "@atoms";
  import { llm_service } from "@platform";
  import { app, runtime, simulationState } from "@state";
  import { prompt_builder, strip_cognition_blocks } from "@intelligence";
  import { create_new } from "@data";
  import { validateImage } from "@platform";
  import { temporal_engine } from "@intelligence";

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
        await validateImage(file);

        // Read file to get base64 DataURL for the image
        const reader = new globalThis.FileReader();
        const dataUrlPromise = new Promise((resolve, reject) => {
          reader.onload = (event) => resolve(event.target?.result || null);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(file);

        const dataUrl = await dataUrlPromise;
        image_data = dataUrl;

        // If PNG, attempt to extract tEXt chara chunks
        if (file.name.endsWith(".png")) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          let offset = 8;
          let foundText = false;
          while (offset < buffer.length) {
            const length = new DataView(buffer.buffer).getUint32(offset, false);
            const typeStr = String.fromCharCode(...buffer.slice(offset + 4, offset + 8));

            if (typeStr === "tEXt") {
              const chunkData = buffer.slice(offset + 8, offset + 8 + length);
              const nullIdx = chunkData.indexOf(0);
              if (nullIdx !== -1) {
                const keyword = String.fromCharCode(...chunkData.slice(0, nullIdx));
                if (keyword === "chara") {
                  const base64Data = String.fromCharCode(...chunkData.slice(nullIdx + 1));
                  raw_text = atob(base64Data);
                  foundText = true;
                  break;
                }
              }
            }
            offset += 12 + length;
          }
          if (!foundText) {
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
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,.png,.jpg,.jpeg,.webp,.txt";
    fileInput.onchange = handle_file_upload;
    fileInput.click();
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
    simulationState.busy = true;

    try {
      const promises = [];
      if (import_character) {
        const charPayload = prompt_builder.build_profile_sorting_prompt(raw_text, "character");
        promises.push(llm_service.enhance(charPayload).then((res) => finalize_import("character", res)));
      }
      if (import_fractal) {
        const fracPayload = prompt_builder.build_profile_sorting_prompt(raw_text, "fractal");
        promises.push(llm_service.enhance(fracPayload).then((res) => finalize_import("fractal", res)));
      }

      await Promise.all(promises);

      app.log(`Import successful.`, "system");
      await app.load_entities();

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
      simulationState.busy = false;
    }
  }

  async function finalize_import(type, result) {
    if (!result) return;

    const cleanJsonText = strip_cognition_blocks(result).trim();
    const startIdx = cleanJsonText.indexOf("{");
    const endIdx = cleanJsonText.lastIndexOf("}");
    if (startIdx >= 0 && endIdx >= 0) {
      const cleanJson = JSON.parse(cleanJsonText.substring(startIdx, endIdx + 1));
      const entity = create_new(type);

      // Preserve the image extracted from upload if available
      if (image_data) {
        entity.profile_picture = image_data;
      }

      for (const [key, val] of Object.entries(cleanJson)) {
        if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

        if (key === "past" || key === "future") {
          if (Array.isArray(val)) {
            const newVectors = val.map((textStr) => {
              const vectorStr = typeof textStr === "string" ? textStr : textStr.directive || textStr.text || JSON.stringify(textStr);
              return {
                ...temporal_engine.create(vectorStr, key),
                id: crypto.randomUUID(),
                base_weight: 5,
              };
            });
            entity[key] = newVectors;
          }
        } else if (typeof val === "object" && !Array.isArray(val)) {
          for (const [subKey, subVal] of Object.entries(val)) {
            if (typeof subVal === "string") {
              if (!entity[key]) entity[key] = {};
              entity[key][subKey] = subVal;
            }
          }
        } else if (typeof val === "string") {
          // Map flat LLM keys (e.g., eternal_physical) back to nested DB schema (eternal: { physical })
          if (key.includes("_") && (key.startsWith("eternal_") || key.startsWith("present_"))) {
            const [mainKey, ...rest] = key.split("_");
            const subKey = rest.join("_");
            if (!entity[mainKey]) entity[mainKey] = {};
            entity[mainKey][subKey] = val;
          } else {
            entity[key] = val;
          }
        }
      }

      const existing = await runtime.get_entity(type, entity.id);
      if (existing) {
        await runtime.update_entity(type, entity.id, entity);
      } else {
        await runtime.save_entity(type, entity);
      }
    }
  }
</script>

{#if open}
  <Modal
    variant="standard"
    z_index="1000"
    class="w-[clamp(26rem,92vw,44rem)] max-w-2xl rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--color-slate-950)_95%,transparent)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] [backdrop-filter:var(--blur-mist)]"
    busy={is_loading}
    on_close={() => (open = false)}
  >
    <div class="flex h-full flex-col gap-6 font-mono">
      <div class="flex items-center justify-between">
        <h5 class="m-0 text-xs font-bold tracking-widest text-slate-300 uppercase">IMPORT ENTITY CARD</h5>
        <div class="flex items-center gap-6 text-xs text-slate-300">
          <Toggle label="Character" bind:value={import_character} disabled={is_loading} />
          <Toggle label="Fractal" bind:value={import_fractal} disabled={is_loading} />
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-4">
        {#if error_message}
          <div class="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 font-mono text-xs text-red-400">
            {error_message}
          </div>
        {/if}

        <div class="flex flex-col gap-2">
          <TextField
            is_edit={true}
            bind:value={raw_text}
            placeholder="Paste raw entity JSON here, or click Upload File to parse a Character Card PNG / JSON file..."
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
{/if}
