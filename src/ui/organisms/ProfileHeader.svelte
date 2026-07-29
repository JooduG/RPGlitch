<script>
  /**
   * @file src/ui/organisms/ProfileHeader.svelte
   * 🪐 HIGH-FIDELITY PROFILE TRANSLATION NODE
   * Organism component managing designation titles and context description text blocks.
   * Enforces strict Svelte 5 state machine physics and Nordic styling token regimes.
   */
  import { FitText } from "@motion";
  import { auto_resize } from "@actions";
  import { ENTITY_FRAGMENTS } from "@intelligence";

  // --- PROP MATRIX BOUNDARIES ---
  let {
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
    min-h-(--text-h3)
    w-full
    min-w-0
    shrink-0
    flex-col
    gap-2

    {className}"
  data-testid="profile-header"
  role="banner"
>
  <div
    class="
    w-full
    min-w-0
    shrink-0
  "
  >
    {#if is_editing}
      <div
        class="
          relative
          flex
          w-(--state-fill-end)
          rounded-standard
          border-transparent
          bg-[color-mix(in_srgb,var(--signature-color)_4%,var(--color-glass-sunken))]
          transition-[border-color,box-shadow,background]
          duration-(--duration-fast)
          ease-(--ease-standard)
          before:pointer-events-none
          before:absolute
          before:inset-0
          before:rounded-[inherit]
          before:mask-border-solid
          before:p-spacing-pixel
          before:opacity-whisper
          before:transition-opacity
          before:duration-(--duration-standard)
          before:content-['']
          before:[background:linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)]
          focus-within:border-transparent
          focus-within:bg-[color-mix(in_srgb,var(--signature-color)_8%,var(--color-glass-sunken))]
          focus-within:before:opacity-solid
          focus-within:before:[background:linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
          data-[expanded=true]:border-transparent
          data-[expanded=true]:bg-[color-mix(in_srgb,var(--signature-color)_8%,var(--color-glass-sunken))]
          data-[expanded=true]:before:opacity-solid
          data-[expanded=true]:before:[background:linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
        "
        data-expanded={active_field === "name"}
      >
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
            text-2xl
            font-extrabold
            tracking-normal
            outline-none
          "
          style="color: {signature_color};"
          onfocus={() => on_focus_field("name", "Entity Name")}
          onblur={() => on_focus_field("", "")}
        />
      </div>
    {:else}
      <h1
        class="
          block
          {entity_type === 'fractal' ? 'text-left' : 'text-right'}
          leading-tight
        "
        style="color: {signature_color}; filter: drop-shadow(0 4px 16px rgb(0 0 0 / 0.4));"
      >
        <FitText text={format_name(name)} max_size={36} class="text-inherit!" />
      </h1>
    {/if}
  </div>

  {#if is_editing}
    <div
      class="
        relative
        flex
        w-(--state-fill-end)
        rounded-standard
        border-transparent
        bg-[color-mix(in_srgb,var(--signature-color)_4%,var(--color-glass-sunken))]
        transition-[border-color,box-shadow,background]
        duration-(--duration-fast)
        ease-(--ease-standard)
        before:pointer-events-none
        before:absolute
        before:inset-0
        before:rounded-[inherit]
        before:mask-border-solid
        before:p-spacing-pixel
        before:opacity-whisper
        before:transition-opacity
        before:duration-(--duration-standard)
        before:content-['']
        before:[background:linear-gradient(to_bottom,color-mix(in_srgb,transparent,var(--signature-color)_40%),transparent_40%)]
        focus-within:border-transparent
        focus-within:bg-[color-mix(in_srgb,var(--signature-color)_8%,var(--color-glass-sunken))]
        focus-within:before:opacity-solid
        focus-within:before:[background:linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
        data-[expanded=true]:border-transparent
        data-[expanded=true]:bg-[color-mix(in_srgb,var(--signature-color)_8%,var(--color-glass-sunken))]
        data-[expanded=true]:before:opacity-solid
        data-[expanded=true]:before:[background:linear-gradient(to_bottom,var(--signature-color),color-mix(in_srgb,var(--signature-color),transparent_60%)_30%,transparent_80%)]
      "
      data-expanded={active_field === "description"}
    >
      <textarea
        class="
          z-20
          m-0
          max-h-[calc(var(--spacing-row-unit)*4)]
          min-h-row-unit
          w-full
          resize-none
          [scrollbar-color:var(--scrollbar-thumb)_var(--scrollbar-track)]
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
          [&::-webkit-scrollbar]:h-scrollbar-width
          [&::-webkit-scrollbar]:w-scrollbar-width
          [&::-webkit-scrollbar-thumb]:rounded-standard

          [&::-webkit-scrollbar-thumb]:bg-(--scrollbar-thumb)
          hover:[&::-webkit-scrollbar-thumb]:bg-(--scrollbar-thumb-hover)
          [&::-webkit-scrollbar-track]:bg-(--scrollbar-track)
        "
        placeholder={ENTITY_FRAGMENTS.description}
        bind:value={description}
        use:auto_resize
        onfocus={() => on_focus_field("description", "Description")}
        onblur={() => on_focus_field("", "")}
      ></textarea>
    </div>
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
