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

    onMount(async () => {
        try {
            const [characters, fractals] = await Promise.all([entities.list("character"), entities.list("fractal")])

            app.ai_list = characters
            app.user_list = characters
            app.fractal_list = fractals
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
        <LoadingSkeleton variant="card" width="var(--card-width, 25vh)" height="var(--card-height, 40vh)" />
        <LoadingSkeleton variant="card" width="var(--card-height, 40vh)" height="var(--card-width, 25vh)" />
        <LoadingSkeleton variant="card" width="var(--card-width, 25vh)" height="var(--card-height, 40vh)" />
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
            <StoryboardCard type="ai" entity={app.selected_ai} role_label="AI Character" on_select={() => app.open_drawer("ai")} on_view_profile={() => app.toggle_profile(true, app.selected_ai)} />
        {/snippet}

        <!-- CENTER: Fractal -->
        {#snippet center()}
            <StoryboardCard type="fractal" entity={app.selected_fractal} role_label="Fractal" on_select={() => app.open_drawer("fractal")} on_view_profile={() => app.toggle_profile(true, app.selected_fractal)} />
        {/snippet}

        <!-- RIGHT: User -->
        {#snippet right()}
            <StoryboardCard type="user" entity={app.selected_user} role_label="Your Persona" on_select={() => app.open_drawer("user")} on_view_profile={() => app.toggle_profile(true, app.selected_user)} />
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

<style>
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
        align-items: center;
        align-content: center;
    }

    .skeleton-boot :global(.skeleton:nth-child(1)) {
        grid-column: 2 / span 2;
        justify-self: center;
    }

    .skeleton-boot :global(.skeleton:nth-child(2)) {
        grid-column: 4 / span 6;
        justify-self: center;
    }

    .skeleton-boot :global(.skeleton:nth-child(3)) {
        grid-column: 10 / span 2;
        justify-self: center;
    }

    /* Mobile Stack */
    @media (max-width: 768px) {
        .skeleton-boot {
            grid-template-columns: 1fr;
            padding-bottom: 0;
            align-items: center;
        }

        .skeleton-boot :global(.skeleton:nth-child(1)),
        .skeleton-boot :global(.skeleton:nth-child(3)) {
            display: none;
        }

        .skeleton-boot :global(.skeleton:nth-child(2)) {
            grid-column: 1 / -1;
        }
    }

    .controls-layer {
        margin-top: auto;
        pointer-events: auto;
        display: flex;
        justify-content: center;
    }
</style>
