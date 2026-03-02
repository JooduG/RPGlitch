<script>
    import { entities } from "@/data/repository.js"
    import { app } from "@state/app.svelte.js"
    import LoadingSkeleton from "@ui/molecules/LoadingSkeleton.svelte"
    import Layout from "@ui/organisms/Layout.svelte"
    import LibraryDrawer from "@ui/organisms/library/LibraryDrawer.svelte"
    import StoryboardCard from "@ui/organisms/storyboard/StoryboardCard.svelte"
    import StoryboardDynamicTitle from "@ui/organisms/storyboard/StoryboardDynamicTitle.svelte"
    import StoryboardPill from "@ui/organisms/storyboard/StoryboardPill.svelte"
    import { onMount } from "svelte"

    // --- STATE ---
    let loading = $state(true)

    // Derived Title for Display

    onMount(async () => {
        try {
            const [characters, fractals] = await Promise.all([entities.list("character"), entities.list("fractal")])

            app.aiList = characters
            app.userList = characters
            app.fractalList = fractals
        } catch (e) {
            console.error("[Storyboard] Failed to load lobby:", e)
        } finally {
            loading = false
        }
    })
</script>

{#if loading}
    <!-- Global Skeleton Loader -->
    <div class="skeleton-boot">
        <LoadingSkeleton variant="card" width="25vh" height="40vh" />
        <LoadingSkeleton variant="card" width="40vh" height="25vh" />
        <LoadingSkeleton variant="card" width="25vh" height="40vh" />
    </div>
{:else}
    <Layout align="end">
        {#snippet header()}
            <div class="header-container">
                <StoryboardDynamicTitle />
            </div>
        {/snippet}

        <!-- LEFT: AI -->
        {#snippet left()}
            <StoryboardCard type="ai" entity={app.selectedAi} roleLabel="AI Character" onSelect={() => app.openDrawer("ai")} onViewProfile={() => app.toggleProfile(true, app.selectedAi)} />
        {/snippet}

        <!-- CENTER: Fractal -->
        {#snippet center()}
            <StoryboardCard type="fractal" entity={app.selectedFractal} roleLabel="Fractal" onSelect={() => app.openDrawer("fractal")} onViewProfile={() => app.toggleProfile(true, app.selectedFractal)} />
        {/snippet}

        <!-- RIGHT: User -->
        {#snippet right()}
            <StoryboardCard type="user" entity={app.selectedUser} roleLabel="Your Persona" onSelect={() => app.openDrawer("user")} onViewProfile={() => app.toggleProfile(true, app.selectedUser)} />
        {/snippet}

        {#snippet footer()}
            <div class="controls-layer">
                <StoryboardPill />
            </div>
        {/snippet}
    </Layout>

    <!-- Entity Drawer (The Library) -->
    <LibraryDrawer />
{/if}

<style lang="scss">
    .header-container {
        text-align: center;
    }

    /* Boot Loader: Matches Layout.svelte 12-col grid */
    .skeleton-boot {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        height: 100vh;
        width: 100%;
        position: fixed;
        inset: 0;
        align-items: center; /* Center items in their row */
        align-content: center; /* Center the row in the container */

        & :global(.skeleton:nth-child(1)) {
            grid-column: 2 / span 2;
            justify-self: center;
        }
        & :global(.skeleton:nth-child(2)) {
            grid-column: 4 / span 6;
            justify-self: center;
        }
        & :global(.skeleton:nth-child(3)) {
            grid-column: 10 / span 2;
            justify-self: center;
        }

        /* Mobile Stack */
        @media (max-width: 768px) {
            grid-template-columns: 1fr;
            /* Remove the shelf padding on mobile so it centers or fits better vertically */
            padding-bottom: 0;
            align-items: center;

            & :global(.skeleton:nth-child(1)),
            & :global(.skeleton:nth-child(3)) {
                display: none;
            }
            & :global(.skeleton:nth-child(2)) {
                grid-column: 1 / -1;
            }
        }
    }

    .controls-layer {
        margin-top: auto;
        pointer-events: auto; /* Ensure clickable */
        display: flex;
        justify-content: center;
    }
</style>
