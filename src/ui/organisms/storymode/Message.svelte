<script>
  /**
   * @file Message.svelte
   * 💬 THE SIMULATION MESSAGE
   * Renders parsed messages in a Unified Nordic Chassis.
   */
  import { parse_message } from "@core/text-parser.js";
  import { app } from "@state/app.svelte.js";
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@theme/palette.svelte.js";
  import DataBox from "@ui/atoms/DataBox.svelte";
  import TypingIndicator from "@ui/atoms/TypingIndicator.svelte";
  import { safe_html } from "@ui/utils/actions/safe-html.js";
  import SceneHeader from "../SceneHeader.svelte";
  import Button from "@ui/atoms/Button.svelte";

  /**
   * @typedef {Object} Props
   * @property {string} [text=""]
   * @property {string} [sender="system"]
   * @property {string} [character_name=""]
   * @property {Date} [timestamp=new Date()]
   * @property {string[]} [attachments=[]]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_delete]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_regenerate]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_continue]
   * @property {(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => any} [on_edit]
   * @property {boolean} [is_last=false]
   * @property {boolean} [busy=false]
   */

  /** @type {Props} */
  let {
    text = "",
    sender = "system",
    character_name = "",
    timestamp = new Date(),
    attachments = [],
    on_delete = undefined,
    on_regenerate = undefined,
    on_continue = undefined,
    on_edit = undefined,
    is_last = false,
    busy = false,
  } = $props();

  let isFocused = $state(false);

  let is_user = $derived(sender === "user");
  let is_ai = $derived(sender === "ai");
  let is_fractal = $derived(sender === "fractal");

  let entity = $derived.by(() => {
    // 1. Explicit character name check
    if (character_name) {
      if (is_user && (runtime.active_user?.name === character_name || character_name === "User"))
        return runtime.active_user || app.selected_user;
      if (is_ai && (runtime.active_ai?.name === character_name || character_name === "AI"))
        return runtime.active_ai || app.selected_ai;
      if (
        is_fractal &&
        (runtime.active_fractal?.name === character_name || character_name === "Fractal")
      )
        return runtime.active_fractal || app.selected_fractal;
    }

    // 2. Fallback to active runtime entities if role matches
    if (is_user) return runtime.active_user || app.selected_user;
    if (is_ai) return runtime.active_ai || app.selected_ai;
    if (is_fractal) return runtime.active_fractal || app.selected_fractal;

    return null;
  });

  let signature_color = $derived.by(() => {
    // Priority 1: Entity's own signature color
    if (entity?.signature_color) return themeStore.get_signature_color(entity);

    // Priority 2: Fallback to role-based deterministic colors
    if (character_name) return themeStore.get_deterministic_color(character_name);
    return themeStore.get_deterministic_color(sender);
  });

  let parsed = $derived(parse_message(text));
  let display_text = $derived(parsed.displayText);
  let think_block = $derived(parsed.think);
  let scene_data = $derived(parsed.sceneData);

  // Check if we have visible story text
  let has_display_text = $derived(!!(display_text && display_text !== "<p></p>"));

  function handle_focus() {
    isFocused = true;
  }

  function handle_focus_out(e) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    isFocused = false;
  }

  async function handle_copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }

  const time_label = $derived(
    timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
  );
</script>

<div
  class="message-row"
  class:user-row={is_user}
  class:ai-row={is_ai}
  class:fractal-row={is_fractal}
  class:centered-row={is_fractal}
