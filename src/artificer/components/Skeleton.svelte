<script>
  let {
    variant = "card", // 'card' | 'text' | 'hero' | 'avatar'
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
  @use "../../scss/abstracts" as *;
  /* 
     The base .skeleton class is defined in src/scss/components/_skeletons.scss 
     We import abstracts here just in case we need variables, but the actual 
     animation logic is global or imported via the main stylesheet.
     
     See: src/scss/components/_skeletons.scss
  */

  .skeleton {
    background: rgba(255, 255, 255, 0.05); /* Base 'bone' color */
    border-radius: 8px;
    overflow: hidden;
    position: relative;

    &.card {
      border-radius: 24px;
    }

    &.avatar {
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
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.05) 20%,
        rgba(255, 255, 255, 0.1) 60%,
        rgba(255, 255, 255, 0)
      );
      animation: shimmer 2s infinite;
    }
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
</style>
