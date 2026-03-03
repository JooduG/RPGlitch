<script>
    let {
        variant = "card", // 'card' | 'text' | 'hero' | 'profilePicture'
        width = "100%",
        height = "auto",
        aspectRatio = "auto",
        class: className = "",
    } = $props()
</script>

<div class="skeleton {variant} {className}" style:width style:height style:aspect-ratio={aspectRatio}>
    <div class="shimmer"></div>
</div>

<style lang="scss">
    @use "@theme/abstracts/variables" as *;
    @use "@theme/abstracts/mixins" as *;
    @use "@theme/abstracts/placeholders" as *;

    .skeleton {
        background: var(--bg-component);
        border-radius: var(--border-radius-m);
        overflow: hidden;
        position: relative;
        min-height: var(--spacing-m);

        &.card {
            border-radius: var(--border-radius-xl);
        }

        &.profilePicture {
            border-radius: var(--border-radius-full);
        }

        &.text {
            height: 1em;
            margin-bottom: var(--spacing-xs);
            border-radius: var(--border-radius-s);
        }

        /* The Shimmer Effect - Nordic Fog */
        &::after {
            content: "";
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(90deg, transparent 0, rgba(var(--pure-white-rgb), var(--opacity-xs)) 20%, rgba(var(--pure-white-rgb), var(--opacity-s)) 60%, transparent);
            filter: blur(var(--blur-xl));
            animation: skeleton-shimmer 2.5s infinite;
        }
    }

    @keyframes skeleton-shimmer {
        100% {
            transform: translateX(100%);
        }
    }
</style>