>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="message-bubble field-chassis"
    class:user-bubble={is_user}
    class:ai-bubble={is_ai}
    class:fractal-bubble={is_fractal}
    class:is-focused={isFocused || busy}
    class:is-busy={busy}
    style="--signature-color: {signature_color};"
    tabindex="0"
    onfocusin={handle_focus}
    onfocusout={handle_focus_out}
    role="article"
  >
    <div class="field-header">
      <div class="header-content">
        <div class="header-status">
          <span class="entity-name"
            >{entity?.name || character_name || (is_fractal ? "Fractal" : sender)}</span
          >
          <span class="timestamp">{time_label}</span>
        </div>
        <div class="header-actions">
          {#if is_ai && is_last}
            <Button
              variant="invisible"
              size="sm"
              square={true}
              aria-label="Continue"
              onclick={on_continue}
            >
              <svg viewBox="0 0 24 24" class="icon-xs"
                ><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg
              >
            </Button>
            <Button
              variant="invisible"
              size="sm"
              square={true}
              aria-label="Reroll"
              onclick={on_regenerate}
            >
              <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
                <polyline points="23 4 23 10 17 10" stroke="currentColor"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor"></path>
              </svg>
            </Button>
          {/if}
          <Button variant="invisible" size="sm" square={true} aria-label="Edit" onclick={on_edit}>
            <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke="currentColor"
              ></path>
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke="currentColor"
              ></path>
            </svg>
          </Button>
          <Button
            variant="invisible"
            size="sm"
            square={true}
            aria-label="Copy"
            onclick={handle_copy}
          >
            <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor"></rect>
              <path
                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                stroke="currentColor"
              ></path>
            </svg>
          </Button>
          <Button
            variant="invisible"
            size="sm"
            square={true}
            aria-label="Delete"
            onclick={on_delete}
          >
            <svg viewBox="0 0 24 24" class="icon-xs icon-outline">
              <polyline points="3 6 5 6 21 6" stroke="currentColor"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                stroke="currentColor"
              ></path>
            </svg>
          </Button>
        </div>
      </div>
    </div>

    <div class="message-body">
      {#if busy && !text}
        <div class="thinking-wrapper">
          <TypingIndicator variant="pill" signatureColor={signature_color} />
        </div>
      {:else}
        {#if scene_data}
          <div>
            <SceneHeader {...scene_data} />
          </div>
        {/if}

        {#if app.settings.dev_mode && think_block}
          <div>
            <DataBox label="🎬 DevMode">
              {think_block}
            </DataBox>
          </div>
        {/if}

        {#if attachments.length > 0}
          <div class="attachments">
            {#each attachments as src (src)}
              <Button
                variant="invisible"
                className="attachment-button"
                onclick={() => app.open_lightbox(src)}
                aria-label="View Attachment"
              >
                <img {src} alt="Attachment" class="attachment-image" />
              </Button>
            {/each}
          </div>
        {/if}

        {#if has_display_text}
          <div class="message-content" use:safe_html={display_text}></div>
        {/if}

        {#if busy && !has_display_text}
          <div class="thinking-wrapper">
            <TypingIndicator variant="pill" signatureColor={signature_color} />
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .message-row {
    display: flex;
    width: 100%;
    padding: var(--spacing-m) var(--spacing-xxxxl);
    position: relative;
    transition: all var(--motion-m);
  }

  .message-row.user-row {
    justify-content: flex-end;
  }

  .message-row.ai-row {
    justify-content: flex-start;
  }

  .message-row.fractal-row,
  .message-row.centered-row {
    justify-content: center;
    padding: var(--spacing-m) var(--spacing-xxxxl);
  }

  .message-bubble {
    width: fit-content;
    min-width: 12rem;
    max-width: calc(6 * var(--grid-unit));
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 1.25rem;
    transition: all var(--motion-l) var(--motion-elastic);
    background: color-mix(in srgb, var(--glass-xs), var(--signature-color) 3%);
    border: var(--border-l);
    border-color: rgb(var(--color-white-rgb) / 5%);
    overflow: hidden;
    outline: none;
    cursor: pointer;
  }

  .fractal-bubble {
    width: 60rem;
    max-width: 90%;
  }

  /* Soft Point Corner Directionality */
  .user-bubble {
    border-bottom-right-radius: 4px;
  }

  .ai-bubble {
    border-bottom-left-radius: 4px;
  }

  .message-bubble.is-focused {
    border-color: var(--color-white);
    box-shadow: 0 0 20px rgb(var(--color-white-rgb) / 8%);
    background: color-mix(in srgb, var(--glass-xs), var(--signature-color) 6%);
    overflow: visible;
  }

  /* --- HOLOGRAPHIC BORDER LOGIC --- */
  .message-bubble::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    padding: 1.5px;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, transparent, var(--signature-color) 40%),
      transparent 40%
    );
    mask:
      linear-gradient(var(--color-white) 0 0) content-box,
      linear-gradient(var(--color-white) 0 0);
    mask-composite: exclude;
    opacity: 0.5;
    transition: opacity var(--motion-l);
  }

  .message-bubble.is-focused::before {
    opacity: 1;
    background: linear-gradient(
      to bottom,
      var(--signature-color),
      color-mix(in srgb, var(--signature-color), transparent 60%) 30%,
      transparent 80%
    );
  }

  .message-bubble.fractal-bubble {
    text-align: center;
  }

  .message-bubble.fractal-bubble .message-content {
    text-align: center;
    text-wrap: balance;
  }

  /* --- HEADER LOGIC --- */
  .field-header {
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--signature-color, var(--color-frozen)) 50%,
      transparent 100%
    );
    transition: all var(--motion-l) var(--motion-elastic);
    display: flex;
    flex-direction: column;
    position: relative;
    top: 0;
    border-radius: 1.25rem 1.25rem 0 0;
    z-index: 2;
  }

  .message-bubble.is-focused .field-header {
    height: 2.2rem;
    background: color-mix(in srgb, var(--signature-color), black 30%);
    border-bottom: 1px solid rgb(var(--color-white-rgb) / 12%);
    overflow: visible;
  }

  .header-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-m);
    opacity: 0;
    transform: translateY(-5px);
    transition: all var(--motion-m);
  }

  .message-bubble.is-focused .header-content {
    opacity: 1;
    transform: translateY(0);
  }

  .header-status {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-m);
    overflow: hidden;
    font-family: var(--font-family-mono);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-l);
  }

  .entity-name {
    font-size: var(--font-size-xxs);
    font-weight: var(--font-weight-xl);
    color: var(--color-white);
    text-shadow: 0 0 8px rgb(var(--color-white-rgb) / 30%);
    white-space: nowrap;
  }

  .timestamp {
    font-size: var(--font-size-xxxs);
    color: var(--color-white);
    opacity: 0.5;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-xxs);
  }

  /* Ghost Icon Lighting */
  .header-actions :global(.button) {
    color: color-mix(in srgb, var(--color-white), var(--signature-color) 20%);
    transition: all var(--motion-l);
  }

  .header-actions :global(.button:hover) {
    color: var(--color-white);
    transform: scale(1.1);
  }

  /* --- BODY LOGIC --- */
  .message-body {
    padding: var(--spacing-m) var(--spacing-l);
    position: relative;
    z-index: 1;
  }

  .message-content {
    line-height: var(--line-height-m);
    font-size: var(--font-size-m);
    font-family: var(--font-family-body);
    color: var(--color-white);
    text-shadow: 0 1px 2px rgb(var(--color-black-rgb) / 60%);
    text-align: left;
    text-wrap: pretty;
  }

  /* Bold & Bright Dialogue */
  .message-content :global(strong),
  .message-content :global(b) {
    font-weight: var(--font-weight-xl);
    color: var(--signature-color);
  }

  /* High-Vis Narration */
  .message-content :global(em),
  .message-content :global(i) {
    font-style: italic;
    opacity: 0.9;
    color: var(--font-color-s);
  }

  .message-content :global(p) {
    margin: 0 0 var(--spacing-s) 0;
  }

  .message-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .thinking-wrapper {
    display: flex;
    padding: var(--spacing-s) 0;
  }

  /* --- BUSY ANIMATION (The "Something") --- */
  .message-bubble.is-busy .field-header {
    overflow: hidden;
  }

  .message-bubble.is-busy .field-header::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgb(var(--color-white-rgb) / 20%) 50%,
      transparent 100%
    );
    width: 100%;
    animation: scan var(--motion-xxl) linear infinite;
  }

  @keyframes scan {
    from {
      transform: translateX(-100%) skewX(-20deg);
    }

    to {
      transform: translateX(100%) skewX(-20deg);
    }
  }

  .attachments {
    margin-bottom: var(--spacing-m);
  }

  .message-row :global(.button.attachment-button) {
    padding: var(--spacing-xxs);
    min-height: 0;
    background: var(--glass-s);
    border: var(--border-l);
    margin: 0 0 var(--spacing-xs) 0;
    width: fit-content;
  }

  .message-row :global(.button.attachment-button:hover) {
    background: var(--glass-l);
  }

  .attachment-image {
    max-width: 100%;
    border-radius: var(--border-radius-s);
    box-shadow: var(--shadow-s);
    object-fit: cover;
  }
</style>
