<script>
  /**
   * @file src/ui/profile/ProfileHeader.svelte
   * 🪐 HIGH-FIDELITY PROFILE TRANSLATION NODE
   * Organism component managing designation titles and context description text blocks.
   * Enforces strict Svelte 5 state machine physics and Nordic styling token regimes.
   */

  import { auto_resize } from "@ui";
  import { PROFILE_FIELDS } from "@data";
  import { GlassWrapper } from "@primitives";

  // --- PROP MATRIX BOUNDARIES ---
  let {
    id = $bindable(""),
    name = $bindable(""),
    description = $bindable(""),
    is_editing = false,
    active_field = "",
    entity_type = "character",
    on_focus_field = () => {},
    signature_color = "var(--color-frozen)",
    class: className = "",
  } = $props();

  // --- INTERACTIVE SYSTEM RUNES ---
  /** @type {HTMLInputElement | undefined} */
  let name_input = $state();

  /**
   * Cleans raw name text for header rendering.
   * @param {string} rawName
   * @returns {string}
   */
  function format_name(rawName) {
    if (!rawName) return "";
    return rawName.trim();
  }

  // Fine-grained tracking of edit state transitions to capture viewport focus boundaries
  $effect(() => {
    if (is_editing && active_field === "name" && name_input) {
      name_input.focus();
      name_input.select();
    }
  });
</script>

<div
  class="
    flex
    min-h-10
    w-full
    min-w-0
    shrink-0
    flex-col
    gap-2

    {className}"
  data-testid="profile-header"
  role="banner"
>
  {#if is_editing}
    <div class="mb-1 flex items-center gap-2 font-mono text-xs opacity-80">
      <span class="text-slate-400">@ID:</span>
      <input
        type="text"
        bind:value={id}
        placeholder="SLUG"
        pattern="^[A-Za-z0-9_-]{2,20}$"
        maxlength="20"
        class="border-b border-white/20 bg-transparent px-1 py-0.5 font-mono text-xs tracking-wider uppercase outline-none focus:border-white/60"
        style="color: {signature_color};"
        oninput={(event) => {
          id = event.currentTarget.value
            .toUpperCase()
            .replace(/[^A-Z0-9_-]/g, "")
            .slice(0, 20);
        }}
        onfocus={() => on_focus_field("id", "Entity Handle (@ID)")}
        onblur={() => on_focus_field("", "")}
      />
    </div>
  {:else if id}
    <div class="mb-1 font-mono text-xs opacity-60 {entity_type === 'fractal' ? 'text-left' : 'text-right'}" style="color: {signature_color};">
      @{id.toUpperCase()}
    </div>
  {/if}

  <div
    class="
    w-full
    min-w-0
    shrink-0
  "
  >
    {#if is_editing}
      <GlassWrapper is_expanded={active_field === "name"} {signature_color}>
        <input
          bind:this={name_input}
          bind:value={name}
          class="
            z-20
            box-border
            w-full
            border-none
            bg-transparent
            p-3
            text-left
            font-heading
            text-4xl
            leading-none
            font-extrabold
            tracking-normal
            outline-none
            sm:text-5xl
            md:text-6xl
          "
          style="color: {signature_color}; font-size: clamp(2.5rem, 5vw, 4.5rem) !important;"
          onfocus={() => on_focus_field("name", "Entity Name")}
          onblur={() => on_focus_field("", "")}
        />
      </GlassWrapper>
    {:else}
      <h1
        class="
          m-0
          block
          {entity_type === 'fractal' ? 'text-left' : 'text-right'}
          font-heading
          text-6xl leading-none font-extrabold
          tracking-tight
          text-balance
          sm:text-7xl
          md:text-8xl
          lg:text-[5.5rem]
        "
        style="margin: 0 !important; color: {signature_color}; font-size: clamp(3.5rem, 7vw, 6rem) !important; filter: drop-shadow(0 4px 16px rgb(0 0 0 / 0.4));"
      >
        {format_name(name)}
      </h1>
    {/if}
  </div>

  {#if is_editing}
    <GlassWrapper is_expanded={active_field === "description"} {signature_color}>
      <textarea
        class="
          z-20
          m-0
          max-h-[calc(var(--spacing-row-unit)*4)]
          min-h-row-unit
          w-full
          resize-none
          [scrollbar-color:color-mix(in_srgb,var(--signature-color)_40%,var(--color-gunmetal))_transparent]
          border-none
          bg-transparent
          p-3
          text-left
          font-sans
          text-sm
          leading-relaxed
          [text-wrap:auto]
          text-slate-50
          outline-none
          placeholder:text-slate-400
          placeholder:italic
          placeholder:opacity-60
          [&::-webkit-scrollbar]:h-[calc(var(--spacing-unit)*2)]
          [&::-webkit-scrollbar]:w-[calc(var(--spacing-unit)*2)]
          [&::-webkit-scrollbar-thumb]:rounded-standard

          [&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--signature-color)_40%,var(--color-gunmetal))]
          hover:[&::-webkit-scrollbar-thumb]:bg-[color-mix(in_srgb,var(--signature-color)_60%,var(--color-frisk))]
          [&::-webkit-scrollbar-track]:bg-transparent
        "
        placeholder={PROFILE_FIELDS.description.description}
        bind:value={description}
        use:auto_resize
        onfocus={() => on_focus_field("description", "Description")}
        onblur={() => on_focus_field("", "")}
      ></textarea>
    </GlassWrapper>
  {:else if description}
    <p
      class="
        m-0
        rounded-md
        {entity_type === 'fractal' ? 'text-left' : 'text-right'}
        font-sans
        text-sm
        leading-relaxed
        text-balance
        whitespace-pre-wrap
        text-slate-200
        opacity-75
      "
    >
      {description}
    </p>
  {/if}
</div>

<!--
  CHANGELOG
  - 2026-10-14: Atom 3.3 — Added user-configurable single-word entity ID handle editor and @SLUG display tag.
-->
