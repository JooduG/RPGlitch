<script>
  import { runtime } from "@state/runtime.svelte.js";
  import { themeStore } from "@media/palette.svelte.js";
  /**
   * @file InputBar.svelte
   * ⌨️ THE COMMAND CONSOLE
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  import Button from "@atoms/Button.svelte";
  import GlassPill from "@atoms/GlassPill.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { session } from "@state/session.svelte.js";
  import { app } from "@state/app.svelte.js";
  import { simulationState } from "@state/status.svelte.js";
  import { controlState } from "@state/control.svelte.js";
  import { spin, stab } from "@ui/actions/kinetic.js";

  /**
   * @typedef {Object} Props
   * @property {boolean} [disabled=false] - Whether the input is disabled
   */

  /** @type {Props} */
  let { disabled = false } = $props();

  // --- STATE & DERIVATIONS ---

  let value = $state("");
  let is_focused = $state(false);

  /** @type {HTMLTextAreaElement | undefined} */
  let textarea = $state();

  /** [R5] Auto-disable when engine is busy */
  let is_locked = $derived(
    disabled || simulationState.phase !== "idle" || controlState.intent_active,
  );

  /** The user's signature color for accenting the send button */
  let signature_color = $derived(
    themeStore.get_signature_color(runtime.active_user || app.selected_user, "var(--gunmetal)"),
  );

  /**
   * Adjusts the height of the textarea based on its content.
   * Uses raw scrollHeight for precise content tracking.
   */
  function adjust_height() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  /**
   * Dispatches the current input to the Engine.
   */
  async function handle_send() {
    const text = value.trim();
    if (!text || is_locked) return;

    controlState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    value = ""; // Clear immediately for UX
    adjust_height(); // Reset height

    try {
      await session.send(text);
    } catch (e) {
      console.error("Failed to send message:", e);
      controlState.set_intent_active(false); // Release lock on error
    }
  }

  /**
   * Handles keyboard shortcuts (Enter to send).
   * @param {KeyboardEvent} e
   */
  function handle_keydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handle_send();
    }
  }

  /**
   * Triggers height adjustment on input.
   */
  function handle_input() {
    adjust_height();
  }
</script>

<GlassPill
  {is_focused}
  class="root {is_locked ? 'is-disabled' : ''}"
  data-testid="input-bar"
  style="--signature-color: {signature_color};"
>
  {#snippet left()}
    <Button
      variant="invisible"
      size="small"
      square={true}
      class="action-btn is-settings"
      onclick={() => app.toggle_control_panel()}
      aria-label="Settings"
      actions={[spin, tooltip]}
    >
      <svg class="icon-medium icon-solid" viewBox="0 0 24 24">
        <path
          d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
        />
      </svg>
    </Button>
  {/snippet}

  <textarea
    bind:this={textarea}
    class="editor"
    bind:value
    onkeydown={handle_keydown}
    oninput={handle_input}
    onfocus={() => (is_focused = true)}
    onblur={() => (is_focused = false)}
    placeholder="Type a message..."
    rows="1"
    disabled={is_locked}
    aria-label="Input message"
  ></textarea>

  {#snippet right()}
    <Button
      variant="invisible"
      size="small"
      square={true}
      class="action-btn is-send"
      onclick={handle_send}
      disabled={!value.trim() || is_locked}
      aria-label="Send Message"
      actions={[stab, tooltip]}
    >
      <svg class="icon-medium icon-solid" viewBox="0 0 24 24">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </Button>
  {/snippet}
</GlassPill>

<style>
  :global(.root[data-testid="input-bar"]) {
    width: clamp(var(--breakpoint-mini), 100%, var(--breakpoint-mobile));
    margin-inline: auto;
    transition:
      opacity var(--duration-standard) var(--ease-standard),
      transform var(--duration-standard) var(--ease-standard);
    min-height: clamp(calc(var(--row-unit) * 0.5), 75%, var(--row-unit));
  }

  :global(.root.is-disabled[data-testid="input-bar"]) {
    opacity: var(--opacity-whisper);
    filter: grayscale(1);
    pointer-events: none;
  }

  .editor {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--frisk);
    padding: var(--padding-tight);
    resize: none;
    outline: none;
    font-family: inherit;
    font-size: var(--font-size-base);
    line-height: var(--font-height-base);
    max-height: var(--modal-height-short);
    overflow-y: hidden;
    transition: color var(--duration-fast) var(--ease-standard);
  }

  .editor::placeholder {
    color: var(--frozen);
    opacity: var(--opacity-whisper);
  }

  /* --- SHARED KINETICS --- */
  :global(.action-btn) {
    transition:
      transform var(--duration-standard) var(--ease-elastic),
      color var(--duration-standard) var(--ease-standard);
    color: var(--pure-white) !important;
    opacity: 0.8;
  }

  :global(.action-btn) svg,
  :global(.action-btn) svg path {
    fill: var(--pure-white) !important;
  }

  :global(.action-btn:hover:not(:disabled)) {
    opacity: 1;
  }

  :global(.action-btn:disabled) {
    color: var(--frozen) !important;
    opacity: var(--opacity-ghost);
  }

  :global(.action-btn:disabled) svg,
  :global(.action-btn:disabled) svg path {
    fill: var(--frozen) !important;
  }
</style>
