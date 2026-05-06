<script>
  /**
   * @file src/ui/profile/VisualWing.svelte
   * ❄️ THE ENTITY SHOWCASE ENGINE
   * Manages signature colors, generation prompts, and modifiers.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import Button from "@atoms/Button.svelte";
  import TextField from "@atoms/TextField.svelte";
  import Toggle from "@atoms/Toggle.svelte";
  import Wing from "@atoms/Wing.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { llm_service } from "@core/intelligence/llm-service.js";
  import { prompt_builder } from "@core/intelligence/prompt-builder.js";
  import { validateImage } from "@core/security.js";
  import { AestheticResolver } from "@media/optics.js";
  import { app } from "@state/app.svelte.js";
  import { PALETTE, PALETTE_VARS } from "@theme/palette.svelte.js";
  import { get_value, set_value } from "@utils/field-path.js";

  const SPECTRUM_COLORS = Object.entries(PALETTE).filter(([name]) => name !== "default");

  /** @type {{ char: any, is_editing: boolean, busy_fields: Set<string>, active_field: any }} */
  let { char = $bindable(), is_editing, busy_fields, active_field = $bindable() } = $props();

  // --- STATE MANAGEMENT ---

  /** Synchronously ensure the modifiers object exists */
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

  let file_input = $state();

  // --- DERIVED LOGIC ---

  const is_prompt_busy = $derived(app.visual.isLoading || busy_fields.has("visual-prompt"));
  const prompt_value = $derived((char.modifiers.prompt || "").trim());
  const has_prompt_text = $derived(
    prompt_value.length > 0 &&
      !prompt_value.startsWith("http") &&
      !prompt_value.startsWith("data:"),
  );

  const is_creative_disabled = $derived(
    !is_editing ||
      (is_prompt_busy && (!active_field || active_field.key === "visual-prompt")) ||
      (!active_field && has_prompt_text),
  );

  // --- LOGIC HANDLERS ---

  async function handle_creative_action() {
    const current_key = active_field?.key || "visual-prompt";
    if (busy_fields.has(current_key)) return;
    busy_fields.add(current_key);

    try {
      if (current_key === "visual-prompt") {
        if (!has_prompt_text) {
          char.modifiers.prompt = AestheticResolver.extract(char);
        } else {
          const result = await app.visual.enhance(char.modifiers.prompt, {
            physical: char.modifiers.prompt,
          });
          if (result) char.modifiers.prompt = result;
        }
      } else {
        if (active_field) active_field = null;
        const val = get_value(char, current_key);
        if (val) {
          const payload = prompt_builder.build_enhancement(current_key, val);
          const res = await llm_service.enhance(payload);
          if (res) set_value(char, current_key, res);
        }
      }
    } catch (err) {
      console.error("Creative action failed:", err);
    } finally {
      busy_fields.delete(current_key);
    }
  }

  async function handle_generate() {
    if (busy_fields.has("visual-prompt")) return;
    busy_fields.add("visual-prompt");

    if (has_prompt_text) {
      app.log(`[VisualWing] Triggering Generate. Prompt: ${prompt_value}`, "system");
      try {
        const url = await app.visual.generate(prompt_value, {
          noBackground: char.modifiers.noBackground,
        });
        if (url) char.profile_picture = url;
      } catch (err) {
        console.error("Generation failed:", err);
        app.log(`Generation failed: ${/** @type {Error} */ (err).message}`, "error");
      } finally {
        busy_fields.delete("visual-prompt");
      }
    } else {
      file_input.click();
      busy_fields.delete("visual-prompt");
    }
  }

  /** @param {Event & { currentTarget: HTMLInputElement }} e */
  async function handle_upload(e) {
    if (!e.currentTarget.files) return;
    const file = e.currentTarget.files[0];
    if (!file) return;
    try {
      await validateImage(file);
      const url = await app.visual.upload(file);
      if (url) char.profile_picture = url;
    } catch (err) {
      console.error("Upload failed:", err);
      app.log(`Upload failed: ${/** @type {Error} */ (err).message}`, "error");
    }
  }

  /** @param {FocusEvent & { currentTarget: HTMLElement }} e */
  function handle_focus_out(e) {
    const root = e.currentTarget;
    setTimeout(() => {
      const focus = document.activeElement;
      if (
        root &&
        !root.contains(focus) &&
        busy_fields.size === 0 &&
        !focus?.closest(".text-area")
      ) {
        active_field = null;
      }
    }, 50);
  }
