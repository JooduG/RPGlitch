<script>
    import { app } from "@state/app.svelte.js"
    import DevWing from "@ui/organisms/profile/DevWing.svelte"
    import VisualWing from "@ui/organisms/profile/VisualWing.svelte"
    import VoiceWing from "@ui/organisms/profile/VoiceWing.svelte"

    let {
        char = $bindable(),
        isEditing,
        busyField = $bindable(),
        activeField = $bindable(),
    } = $props()

    $effect(() => {})
</script>

<aside class="wing-left" class:is-visible={isEditing} data-testid="visual-wing">
    <VisualWing bind:char {isEditing} bind:busyField bind:activeField />
    <VoiceWing bind:char {isEditing} />
</aside>

{#if app.settings.devMode}
    <aside
        class="wing-right"
        class:is-visible={isEditing || app.settings.devMode}
        data-testid="dev-wing"
    >
        <DevWing bind:char {isEditing} />
    </aside>
{/if}

<style lang="scss">
    .wing-left,
    .wing-right {
        width: 0;
        min-width: 0;
        max-width: 0;
        opacity: 0;
        /* FIX: overflow visible and preserve-3d to fix clipping */
        overflow: visible;
        pointer-events: none;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: scale(0.9);
        filter: blur(10px);
        height: auto;
        max-height: 48rem;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        background: transparent;
        border: none;
        border-radius: var(--spacing-l);
        transform-style: preserve-3d;
        z-index: 100;

        &.is-visible {
            width: 16rem;
            min-width: 16rem;
            max-width: 20rem;
            opacity: 1;
            pointer-events: auto;
            filter: blur(0);
        }
    }

    .wing-left {
        order: 1;

        &.is-visible {
            transform: scale(1) translateX(-0.5rem);
        }
    }

    .wing-right {
        order: 3;

        &.is-visible {
            transform: scale(1) translateX(0.5rem);
        }
    }
</style>
