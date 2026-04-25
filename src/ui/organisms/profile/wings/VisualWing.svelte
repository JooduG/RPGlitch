<script>
  /**
   * @file src/ui/organisms/profile/wings/VisualWing.svelte
   * 🎨 THE AESTHETIC ENGINE
   * Manages signature colors, generation prompts, and modifiers.
   */
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import { validateImage } from "@core/security.js";
  import { app } from "@state/app.svelte.js";
  import { PALETTE, PALETTE_VARS } from "@theme/palette.svelte.js";
  import { AestheticResolver } from "@media/optics.js";
  import Button from "@ui/atoms/Button.svelte";
  import TextField from "@ui/atoms/TextField.svelte";
  import Toggle from "@ui/atoms/Toggle.svelte";
  import { get_value, set_value } from "@ui/utils/field-path.js";
  import Wing from "./Wing.svelte";

  const SPECTRUM_COLORS = Object.entries(PALETTE).filter(([name]) => name !== "default");

  let { char = $bindable(), is_editing, busy_fields, active_field = $bindable() } = $props();

  // [CRITICAL FIX] Synchronously ensure the modifiers object exists
  const ensure_modifiers = () => {
    if (!char.modifiers) {
      char.modifiers = {
        prompt: "",
        noBackground: false,
        flipped: false,
        profile_picture_seed: 0,
        colorName: "",
      };
    } else {
      char.modifiers.prompt ??= "";
      char.modifiers.noBackground ??= false;
      char.modifiers.flipped ??= false;
      char.modifiers.profile_picture_seed ??= 0;
      char.modifiers.colorName ??= "";
    }
  };

  ensure_modifiers();
  $effect(ensure_modifiers);

  let is_prompt_busy = $derived(app.visual.isLoading || busy_fields.has("visual-prompt"));
  let file_input = $state();
  const prompt_value = $derived((char.modifiers.prompt || "").trim());
  const has_prompt_text = $derived(
    prompt_value.length > 0 &&
      !prompt_value.startsWith("http") &&
      !prompt_value.startsWith("data:"),
  );

  const target_value = $derived(
    active_field?.key === "visual-prompt"
      ? prompt_value
      : active_field
        ? get_value(char, active_field.key)
        : "",
  );

  let is_enhance_mode = $derived(is_editing && target_value.trim().length > 0);

  let is_creative_disabled = $derived(
    !is_editing ||
      (is_prompt_busy && (!active_field || active_field.key === "visual-prompt")) ||
      (!active_field && has_prompt_text),
  );

  let creative_label = $derived.by(() => {
    if (is_prompt_busy && (!active_field || active_field.key === "visual-prompt")) return "Busy...";

    // Priority 1: Visual Prompt Context
    const current_key = active_field?.key || "visual-prompt";
    if (current_key === "visual-prompt") {
      return has_prompt_text ? "Enhance" : "Fetch";
    }

    // Priority 2: Generic Field Refinement
    if (active_field) {
      const key = active_field.key;
      const label = active_field.label?.toLowerCase() || "";
      if (key.startsWith("past")) return "Enhance Memories";
      if (key.startsWith("future")) return "Enhance Vectors";
      if (key.includes("present") || label.includes("present")) return "Enhance Present";
      if (key.includes("eternal") || label.includes("eternal")) return "Enhance Eternal";
      return "Enhance";
    }

    return "Fetch";
  });

  let creative_variant = $derived(active_field && is_enhance_mode ? "magic" : "tech");
  let generation_variant = $derived(has_prompt_text ? "magic" : "tech");

  async function handle_creative_action() {
    const current_target_key = active_field?.key || "visual-prompt";
    if (busy_fields.has(current_target_key)) return;
    busy_fields.add(current_target_key);
    try {
      // 1. Visual Prompt Flow: Fetch (JS) -> Enhance (AI)
      if (current_target_key === "visual-prompt") {
        if (!has_prompt_text) {
          // FETCH: Deterministic Trait Extraction (NO Description mining)
          char.modifiers.prompt = AestheticResolver.extract(char);
        } else {
          // ENHANCE: AI-driven Prompt Refinery
          const result = await app.visual.enhance(char.modifiers.prompt, {
            physical: char.modifiers.prompt,
          });
          if (result) char.modifiers.prompt = result;
        }
      } else {
        // 2. Generic Field Flow: Refine current text
        if (active_field) active_field = null; // Blur if not prompt

        const field_val = get_value(char, current_target_key);
        if (field_val) {
          const payload = prompt_builder.build_enhancement(current_target_key, field_val);
          const result = await llm_service.enhance(payload);
          if (result) set_value(char, current_target_key, result);
        }
      }
    } catch (err) {
      console.error("Creative action failed:", err);
    } finally {
      busy_fields.delete(current_target_key);
    }
  }

  async function handle_generation_action() {
    if (busy_fields.has("visual-prompt")) return;
    busy_fields.add("visual-prompt");
    if (has_prompt_text) {
      app.log(`[VisualWing] Triggering Generate. Prompt: ${prompt_value}`, "system");
      try {
        if (!window.pluginTextToImage) {
          const msg = "[VisualWing] CRITICAL: window.pluginTextToImage is MISSING!";
          console.error(msg, window);
          app.log(msg, "error");
          return;
        }
        const url = await app.visual.generate(prompt_value, {
          noBackground: char.modifiers.noBackground,
        });
        if (url) char.profile_picture = url;
      } catch (err) {
        console.error("Generation failed:", err);
        app.log(`Generation failed: ${err.message}`, "error");
      } finally {
        busy_fields.delete("visual-prompt");
      }
    } else {
      file_input.click();
      busy_fields.delete("visual-prompt");
    }
  }

  async function handle_upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await validateImage(file);
      const url = await app.visual.upload(file);
      if (url) char.profile_picture = url;
    } catch (err) {
      console.error("Upload failed:", err);
      app.log(`Upload failed: ${err.message}`, "error");
    }
  }

  function handle_wing_focus_out(e) {
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
  }
