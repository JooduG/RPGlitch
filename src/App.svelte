<script>

    import Stage from './artificer/Stage.svelte';
    import VitalsPane from './scholar/VitalsPane.svelte';
    import ControlPanel from './warden/ControlPanel.svelte'; // 🛡️ Warden
    import SettingsButton from './artificer/hud/SettingsButton.svelte'; // ⚒️ Trigger
    import { app } from './artificer/stores/app.svelte.js';
    import { runtime } from './scholar/stores/runtime.svelte.js';
    
    // Auto-Sync Bridge
    $effect(() => {
         const interval = setInterval(() => runtime.sync(), 1000);
         return () => clearInterval(interval);
    });
</script>

<main class="app-root">
    {#if app.view === 'lobby'}
         <!-- Hybrid Mode: Legacy Lobby View -->
         
         <div class="hud-layer">
             <div class="bottom-right">
                 <SettingsButton /> 
             </div>
         </div>
    {:else}
        <!-- Hybrid Mode: Legacy Game View -->

        <div class="hud-layer">
            <div class="top-right">
                <VitalsPane />
            </div>
            <div class="bottom-right">
                <SettingsButton />
            </div>
        </div>
    {/if}

    {#if app.controlPanelOpen}
        <ControlPanel />
    {/if}
</main>

<style lang="scss">
    .app-root {
        position: fixed; /* Overlay mode */
        inset: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        z-index: 50; /* Ensure it sits above legacy content but below modals if needed */
        pointer-events: none; /* Let clicks pass through to legacy app by default */
    }

    .hud-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 50;
        padding: 1rem;

        .top-right {
            position: absolute;
            top: 1rem;
            right: 1rem;
            pointer-events: auto;
        }

        .bottom-right {
            position: absolute;
            bottom: 1rem;
            right: 1rem;
            pointer-events: auto;
        }
    }
</style>
