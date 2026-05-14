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
    /* Church & State: Styles belong here, scoped. Zero raw values — Chalk Regime. */

    .c-card {
        background: var(--glass-base);
        border-radius: var(--radius-subtle);
        padding: var(--padding-standard);
        display: flex;
        flex-direction: column;
        gap: var(--gap-standard);
    }

    .c-card__title {
        font-size: var(--font-size-h5);
        font-weight: var(--font-weight-bold);
    }

    .c-card__footer {
        display: flex;
        justify-content: flex-end;
    }

    .c-btn {
        background: var(--signature-color);
        color: var(--color-black);
        padding: var(--padding-tight) var(--padding-standard);
        border-radius: var(--radius-sharp);
        transition: opacity var(--duration-fast) var(--ease-standard);
    }

    .c-btn:hover {
        opacity: var(--opacity-intense);
    }
</style>
