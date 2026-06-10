<script>
  /**
   * @file src/ui/organisms/Profile.svelte
   * ðŸ§ª ENTITY EDITOR â€” Primary orchestrator for viewing and editing entities.
   * Chalk Regime UI Â· Flat DOM Â· Bolted Architecture
   */
  import { click_outside } from "@actions";
  import { Button, Modal, ProfilePicture, ScrollArea, TextField, tooltip } from "@atoms";
  import { PROFILE_SECTIONS_BY_TYPE } from "@intelligence";
  import { themeStore } from "@media";
  import { AudioWing, DevWing, Dialog, VisualWing } from "@molecules";
  import { ProfileArray, ProfileHeader } from "@organisms";
  import { app } from "@state";
  import { ProfileState } from "./profile.svelte.js";

  /** @type {{ entity_type?: "character" | "fractal" }} */
  let { entity_type = "character" } = $props();

  // --- ORCHESTRATION ---
  const state = new ProfileState();

  // --- DERIVED ---
  const signature_color = $derived(themeStore.get_signature_color(state.char, "var(--gunmetal)"));
  const has_wings = $derived(state.is_editing || app.settings.dev_mode);
  const active_sections = $derived(
    PROFILE_SECTIONS_BY_TYPE[entity_type] || PROFILE_SECTIONS_BY_TYPE.character,
  );

  // --- EFFECTS ---
  $effect(() => state.sync());

  /** @param {MouseEvent} event */
  function handle_click_outside(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (state.show_delete_confirm) return;
    if (target.closest("[data-wings-container]")) return;
    if (
      target.closest(".menu") ||
      target.closest("[data-dropdown-menu]") ||
      target.closest(".dropdown-portal-wrapper") ||
      target.closest(".tooltip-portal")
    )
      return;
    if (target.closest("[data-backdrop='mini']") || target.closest(".root.mini")) return;

    state.handle_close();
  }
</script>

