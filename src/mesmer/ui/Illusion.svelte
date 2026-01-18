<script>
  let {
    variant = "card", // 'card' | 'text' | 'hero' | 'profilePicture'
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
>
  <div class="shimmer"></div>
</div>

<style lang="scss">
  @use "../scss/abstracts/variables" as *;
  @use "../scss/abstracts/mixins" as *;
  @use "../scss/abstracts/placeholders" as *;

  .illusion {
    background: rgba($white, 0.05); /* Base 'bone' color */
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

    /* The Shimmer Effect */
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        90deg,
        transparent 0,
        $illusion-shimmer-color 20%,
        $illusion-shimmer-highlight 60%,
        transparent
      );
      animation: illusion-shimmer 5s infinite;
    }
  }

  @keyframes illusion-shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
