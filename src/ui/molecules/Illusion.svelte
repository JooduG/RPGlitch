<script>
    let {
        variant = "card", // 'card' | 'text' | 'hero' | 'profilePicture'
        width = "100%",
        height = "auto",
        aspectRatio = "auto",
        class: className = "",
    } = $props()
</script>

<div
    class="skeleton {variant} {className}"
    style:width
    style:height
    style:aspect-ratio={aspectRatio}
>
    <div class="shimmer"></div>
</div>

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/mixins" as *;
    @use "@theme/abstracts/placeholders" as *;

    .illusion {
        background: var(--chalk, #222326); /* Chalk Regime */
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        min-height: 1rem;

        &.card {
            border-radius: 24px;
        }

        &.profilePicture {
            border-radius: 50%;
        }

        &.text {
            height: 1em;
            margin-bottom: 0.5em;
            border-radius: 4px;
        }

        /* The Shimmer Effect - Nordic Fog */
        &::after {
            content: "";
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(
                90deg,
                transparent 0,
                rgba(255, 255, 255, 0.08) 20%,
                /* Opacity 8% */ rgba(255, 255, 255, 0.12) 60%,
                transparent
            );
            filter: blur(60px); /* Diffusion 60px */
            animation: illusion-shimmer 2.5s infinite; /* Slowed down slightly for fog effect? User said "Not a laser show" */
        }
    }

    @keyframes illusion-shimmer {
        100% {
            transform: translateX(100%);
        }
    }
</style>
