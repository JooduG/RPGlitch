<script module>
  import { VISUAL_STYLES } from "@definitions";
  import { PALETTE, SIGNATURE_COLORS, to_style_dropdown_items } from "@utils";

  /** Returns HSL hue (0-360) for a hex color; neutrals sort last. */
  function hex_hue(hex) {
    const h = hex.replace("#", "").padEnd(6, "0");
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === min) return 361;
    const d = max - min;
    const hue =
      max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g ? ((b - r) / d + 2) / 6
      : ((r - g) / d + 4) / 6;
    return hue * 360;
  }

  const SPECTRUM_COLORS = Object.entries(PALETTE)
    .filter(([name]) => SIGNATURE_COLORS.includes(name))
    .sort(([, a], [, b]) => hex_hue(a) - hex_hue(b));

  const VISUAL_STYLE_OPTIONS = to_style_dropdown_items(VISUAL_STYLES, "none");
</script>

<script>
  /**
   * @file src/ui/organisms/VisualWing.svelte
   * Signature color, diffusion style, prompt authoring, and portrait generation wing for Profile.
   */
  import { Button, Icon, Label, Toggle, tooltip } from "@atoms";
  import { refine_image_prompt } from "@engine";
  import { visual_engine } from "@media";
  import { Dropdown, SourceField, TextField } from "@molecules";
  import { extract_aesthetic_traits, sanitize_visual_text } from "@simulation";
  import { app } from "@state";
  import { get_signature_label, PALETTE_CSS_VARIABLES } from "@utils";

  let { profile_state } = $props();

  function sync_modifiers() {
    if (!profile_state.char) return;
    if (!profile_state.char.modifiers) {
      profile_state.char.modifiers = { prompt: "", negative_prompt: "", flipped: false, profile_picture_seed: null, last_generated_seed: null };
      return;
    }
    const m = profile_state.char.modifiers;
    m.prompt ??= "";
    m.negative_prompt ??= "";
    m.flipped ??= false;
    if (m.profile_picture_seed === 0 || m.profile_picture_seed === undefined) m.profile_picture_seed = null;
    m.last_generated_seed ??= null;
  }

  sync_modifiers();
  $effect(sync_modifiers);

  let generate_error = $state("");

  const current_label = $derived(get_signature_label(profile_state.char));
  const is_prompt_busy = $derived(profile_state.busy_fields.has("generating-image") || profile_state.busy_fields.has("visual-prompt"));
  const prompt_value = $derived((profile_state.char?.modifiers?.prompt || "").trim());
  const has_prompt_text = $derived(prompt_value.length > 0 && !prompt_value.startsWith("http") && !prompt_value.startsWith("data:"));
  const is_creative_disabled = $derived(!profile_state.is_editing || is_prompt_busy);

  async function handle_creative_action() {
    if (profile_state.busy_fields.has("visual-prompt")) return;
    profile_state.busy_fields.add("visual-prompt");

    try {
      if (!prompt_value) {
        profile_state.char.modifiers.prompt = extract_aesthetic_traits(profile_state.char);
        profile_state.mark_mutated();
      } else if (has_prompt_text) {
        const result = await refine_image_prompt(profile_state.char.modifiers.prompt, profile_state.char.type, profile_state.char, app.settings?.visual_style);
        if (!result) return;
        const positive = sanitize_visual_text(result.prompt || "").trim();
        const negative = sanitize_visual_text(result.negative_prompt || "").trim();

        if (!positive || positive.includes("_thought_process") || positive.trimStart().startsWith('{"_thought_process')) {
          console.warn("Envision returned no usable prose - draft kept");
        } else {
          profile_state.char.modifiers.prompt = positive;
          if (negative) profile_state.char.modifiers.negative_prompt = negative;
          profile_state.mark_mutated();
        }
      }
    } catch (err) {
      console.error("[VisualWing] Creative action failed:", err);
    } finally {
      profile_state.busy_fields.delete("visual-prompt");
    }
  }

  async function handle_generate() {
    if (profile_state.busy_fields.has("visual-prompt") || !has_prompt_text) return;

    generate_error = "";
    profile_state.busy_fields.add("visual-prompt");
    profile_state.busy_fields.add("generating-image");

    try {
      const m = profile_state.char.modifiers;
      const has_seed = m.profile_picture_seed !== null && m.profile_picture_seed !== undefined && m.profile_picture_seed !== "";
      const payload = await visual_engine.generate(prompt_value, {
        mode: profile_state.char?.type === "fractal" ? "story_scene" : "solo_entity",
        negative_prompt: m.negative_prompt || undefined,
        seed: has_seed ? Number(m.profile_picture_seed) : undefined,
        returnPayload: true,
        _entity: profile_state.char,
      });

      if (payload?.image_url) {
        profile_state.char.profile_picture = payload.image_url;
        if (payload.metadata?.seed !== undefined) m.last_generated_seed = payload.metadata.seed;
        profile_state.mark_mutated();
      }
    } catch (err) {
      generate_error = /** @type {Error} */ (err).message || "Generation failed";
      console.error(`Generation failed: ${generate_error}`, err);
    } finally {
      profile_state.busy_fields.delete("visual-prompt");
      profile_state.busy_fields.delete("generating-image");
    }
  }

  function handle_source_field(info) {
    if (info.kind === "image" && info.data_url) {
      profile_state.setImage(info.data_url);
    } else if (info.kind === "error") {
      generate_error = info.message || "Unknown error";
      console.error(`Image failed: ${generate_error}`);
    }
  }
</script>

