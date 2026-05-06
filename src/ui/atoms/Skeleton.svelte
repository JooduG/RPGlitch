<script>
  let {
    variant = "card", // 'card' | 'text' | 'hero' | 'profile-picture'
    width = "100%",
    height = "auto",
    aspectRatio = "auto",
    class: className = "",
  } = $props();
</script>

<div
  class="skeleton {variant} {className}"
  style:width
  style:height
  style:aspect-ratio={aspectRatio}
></div>

<style>
  .skeleton {
    background: var(--bg-component);
    border-radius: var(--border-radius-m);
    overflow: hidden;
    position: relative;
    min-height: var(--spacing-m);
  }

  .skeleton.card {
    border-radius: var(--border-radius-xl);
  }

  .skeleton.profile-picture {
    border-radius: var(--border-radius-full);
  }

  .skeleton.text {
    height: 1em;
    margin-bottom: var(--spacing-xs);
    border-radius: var(--border-radius-s);
  }

  /* The Shimmer Effect - Nordic Fog */
  .skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      transparent 0,
      rgb(var(--color-white-rgb) / var(--opacity-xs)) 20%,
      rgb(var(--color-white-rgb) / var(--opacity-s)) 60%,
      transparent
    );
    filter: blur(var(--blur-xl));
    animation: skeleton-shimmer 2.5s infinite;
  }

  @keyframes skeleton-shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