{#if state.char?.id}
  <Dialog
    type="confirm"
    bind:open={state.show_delete_confirm}
    title="Delete {state.char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and vectors, will be lost."
    confirm_label="Delete Permanently"
    on_confirm={() => state.delete(entity_type)}
  />

  <Modal variant="profile" on_close={() => state.handle_close()} is_pass_through={true}>
    <div
      class="
        m-auto
        grid
        h-(--grid-height)
        w-(--grid-width)
        grid-cols-12
        overflow-hidden"
      data-mobile={app.viewport.mobile}
      data-mini={app.viewport.mini}
      role="presentation"
    >
      <div
        class="
          {has_wings ? 'col-[2/8]' : 'col-[4/10]'}

          flex
          h-full
          scrollbar-none overflow-auto
          border-solid
          border-[color-mix(in_srgb,var(--signature-color)_30%,transparent)]
          bg-(--glass-elevated)
          [backdrop-filter:var(--blur-mist)]
          transition-all
          duration-300
          [&::-webkit-scrollbar]:hidden

          {entity_type === 'fractal' ? 'flex-col' : 'flex-row'}
          {app.viewport.mobile || app.viewport.mini
          ? `
            col-span-full
            flex-col
          `
          : ''}
        "
        style:--signature-color={signature_color}
        use:click_outside={handle_click_outside}
      >
        <div
          class="
            sticky
            top-0
            z-20
            flex
            shrink-0
            items-stretch

            {entity_type === 'fractal'
            ? `
              h-12
              min-h-[calc(var(--spacing-unit)*50)]
              w-full
            `
            : `
              h-full
              w-(--avatar-medium-size)
            `}
            {app.viewport.mobile || app.viewport.mini
            ? `
              h-auto
              w-auto
              items-center
              justify-center
              p-4
            `
            : ''}
          "
        >
          <div
            class="
              overflow-hidden
              border-solid
              border-[color-mix(in_srgb,var(--signature-color)_30%,transparent)]

              {entity_type === 'fractal'
              ? `
                h-full
                w-full
                rounded-none
                border-0
                border-b
              `
              : `
                h-full
                w-full
                rounded-none
                border-0
                border-r
              `}
              {app.viewport.mobile || app.viewport.mini
              ? `
                h-(--avatar-medium-size)
                w-(--avatar-medium-size)
                rounded-md
                border-(--border-width-base)
              `
              : ''}
            "
          >
            <ProfilePicture entity={state.char} />
          </div>
        </div>

        <div
          class="
            flex
            min-w-0
            flex-1
            flex-col
            justify-between

            {entity_type === 'fractal' ? 'h-auto' : 'min-h-0'}
          "
        >
          <ProfileHeader
            bind:name={state.char.name}
            bind:description={state.char.description}
            is_editing={state.is_editing}
            active_field={state.active_field?.key}
            {signature_color}
            on_focus_field={(/** @type {string} */ key, /** @type {string} */ label) =>
              state.set_active_field(key, label)}
          />

          <main
            class="
              grow
              p-0

              {entity_type === 'fractal'
              ? `
                h-auto
                overflow-visible
              `
              : 'overflow-visible'}

              scrollbar-none [&::-webkit-scrollbar]:hidden
            "
          >
            <ScrollArea
              style={entity_type === "fractal"
                ? "height: auto; overflow: visible;"
                : "height: 100%;"}
            >
              {@render EntityBody()}
            </ScrollArea>
          </main>

          <footer
            class="
              flex
              shrink-0
              gap-4
              p-4

              {app.viewport.mobile || app.viewport.mini
              ? `
                w-full
                flex-col
                items-stretch
              `
              : 'justify-end'}
            "
          >
            {#if state.is_editing}
              <Button variant="secondary" onclick={() => state.save(entity_type)}>Save</Button>
              <Button variant="danger" onclick={() => (state.show_delete_confirm = true)}
                >Delete</Button
              >
              <Button variant="primary" onclick={() => state.cancel()}>Cancel</Button>
            {:else}
              <Button variant="secondary" onclick={() => (state.is_editing = true)}>Edit</Button>
              <Button variant="primary" onclick={() => state.handle_close()}>Close</Button>
            {/if}
          </footer>
        </div>
      </div>

      {#if has_wings}
        <aside
          data-wings-container
          class="
            col-[9/12] flex
            animate-[slide-in-left_var(--motion-elastic)]
            scrollbar-none
            flex-col
            justify-center
            gap-4
            overflow-y-auto
            [&::-webkit-scrollbar]:hidden
          "
        >
          {#if state.is_editing}
            <VisualWing profileState={state} />
            <AudioWing profileState={state} />
          {/if}
          {#if app.settings.dev_mode}
            <DevWing profileState={state} />
          {/if}
        </aside>
      {/if}
    </div>
  </Modal>
{/if}

{#snippet EntityBody()}
  <div
    class="
      min-w-0
      p-4
      pb-8

      {app.viewport.mobile || app.viewport.mini
      ? `
        flex
        flex-col
        gap-4
      `
      : `
        grid
        grid-cols-[2rem_1fr]
        gap-x-2
        gap-y-4
      `}
    "
    data-testid="profile-fragments"
  >
    {#each active_sections as section (section.id)}
      {@const arrayField = section.fields.find((/** @type {any} */ f) => f.type === "array")}

      <div
        class="
          relative
          flex
          min-w-0
          flex-col
          items-center
          justify-center
          overflow-hidden
          text-center
          transition-all
          duration-300

          {state.is_editing && arrayField ? 'cursor-pointer' : 'cursor-default'}
          {app.viewport.mobile || app.viewport.mini
          ? `
            border-b
            border-[color-mix(in_srgb,var(--signature-color)_30%,transparent)]
            pr-0
            pb-2
          `
          : ''}
        "
        data-section={section.id}
        onclick={() => arrayField && state.add_vector_item(arrayField.key)}
        onmouseenter={() => (state.hovered_section = section.id)}
        onmouseleave={() => (state.hovered_section = null)}
        role="presentation"
      >
        <div
          class="
            flex
            w-full
            flex-col
            items-center

            {section.id === 'eternal' && !(app.viewport.mobile || app.viewport.mini)
            ? 'translate-y-4'
            : ''}
          "
        >
          <h6
            class="
              m-0
              flex
              flex-col
              items-center
              justify-center
              text-center
              tracking-widest
              uppercase
              transition-colors
              duration-300
            "
            style="color: var(--signature-color); text-shadow: none;"
          >
            {#if state.is_editing && state.hovered_section === section.id && arrayField}
              <span
                class="
                  pointer-events-none
                  shrink-0
                  animate-[add-hint-fade_var(--motion-elastic)]
                  text-base
                  font-(--font-family-mono)
                  tracking-widest
                  whitespace-nowrap
                  text-white

                  {app.viewport.mobile || app.viewport.mini ? 'text-center' : ''}
                ">+</span
              >
            {/if}
            <span
              class="
                {app.viewport.mobile || app.viewport.mini
                ? ''
                : `
                  block
                  rotate-180
                  [text-orientation:mixed]
                  [writing-mode:vertical-rl]
                `}
              ">{section.label}</span
            >
          </h6>
        </div>
      </div>

      <div
        class="
          grid
          min-w-0
          items-stretch
          gap-4

          {section.fields.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}
        "
      >
        {#each section.fields as field (field.key)}
          <div
            class="
              relative
              flex
              h-full
              w-full
              min-w-0
              flex-col
              items-stretch
              justify-stretch
              gap-2
            "
          >
            {#if field.type === "array"}
              <ProfileArray
                {state}
                path={field.key}
                unit_label={field.unitLabel}
                {signature_color}
              />
            {:else}
              {@const fieldId = `field-${field.key.replace(".", "-")}`}
              {#if field.label && section.id === "eternal"}
                <label
                  class="
                    block
                    w-full
                    text-center
                    text-[10px]
                    font-bold
                    tracking-widest
                    text-(--signature-color)
                    uppercase
                    drop-shadow-md
                  "
                  for={fieldId}>{field.label}</label
                >
              {/if}
              <TextField
                id={fieldId}
                is_edit={state.is_editing}
                syncId={section.label}
                {signature_color}
                data-active={state.active_field?.key === field.key ? true : undefined}
                placeholder={field.description}
                value={state.get_safe_value(field.key)}
                oninput={(/** @type {any} */ e) =>
                  state.set_field_value(field.key, e.currentTarget.value)}
                busy={state.busy_fields.has(field.key)}
                onfocus={() => state.set_active_field(field.key, field.label || section.label)}
              >
                {#snippet status()}
                  {#if state.busy_fields.has(field.key)}
                    <span
                      class="
                        mt-2
                        block
                        animate-pulse
                        text-[10px]
                        font-(--font-family-mono)
                        tracking-widest
                        text-white
                        uppercase
                      ">ENHANCING</span
                    >
                  {:else if field.sublabel}
                    <span
                      class="text-[10px] font-(--font-family-mono) tracking-widest text-white uppercase opacity-80"
                      >{field.sublabel}</span
                    >
                  {/if}
                {/snippet}

                {#snippet header_actions()}
                  {#if state.is_editing}
                    <Button
                      variant="invisible"
                      size="small"
                      square={true}
                      aria-label="Enhance with AI"
                      actions={[tooltip]}
                      disabled={state.busy_fields.has(field.key) ||
                        !state.get_safe_value(field.key)}
                      onclick={() => state.enhance(field.key, state.get_safe_value(field.key))}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        class="
                          size-(--icon-small)
                          fill-none
                          stroke-current
                          stroke-2
                          [stroke-linecap:round]
                          [stroke-linejoin:round]
                        "
                      >
                        <path
                          d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"
                          fill="var(--pure-white)"
                        ></path>
                      </svg>
                    </Button>
                  {/if}
                {/snippet}
              </TextField>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
{/snippet}

<style>
  @keyframes slide-in-left {
    0% {
      opacity: var(--opacity-none);
      transform: translateX(calc(var(--spacing-unit) * 5));
    }

    100% {
      opacity: var(--opacity-solid);
      transform: translateX(0);
    }
  }

  @keyframes add-hint-fade {
    0% {
      opacity: var(--opacity-none);
      transform: scale(0.6);
    }

    100% {
      opacity: var(--opacity-solid);
      transform: scale(1);
    }
  }
</style>