<div
  role="region"
  aria-label="Visual settings"
  class="flex w-full flex-col gap-tight rounded-standard bg-glass-elevated p-standard [backdrop-filter:var(--blur-mist)]"
  style:animation="wing-item-slide-down var(--motion-elastic) forwards"
  style:--signature-color="var(--color-frozen)">
  <Label>Signature Color</Label>

  <div class="isolate grid grid-cols-5 gap-tight">
    {#each SPECTRUM_COLORS as [name, hex] (name)}
      {@const color = PALETTE_CSS_VARIABLES[/** @type {keyof typeof PALETTE_CSS_VARIABLES} */ (hex)] || hex}
      <div
        class={[
          "relative aspect-square w-full rounded-xl shadow-ghost transition-shadow duration-fast ease-out has-not-disabled:hover:z-20 has-not-disabled:hover:shadow-standard has-not-disabled:hover:brightness-125 has-not-disabled:active:scale-sink",
          current_label === name &&
            "z-20 scale-[1.1] cursor-default [box-shadow:0_0_calc(var(--spacing-unit)*5)_var(--color-swatch-active)] outline-[calc(var(--spacing-pixel)*3)] outline-offset-[calc(var(--spacing-pixel)*2)] outline-white brightness-110 outline-solid",
        ]}
        style:--color-swatch-active={color}
        style:background-color="var(--color-swatch-active)">
        <Button
          square={true}
          cover={true}
          aria-label={name}
          actions={[tooltip]}
          onclick={() => {
            profile_state.char.signature_color = name;
            profile_state.mark_mutated();
          }}
          disabled={!profile_state.is_editing}
          variant="invisible" />
      </div>
    {/each}
  </div>

  <Label for="visual-style-select" class="pt-tight">Profile Picture Generation</Label>

  <div class="grid w-full grid-cols-[minmax(0,1fr)_6rem] items-stretch gap-tight">
    <Dropdown
      id="visual-style-select"
      bind:value={profile_state.char.visual_style}
      items={VISUAL_STYLE_OPTIONS}
      label="Select Visual Style"
      matchWidth={false}
      dropdownWidth="w-80"
      align="start"
      disabled={!profile_state.is_editing}
      onchange={() => profile_state.mark_mutated()} />

    <input
      id="seed-input"
      type="number"
      bind:value={profile_state.char.modifiers.profile_picture_seed}
      disabled={!profile_state.is_editing || is_prompt_busy}
      oninput={() => profile_state.mark_mutated()}
      placeholder="Seed"
      class="glass-input min-h-12 w-full [appearance:textfield] text-center font-mono [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
  </div>

  <SourceField
    mode="image"
    bind:value={profile_state.char.modifiers.prompt}
    disabled={!profile_state.is_editing || is_prompt_busy}
    busy={is_prompt_busy}
    is_edit={profile_state.is_editing}
    placeholder="Image prompt, URL, or drop/paste an image here..."
    size="sm"
    data-active={profile_state.active_field?.key === "visual-prompt" ? true : undefined}
    oninput={() => profile_state.mark_mutated()}
    onfocus={() => profile_state.is_editing && profile_state.set_active_field("visual-prompt", "Image Prompt")}
    onblur={() => profile_state.set_active_field("", "")}
    on_source={handle_source_field}>
    {#snippet status()}
      <div class="flex items-center gap-tight">
        <span class="type-uppercase-label text-frisk">Positive Prompt</span>
        {#if generate_error}
          <span
            class="inline-flex items-center gap-tight rounded-full border border-red-500/15 bg-red-500/15 px-tight py-0.5 type-uppercase-label text-red-500"
            data-loading={is_prompt_busy}>
            <span>ERROR</span>
            <span class="text-slate-400 opacity-80">{generate_error}</span>
          </span>
        {/if}
      </div>
    {/snippet}

    {#snippet header_actions()}
      {#if profile_state.is_editing}
        <div class="flex items-center gap-tight">
          <Button
            variant="invisible"
            size="small"
            square
            aria-label={has_prompt_text ? "Envision Prompt" : "Fetch Data"}
            actions={[tooltip]}
            onclick={handle_creative_action}
            onmousedown={(e) => e.preventDefault()}
            disabled={is_creative_disabled}>
            <Icon name={has_prompt_text ? "ai_enhance" : "download"} class="size-icon-small" />
          </Button>

          {#if has_prompt_text}
            <Button
              variant="invisible"
              size="small"
              square
              aria-label="Generate Image"
              actions={[tooltip]}
              onclick={handle_generate}
              onmousedown={(e) => e.preventDefault()}
              disabled={is_creative_disabled}>
              <Icon name="camera" class="size-icon-small" />
            </Button>
          {/if}
        </div>
      {/if}
    {/snippet}
  </SourceField>

  <TextField
    data-active={profile_state.active_field?.key === "visual-negative-prompt" ? true : undefined}
    is_edit={profile_state.is_editing}
    busy={is_prompt_busy}
    bind:value={profile_state.char.modifiers.negative_prompt}
    placeholder="Negative prompt (avoid these)..."
    disabled={!profile_state.is_editing || is_prompt_busy}
    oninput={() => profile_state.mark_mutated()}
    onfocus={() => profile_state.is_editing && profile_state.set_active_field("visual-negative-prompt", "Negative Prompt")}
    onblur={() => profile_state.set_active_field("", "")}>
    {#snippet status()}
      <span class="type-uppercase-label text-frisk">Negative Prompt</span>
    {/snippet}
  </TextField>

  <Toggle
    label="Flip Image"
    bind:value={profile_state.char.modifiers.flipped}
    disabled={!profile_state.is_editing}
    onchange={() => profile_state.mark_mutated()} />
</div>
