<script>
    import { app } from "@state/app.svelte.js"
    import { session } from "@state/session.svelte.js"
    import { simulation_log } from "@state/simulation_log.svelte.js"
    import { engineState } from "@state/status.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import Message from "./Message.svelte"

    // --- STATE ---
    let scrollRef = $state(null)

    // Derived
    let isThinking = $derived(engineState.phase === "generating")

    // Auto-scroll logic
    $effect(() => {
        if ((simulation_log.feed.length || app.streaming.active) && scrollRef) {
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
        const entry = simulation_log.feed[index]
        if (entry && entry.id) {
            await session.delete_entry(entry.id)
        }
    }

    async function handleRegenerate() {
        await session.retry()
    }

    async function handleContinue() {
        await session.continue()
    }

    async function handleEdit(index) {
        const entry = simulation_log.feed[index]
        if (!entry) return

        const newText = prompt("Edit log entry:", entry.text)
        if (newText !== null && newText !== entry.text) {
            await session.edit_entry(entry.id, newText)
        }
    }
</script>

<div class="prose-panel" bind:this={scrollRef}>
    {#each simulation_log.feed as entry, index (entry.id)}
        <Message
            text={entry.text}
            sender={mapRole(entry.role)}
            character_name={entry.character_name || (mapRole(entry.role) === "ai" ? app.selectedAi?.name : "")}
            timestamp={entry.created_at ? new Date(entry.created_at) : new Date()}
            attachments={entry.attachments}
            isLast={index === simulation_log.feed.length - 1}
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
    {:else if simulation_log.feed.length === 0}
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
