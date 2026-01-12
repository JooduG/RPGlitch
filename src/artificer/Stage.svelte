<script>
    let { 
        leftPanel, 
        centerPanel, 
        rightPanel,
        transparent = false
    } = $props();
</script>

<div class="universal-stage" class:is-transparent={transparent}>
    <!-- Track 1: Margin -->
    <div class="margin-col"></div>

    <!-- Track 2: Left Panel (AI) -->
    <aside class="stage-column left-panel">
        {#if leftPanel}
            {@render leftPanel()}
        {/if}
    </aside>

    <!-- Track 3: Center Stage (Chat) -->
    <main class="stage-column center-stage">
        {#if centerPanel}
            {@render centerPanel()}
        {/if}
    </main>

    <!-- Track 4: Right Panel (User) -->
    <aside class="stage-column right-panel">
        {#if rightPanel}
            {@render rightPanel()}
        {/if}
    </aside>

    <!-- Track 5: Margin -->
    <div class="margin-col"></div>
</div>

<style lang="scss">
    .universal-stage {
        display: grid;
        grid-template-columns: 1fr 2fr 4fr 2fr 1fr;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        position: fixed;
        inset: 0;
        z-index: 0; /* Changed from 100 to 0 to sit behind HUD (50) */
        
        /* Atmospheric Background */
        background-color: #020202;
        background-image: 
            radial-gradient(
                circle at 50% 0%,
                rgba(30, 40, 50, 0.2) 0%,
                transparent 60%
            ),
            radial-gradient(
                circle at 50% 100%,
                rgba(10, 10, 15, 0.8) 0%,
                transparent 50%
            );
        
        &.is-transparent {
            background: transparent;
        }
        
        pointer-events: none;

        // Mobile: Single Column Stack
        @media (max-width: 768px) {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
        }
    }

    .stage-column {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        pointer-events: none; /* Allow clicks to pass through empty columns */
        min-height: 0; 
    }

    .center-stage {
        background: radial-gradient(
            circle at center,
            rgb(255 255 255 / 3%) 0%,
            transparent 70%
        );
    }

    .margin-col {
        pointer-events: none;
    }

    /* Mobile handling for side panels would go here (e.g. drawers) */
    @media (max-width: 768px) {
        .left-panel, .right-panel {
            display: none; /* Hidden on mobile by default, replaced by drawers */
        }
    }
</style>
