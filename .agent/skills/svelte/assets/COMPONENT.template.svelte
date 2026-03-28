<script lang="ts">
    /**
     * ⚡ Svelte 5 Component Standard
     * Separation of Concerns: Logic / Structure / Style
     */

    interface Props {
        title: string
        onUpdate?: (val: number) => void
        children?: import("svelte").Snippet
    }

    // 1. Props (Runes)
    let { title, onUpdate, children }: Props = $props()

    // 2. State (Runes)
    let count = $state(0)
    let isHovered = $state(false)

    // 3. Derived (Runes)
    let double = $derived(count * 2)

    // 4. Logic
    function increment() {
        count += 1
        onUpdate?.(count)
    }
</script>

<article
    class="c-card"
    role="group"
    onmouseenter={() => (isHovered = true)}
    onmouseleave={() => (isHovered = false)}
>
    <header class="c-card__header">
        <h2 class="c-card__title">{title}</h2>
    </header>

    <div class="c-card__body">
        <p>Value: {count} (Double: {double})</p>

        {#if children}
            <div class="c-card__content">
                {@render children()}
            </div>
        {/if}
    </div>

    <footer class="c-card__footer">
        <button class="c-btn" onclick={increment}> Increment </button>
    </footer>
</article>

<style>
    /* Church & State: Styles belong here, scoped. */

    .c-card {
        background: var(--surface-1);
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .c-card__title {
        font-size: 1.25rem;
        font-weight: 600;
    }

    .c-card__footer {
        display: flex;
        justify-content: flex-end;
    }

    .c-btn {
        background: var(--primary);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
    }

    .c-btn:hover {
        opacity: 0.9;
    }
</style>
