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
  const profileState = new ProfileState();
  /** @type {HTMLElement | undefined} */
  let footer_el = $state();

  // --- DERIVED ---
  const signature_color = $derived(
    themeStore.get_signature_color(profileState.char, "var(--gunmetal)"),
  );
  const has_wings = $derived(profileState.is_editing || app.settings.dev_mode);
  const active_sections = $derived(
    PROFILE_SECTIONS_BY_TYPE[entity_type] || PROFILE_SECTIONS_BY_TYPE.character,
  );

  // --- EFFECTS ---
  $effect(() => profileState.sync());

  /** @param {MouseEvent} event */
  function handle_click_outside(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (profileState.show_delete_confirm) return;
    if (target.closest("[data-wings-container] > *")) return;
    if (
      target.closest(".menu") ||
      target.closest("[data-dropdown-menu]") ||
      target.closest(".dropdown-portal-wrapper") ||
      target.closest(".tooltip-portal")
    )
      return;
    if (target.closest("[data-backdrop='mini']") || target.closest(".root.mini")) return;

    profileState.handle_close();
  }
</script>

{#if profileState.char?.id}
  <Dialog
    type="confirm"
    bind:open={profileState.show_delete_confirm}
    title="Delete {profileState.char.name || 'Entity'}"
    message="This action is irreversible. All associated data, including history and vectors, will be lost."
    confirm_label="Delete Permanently"
    on_confirm={() => profileState.delete(entity_type)}
  />

  <Modal variant="profile" on_close={() => profileState.handle_close()} is_pass_through={true}>
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
            <ProfilePicture entity={profileState.char} />
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
            bind:name={profileState.char.name}
            bind:description={profileState.char.description}
            is_editing={profileState.is_editing}
            active_field={profileState.active_field?.key}
            {signature_color}
            on_focus_field={(/** @type {string} */ key, /** @type {string} */ label) =>
              profileState.set_active_field(key, label)}
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
            bind:this={footer_el}
            tabindex="-1"
            class="
              flex
              shrink-0
              gap-4
              p-4
              outline-none

              {app.viewport.mobile || app.viewport.mini
              ? `
                w-full
                flex-col
                items-stretch
              `
              : 'justify-end'}
            "
          >
            {#if profileState.is_editing}
              <Button
                variant="secondary"
                onclick={() => {
                  footer_el?.focus();
                  profileState.save(entity_type);
                }}>Save</Button
              >
              <Button
                variant="danger"
                onclick={() => {
                  footer_el?.focus();
                  profileState.show_delete_confirm = true;
                }}>Delete</Button
              >
            {:else}
              <Button
                variant="secondary"
                onclick={() => {
                  footer_el?.focus();
                  profileState.is_editing = true;
                }}>Edit</Button
              >
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
          {#if profileState.is_editing}
            <VisualWing {profileState} />
            <AudioWing {profileState} />
          {/if}
          {#if app.settings.dev_mode}
            <DevWing {profileState} />
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

          {profileState.is_editing && arrayField ? 'cursor-pointer' : 'cursor-default'}
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
        onclick={() => arrayField && profileState.add_vector_item(arrayField.key)}
        onmouseenter={() => (profileState.hovered_section = section.id)}
        onmouseleave={() => (profileState.hovered_section = null)}
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
            {#if profileState.is_editing && profileState.hovered_section === section.id && arrayField}
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
                state={profileState}
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
                is_edit={profileState.is_editing}
                syncId={section.label}
                {signature_color}
                data-active={profileState.active_field?.key === field.key ? true : undefined}
                placeholder={field.description}
                value={profileState.get_safe_value(field.key)}
                oninput={(/** @type {any} */ e) =>
                  profileState.set_field_value(field.key, e.currentTarget.value)}
                busy={profileState.busy_fields.has(field.key)}
                onfocus={() =>
                  profileState.set_active_field(field.key, field.label || section.label)}
                onblur={() => profileState.reset_active_field()}
              >
                {#snippet status()}
                  {#if profileState.busy_fields.has(field.key)}
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
                  {#if profileState.is_editing}
                    <Button
                      variant="invisible"
                      size="small"
                      square={true}
                      aria-label="Enhance with AI"
                      actions={[tooltip]}
                      disabled={profileState.busy_fields.has(field.key) ||
                        !profileState.get_safe_value(field.key)}
                      onclick={() =>
                        profileState.enhance(field.key, profileState.get_safe_value(field.key))}
                      class="
                        text-slate-400
                        opacity-0
                        transition-all
                        duration-200
                        group-data-[expanded=true]/textfield:opacity-100
                        hover:text-(--signature-color)
                      "
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
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor"
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
