<script>
    import { app } from './artificer/stores/app.svelte.js';
    import Stage from './artificer/Stage.svelte';
    import ChatLog from './artificer/chat/ChatLog.svelte';
    import InputBar from './artificer/input/InputBar.svelte';
    import Panel from './artificer/Panel.svelte';
    import Storyboard from './artificer/lobby/Storyboard.svelte';
    import Message from './artificer/chat/Message.svelte';

    // Temporary State for Demo (Migrating to Store later)
    let messages = $state([
        { text: "System Initialized. Welcome to The Artificer UI.", sender: "system", timestamp: new Date() },
        { text: "The rigid grid structure is active.", sender: "ai", timestamp: new Date() }
    ]);

    function handleSend(text) {
        // Add User Message
        messages.push({ text, sender: "user", timestamp: new Date() });
    }

    let scrollContainer = $state();
    
    $effect(() => {
        // Run dependency check
        app.messages;
        
        if (scrollContainer) {
            // Use requestAnimationFrame to wait for DOM update
            requestAnimationFrame(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            });
        }
    });
</script>

{#if app.view === 'lobby'}
    <Storyboard />
{:else}
    <Stage>
        {#snippet leftPanel()}
            <Panel title={app.selectedAi?.name || "AI"} variant="glass">
                <div style="padding: 1rem; color: #888;">
                    <img src={app.selectedAi?.avatar} alt="Avatar" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;" />
                    <p>{app.selectedAi?.description || "No Data"}</p>
                </div>
            </Panel>
        {/snippet}

        {#snippet centerPanel()}
                <div class="chat-viewport">
                <div class="chat-scroll-area" bind:this={scrollContainer}>
                    {#each app.messages as msg (msg.id || Math.random())}
                        <Message 
                            text={msg.text} 
                            sender={msg.role} 
                            timestamp={new Date(msg.createdAt)}
                            attachments={msg.attachments || []} 
                        />
                    {/each}
                </div>
                <div class="input-container">
                    <InputBar onsend={(text) => window.GameMaster.send(text)} />
                </div>
            </div>
        {/snippet}

        {#snippet rightPanel()}
            <Panel title={app.selectedUser?.name || "User"} variant="glass">
                <div style="padding: 1rem; color: #888;">
                     <img src={app.selectedUser?.avatar} alt="Avatar" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;" />
                    <p>{app.selectedUser?.description || "No Data"}</p>
                </div>
            </Panel>
        {/snippet}
    </Stage>
{/if}

<style lang="scss">


    .chat-viewport {
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
    }

    .chat-scroll-area {
        flex: 1;
        overflow-y: auto;
        padding-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        
        /* Hide Scrollbar */
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */
        &::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
        }
    }

    .input-container {
        flex-shrink: 0;
        z-index: 10;
    }

</style>
