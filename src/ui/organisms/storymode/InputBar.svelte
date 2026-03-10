<script>
    /**
     * @file InputBar.svelte
     * ⌨️ THE COMMAND CONSOLE
     * The main interface for user input during Storymode.
     * Flattened Schema Compliant.
     */
    import { Engine } from "@core/engine/engine.js"
    import { app } from "@state/app.svelte.js"
    import { engineState } from "@state/status.svelte.js"
    import { spin, stab } from "@ui/utils/actions/kinetic.js"

    let { disabled = false } = $props()

    // [R5] Auto-disable when engine is busy
    let is_locked = $derived(disabled || engineState.phase !== "idle")
    let value = $state("")
    let is_focused = $state(false)
    let textarea

    function adjust_height() {
        if (!textarea) return
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + "px"
    }

    async function handle_send() {
        const text = value.trim()
        if (!text || is_locked) return

        value = "" // Clear immediately for UX
        adjust_height() // Reset height

        try {
            await Engine.send(text)
        } catch (e) {
            console.error("Failed to send message:", e)
        }
    }

    function handle_keydown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handle_send()
        }
    }

    function handle_input() {
        adjust_height()
    }
</script>

<div class="input-bar-unit" class:is-focused={is_focused} class:is-disabled={is_locked}>
    <button class="icon-btn settings-btn" onclick={() => app.toggleControlPanel()} title="Settings" type="button" use:spin>
        <svg class="icon" viewBox="0 0 24 24">
            <path
                d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
        </svg>
    </button>

    <textarea bind:this={textarea} class="input-area" bind:value onkeydown={handle_keydown} oninput={handle_input} onfocus={() => (is_focused = true)} onblur={() => (is_focused = false)} placeholder="Type a message..." rows="1" disabled={is_locked}></textarea>

    <button class="icon-btn send-btn" onclick={handle_send} disabled={!value.trim() || is_locked} title="Send Message" type="button" use:stab>
        <svg class="icon" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
    </button>
</div>

<style lang="scss">
    @use "@theme/abstracts/variables" as *;

    .input-bar-unit {
        display: flex;
        align-items: flex-end;
        background: var(--glass-m);
        backdrop-filter: blur(var(--blur-m));
        border-radius: var(--border-radius-l);
        padding: var(--spacing-xs);
        margin: var(--spacing-l);
        transition: all var(--transition-speed);
        box-shadow: var(--glass-border-none);

        &.is-focused {
            background: var(--glass-l);
            box-shadow:
                inset 0 0 0 var(--spacing-px) var(--signature-color, var(--glass-border)),
                var(--shadow-m),
                0 0 0 var(--spacing-xxs) var(--glass-hover);
            transform: translateY(-2px);
        }

        &.is-disabled {
            opacity: var(--opacity-m);
            pointer-events: none;
        }
    }

    .input-area {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--app-color);
        padding: var(--spacing-s);
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: var(--font-size-m);
        line-height: var(--line-height-base);
        max-height: 12.5rem; /* Standardized ~200px */
        overflow-y: hidden;

        &::placeholder {
            color: var(--app-muted);
        }
    }

    .icon-btn {
        background: transparent;
        border: none;
        color: var(--app-muted);
        cursor: pointer;
        padding: var(--spacing-s);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-speed);
        border-radius: var(--border-radius);

        &:hover:not(:disabled) {
            color: var(--app-color);
            filter: drop-shadow(0 0 var(--spacing-m) var(--glass-m));
        }

        &:disabled {
            opacity: var(--opacity-xxs);
            cursor: not-allowed;
        }

        .icon {
            width: 1.25rem;
            height: 1.25rem;
            fill: currentColor;
        }
    }

    .send-btn {
        &:not(:disabled):hover {
            color: var(--app-color);
            filter: drop-shadow(0 0 var(--spacing-m) var(--signature-color, var(--glass-l)));
        }
    }
</style>
