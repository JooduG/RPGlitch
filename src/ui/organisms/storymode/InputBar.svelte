<script>
    import { Engine } from "@core/engine/engine.js"
    import { app } from "@state/app.svelte.js"
    import { spin, stab } from "@ui/utils/actions/kinetic.js"

    let { disabled = false } = $props()
    let value = $state("")
    let isFocused = $state(false)
    let textarea

    function adjustHeight() {
        if (!textarea) return
        textarea.style.height = "auto"
        textarea.style.height = textarea.scrollHeight + "px"
    }

    async function handleSend() {
        const text = value.trim()
        if (!text || disabled) return

        value = "" // Clear immediately for UX
        adjustHeight() // Reset height

        try {
            await Engine.send(text)
        } catch (e) {
            console.error("Failed to send message:", e)
        }
    }

    function handleKeydown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    function handleInput() {
        adjustHeight()
    }
</script>

```
<div
    class="input-bar-unit"
    class:is-focused={isFocused}
    class:is-disabled={disabled}
>
    <!-- SETTINGS COG -->
    <button
        class="icon-btn settings-btn"
        onclick={() => app.toggleControlPanel()}
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
        onkeydown={handleKeydown}
        oninput={handleInput}
        onfocus={() => (isFocused = true)}
        onblur={() => (isFocused = false)}
        placeholder="Type a message..."
        rows="1"
        {disabled}
    ></textarea>

    <!-- SEND ACTION -->
    <button
        class="icon-btn send-btn"
        onclick={handleSend}
        disabled={!value.trim() || disabled}
        title="Send Message"
        type="button"
        use:stab
    >
        <svg class="icon" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
    </button>
</div>

<style lang="scss">
    .input-bar-unit {
        display: flex;
        align-items: flex-end;
        background: rgba(24, 24, 27, 0.4); /* Subtle Zinc 950 alpha */
        backdrop-filter: blur(8px);
        border-radius: 12px;
        padding: 0.5rem;
        margin: 1.25rem;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: 0.0625rem solid transparent; /* Border is invisible by default */

        &.is-focused {
            background: rgba(39, 39, 42, 0.6);
            border-color: var(--app-accent, rgba(255, 255, 255, 0.2));
            box-shadow:
                0 0 20px rgba(0, 0, 0, 0.2),
                0 0 0 4px rgba(255, 255, 255, 0.02);
            transform: translateY(-2px);
        }

        &.is-disabled {
            opacity: 0.5;
            pointer-events: none;
        }
    }

    .input-area {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--app-color, #f4f4f5); /* Zinc 100 */
        padding: 0.75rem;
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: 1rem;
        line-height: 1.5;
        max-height: 200px;
        overflow-y: hidden;

        &::placeholder {
            color: var(--app-muted, #71717a); /* Zinc 500 */
        }
    }

    .icon-btn {
        background: transparent;
        border: none;
        color: rgba(161, 161, 170, 0.6); /* Zinc 400 dim */
        cursor: pointer;
        padding: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 8px;

        &:hover:not(:disabled) {
            color: var(--app-color, #fff);
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.4));
            /* background highlight removed as requested */
        }

        &:disabled {
            opacity: 0.15;
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
            color: var(--app-color, #fff);
            filter: drop-shadow(
                0 0 12px var(--app-accent, rgba(255, 255, 255, 0.6))
            );
        }
    }
</style>