</script>

<Wing class="wrapper" onfocusout={handle_focus_out}>
  <div class="group">
    <div class="grid">
      {#each SPECTRUM_COLORS as [name, hex] (name)}
        {@const color = PALETTE_VARS[/** @type {keyof typeof PALETTE_VARS} */ (hex)] || hex}
        <Button
          className="swatch {char.signature_color === hex || char.signature_color === name
            ? 'active'
            : ''}"
          style="background-color: {color}; --swatch-color: {color};"
          aria-label={name.charAt(0).toUpperCase() + name.slice(1)}
          actions={[tooltip]}
          onclick={() => (char.signature_color = name)}
          disabled={!is_editing}
          variant="invisible"
        ></Button>
      {/each}
    </div>
  </div>

  <div class="group">
    <TextField
      class="control"
      style="--signature-color: var(--color-frozen);"
      is_edit={is_editing}
      busy={is_prompt_busy}
      bind:value={char.modifiers.prompt}
      placeholder="Enter image prompt or paste a URL..."
      disabled={!is_editing || is_prompt_busy}
      onfocus={() => is_editing && (active_field = { key: "visual-prompt", label: "Image Prompt" })}
    >
      {#snippet status()}
        {#if is_prompt_busy || app.visual.error || app.visual.isOffline}
          <div class="status" class:error={app.visual.error || app.visual.isOffline}>
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
          <div class="actions">
            <Button
              variant="invisible"
              size="sm"
              square
              aria-label={has_prompt_text ? "Enhance" : "Fetch"}
              className="btn"
              actions={[tooltip]}
              onclick={handle_creative_action}
              disabled={is_creative_disabled}
            >
              {#if has_prompt_text}
                <svg viewBox="0 0 24 24" class="icon-xs icon-outline"
                  ><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="var(--color-white)"
                  ></path></svg
                >
              {:else}
                <svg viewBox="0 0 24 24" class="icon-xs icon-outline"
                  ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--color-white)"
                  ></path><polyline points="7 10 12 15 17 10" stroke="var(--color-white)"
                  ></polyline><line x1="12" y1="15" x2="12" y2="3" stroke="var(--color-white)"
                  ></line></svg
                >
              {/if}
            </Button>

            <Button
              variant="invisible"
              size="sm"
              square
              aria-label="Generate Image"
              className="btn"
              actions={[tooltip]}
              onclick={handle_generate}
              disabled={!is_editing || is_prompt_busy}
            >
              <svg viewBox="0 0 24 24" class="icon-xs icon-outline"
                ><path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke="var(--color-white)"
                ></path><circle cx="12" cy="13" r="4" stroke="var(--color-white)"></circle></svg
              >
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
    <div class="stack">
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
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) 0;
  }

  .grid :global(.button.swatch) {
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

  .grid :global(.button.swatch:hover:not(:disabled)) {
    transform: scale(1.1);
    z-index: var(--z-index-m);
    box-shadow: var(--shadow-m);
    background-color: var(--swatch-color);
  }

  .grid :global(.button.swatch.active) {
    box-shadow: 0 0 16px var(--swatch-color);
    transform: scale(1.15);
    z-index: var(--z-index-m);
    border: var(--border-l);
    border-color: rgb(var(--color-white-rgb) / var(--opacity-s));
  }

  .grid :global(.button.swatch:disabled) {
    cursor: default;
    opacity: var(--opacity-l);
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .status {
    display: flex;
    align-items: center;
    gap: var(--spacing-s);
    color: var(--color-white);
  }

  .status.error {
    color: var(--color-red);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
</style>
