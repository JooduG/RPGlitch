<script>
  /**
   * @file VisualWing.svelte
   * 🎨 THE AESTHETIC ENGINE
   * Manages signature colors, generation prompts, and modifiers.
   * Updated to target the flattened signature_color and profile_picture.
   */
  import { PALETTE, PALETTE_VARS } from "@theme/palette.svelte.js";
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import { ImageGeneration } from "@media/image-engine.js";
  import { app } from "@state/app.svelte.js";
  import Button from "@ui/atoms/Button.svelte";
  import Toggle from "@ui/atoms/Toggle.svelte";

  const SPECTRUM_COLORS = Object.entries(PALETTE).filter(([name]) => name !== "default");

  /* eslint-disable svelte/prefer-svelte-reactivity */
  let {
    char = $bindable(),
    is_editing,
    busy_fields = $bindable(),
    active_field = $bindable(),
  } = $props();
  // [CRITICAL FIX] Synchronously ensure the modifiers object exists so Svelte bindings don't crash
  if (!char.visuals) {
    char.visuals = { prompt: "", noBackground: false, flipped: false };
  }
  if (char.visuals.prompt === undefined) char.visuals.prompt = "";
  // Derived: Check if the visual-prompt specifically is busy
  let is_prompt_busy = $derived(busy_fields.has("visual-prompt"));
  let file_input = $state();
  // Determine current state
  const prompt_value = $derived((char.visuals.prompt || "").trim());
  const has_prompt_text = $derived(
    prompt_value.length > 0 &&
      !prompt_value.startsWith("http") &&
      !prompt_value.startsWith("data:"),
  );
  // Determine the active target value (prompt or focused field)
  const target_value = $derived(
    active_field?.key === "visual-prompt"
      ? prompt_value
      : active_field
        ? get_value(char, active_field.key)
        : "",
  );
  // Action is "Enhance" if the target we are looking at has text (ready for AI)
  let is_enhance_mode = $derived(is_editing && target_value.trim().length > 0);
  // Button Logic:
  let is_creative_disabled = $derived(
    !is_editing ||
      (is_prompt_busy && (!active_field || active_field.key === "visual-prompt")) ||
      (!active_field && has_prompt_text),
  );
  // Label Logic:
  let creative_label = $derived.by(() => {
    if (is_prompt_busy && (!active_field || active_field.key === "visual-prompt")) return "Busy...";
    if (active_field) {
      const key = active_field.key;
      const label = active_field.label?.toLowerCase() || "";
      if (key === "visual-prompt") return has_prompt_text ? "Enhance" : "Fetch";
      if (key.startsWith("past")) return "Enhance Memories";
      if (key.startsWith("future")) return "Enhance Vectors";
      if (key.includes("present") || label.includes("present")) return "Enhance Present";
      if (key.includes("eternal") || label.includes("eternal")) return "Enhance Eternal";
      return "Enhance";
    }
    return "Fetch";
  });
  // Design Variants
  let creative_variant = $derived(active_field && is_enhance_mode ? "magic" : "tech");
  let generation_variant = $derived(has_prompt_text ? "magic" : "tech");
  async function handle_creative_action() {
    const current_target_key = active_field?.key || "visual-prompt";
    if (busy_fields.has(current_target_key)) return;
    busy_fields = new Set([...busy_fields, current_target_key]);
    try {
      if (active_field && active_field.key !== "visual-prompt") {
        active_field = null;
      }
      if (current_target_key === "visual-prompt" && is_enhance_mode) {
        const payload = prompt_builder.build_enhancement("visuals.prompt", char.visuals.prompt);
        const result = await llm_service.enhance(payload);
        if (result) char.visuals.prompt = result;
      } else if (current_target_key !== "visual-prompt") {
        const field_val = get_value(char, current_target_key);
        if (field_val) {
          const payload = prompt_builder.build_enhancement(current_target_key, field_val);
          const result = await llm_service.enhance(payload);
          if (result) set_value(char, current_target_key, result);
        }
      } else {
        char.visuals.prompt = ImageGeneration.composeBasePrompt(char);
      }
    } catch (err) {
      console.error("Creative action failed:", err);
    } finally {
      const updated = new Set(busy_fields);
      updated.delete(current_target_key);
      busy_fields = updated;
    }
  }
  async function handle_generation_action() {
    if (busy_fields.has("visual-prompt")) return;
    busy_fields = new Set([...busy_fields, "visual-prompt"]);
    if (has_prompt_text) {
      app.log(`[VisualWing] Triggering Generate. Prompt: ${prompt_value}`, "system");
      try {
        if (!window.pluginTextToImage) {
          const msg = "[VisualWing] CRITICAL: window.pluginTextToImage is MISSING!";
          console.error(msg, window);
          app.log(msg, "error");
          return;
        }
        const url = await ImageGeneration.generate(prompt_value, {
          noBackground: char.visuals.noBackground,
        });
        app.log(`[VisualWing] Generation Result: ${url}`, "system");
        if (url) char.profile_picture = url;
      } catch (err) {
        console.error("Generation failed:", err);
        app.log(`Generation failed: ${err.message}`, "error");
      } finally {
        const updated = new Set(busy_fields);
        updated.delete("visual-prompt");
        busy_fields = updated;
      }
    } else {
      file_input.click();
      const updated = new Set(busy_fields);
      updated.delete("visual-prompt");
      busy_fields = updated;
    }
  }
  // --- UTILITIES ---
  async function handle_upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await ImageGeneration.upload(file);
      if (url) char.profile_picture = url;
    } catch (err) {
      console.error("Upload failed:", err);
      app.log(`Upload failed: ${err.message}`, "error");
    }
  }
  function get_value(obj, path) {
    if (!path) return "";
    return path.split(".").reduce((acc, part) => acc && acc[part], obj) || "";
  }
  function set_value(obj, path, val) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((acc, key) => (acc[key] = acc[key] || {}), obj);
    target[last] = val;
  }
  function auto_resize(node) {
    let frame;
    const update = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.height = "auto";
        node.style.height = node.scrollHeight + "px";
      });
    };
    node.addEventListener("input", update);
    const observer = new ResizeObserver(update);
    observer.observe(node);
    update();
    return {
      destroy() {
        if (frame) cancelAnimationFrame(frame);
        node.removeEventListener("input", update);
        observer.disconnect();
      },
    };
  }
