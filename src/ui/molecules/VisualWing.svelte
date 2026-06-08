<script>
  /**
   * @file src/ui/profile/VisualWing.svelte
   * â„ï¸ THE ENTITY SHOWCASE ENGINE
   * Manages signature colors, generation prompts, and image modifiers.
   * Part of the RPGlitch "Chalk Regime" UI collection.
   */
  import { Button, TextField, Toggle, tooltip } from "@atoms";
  import { prompt_builder } from "@intelligence";
  import { AestheticResolver, PALETTE, PALETTE_VARS, themeStore } from "@media";
  import { llm_service } from "@platform";
  import { app } from "@state";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/profile.svelte.js').ProfileState} profileState - The profile state controller
   */

  /** @type {Props} */
  let { profileState } = $props();

  // --- CONSTANTS ---

  /** Names to exclude from the swatch grid (background gradients + chalk/neutral base tones). */
  const EXCLUDED_SWATCHES = new Set([
    "Background Gradient 1",
    "Background Gradient 2",
    "Background Gradient 3",
    "Background Gradient 4",
    "Chalk",
    "Gunmetal",
    "Frisk",
    "Frozen",
    "Pure White",
    "Void Black",
  ]);

  /**
   * Returns the HSL hue (0â€“360) for a hex color.
   * Achromatic colors (neutrals) return 361 so they sort to the end.
   * @param {string} hex
   */
  function hex_hue(hex) {
    const h = hex.replace("#", "").padEnd(6, "0");
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 361;
    const d = max - min;
    let hue;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
    return hue * 360;
  }

  const SPECTRUM_COLORS = Object.entries(PALETTE)
    .filter(([name]) => !EXCLUDED_SWATCHES.has(name))
    .sort(([, a], [, b]) => hex_hue(a) - hex_hue(b));

  // --- INITIALIZATION ---

  /**
   * Ensures the modifiers object exists with all required fields.
   */
  const sync_modifiers = () => {
    if (!profileState.char) return;
    if (!profileState.char.modifiers) {
      profileState.char.modifiers = {
        prompt: "",
        no_background: false,
        flipped: false,
        profile_picture_seed: 0,
        color_name: "",
      };
      return;
    }
    profileState.char.modifiers.prompt ??= "";
    profileState.char.modifiers.no_background ??= false;
    profileState.char.modifiers.flipped ??= false;
    profileState.char.modifiers.profile_picture_seed ??= 0;
    profileState.char.modifiers.color_name ??= "";
  };

  sync_modifiers();
  $effect(sync_modifiers);

  // --- DERIVED ---

  const current_label = $derived(themeStore.get_signature_label(profileState.char));

  const is_prompt_busy = $derived(
    app.visual.isLoading || profileState.busy_fields.has("visual-prompt"),
  );

  const prompt_value = $derived((profileState.char?.modifiers?.prompt || "").trim());

  /** True when the prompt is freeform text (not a URL or data URI). */
  const has_prompt_text = $derived(
    prompt_value.length > 0 &&
      !prompt_value.startsWith("http") &&
      !prompt_value.startsWith("data:"),
  );

  const is_creative_disabled = $derived(
    !profileState.is_editing ||
      (is_prompt_busy &&
        (!profileState.active_field || profileState.active_field.key === "visual-prompt")) ||
      (!profileState.active_field && has_prompt_text),
  );

  // --- HANDLERS ---

  /**
   * Triggers AI enhancement for the active field, or extracts optics metadata
   * when no prompt text is present.
   */
  async function handle_creative_action() {
    const current_key = profileState.active_field?.key || "visual-prompt";
    if (profileState.busy_fields.has(current_key)) return;
    profileState.busy_fields.add(current_key);

    try {
      if (current_key === "visual-prompt") {
        if (!has_prompt_text) {
          profileState.char.modifiers.prompt = AestheticResolver.extract(profileState.char);
        } else {
          const result = await app.visual.enhance(profileState.char.modifiers.prompt);
          if (result) profileState.char.modifiers.prompt = result;
        }
      } else if (profileState.active_field) {
        const val = profileState.get_safe_value(current_key);
        if (val) {
          const payload = prompt_builder.build_enhancement(current_key, val);
          const res = await llm_service.enhance(payload);
          if (res) profileState.set_field_value(current_key, res);
        }
      }
    } catch (err) {
      console.error("[VisualWing] Creative action failed:", err);
    } finally {
      profileState.busy_fields.delete(current_key);
    }
  }

  /**
   * Triggers image generation when a prompt exists, or opens the upload dialog
   * as a fallback for direct uploads.
   */
  async function handle_generate() {
    if (profileState.busy_fields.has("visual-prompt")) return;

    if (!has_prompt_text) {
      await handle_upload_portrait();
      return;
    }

    profileState.busy_fields.add("visual-prompt");
    app.log(`[VisualWing] Generating... Prompt: ${prompt_value}`, "system");

    try {
      const url = await app.visual.generate(prompt_value, {
        no_background: profileState.noBackground,
      });
      if (url) profileState.char.profile_picture = url;
    } catch (err) {
      app.log(`Generation failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      profileState.busy_fields.delete("visual-prompt");
    }
  }

  /**
   * Handles manual image upload via Perchance upload plugin.
   */
  async function handle_upload_portrait() {
    if (profileState.busy_fields.has("visual-prompt")) return;
    profileState.busy_fields.add("visual-prompt");
    app.log("[VisualWing] Triggering manual image upload...", "system");

    try {
      const dataUrl = await app.visual.upload();
      if (dataUrl) {
        await profileState.setImage(dataUrl);
        app.log("[VisualWing] Image upload succeeded and state persisted.", "system");
      }
    } catch (err) {
      app.log(`Upload failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      profileState.busy_fields.delete("visual-prompt");
    }
  }

  /**
   * Prevents default behavior to maintain active focus states.
   * @param {MouseEvent} e
   */
  function prevent_default(e) {
    e.preventDefault();
  }
</script>

<section
  class="
    wing
    glass-elevated
  "
>
  <!-- ðŸŽ¨ COLOR SWATCHES -->
  <div class="swatches">
    {#each SPECTRUM_COLORS as [name, hex] (name)}
      {@const color = PALETTE_VARS[/** @type {keyof typeof PALETTE_VARS} */ (hex)] || hex}
      <div
        class="swatch"
        class:active={current_label === name}
        style="--swatch-color: {color}; background-color: var(--swatch-color);"
      >
        <Button
          square={true}
          cover={true}
          aria-label={name}
          actions={[tooltip]}
          onclick={() => (profileState.char.signature_color = name)}
          disabled={!profileState.is_editing}
          variant="invisible"
        ></Button>
      </div>
    {/each}
  </div>

  <!-- ðŸ‘ï¸ IMAGE PROMPT -->
  <TextField
    class="
      prompt-field

      {profileState.active_field?.key === 'visual-prompt' ? `active` : ''}"
    is_edit={profileState.is_editing}
    busy={is_prompt_busy}
    bind:value={profileState.char.modifiers.prompt}
    placeholder="Image prompt or URL..."
    disabled={!profileState.is_editing || is_prompt_busy}
    signature_color="var(--frozen)"
    onfocus={() =>
      profileState.is_editing &&
      (profileState.active_field = { key: "visual-prompt", label: "Image Prompt" })}
  >
    {#snippet status()}
      {#if is_prompt_busy || app.visual.error || app.visual.isOffline}
        <div
          class="status-bar"
          class:is-error={app.visual.error || app.visual.isOffline}
          class:is-loading={is_prompt_busy}
        >
          <div class="status-content">
            {#if app.visual.isOffline}
              <span class="tag">OFFLINE</span>
            {:else if app.visual.error}
              <span class="tag">ERROR</span>
              <span class="status-msg">{app.visual.error}</span>
            {:else if app.visual.attempts > 0}
              <span
                class="
                  tag
                  pulse
                ">RETRYING</span
              >
              <span class="status-msg">Attempt {app.visual.attempts}</span>
            {:else}
              <span
                class="
                  tag
                  pulse
                ">GENERATING</span
              >
            {/if}
          </div>
        </div>
      {/if}
    {/snippet}

    {#snippet header_actions()}
      {#if profileState.is_editing}
        <div class="actions">
          <Button
            variant="invisible"
            size="small"
            square
            aria-label={has_prompt_text ? "Enhance Prompt" : "Fetch Data"}
            class="action"
            actions={[tooltip]}
            onclick={handle_creative_action}
            onmousedown={prevent_default}
            disabled={is_creative_disabled}
          >
            {#if has_prompt_text}
              <svg
                viewBox="0 0 24 24"
                class="
                  icon-small
                  icon-outline
                "
              >
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="var(--pure-white)"
                ></path>
              </svg>
            {:else}
              <svg
                viewBox="0 0 24 24"
                class="
                  icon-small
                  icon-outline
                "
                fill="none"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--pure-white)"
                ></path>
                <polyline points="7 10 12 15 17 10" stroke="var(--pure-white)"></polyline>
                <line x1="12" y1="15" x2="12" y2="3" stroke="var(--pure-white)"></line>
              </svg>
            {/if}
          </Button>

          <Button
            variant="invisible"
            size="small"
            square
            aria-label="Generate Image"
            class="action"
            actions={[tooltip]}
            onclick={handle_generate}
            onmousedown={prevent_default}
            disabled={!profileState.is_editing || is_prompt_busy}
          >
            <svg
              viewBox="0 0 24 24"
              class="
                icon-small
                icon-outline
              "
              fill="none"
            >
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="var(--pure-white)"
              ></path>
              <circle cx="12" cy="13" r="4" stroke="var(--pure-white)"></circle>
            </svg>
          </Button>

          <Button
            variant="invisible"
            size="small"
            square
            aria-label="Upload Portrait"
            class="action"
            actions={[tooltip]}
            onclick={handle_upload_portrait}
            onmousedown={prevent_default}
            disabled={!profileState.is_editing || is_prompt_busy}
          >
            <svg
              viewBox="0 0 24 24"
              class="
                icon-small
                icon-outline
              "
              fill="none"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="var(--pure-white)"></path>
              <polyline points="17 8 12 3 7 8" stroke="var(--pure-white)"></polyline>
              <line x1="12" y1="3" x2="12" y2="15" stroke="var(--pure-white)"></line>
            </svg>
          </Button>
        </div>
      {/if}
    {/snippet}
  </TextField>

  <!-- âš™ï¸ RENDER TOGGLES -->
  <div class="controls">
    <Toggle
      label="No Background"
      bind:value={profileState.noBackground}
      disabled={!profileState.is_editing}
    />
    <Toggle
      label="Mirror Image"
      bind:value={profileState.char.modifiers.flipped}
      disabled={!profileState.is_editing}
    />
  </div>
</section>

<style>
  /* --- Wing Shell --- */

  .wing {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--gap-standard);
    padding: var(--padding-standard);
    border-radius: var(--radius-standard);
  }

  /* --- Swatches --- */

  .swatches {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--gap-tight);
  }

  .swatch {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: var(--radius-standard);
    box-shadow: var(--shadow-ghost);
    transition:
      transform var(--duration-fast) var(--motion-dissolve),
      box-shadow var(--duration-fast) var(--motion-dissolve),
      filter var(--duration-fast) var(--motion-dissolve);
  }

  .swatch:hover:not(:has(button:disabled)) {
    z-index: var(--z-index-elevated);
    box-shadow: var(--shadow-standard);
    filter: brightness(1.15);
  }

  .swatch.active {
    outline: calc(var(--spacing-pixel) * 3) solid var(--pure-white);
    outline-offset: calc(var(--spacing-pixel) * 2);
    box-shadow: 0 0 calc(var(--spacing-unit) * 5) var(--swatch-color);
    transform: scale(1.14);
    z-index: var(--z-index-elevated);
    cursor: default;
    filter: brightness(1.1);
  }

  .swatch.active:hover {
    filter: none;
  }

  /* --- Status & Actions --- */

  :global(.prompt-field .status-bar) {
    display: flex;
    align-items: center;
    gap: var(--gap-standard);
    color: var(--pure-white);
    background: rgb(from var(--pure-white) r g b / var(--opacity-ghost));
    padding: var(--padding-tight);
    border-radius: var(--radius-full);
    border: var(--spacing-pixel) solid rgb(from var(--pure-white) r g b / var(--opacity-whisper));
  }

  :global(.prompt-field .status-content) {
    display: flex;
    align-items: center;
    gap: var(--gap-standard);
    box-sizing: border-box;
  }

  :global(.prompt-field .status-bar.is-error) {
    color: var(--crimson-red);
    background: rgb(from var(--crimson-red) r g b / var(--opacity-whisper));
    border-color: rgb(from var(--crimson-red) r g b / var(--opacity-whisper));
  }

  :global(.prompt-field .tag) {
    font-family: var(--font-family-mono);
    font-size: var(--font-size-tiny);
    font-weight: var(--font-weight-bold);
    letter-spacing: var(--font-spacing-loose);
    text-transform: uppercase;
    color: inherit;
  }

  :global(.prompt-field .tag.pulse) {
    animation: pulse-tag 1.4s ease-in-out infinite;
  }

  :global(.prompt-field .actions) {
    display: flex;
    align-items: center;
    gap: var(--gap-tight);
  }

  /* --- Controls --- */

  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--gap-tight);
  }

  /* --- Animations --- */

  @keyframes pulse-tag {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>
