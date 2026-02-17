<script>
    import { entities } from "@data/repository.js"
    import { app } from "@state/app.svelte.js"
    import { messages } from "@state/messages.svelte.js"
    import { session } from "@state/session.svelte.js"
    import Button from "@ui/atoms/Button.svelte"
    import { onMount } from "svelte"
    // TypingIndicator is now integrated into Message.svelte via isThinking prop
    import Layout from "@ui/organisms/Layout.svelte"
    import InputBar from "./InputBar.svelte"
    import Message from "./Message.svelte"
    import StorymodePanel from "./StorymodePanel.svelte"
    // [FEEDBACK] Fractal Background Logic
    import { runtime } from "@state/runtime.svelte.js"
    let fractalBg = $derived(
        runtime?.storyFractal?.visuals?.profilePicture || ""
    )
    // --- STATE ---
    let scrollRef = $state(null)

    // Derived
    let feed = $derived(messages.feed || [])
    let isThinking = $derived(app.simulation.loading)

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

    // --- ON MOUNT: Hydrate Entity Lists for Color Lookups ---
    onMount(async () => {
        // If we landed directly in Game (reload), the lists might be empty.
        // We need them to resolve signature colors for historical messages.
        if (app.aiList.length === 0) {
            try {
                const [ais, users, fractals] = await Promise.all([
                    entities.list("character"),
                    entities.list("character"),
                    entities.list("fractal"),
                ])
                app.aiList = ais
                app.userList = users
                app.fractalList = fractals
            } catch (e) {
                console.error("[Storymode] Failed to hydrate colors:", e)
            }
        }

        // [R5] Ensure Runtime is Synced (Vital for Message.svelte fallbacks)
        if (!runtime.isReady) {
            // Runtime can auto-recover story ID from DB
            await runtime.sync()
        }
    })
</script>

<div class="storymode-container">
    <!-- [FEEDBACK] Fractal Wallpaper Layer -->
    {#if fractalBg}
        <div
            class="fractal-wallpaper"
            style="background-image: url('{fractalBg}')"
        ></div>
    {/if}

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
                    {#each messages.feed as msg, index (msg.id)}
                        <Message
                            text={msg.text}
                            sender={mapRole(msg.role)}
                            characterName={msg.characterName ||
                                (mapRole(msg.role) === "ai"
                                    ? app.selectedAi?.name
                                    : "")}
                            timestamp={msg.timestamp
                                ? new Date(msg.timestamp)
                                : new Date()}
                            attachments={msg.attachments}
                            isLast={index === messages.feed.length - 1}
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
                        <!-- [R5] Dynamic Thinking Indicator -->
                        <Message
                            sender={app.simulation.generatingRole}
                            isThinking={true}
                        />
                        <!-- Future: <Message sender="user" isThinking={true} /> -->
                        <!-- Future: <Message sender="fractal" isThinking={true} /> -->
                    {:else if messages.feed.length === 0}
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
        position: relative;
    }

    .fractal-wallpaper {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.15; /* Subtle overlay */
        z-index: 0; /* Base level */
        pointer-events: none;
        mix-blend-mode: overlay;
        filter: grayscale(100%) contrast(120%); /* Stylized */
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
            background: var(--gunmetal, #333);
            border-radius: 3px;
        }
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