</script>

<div
  class="visual-wing-content"
  onfocusout={(e) => {
    const wing_root = e.currentTarget;
    setTimeout(() => {
      const current_focus = document.activeElement;
      if (
        wing_root &&
        !wing_root.contains(current_focus) &&
        busy_fields.size === 0 &&
        !current_focus?.closest(".text-area")
      ) {
        active_field = null;
      }
    }, 50);
  }}
>
  <div class="group">
    <div class="spectrum-grid">
      {#each SPECTRUM_COLORS as [name, hex] (name)}
        <button
          class="swatch"
          class:active={char.signature_color === hex}
          style="background-color: {PALETTE_VARS[hex] || hex}"
          aria-label="Select color {name}"
          onclick={() => {
            char.signature_color = hex;
          }}
          disabled={!is_editing}
          data-tooltip={name.charAt(0).toUpperCase() + name.slice(1)}
        ></button>
      {/each}
    </div>
  </div>
  <div class="group">
    <div class="prompt-box">
      <div class="visual-prompt-container">
        <textarea
          use:auto_resize
          class="visual-prompt"
          bind:value={char.visuals.prompt}
          placeholder="Enter image prompt or paste a URL..."
          disabled={!is_editing || is_prompt_busy}
          onfocus={() => {
            if (is_editing) {
              active_field = {
                key: "visual-prompt",
                label: "Image Prompt",
              };
            }
          }}
          onblur={() => {
            setTimeout(() => {
              if (active_field?.key === "visual-prompt") {
                const focused = document.activeElement;
                if (
                  !focused?.closest(".action-btn") &&
                  !focused?.closest(".text-area") &&
                  busy_fields.size === 0
                ) {
                  active_field = null;
                }
              }
            }, 150);
          }}
        ></textarea>
        {#if is_prompt_busy}
          <div class="spinner-overlay">
            <div class="spinner"></div>
          </div>
        {/if}
      </div>
      <div class="action-row">
        <Button
          variant="ghost"
          size="sm"
          label={creative_label}
          className="action-btn mode-{creative_variant}"
          onclick={handle_creative_action}
          disabled={is_creative_disabled}
        />
        <Button
          variant="ghost"
          size="sm"
          label={is_prompt_busy ? "Busy..." : has_prompt_text ? "Generate" : "Upload"}
          className="action-btn mode-{generation_variant}"
          onclick={handle_generation_action}
          disabled={!is_editing || is_prompt_busy}
        />
      </div>
      <input
        type="file"
        accept="image/*"
        style="display: none;"
        bind:this={file_input}
        onchange={handle_upload}
      />
    </div>
  </div>
  <div class="toggle-stack">
    <Toggle label="No Background" bind:value={char.visuals.noBackground} disabled={!is_editing} />
    <Toggle label="Flip Profile Picture" bind:value={char.visuals.flipped} disabled={!is_editing} />
  </div>
</div>

<style>
  .visual-wing-content {
    background: var(--surface-raised);
    box-shadow: var(--shadow-m);
    border-radius: var(--border-radius-l);
    padding: var(--spacing-m);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-m);
    height: 100%;
    overflow-y: auto;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }

  .spectrum-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--spacing-xs);
    padding: 0;
  }

  .swatch {
    width: 100%;
    aspect-ratio: 1;
    border: 0;
    border-radius: var(--spacing-xs);
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-elastic);
    box-shadow: var(--shadow-s);
  }

  .swatch:hover:not(:disabled) {
    transform: scale(1.1);
    z-index: 2;
    box-shadow: var(--shadow-m);
  }

  .swatch.active {
    outline: var(--spacing-xxs) solid var(--color-white);
    outline-offset: var(--spacing-xxs);
    box-shadow: var(--shadow-glow);
    transform: scale(1.1);
    z-index: 10;
  }

  .swatch:disabled {
    cursor: default;
    opacity: var(--opacity-l);
  }

  .prompt-box {
    background: var(--surface-sunken);
    box-shadow:
      inset 0 0 0 1px var(--border-light),
      inset 0 0.125rem 0.25rem var(--surface-elevated);
    border-radius: var(--border-radius-m);
    overflow: hidden;
  }

  .visual-prompt-container {
    position: relative;
    width: 100%;
  }

  .visual-prompt {
    width: 100%;
    background: var(--surface-base);
    border: none;
    color: var(--color-white);
    padding: var(--spacing-s);
    font-size: var(--font-size-s);
    font-family: var(--font-body);
    resize: none;
    outline: none;
    display: block;
  }

  .visual-prompt:disabled {
    opacity: var(--opacity-m);
    color: var(--font-muted);
    cursor: not-allowed;
    background: var(--surface-base);
  }

  .visual-prompt::placeholder {
    color: var(--font-muted);
    font-style: italic;
    font-weight: 400;
  }

  .spinner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-void);
    z-index: 5;
    cursor: wait;
  }

  .spinner {
    width: var(--spacing-l);
    height: var(--spacing-l);
    border: var(--spacing-xxs) solid var(--border-light);
    border-top-color: var(--color-frozen);
    border-radius: var(--border-radius-full);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .action-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    box-shadow: inset 0 1px 0 var(--border-light);
  }

  .action-row :global(.btn) {
    width: 100%;
    border: none;
    border-radius: 0;
    background: var(--surface-base);
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs);
    transition: all var(--transition-fast);
    text-transform: capitalize;
  }

  .action-row :global(.btn:not(:last-child)) {
    box-shadow: 1px 0 0 var(--border-light);
  }

  .action-row :global(.btn:hover) {
    background: var(--surface-raised);
  }

  .action-row :global(.btn.action-btn) {
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .action-row :global(.btn.action-btn.mode-tech):not(:disabled) {
    color: var(--color-frisk);
  }

  .action-row :global(.btn.action-btn.mode-tech):not(:disabled):hover {
    background: rgb(var(--color-frisk-rgb) / 0.1);
    color: var(--color-white);
  }

  .action-row :global(.btn.action-btn.mode-magic):not(:disabled) {
    color: var(--color-frozen);
    font-weight: 700;
  }

  .action-row :global(.btn.action-btn.mode-magic):not(:disabled):hover {
    background: rgb(var(--color-frozen-rgb) / 0.1);
    color: var(--color-white);
  }

  .toggle-stack {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
</style>
