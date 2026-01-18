<script>
  /*
    Mesmer Typography Module
    Injects global font assets and styles.
  */
</script>

<svelte:head>
  <!-- Roboto: Headings (400 Regular, 700 Bold, 900 Black) -->
  <!-- Inter: Body (400 Regular, 600 SemiBold) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Roboto:wght@400;700;900&display=swap"
    rel="stylesheet"
  />
  <!-- 
    === ALTS (Uncomment to use) === 
    Outfit:  family=Outfit:wght@400;800 (Previous)
    Kanit:   family=Kanit:wght@400;800 (Previous)
    Sci-Fi:  family=Space+Grotesk:wght@400;700 
    Fantasy: family=Cinzel:wght@500;900
    Elegant: family=Cormorant+Garamond:wght@400;700
    Bold:    family=Syne:wght@500;800
  -->
</svelte:head>

<style lang="scss">
  /* Global Typography Rules */
  :global(:root) {
    --font-heading: "Roboto", sans-serif;
    --font-body: "Inter", sans-serif;
  }

  :global(body),
  :global(html) {
    font-family: var(--font-body);
    font-weight: 400;
  }

  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6),
  :global(.avatar-placeholder) {
    font-family: var(--font-heading);
    font-weight: 900; /* Roboto 900 for that thick look */
    letter-spacing: -0.01em;
    color: inherit;
    text-wrap: balance;
  }

  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6) {
    margin-block: 0.5rem;
  }

  :global(p),
  :global(input),
  :global(button),
  :global(textarea),
  :global(span),
  :global(div) {
    font-family: var(--font-body);
  }

  :global(p) {
    line-height: 1.6;
    margin-bottom: 1rem;
    text-wrap: pretty;
  }
</style>
