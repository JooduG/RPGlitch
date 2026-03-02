<script>
    import { app } from "@state/app.svelte.js"
    import { messages } from "@state/messages.svelte.js"
    import { session } from "@state/session.svelte.js"
    import { engineState } from "@state/status.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import Message from "./Message.svelte"

    // --- STATE ---
    let scrollRef = $state(null)

    // Derived
    let isThinking = $derived(engineState.phase === "generating")

    // Auto-scroll logic
    $effect(() => {
        if ((messages.feed.length || app.streaming.active) && scrollRef) {
            // Small timeout to allow DOM render
            setTimeout(() => {
                if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight
            }, 0)
        }
    })

    // Helper to map DB role to UI sender
    function mapRole(role) {
        if (role === "assistant" || role === "ai") return "ai"
        if (role === "prologue") return "fractal"
        return role
    }

    // --- ACTIONS ---
    async function handleDelete(index) {
        const msg = messages.feed[index]
        if (msg && msg.id) {
            await session.deleteMessage(msg.id)
        }
    }

    async function handleRegenerate() {
        await session.retry()
    }

    async function handleContinue() {
        await session.continue()
    }

    async function handleEdit(index) {
        const msg = messages.feed[index]
        if (!msg) return

        const newText = prompt("Edit message:", msg.text)
        if (newText !== null && newText !== msg.text) {
            await session.editMessage(msg.id, newText)
        }
    }
</script>

<div class="prose-panel" bind:this={scrollRef}>
    {#each messages.feed as msg, index (msg.id)}
        <Message
            text={msg.text}
            sender={mapRole(msg.role)}
            characterName={msg.characterName || (mapRole(msg.role) === "ai" ? app.selectedAi?.name : "")}
            timestamp={msg.timestamp ? new Date(msg.timestamp) : new Date()}
            attachments={msg.attachments}
            isLast={index === messages.feed.length - 1}
            onDelete={() => handleDelete(index)}
            onRegenerate={() => handleRegenerate()}
            onContinue={() => handleContinue()}
            onEdit={() => handleEdit(index)}
        />
    {/each}

    {#if app.streaming?.active}
        <Message text={app.streaming.content} sender="ai" timestamp={new Date()} isLast={true} />
    {:else if isThinking}
        <Message sender={engineState.role} isThinking={true} />
    {:else if messages.feed.length === 0}
        <div class="empty-feed-fallback">
            <p>Establishing context stream... If the screen remains black, please check your network or AI plugin settings.</p>
            <Button className="btn-retry" variant="ghost" onclick={() => session.retry()} label="Retry Connection" />
        </div>
    {/if}
</div>

<style lang="scss">
    .prose-panel {
        flex: 1;
        min-height: 200px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 0;
        scroll-behavior: smooth;

        &::-webkit-scrollbar {
            width: 6px;
        }
        &::-webkit-scrollbar-thumb {
            background: var(--gunmetal, #333);
            border-radius: 3px;
        }
    }

    .empty-feed-fallback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        color: var(--frozen-pole, #666);
        gap: 1rem;

        p {
            max-width: 400px;
        }

        :global(.btn-retry) {
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: var(--frisk, #999);

            &:hover {
                background: rgba(255, 255, 255, 0.15);
                color: white;
            }
        }
    }
</style>
