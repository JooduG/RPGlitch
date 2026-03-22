<script>
    import { entities } from "@/data/repository.js"
    import { app } from "@state/app.svelte.js"
    import Layout from "@ui/organisms/Layout.svelte"
    import LibraryDrawer from "@ui/organisms/library/LibraryDrawer.svelte"
    import StoryboardCard from "@ui/organisms/storyboard/StoryboardCard.svelte"
    import StoryboardDynamicTitle from "@ui/organisms/storyboard/StoryboardDynamicTitle.svelte"
    import StoryboardPill from "@ui/organisms/storyboard/StoryboardPill.svelte"
    import { onMount } from "svelte"
    onMount(async () => {
        try {
            const [characters, fractals] = await Promise.all([entities.list("character"), entities.list("fractal")])
            app.ai_list = characters
            app.user_list = characters
            app.fractal_list = fractals
        } catch (e) {
            console.error("[Storyboard] Failed to load lobby:", e)
        }
    })
</script>

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


<style>
    .header-container {
        text-align: center;
    }

    .controls-layer {
        margin-top: auto;
        pointer-events: auto;
        display: flex;
        justify-content: center;
    }
</style>
