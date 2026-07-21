<script>
  /**
   * @file src/ui/profile/ProfileArray.svelte
   * THE VECTOR ARRAY INSTRUMENT
   * A high-fidelity list orchestrator for entity characteristics.
   * Part of the RPGlitch UI.
   */
  import { Button, TextField, tooltip } from "@atoms";

  /**
   * @typedef {Object} VectorItem
   * @property {string} id
   * @property {number} [timestamp]
   * @property {string} directive
   * @property {string} [type]
   * @property {number} emotional_weight
   * @property {string[]} [tags]
   * @property {string[]} [vector_tags]
   */

  /**
   * @typedef {Object} Props
   * @property {import('./profile.svelte.js').ProfileState} state - The profile state controller
   * @property {string} path - The dot-path to the array in state.char
   * @property {string} signature_color - The theme accent color
   * @property {string} [sublabel] - Display label for individual items
   */

  /** @type {Props} */
  let { state: profileState, path, signature_color, sublabel = "Vector" } = $props();

  // --- DERIVED STATE ---

  /** Normalized array of vector objects. */
  const items = $derived.by(() => {
    const raw = profileState.get_safe_value(path) || [];
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" && raw.trim() ? [raw] : [];

    return arr.map((val) => {
      if (typeof val === "object" && val !== null) {
        return {
          ...val,
          emotional_weight: val.emotional_weight ?? 5,
          tags: val.tags ?? val.vector_tags ?? [],
        };
      }
      // This case should be rare now as state.add_vector_item handles initialization
      return { directive: String(val || ""), emotional_weight: 5, tags: [] };
    });
  });

  let editing_tag_key = $state(null);

  // --- HANDLERS ---

  /** @param {number} i @param {number} tag_idx */
  function remove_tag(i, tag_idx) {
    const current = items[i]?.tags || [];
    const updated = current.filter((_, idx) => idx !== tag_idx);
    profileState.patch_vector_item(path, i, { tags: updated });
  }

  /** @param {number} i @param {number} tag_idx @param {string} new_val */
  function update_tag_at(i, tag_idx, new_val) {
    const clean = new_val.trim();
    const current = [...(items[i]?.tags || [])];
    if (!clean) {
      current.splice(tag_idx, 1);
    } else {
      current[tag_idx] = clean;
    }
    profileState.patch_vector_item(path, i, { tags: current });
    editing_tag_key = null;
  }

  /** @param {number} i @param {string} raw */
  function add_tag(i, raw) {
    const clean = raw.trim();
    if (!clean) return;
    const current = items[i]?.tags || [];
    const new_tags = clean
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const combined = Array.from(new Set([...current, ...new_tags]));
    profileState.patch_vector_item(path, i, { tags: combined });
  }
</script>

<div
  class="
    relative
  flex
  w-full
  flex-col
  gap-4
"
  style="--accent-color: {signature_color}"
