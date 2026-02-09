<script>
    import { app } from "@state/app.svelte.js"
    import { session } from "@state/session.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import LoadingSkeleton from "@ui/molecules/LoadingSkeleton.svelte"
    import Layout from "@ui/organisms/Layout.svelte"
    import InputBar from "./InputBar.svelte"
    import Message from "./Message.svelte"
    import StorymodePanel from "./StorymodePanel.svelte"

    // --- STATE ---
    let scrollRef = $state(null)

    // Derived
    let feed = $derived(app.simulation.feed || [])
    let isThinking = $derived(app.simulation.loading)

    // Auto-scroll logic
    $effect(() => {
        if ((feed.length || app.streaming.active) && scrollRef) {
            // Small timeout to allow DOM render
            setTimeout(() => {
                if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight
            }, 0)
        }
    })

    // Helper to map DB role to UI sender
    function mapRole(role) {
        if (role === "assistant") return "ai"
        return role
    }

    // --- ACTIONS ---
    async function handleDelete(index) {
        const msg = feed[index]
        if (msg && msg.id) {
            await session.deleteMessage(msg.id)
        }
    }

    async function handleRegenerate(index) {
        // Regenerate the LAST message (ignoring index for now, as API only supports last)
        await session.retry()
    }

    async function handleContinue() {
        await session.continue()
    }

    async function handleEdit(index) {
        const msg = feed[index]
        if (!msg) return

        // Simple prompt for now
        const newText = prompt("Edit message:", msg.text)
        if (newText !== null && newText !== msg.text) {
            await session.editMessage(msg.id, newText)
        }
    }
</script>

<div class="storymode-container">
    <!-- CINEMATIC LAYOUT: 2-6-2 -->
    <Layout mode="cinematic">
        {#snippet header()}{/snippet}
        {#snippet footer()}{/snippet}
        <!-- LEFT: AI Companion (Full Bleed) -->
        {#snippet left()}
            <StorymodePanel entity={app.selectedAi} side="left" />
        {/snippet}

        <!-- CENTER: Feed & Input -->
        {#snippet center()}
            <div class="game-stage">
                <!-- Narrative Feed -->
                <div class="feed-scroll" bind:this={scrollRef}>
                    {#each feed as msg, index (msg.id)}
                        <Message
                            text={msg.text}
                            sender={mapRole(msg.role)}
                            timestamp={msg.timestamp
                                ? new Date(msg.timestamp)
                                : new Date()}
                            attachments={msg.attachments}
                            isLast={index === feed.length - 1}
                            onDelete={() => handleDelete(index)}
                            onRegenerate={() => handleRegenerate(index)}
                            onContinue={() => handleContinue()}
                            onEdit={() => handleEdit(index)}
                        />
                    {/each}

                    {#if app.streaming?.active}
                        <Message
                            text={app.streaming.content}
                            sender="ai"
                            timestamp={new Date()}
                            isLast={true}
                        />
                    {:else if isThinking}
                        <!-- Thinking Indicator using Message bubble for consistency -->
                        <div class="thinking-container">
                            <div class="message-group ai thinking">
                                <LoadingSkeleton
                                    variant="text"
                                    width="60%"
                                    height="1.5rem"
                                    class="skeleton-pulse"
                                />
                            </div>
                        </div>
                    {:else if feed.length === 0}
                        <div class="empty-feed-fallback">
                            <p>
                                Establishing context stream... If the screen
                                remains black, please check your network or AI
                                plugin settings.
                            </p>
                            <Button
                                className="btn-retry"
                                variant="ghost"
                                onclick={() => session.retry()}
                                label="Retry Connection"
                            />
                        </div>
                    {/if}
                </div>

                <!-- Sticky Input Bar -->
                <div class="input-container">
                    <InputBar disabled={isThinking} />
                </div>
            </div>
        {/snippet}

        <!-- RIGHT: User Persona (Full Bleed) -->
        {#snippet right()}
            <StorymodePanel entity={app.selectedUser} side="right" />
        {/snippet}
    </Layout>
</div>

<style lang="scss">
    .storymode-container {
        width: 100%;
        height: 100%;
        background: inherit; /* Inherit radial gradient from body */
    }

    .game-stage {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .feed-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1rem 0; /* Vertical padding */
        display: flex;
        flex-direction: column;
        gap: 0; /* Message component handles its own spacing/padding */

        /* Smooth Scroll */
        scroll-behavior: smooth;

        /* Hide Scrollbar but keep functionality */
        &::-webkit-scrollbar {
            width: 6px;
        }
        &::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 3px;
        }
    }

    .thinking-container {
        padding: 1rem 1.5rem;
        opacity: 0.7;
        animation: pulse 1.5s infinite ease-in-out;
    }

    /* Input Container sits at the bottom */
    .input-container {
        flex-shrink: 0;
        width: 100%;
        padding-bottom: 0; /* InputBar likely has its own padding */
        z-index: 10;
    }

    .empty-feed-fallback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        color: #666;
        gap: 1rem;

        p {
            max-width: 400px;
        }

        :global(.btn-retry) {
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            color: #999;

            &:hover {
                background: rgba(255, 255, 255, 0.15);
                color: white;
            }
        }
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.5;
        }
        50% {
            opacity: 0.8;
        }
    }
</style>