</script>

<Wing class="visual-wing" onfocusout={handle_wing_focus_out}>
  <div class="group">
    <div class="spectrum-grid">
      {#each SPECTRUM_COLORS as [name, hex] (name)}
        <button
          class="swatch"
          class:active={char.signature_color === hex || char.signature_color === name}
          style="background-color: {PALETTE_VARS[hex] || hex}"
          aria-label={name.charAt(0).toUpperCase() + name.slice(1)}
          onclick={() => {
            char.signature_color = name;
          }}
          disabled={!is_editing}
        ></button>
      {/each}
    </div>
  </div>

  <div class="group">
    <div class="prompt-box">
      <div
        class="visual-prompt-container"
        onfocusout={(e) => {
          setTimeout(() => {
            if (active_field?.key === "visual-prompt") {
              const focused = document.activeElement;
              if (
                !focused?.closest(".action-button") &&
                !focused?.closest(".visual-prompt") &&
                busy_fields.size === 0
              ) {
                active_field = null;
              }
            }
          }, 150);
        }}
      >
        <TextField
          class="visual-prompt"
          is_edit={is_editing && !is_prompt_busy}
          bind:value={char.modifiers.prompt}
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
        />
      </div>
      <div class="action-row">
        <Button
          variant={creative_variant}
          size="sm"
          className="action-button"
          label={creative_label}
          onclick={handle_creative_action}
          disabled={is_creative_disabled}
        />
        <Button
          variant={generation_variant}
          size="sm"
          className="action-button"
          label={is_prompt_busy ? "Busy..." : has_prompt_text ? "Generate" : "Upload"}
          onclick={handle_generation_action}
          disabled={!is_editing || is_prompt_busy}
        />
      </div>

      {#if app.visual.attempts > 0 || app.visual.error || app.visual.isOffline}
        <div class="engine-status" class:error={app.visual.error || app.visual.isOffline}>
          {#if app.visual.isOffline}
            <span class="status-tag">SYSTEM OFFLINE</span>
            <span class="status-msg">GPU Cluster Cooling Down...</span>
          {:else if app.visual.error}
            <span class="status-tag">ERROR</span>
            <span class="status-msg">{app.visual.error}</span>
          {:else if app.visual.attempts > 0}
            <span class="status-tag pulse">RETRYING</span>
            <span class="status-msg">Attempt {app.visual.attempts}/3...</span>
          {/if}
        </div>
      {/if}
    </div>
    <input
      type="file"
      accept="image/*"
      style="display: none;"
      bind:this={file_input}
      onchange={handle_upload}
    />
  </div>
  <div class="group">
    <div class="toggle-stack">
      <Toggle
        label="No Background"
        bind:value={char.modifiers.noBackground}
        disabled={!is_editing}
      />
      <Toggle label="Mirror Image" bind:value={char.modifiers.flipped} disabled={!is_editing} />
    </div>
  </div>
</Wing>

<style>
  .spectrum-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) 0;
  }

  .swatch {
    width: 100%;
    aspect-ratio: 1;
    border: 0;
    border-radius: var(--border-radius-m);
    cursor: pointer;
    transition: all var(--motion-l) var(--motion-elastic);
    box-shadow: var(--shadow-s);
  }

  .swatch:hover:not(:disabled) {
    transform: scale(1.1);
    z-index: var(--z-index-m);
    box-shadow: var(--shadow-m);
  }

  .swatch.active {
    outline: var(--spacing-xxs) solid var(--color-white);
    outline-offset: var(--spacing-xxs);
    box-shadow: var(--shadow-glow);
    transform: scale(1.1);
    z-index: var(--z-index-m);
  }

  .swatch:disabled {
    cursor: default;
    opacity: var(--opacity-l);
  }

  .prompt-box {
    display: flex;
    flex-direction: column;
    overflow: visible; /* Prevent tooltip clipping */
    border-radius: var(--border-radius-m);
    border: transparent;
    background: transparent;
    transition: all var(--motion-l) var(--motion-elastic);
  }

  .prompt-box:focus-within {
    border-color: transparent;
    background: transparent;
  }

  .visual-prompt-container {
    position: relative;
    width: 100%;
  }

  :global(.visual-prompt) {
    padding: var(--spacing-m);
  }

  .action-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: var(--border-l);
    overflow: visible;
    gap: var(--spacing-xxs);
  }

  .action-row :global(.action-button) {
    height: 2.5rem;
    background: var(--glass-xs);
    border-right: var(--border-l);
    transition: all var(--motion-l) var(--motion-elastic);
  }

  :global(.action-button:last-child) {
    border-right: none;
  }

  :global(.action-button:hover:not(:disabled)) {
    background: var(--glass-s);
    filter: brightness(1.2);
  }

  :global(.action-button:active:not(:disabled)) {
    transform: scale(0.98);
  }

  .toggle-stack {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .engine-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    padding: var(--spacing-xs) var(--spacing-m);
    background: var(--glass-xs);
    border-top: var(--border-l);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-xxxs);
    color: var(--color-chalk);
    animation: slide-in var(--motion-m) ease-out;
  }

  .engine-status.error {
    color: var(--color-red);
  }

  .status-tag {
    font-weight: bold;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }

  .status-msg {
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }

  .pulse {
    animation: pulse 1s infinite ease-in-out;
  }

  @keyframes slide-in {
    from {
      transform: translateY(-10px);
      opacity: 0;
    }

    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
