<script>
  import { app } from "../../gamemaster/state.svelte.js";

  /**
   * Handles manual input to lock the title
   */
  function handleInput(e) {
    app.setTitle(e.currentTarget.textContent);
  }

  /**
   * Handles double-click to re-roll prefixes
   */
  function handleDblClick() {
    app.rerollTitle();
  }
</script>

<h1
  contenteditable="true"
  title="Double-click to re-roll title"
  oninput={handleInput}
  ondblclick={handleDblClick}
>
  <span class="title-content">
    {#if app.isCustomTitle}
      {app.storyTitle}
    {:else}
      {#each app.storyTitleParts as part (part.text)}
        {#if part.color}
          <span class="entity-name" style="color: {part.color}"
            >{part.text}</span
          >
        {:else}
          {part.text}
        {/if}
      {/each}
    {/if}
  </span>
</h1>

<style lang="scss">
  /* Import Satisfy font for the special story title */
  @import url("https://fonts.googleapis.com/css2?family=Satisfy&display=swap");

  h1 {
    font-size: clamp(1.8rem, 5vw, 3rem); /* Size bump for more impact */
    line-height: 1.2;
    min-height: calc(1.2em * 2); /* Reserve space for exactly 2 lines */
    margin: 0;
    font-family: "Satisfy", cursive;
    letter-spacing: 0.02em; /* Subtle elegance */
    cursor: text;
    transition:
      color 0.2s ease,
      text-shadow 0.3s ease;
    border-radius: 8px;
    padding: 0.25rem 0.75rem;
    text-wrap: balance;
    max-width: 80vw;
    margin-inline: auto;

    /* Soft ethereal glow */
    text-shadow:
      0 2px 10px rgba(255, 255, 255, 0.15),
      0 0 30px rgba(255, 255, 255, 0.08);

    display: grid;
    place-content: center;
    min-width: 300px;
    text-align: center;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &:focus-within {
      outline: none;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 0 2px var(--primary-color);
    }

    .title-content {
      display: inline; /* Natural text flow */
      text-wrap: balance; /* Nicer wrapping as requested */
    }

    .entity-name {
      /* Inherit font styles but use custom color */
      font-weight: inherit;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      white-space: nowrap; /* Never break in the middle of a name */
      /* Margins not needed with natural text flow */
    }
  }
</style>