>
  {#each items as item, i (item.id || i)}
    <div
      class="
      animate-[slide-down-item_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]
    "
    >
      <TextField
        is_edit={profileState.is_editing}
        active={profileState.active_field?.key === `${path}[${i}]`}
        busy={profileState.busy_fields.has(`${path}[${i}]`)}
        {signature_color}
        value={item.directive}
        oninput={(/** @type {Event & { currentTarget: HTMLTextAreaElement }} */ e) =>
          profileState.patch_vector_item(path, i, { directive: e.currentTarget.value })}
        placeholder="Enter {sublabel.toLowerCase()} detail..."
        weight={item.emotional_weight}
        onfocus={() => profileState.set_active_field(`${path}[${i}]`, sublabel)}
      >
        {#snippet status()}
          <div
            class="
              flex
              w-full
              flex-wrap
              items-center
              gap-1
              py-0.5
            "
          >
            {#each item.tags as tag, tag_idx (tag)}
              {@const tagKey = `${path}[${i}]-${tag_idx}`}
              {#if editing_tag_key === tagKey && profileState.is_editing}
                <input
                  type="text"
                  style="font-size: 9px !important; line-height: 1.2 !important;"
                  class="
                    max-w-30
                    min-w-12.5
                    rounded-sm
                    border
                    border-solid
                    border-white/40
                    bg-white/10
                    px-1.5
                    py-0.5
                    font-mono
                    tracking-widest
                    text-white
                    uppercase
                    outline-none
                  "
                  value={tag}
                  onkeydown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      update_tag_at(i, tag_idx, e.currentTarget.value);
                    } else if (e.key === "Escape") {
                      editing_tag_key = null;
                    }
                  }}
                  onblur={(e) => update_tag_at(i, tag_idx, e.currentTarget.value)}
                />
              {:else}
                <span
                  class="
                    group/tag
                    flex
                    items-center
                    gap-1
                    rounded-sm
                    border
                    border-white/10
                    bg-white/10
                    px-1.5
                    py-0.5
                    font-mono
                    text-[9px]
                    tracking-widest
                    whitespace-nowrap
                    text-white
                    uppercase
                    opacity-90
                    drop-shadow-sm
                    {profileState.is_editing ? 'cursor-pointer hover:bg-white/20' : ''}
                  "
                >
                  <span
                    role="button"
                    tabindex="0"
                    onclick={() => {
                      if (profileState.is_editing) editing_tag_key = tagKey;
                    }}
                    onkeydown={(e) => {
                      if (profileState.is_editing && (e.key === "Enter" || e.key === " ")) {
                        editing_tag_key = tagKey;
                      }
                    }}>{tag}</span
                  >
                  {#if profileState.is_editing}
                    <button
                      type="button"
                      class="
                        flex
                        size-3
                        items-center
                        justify-center
                        rounded-full
                        text-white/50
                        hover:bg-white/20
                        hover:text-white
                      "
                      onclick={(e) => {
                        e.stopPropagation();
                        remove_tag(i, tag_idx);
                      }}
                      aria-label="Remove tag {tag}"
                    >
                      &times;
                    </button>
                  {/if}
                </span>
              {/if}
            {/each}

            {#if profileState.is_editing}
              <input
                type="text"
                style="font-size: 9px !important; line-height: 1.2 !important;"
                class="
                  max-w-30
                  min-w-16
                  rounded-sm
                  border
                  border-dashed
                  border-white/20
                  bg-transparent
                  px-1.5
                  py-0.5
                  font-mono
                  tracking-widest
                  text-white
                  uppercase
                  opacity-70
                  transition-opacity
                  duration-200
                  outline-none
                  placeholder:text-white/40
                  focus:border-solid
                  focus:bg-white/10
                  focus:opacity-100
                "
                placeholder="+ TAG..."
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    add_tag(i, e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                onblur={(e) => {
                  if (e.currentTarget.value.trim()) {
                    add_tag(i, e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
            {/if}
          </div>
        {/snippet}

        {#snippet header_actions()}
          <div
            class="
              flex
              h-full
              items-center
              gap-1.5
              select-none
            "
          >
            {#if profileState.is_editing}
              <div
                class="
                  flex
                  items-center
                  gap-1
                  rounded-sm
                  border
                  border-white/10
                  bg-white/10
                  px-1.5
                  py-0.5
                "
                use:tooltip={{ text: "Influence weight of this vector" }}
              >
                <span
                  class="
                    pointer-events-none
                    font-mono
                    text-xs
                    leading-none
                    font-bold
                    text-white
                  ">{item.emotional_weight}</span
                >

                <div class="flex flex-col gap-[1px]">
                  <button
                    type="button"
                    class="
                      flex
                      h-2.5
                      w-3
                      items-center
                      justify-center
                      rounded-xs
                      text-white/60
                      hover:bg-white/20
                      hover:text-white
                    "
                    onclick={() => profileState.update_vector_weight(path, i, 1)}
                    aria-label="Increase Weight"
                  >
                    <svg viewBox="0 0 24 24" class="size-2.5 fill-none stroke-current stroke-3"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  </button>
                  <button
                    type="button"
                    class="
                      flex
                      h-2.5
                      w-3
                      items-center
                      justify-center
                      rounded-xs
                      text-white/60
                      hover:bg-white/20
                      hover:text-white
                    "
                    onclick={() => profileState.update_vector_weight(path, i, -1)}
                    aria-label="Decrease Weight"
                  >
                    <svg viewBox="0 0 24 24" class="size-2.5 fill-none stroke-current stroke-3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                </div>
              </div>
            {:else}
              <span
                class="
                  pointer-events-none
                  font-mono
                  text-xs
                  leading-none
                  font-bold
                  text-white
                  opacity-90
                  drop-shadow-xs
                "
                use:tooltip={{ text: "Influence weight of this vector" }}>{item.emotional_weight}</span
              >
            {/if}

            {#if profileState.is_editing}
              <Button
                variant="invisible"
                size="small"
                square
                aria-label="Enhance with AI"
                actions={[tooltip]}
                tooltip="Enhance {sublabel} with AI"
                disabled={profileState.busy_fields.has(path) || profileState.busy_fields.has(`${path}[${i}]`) || !item.directive}
                onclick={() => profileState.enhance_vector_item(path, i)}
                class="
                  text-slate-400
                  opacity-0
                  transition-colors
                  duration-200
                  group-data-[expanded=true]/textfield:opacity-90
                  hover:text-white!
                  hover:opacity-100!
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-icon-small fill-none stroke-current stroke-2"
                  style="stroke-linecap: round; stroke-linejoin: round;"
                >
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"></path>
                </svg>
              </Button>
              <Button
                variant="invisible"
                size="small"
                square
                actions={[tooltip]}
                tooltip="Remove {sublabel}"
                aria-label="Remove {sublabel}"
                onclick={() => profileState.remove_vector_item(path, i)}
              >
                <svg
                  viewBox="0 0 24 24"
                  class="
                    size-icon-small
                    fill-none
                    stroke-current
                    stroke-2
                    [stroke-linecap:round]
                    [stroke-linejoin:round]
                  "
                  fill="none"
                >
                  <polyline points="3 6 5 6 21 6" stroke="currentColor"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor"></path>
                </svg>
              </Button>
            {/if}
          </div>
        {/snippet}
      </TextField>
    </div>
  {/each}

  {#if items.length === 0 && !profileState.is_editing}
    <div
      class="
        flex
        min-h-12
        animate-[slide-down-item_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]
        items-center
        px-4
        py-2
      "
    >
      <span
        class="
          pointer-events-none
          flex
          items-center
          gap-4
          font-mono
          text-[10px]
          tracking-widest
          text-slate-50
          uppercase
          opacity-30
          select-none
        "
      >
        <svg
          viewBox="0 0 24 24"
          class="
            h-kinetic-slide-y
            w-kinetic-slide-y
          "
          style="width: var(--text-small); height: var(--text-small);"
        >
          <path
            fill="currentColor"
            d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
          />
        </svg>
        AWAITING {sublabel.toUpperCase()} DATA STREAM...
      </span>
    </div>
  {/if}
</div>

<style>
  @keyframes slide-down-item {
    from {
      opacity: 0;
      transform: translateY(calc(var(--spacing-spacing-unit) * -2.5));
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
