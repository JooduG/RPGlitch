<script>
    import { Session } from "@core/engine/session.js"
    import Button from "@ui/atoms/Button.svelte"

    let { disabled = false } = $props()
    let value = $state("")
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
            await Session.send(text)
        } catch (e) {
            console.error("Failed to send message:", e)
            // Optional: restore text if failed? For now, we assume success or global error handling.
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

<div class="input-bar">
    <textarea
        bind:this={textarea}
        class="input-area"
        bind:value
        onkeydown={handleKeydown}
        oninput={handleInput}
        placeholder="Type a message..."
        rows="1"
        {disabled}
    ></textarea>
    <Button
        class="send-btn"
        variant="primary"
        onclick={handleSend}
        disabled={!value.trim() || disabled}
        label="Send"
    />
</div>

<style lang="scss">
    .input-bar {
        display: flex;
        gap: 0.75rem; /* Larger gap */
        padding: 1.25rem; /* Chunkier padding */
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.95) 20%,
            transparent 100%
        );
        /* Removed solid backdrop border to blend better */
        /* border-top: 1px solid #27272a; */
        width: 100%;
        /* box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5); */ /* Replaced with gradient fade */
        align-items: flex-end; /* Align bottom when resizing */
    }

    .input-area {
        flex: 1;
        background: #18181b; /* Zinc 900 */
        border: 1px solid #27272a;
        border-radius: 8px;
        color: #e4e4e7;
        padding: 1rem; /* More breathing room */
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: 1rem; /* readable size */
        line-height: 1.5;
        max-height: 200px; /* Limit expansion */
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        overflow-y: hidden; /* Hide scrollbar until max-height */

        &:focus {
            background: #27272a;
            border-color: #3f3f46;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05);
        }
    }

    :global(.input-bar .send-btn.btn) {
        /* Extending primary button with specific overrides */
        padding: 0 2rem; /* Wide button */
        height: 3.5rem; /* Match input height */
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-radius: 8px;
        font-size: 0.95rem;

        /* Original hover/active states are handled by variant="primary" mostly */
        /* but we keep specific overrides if needed */
    }
</style>
