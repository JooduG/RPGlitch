<script>
  /**
   * @file src/ui/organisms/ProfileHeader.svelte
   * 🪐 HIGH-FIDELITY PROFILE TRANSLATION NODE
   * Organism component managing designation titles and context description text blocks.
   * Enforces strict Svelte 5 state machine physics and Nordic styling token regimes.
   */

  import { auto_resize } from "@actions";
  import { ENTITY_FRAGMENTS } from "@intelligence";
  import { GlassWrapper } from "@atoms";

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
            text-2xl
            font-extrabold
            tracking-normal
            outline-none
          "
          style="color: {signature_color};"
          onfocus={() => on_focus_field("name", "Entity Name")}
          onblur={() => on_focus_field("", "")}
        />
      </GlassWrapper>
    {:else}
      <h1
        class="
          block
          {entity_type === 'fractal' ? 'text-left' : 'text-right'}
          font-heading
          text-[clamp(3rem,6vw,5rem)]
          leading-none
          font-extrabold
          tracking-tight
          text-balance
        "
        style="color: {signature_color}; filter: drop-shadow(0 4px 16px rgb(0 0 0 / 0.4));"
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
