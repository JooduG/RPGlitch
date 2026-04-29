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

  let is_creative_disabled = $derived(
    !is_editing ||
      (is_prompt_busy && (!active_field || active_field.key === "visual-prompt")) ||
      (!active_field && has_prompt_text),
  );

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
        <Button
          className="swatch {char.signature_color === hex || char.signature_color === name ? 'active' : ''}"
          style="background-color: {PALETTE_VARS[hex] || hex}; --swatch-color: {PALETTE_VARS[hex] ||
            hex};"
          aria-label={name.charAt(0).toUpperCase() + name.slice(1)}
          onclick={() => {
            char.signature_color = name;
          }}
          disabled={!is_editing}
          variant="invisible"
        ></Button>
      {/each}
    </div>
  </div>

  <div class="group">
    <TextField
      class="visual-prompt"
      style="--signature-color: var(--color-frozen);"
      is_edit={is_editing}
      busy={is_prompt_busy}
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
    >
      {#snippet status()}
        {#if is_prompt_busy || app.visual.error || app.visual.isOffline}
          <div class="engine-status-wrap" class:error={app.visual.error || app.visual.isOffline}>
            {#if app.visual.isOffline}
              <span class="status-tag">OFFLINE</span>
            {:else if app.visual.error}
              <span class="status-tag">ERROR</span>
            {:else if app.visual.attempts > 0}
              <span class="status-tag pulse">RETRYING</span>
            {:else}
              <span class="status-tag pulse">GENERATING</span>
            {/if}
          </div>
        {/if}
      {/snippet}
      {#snippet actions()}
        {#if is_editing}
          <div class="prompt-actions">
            <Button
              variant="invisible"
              size="sm"
              square={true}
              aria-label={has_prompt_text ? "Enhance" : "Fetch"}
              className="action-btn"
              onclick={handle_creative_action}
              disabled={is_creative_disabled}
            >
              {#if has_prompt_text}
                <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="var(--color-white)"
                  ></path>
                </svg>
              {:else}
                <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--color-white)"
                  ></path>
                  <polyline points="7 10 12 15 17 10" stroke="var(--color-white)"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="var(--color-white)"></line>
                </svg>
              {/if}
            </Button>

            <Button
              variant="invisible"
              size="sm"
              square={true}
              aria-label="Generate Image"
              className="action-btn"
              onclick={handle_generation_action}
              disabled={!is_editing || is_prompt_busy}
            >
              <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
                <path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="var(--color-white)"
                ></path>
                <circle cx="12" cy="13" r="4" stroke="var(--color-white)"></circle>
              </svg>
            </Button>
          </div>
        {/if}
      {/snippet}
    </TextField>

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

  .spectrum-grid :global(.button.swatch) {
    width: 100%;
    aspect-ratio: 1;
    border: 0;
    padding: 0;
    min-height: 0;
    border-radius: var(--border-radius-m);
    cursor: pointer;
    transition: all var(--motion-l) var(--motion-elastic);
    box-shadow: var(--shadow-s);
  }

  .spectrum-grid :global(.button.swatch:hover:not(:disabled)) {
    transform: scale(1.1);
    z-index: var(--z-index-m);
    box-shadow: var(--shadow-m);
    background-color: var(--swatch-color); /* Ensure bg-color persists */
  }

  .spectrum-grid :global(.button.swatch.active) {
    box-shadow: 0 0 16px var(--swatch-color);
    transform: scale(1.15);
    z-index: var(--z-index-m);
    border: var(--border-l);
    border-color: rgb(var(--color-white-rgb) / var(--opacity-s));
  }

  .spectrum-grid :global(.button.swatch:disabled) {
    cursor: default;
    opacity: var(--opacity-l);
  }

  .toggle-stack {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .engine-status-wrap {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    color: var(--color-white);
  }

  .engine-status-wrap.error {
    color: var(--color-red);
  }
</style>
