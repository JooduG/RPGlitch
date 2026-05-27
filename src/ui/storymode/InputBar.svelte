<script>
  import { themeStore } from "@media";
  import { runtime } from "@state";
  /**
   * @file InputBar.svelte
   * ⌨️ THE COMMAND CONSOLE
   * Refactored: Mariana Trench SOTA Refactor
   * Standard: Ultra-Lean DOM & Chalk Regime Enforcement
   */
  import Button from "@atoms/Button.svelte";
  import GlassPill from "@atoms/GlassPill.svelte";
  import { tooltip } from "@atoms/Tooltip.svelte";
  import { app, session, simulationState } from "@state";
  import { roll, stab } from "@ui/actions";

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

  /** [R5] Auto-disable when engine is busy (Converged state lock) */
  let is_locked = $derived(disabled || simulationState.busy);

  /** The user's signature color for accenting the focus rings and elements */
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

    simulationState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    value = ""; // Clear immediately for UX
    adjust_height(); // Reset height

    try {
      await session.send(text);
    } catch (e) {
      console.error("Failed to send message:", e);
      simulationState.set_intent_active(false); // Release lock on error
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
  {signature_color}
  disabled={is_locked}
  class="console-capsule pill-chassis"
  data-testid="input-bar"
>
  {#snippet left()}
    <Button
      variant="invisible"
      class="flank"
      onclick={() => app.toggle_control_panel()}
      aria-label="Settings"
      actions={[roll, tooltip]}
    >
      <svg class="icon-medium" viewBox="0 0 24 24">
        <path
          fill="currentColor"
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
      class="flank"
      onclick={handle_send}
      disabled={!value.trim() || is_locked}
      aria-label="Send Message"
      actions={[stab, tooltip]}
    >
      <svg class="icon-medium" viewBox="0 0 24 24">
        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </Button>
  {/snippet}
</GlassPill>

<style>
  /**
   * ULTRA-LEAN NOMENCLATURE:
   * .editor - Inner textarea entry console.
   */
  .editor {
    flex: 1;
    background: transparent;
    border: none;
    padding: var(--padding-tight);
    resize: none;
    outline: none;
    font-size: var(--font-size-base);
    max-height: var(--modal-height-short);
    overflow-y: hidden;
  }

  .editor::placeholder {
    color: var(--frozen);
    opacity: var(--opacity-whisper);
  }
</style>
