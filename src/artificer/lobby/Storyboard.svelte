<script>
    import { onMount } from 'svelte';
    import { app } from '../stores/app.svelte.js';
    import { entities } from '../../js/scholar/repository.js';
    import { Session } from '../../js/gamemaster/session.js';
    import Button from '../Button.svelte';
    import Panel from '../Panel.svelte';

    let loading = $state(true);
    let initializing = $state(false);

    onMount(async () => {
        try {
            const [ais, users, fractals] = await Promise.all([
                entities.list('character'), 
                entities.list('character'), 
                entities.list('fractal')
            ]);
            
            app.aiList = ais; 
            app.userList = users;
            app.fractalList = fractals;

            // Auto-select defaults if not set
            if (!app.selectedAi && ais.length > 0) app.selectedAi = ais[0];
            if (!app.selectedUser && users.length > 0) app.selectedUser = users[0];
            if (!app.selectedFractal && fractals.length > 0) app.selectedFractal = fractals[0];

            loading = false;
        } catch (e) {
            console.error("Failed to load lobby:", e);
        }
    });

    async function startStory() {
        if (!app.selectedAi || !app.selectedUser || !app.selectedFractal) return;
        
        initializing = true;
        try {
            console.log("[Storyboard] Creating new session...");
            await Session.createFromSelection({
                aiId: app.selectedAi.id,
                userId: app.selectedUser.id,
                fractalId: app.selectedFractal.id,
                storyTitle: `The ${app.selectedFractal.name} Protocol`
            });
            console.log("[Storyboard] Session created, switching view.");
            app.setView('story');
        } catch (err) {
            console.error("Failed to start story:", err);
            alert("Failed to initialize session. Check console.");
        } finally {
            initializing = false;
        }
    }
</script>

<div class="lobby-layout">
    <div class="header">
        <h1>New Story</h1>
        <p>Select your roster to begin</p>
    </div>

    {#if loading}
        <div class="loading">Initializing Repository...</div>
    {:else}
        <div class="card-grid">
            <!-- AI Selector -->
            <Panel title="AI Companion">
                <div class="selection-col">
                    <select bind:value={app.selectedAi} class="entity-select">
                        {#each app.aiList as entity}
                            <option value={entity}>{entity.name}</option>
                        {/each}
                    </select>
                    {#if app.selectedAi}
                        <div class="preview">
                            <div class="avatar" style="background-image: url({app.selectedAi.profilePictureUrl || ''})"></div>
                            <p class="desc">{app.selectedAi.summary || "No description available."}</p>
                        </div>
                    {/if}
                </div>
            </Panel>

            <!-- Fractal Selector -->
            <Panel title="Fractal (World)">
                <div class="selection-col">
                    <select bind:value={app.selectedFractal} class="entity-select">
                        {#each app.fractalList as entity}
                            <option value={entity}>{entity.name}</option>
                        {/each}
                    </select>
                    {#if app.selectedFractal}
                        <div class="preview">
                            <div class="avatar" style="background-image: url({app.selectedFractal.profilePictureUrl || ''})"></div>
                            <p class="desc">{app.selectedFractal.summary || "No description available."}</p>
                        </div>
                    {/if}
                </div>
            </Panel>

            <!-- User Selector -->
            <Panel title="Your Character">
                <div class="selection-col">
                    <select bind:value={app.selectedUser} class="entity-select">
                        {#each app.userList as entity}
                            <option value={entity}>{entity.name}</option>
                        {/each}
                    </select>
                    {#if app.selectedUser}
                        <div class="preview">
                            <div class="avatar" style="background-image: url({app.selectedUser.profilePictureUrl || ''})"></div>
                            <p class="desc">{app.selectedUser.summary || "No description available."}</p>
                        </div>
                    {/if}
                </div>
            </Panel>
        </div>

        <div class="action-bar">
            <Button label={initializing ? "Initializing..." : "Begin Session"} onclick={startStory} variant="primary" disabled={initializing} />
        </div>
    {/if}
</div>

<style lang="scss">
    .lobby-layout {
        max-width: 1200px;
        margin: 0 auto;
        padding: 4rem 2rem;
        height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .header {
        text-align: center;
        h1 { font-size: 2rem; font-weight: 700; color: #fff; margin: 0; }
        p { color: #94a3b8; margin-top: 0.5rem; }
    }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        flex: 1;
        min-height: 0;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    }

    .selection-col {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
    }

    .entity-select {
        background: #18181b;
        border: 1px solid #27272a;
        color: #fff;
        padding: 0.75rem;
        border-radius: 6px;
        width: 100%;
        outline: none;
        
        &:focus { border-color: #3b82f6; }
    }

    .preview {
        flex: 1;
        background: rgba(0,0,0,0.2);
        border-radius: 6px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        text-align: center;

        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #27272a;
            background-size: cover;
            background-position: center;
            border: 2px solid #3f3f46;
        }

        .desc {
            font-size: 0.875rem;
            color: #a1a1aa;
            line-height: 1.5;
        }
    }

    .action-bar {
        display: flex;
        justify-content: center;
        padding-top: 1rem;
    }

    .loading {
        text-align: center;
        color: #94a3b8;
        font-size: 1.25rem;
        margin-top: 4rem;
    }
</style>
