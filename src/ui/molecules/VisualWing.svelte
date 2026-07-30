<script>
  /**
   * @file src/ui/profile/VisualWing.svelte
   * ❄️ THE ENTITY SHOWCASE ENGINE
   * Manages signature colors, generation prompts, and image modifiers.
   * Part of the RPGlitch UI.
   */
  import { Button, TextField, Toggle, NumberField, Dropdown, tooltip, Label } from "@atoms";
  import { strip_cognition_blocks } from "@intelligence";
  import { AestheticResolver, get_signature_label, PALETTE, PALETTE_VARS, SIGNATURE_COLORS } from "@media";
  import { app } from "@state";
  import { VISUAL_STYLES } from "@data";

  /**
   * @typedef {Object} Props
   * @property {import('@organisms/Profile.svelte.js').ProfileState} profile_state - The profile state controller
   */

  /** @type {Props} */
  let { profile_state } = $props();

  // --- CONSTANTS ---

  /**
   * Returns the HSL hue (0–360) for a hex color.
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
    .filter(([name]) => SIGNATURE_COLORS.includes(name))
    .sort(([, a], [, b]) => hex_hue(a) - hex_hue(b));

  // --- INITIALIZATION ---

  /**
   * Ensures the modifiers object exists with all required fields.
   */
  const sync_modifiers = () => {
    if (!profile_state.char) return;
    if (!profile_state.char.modifiers) {
      profile_state.char.modifiers = {
        prompt: "",
        negative_prompt: "",
        no_background: false,
        flipped: false,
        profile_picture_seed: null,
        last_generated_seed: null,
        color_name: "",
      };
      return;
    }
    profile_state.char.modifiers.prompt ??= "";
    profile_state.char.modifiers.negative_prompt ??= "";
    profile_state.char.modifiers.no_background ??= false;
    profile_state.char.modifiers.flipped ??= false;
    if (profile_state.char.modifiers.profile_picture_seed === 0 || profile_state.char.modifiers.profile_picture_seed === undefined) {
      profile_state.char.modifiers.profile_picture_seed = null;
    }
    profile_state.char.modifiers.last_generated_seed ??= null;
    profile_state.char.modifiers.color_name ??= "";
  };

  sync_modifiers();
  $effect(sync_modifiers);

  // --- DERIVED ---

  const current_label = $derived(get_signature_label(profile_state.char));

  const is_prompt_busy = $derived(app.visual.isLoading || profile_state.busy_fields.has("visual-prompt"));

  const prompt_value = $derived((profile_state.char?.modifiers?.prompt || "").trim());

  /** True when the prompt is freeform text (not a URL or data URI). */
  const has_prompt_text = $derived(prompt_value.length > 0 && !prompt_value.startsWith("http") && !prompt_value.startsWith("data:"));

  const is_creative_disabled = $derived(!profile_state.is_editing || is_prompt_busy);

  const visual_style_options = Object.values(VISUAL_STYLES)
    .sort((a, b) => {
      if (a.id === "none") return -1;
      if (b.id === "none") return 1;
      return a.name.localeCompare(b.name);
    })
    .map((style) => ({
      value: style.id,
      label: style.name,
      portrait: style.portrait,
      tag: style.description,
      tooltip: `${style.name}: ${style.description}`,
    }));

  // --- HANDLERS ---

  /**
   * Triggers AI enhancement for the visual prompt field, or extracts optics metadata
   * when no prompt text is present.
   */
  async function handle_creative_action() {
    if (profile_state.busy_fields.has("visual-prompt")) return;
    profile_state.busy_fields.add("visual-prompt");

    try {
      if (!has_prompt_text) {
        profile_state.char.modifiers.prompt = AestheticResolver.extract(profile_state.char);
      } else {
        const result = await app.visual.enhance(profile_state.char.modifiers.prompt, profile_state.char.type, profile_state.char);
        if (result) {
          let positive = result.prompt || "";
          let negative = result.negative_prompt || "";

          // Emergency extraction slice if upstream JSON.parse tripped and returned a raw string dump
          if (!negative && (positive.includes('"prompt"') || positive.includes('"negative_prompt"'))) {
            const clean_text = strip_cognition_blocks(positive);
            const prompt_match = clean_text.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
            const neg_match = clean_text.match(/"negative(?:Prompt|_prompt)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);

            if (prompt_match && prompt_match[1]) {
              positive = prompt_match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
            }
            if (neg_match && neg_match[1]) {
              negative = neg_match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
            }
          }

          if (positive) profile_state.char.modifiers.prompt = positive.trim();
          if (negative) profile_state.char.modifiers.negative_prompt = negative.trim();
        }
      }
    } catch (err) {
      console.error("[VisualWing] Creative action failed:", err);
    } finally {
      profile_state.busy_fields.delete("visual-prompt");
    }
  }

  /**
   * Triggers image generation when a prompt exists, or opens the upload dialog
   * as a fallback for direct uploads.
   */
  async function handle_generate() {
    if (profile_state.busy_fields.has("visual-prompt")) return;

    if (!has_prompt_text) {
      await handle_upload_portrait();
      return;
    }

    profile_state.busy_fields.add("visual-prompt");
    app.log(`[VisualWing] Generating... Prompt: ${prompt_value}`, "system");

    try {
      const payload = await app.visual.generate(prompt_value, {
        mode: profile_state.char.type,
        no_background: profile_state.noBackground,
        negative_prompt: profile_state.char.modifiers.negative_prompt || undefined,
        seed:
          profile_state.char.modifiers.profile_picture_seed !== null &&
          profile_state.char.modifiers.profile_picture_seed !== undefined &&
          profile_state.char.modifiers.profile_picture_seed !== ""
            ? Number(profile_state.char.modifiers.profile_picture_seed)
            : undefined,
        returnPayload: true,
        _entity: profile_state.char,
      });
      if (payload?.url) {
        profile_state.char.profile_picture = payload.url;
        if (payload.metadata?.seed !== undefined) profile_state.char.modifiers.last_generated_seed = payload.metadata.seed;
      }
    } catch (err) {
      app.log(`Generation failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      profile_state.busy_fields.delete("visual-prompt");
    }
  }

  /**
   * Handles manual image upload via Perchance upload plugin.
   */
  async function handle_upload_portrait() {
    if (profile_state.busy_fields.has("visual-prompt")) return;
    profile_state.busy_fields.add("visual-prompt");
    app.log("[VisualWing] Triggering manual image upload...", "system");

    try {
      const data_url = await app.visual.upload();
      if (data_url) {
        await profile_state.setImage(data_url);
        app.log("[VisualWing] Image upload succeeded and state persisted.", "system");
      }
    } catch (err) {
      app.log(`Upload failed: ${/** @type {Error} */ (err).message}`, "error");
    } finally {
      profile_state.busy_fields.delete("visual-prompt");
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
  flex w-full
  flex-col
  gap-2
  rounded-standard
  bg-glass-elevated
  p-padding-standard
  [backdrop-filter:var(--blur-mist)]
"
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
>
  <div class="flex flex-col gap-2">
    <Label>Signature Color</Label>

    <div
      class="
      grid
    grid-cols-5
    gap-gap-tight
  "
    >
      {#each SPECTRUM_COLORS as [name, hex] (name)}
        {@const color = PALETTE_VARS[/** @type {keyof typeof PALETTE_VARS} */ (hex)] || hex}
        <div
          class="
          relative
          aspect-square
          w-full
          rounded-xl
          shadow-ghost
          transition-all
          duration-(--duration-fast)
          ease-(--motion-dissolve)
          has-not-disabled:hover:z-20
          has-not-disabled:hover:shadow-standard
          has-not-disabled:hover:brightness-125
          has-not-disabled:active:scale-[0.96]
          {current_label === name
            ? `
            z-25
            scale-[1.1]
            cursor-default
            [box-shadow:0_0_calc(var(--spacing-spacing-unit)*5)_var(--swatch-color)]
            outline-[calc(var(--spacing-spacing-pixel)*3)]
            outline-offset-[calc(var(--spacing-spacing-pixel)*2)]
            outline-white
            brightness-110
            outline-solid
          `
            : ''}"
          style="--swatch-color: {color}; background-color: var(--swatch-color);"
        >
          <Button
            square={true}
            cover={true}
            aria-label={name}
            actions={[tooltip]}
            onclick={() => (profile_state.char.signature_color = name)}
            disabled={!profile_state.is_editing}
            variant="invisible"
          ></Button>
        </div>
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <Label for="visual-style-select">Profile Picture Generation</Label>

    <div class="grid w-full grid-cols-[1fr_6rem] gap-2">
      <div class="flex w-full min-w-0 flex-col gap-2">
        <Dropdown
          id="visual-style-select"
          bind:value={profile_state.char.visual_style}
          items={visual_style_options}
          label="Select Visual Style"
          uppercase={false}
          matchWidth={false}
          dropdownWidth="w-80"
          align="start"
          disabled={!profile_state.is_editing}
          onchange={() => (profile_state._user_mutated = true)}
        />
      </div>
      <div class="flex h-full w-full flex-col justify-end gap-2">
        <NumberField
          id="seed-input"
          bind:value={profile_state.char.modifiers.profile_picture_seed}
          disabled={!profile_state.is_editing || is_prompt_busy}
          oninput={() => (profile_state._user_mutated = true)}
          placeholder="Seed"
          class="min-h-12 w-full"
        />
      </div>
    </div>
  </div>

  <TextField
    data-active={profile_state.active_field?.key === "visual-prompt" ? true : undefined}
    is_edit={profile_state.is_editing}
    busy={is_prompt_busy}
    bind:value={profile_state.char.modifiers.prompt}
    placeholder="Image prompt or URL..."
    disabled={!profile_state.is_editing || is_prompt_busy}
    signature_color="var(--color-frozen)"
    oninput={() => (profile_state._user_mutated = true)}
    onfocus={() => profile_state.is_editing && (profile_state.active_field = { key: "visual-prompt", label: "Image Prompt" })}
  >
    {#snippet status()}
      <div class="flex items-center gap-2">
        <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Positive Prompt</span>
        {#if is_prompt_busy || app.visual.error || app.visual.isOffline}
          <div
            class="
              flex
              items-center
              gap-2
              rounded-full
              border
              p-2

              {app.visual.error || app.visual.isOffline
              ? `
                border-red-500/15
                bg-red-500/15
                text-red-500
              `
              : `
                border-white/15
                bg-white/5
                text-slate-50
              `}"
            data-loading={is_prompt_busy}
          >
            <div
              class="
              box-border
              flex
              items-center
              gap-2
            "
            >
              {#if app.visual.isOffline}
                <span
                  class="
                    font-mono
                    text-[0.625rem]
                    tracking-widest
                    text-inherit
                    uppercase
                  ">OFFLINE</span
                >
              {:else if app.visual.error}
                <span
                  class="
                    font-mono
                    text-[0.625rem]
                    tracking-widest
                    text-inherit
                    uppercase
                  ">ERROR</span
                >
                <span class="font-mono text-[10px] tracking-widest text-slate-400 uppercase opacity-80">{app.visual.error}</span>
              {:else if app.visual.attempts > 0}
                <span
                  class="
                    animate-pulse
                    font-mono
                    text-[0.625rem]
                    tracking-widest
                    text-inherit
                    uppercase
                  ">RETRYING</span
                >
                <span class="font-mono text-[10px] tracking-widest text-slate-400 uppercase opacity-80">Attempt {app.visual.attempts}</span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/snippet}

    {#snippet header_actions()}
      {#if profile_state.is_editing}
        <div
          class="
          flex
          items-center
          gap-2
        "
        >
          <Button
            variant="invisible"
            size="small"
            square
            aria-label={has_prompt_text ? "Enhance Prompt" : "Fetch Data"}
            actions={[tooltip]}
            onclick={handle_creative_action}
            onmousedown={prevent_default}
            disabled={is_creative_disabled}
          >
            {#if has_prompt_text}
              <svg
                viewBox="0 0 24 24"
                class="
                size-icon-small
              "
              >
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
              </svg>
            {:else}
              <svg
                viewBox="0 0 24 24"
                class="
                size-icon-small
              "
                fill="none"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"></path>
                <polyline points="7 10 12 15 17 10" stroke="currentColor"></polyline>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor"></line>
              </svg>
            {/if}
          </Button>

          <Button
            variant="invisible"
            size="small"
            square
            aria-label={has_prompt_text ? "Generate Image" : "Upload Portrait"}
            actions={[tooltip]}
            onclick={handle_generate}
            onmousedown={prevent_default}
            disabled={!profile_state.is_editing || is_prompt_busy}
          >
            {#if has_prompt_text}
              <svg
                viewBox="0 0 24 24"
                class="
                size-icon-small
              "
                fill="none"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor"></path>
                <circle cx="12" cy="13" r="4" stroke="currentColor"></circle>
              </svg>
            {:else}
              <svg
                viewBox="0 0 24 24"
                class="
                size-icon-small
              "
                fill="none"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"></path>
                <polyline points="17 8 12 3 7 8" stroke="currentColor"></polyline>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor"></line>
              </svg>
            {/if}
          </Button>
        </div>
      {/if}
    {/snippet}
  </TextField>

  <TextField
    data-active={profile_state.active_field?.key === "visual-negative-prompt" ? true : undefined}
    is_edit={profile_state.is_editing}
    busy={is_prompt_busy}
    bind:value={profile_state.char.modifiers.negative_prompt}
    placeholder="Negative prompt (avoid these)..."
    disabled={!profile_state.is_editing || is_prompt_busy}
    signature_color="var(--color-frozen)"
    oninput={() => (profile_state._user_mutated = true)}
    onfocus={() => profile_state.is_editing && (profile_state.active_field = { key: "visual-negative-prompt", label: "Negative Prompt" })}
  >
    {#snippet status()}
      <span class="font-mono text-[0.625rem] tracking-widest text-slate-50 uppercase">Negative Prompt</span>
    {/snippet}
  </TextField>

  <div class="flex items-center justify-between gap-2">
    <!-- Left: Toggles -->
    <div class="flex flex-col gap-2">
      <Toggle label="Transparent Background" bind:value={profile_state.noBackground} disabled={!profile_state.is_editing} />
      <Toggle
        label="Flip Image"
        bind:value={profile_state.char.modifiers.flipped}
        disabled={!profile_state.is_editing}
        onchange={() => (profile_state._user_mutated = true)}
      />
    </div>
  </div>
</section>
