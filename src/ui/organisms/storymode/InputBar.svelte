<script>
  /**
   * @file InputBar.svelte
   * ⌨️ THE COMMAND CONSOLE
   * The main interface for user input during Storymode.
   * Flattened Schema Compliant.
   */
  import { Engine } from "@core/engine/engine.js";
  import { app } from "@state/app.svelte.js";
  import { simulationState } from "@state/status.svelte.js";
  import { spin, stab } from "@ui/utils/actions/kinetic.js";
  let { disabled = false } = $props();
  // [R5] Auto-disable when engine is busy
  let is_locked = $derived(disabled || simulationState.phase !== "idle");
  let value = $state("");
  let is_focused = $state(false);
  let textarea;
  function adjust_height() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
  async function handle_send() {
    const text = value.trim();
    if (!text || is_locked) return;
    value = ""; // Clear immediately for UX
    adjust_height(); // Reset height
    try {
      await Engine.send(text);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  }
  function handle_keydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handle_send();
    }
  }
  function handle_input() {
    adjust_height();
  }
</script>

<div class="input-bar-unit" class:is-focused={is_focused} class:is-disabled={is_locked}>
  <button
    class="icon-button settings-button"
    onclick={() => app.toggle_control_panel()}
    title="Settings"
    type="button"
    use:spin
  >
    <svg class="icon" viewBox="0 0 24 24">
      <path
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </svg>
  </button>
  <textarea
    bind:this={textarea}
    class="input-area"
    bind:value
    onkeydown={handle_keydown}
    oninput={handle_input}
    onfocus={() => (is_focused = true)}
    onblur={() => (is_focused = false)}
    placeholder="Type a message..."
    rows="1"
    disabled={is_locked}
  ></textarea>
  <button
    class="icon-button send-button"
    onclick={handle_send}
    disabled={!value.trim() || is_locked}
    title="Send Message"
    type="button"
    use:stab
  >
    <svg class="icon" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  </button>
</div>

<style>
  .input-bar-unit {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: var(--max-width-text);
    background: color-mix(
      in srgb,
      var(--signature-color, var(--color-gunmetal)) 15%,
      var(--color-black)
    );
    border-radius: var(--border-radius-xl);
    padding: 0 var(--spacing-s);
    margin: var(--spacing-l);
    box-shadow: none;
    transition: all var(--motion-slow) var(--motion-elastic);
    position: relative;
  }

  .input-bar-unit.is-focused {
    background: color-mix(
      in srgb,
      var(--signature-color, var(--color-gunmetal)) 25%,
      var(--color-black)
    );
    box-shadow:
      inset 0 0 0 var(--spacing-px) var(--signature-color, transparent),
      0 0 0 var(--spacing-xxs)
        color-mix(in srgb, var(--signature-color, transparent) 10%, transparent);
    transform: none;
  }

  .input-bar-unit.is-disabled {
    opacity: var(--opacity-m);
    pointer-events: none;
  }

  .input-area {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--font-color-m);
    padding: var(--spacing-s);
    resize: none;
    outline: none;
    font-family: inherit;
    font-size: var(--font-size-m);
    line-height: var(--line-height-m);
    max-height: 12.5rem; /* Standardized ~200px */
    overflow-y: hidden;
  }

  .input-area::placeholder {
    color: var(--font-color-s);
  }

  .icon-button {
    background: transparent;
    border: none;
    color: var(--font-color-s);
    cursor: pointer;
    padding: var(--spacing-s);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--motion-fast);
    border-radius: var(--border-radius);
  }

  .icon-button .icon {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentcolor;
  }

  /* 1. Icon Button States */
  .icon-button:disabled {
    opacity: var(--opacity-xxs);
    cursor: not-allowed;
  }

  .icon-button:hover:not(:disabled) {
    color: var(--font-color-m);
    filter: drop-shadow(
      0 0 var(--spacing-m)
        color-mix(in srgb, var(--signature-color, var(--color-gunmetal)) 30%, transparent)
    );
  }

  /* 2. Specific Overrides */
  .send-button:not(:disabled):hover {
    color: var(--font-color-m);
    filter: drop-shadow(
      0 0 var(--spacing-m)
        color-mix(in srgb, var(--signature-color, var(--color-gunmetal)) 50%, transparent)
    );
  }
</style>
