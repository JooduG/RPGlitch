<script>
    let { 
        leftPanel, 
        centerPanel, 
        rightPanel 
    } = $props();
</script>

<div class="universal-stage">
    <!-- Track 1: Margin -->
    <div class="margin-col"></div>

    <!-- Track 2: Left Panel (AI) -->
    <aside class="stage-column left-panel">
        {@render leftPanel?.()}
    </aside>

    <!-- Track 3: Center Stage (Chat) -->
    <main class="stage-column center-stage">
        {@render centerPanel?.()}
    </main>

    <!-- Track 4: Right Panel (User) -->
    <aside class="stage-column right-panel">
        {@render rightPanel?.()}
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
        z-index: 100;
        
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
        pointer-events: auto; /* Enable interaction within columns */
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
