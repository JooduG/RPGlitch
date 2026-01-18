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
  {app.storyTitle}
</h1>

<style lang="scss">
  h1 {
    font-size: clamp(1.2rem, 4vw, 2.2rem);
    margin: 0;
    cursor: text;
    transition: color 0.2s ease;
    border-radius: 8px;
    padding: 0.25rem 0.75rem;
    text-wrap: balance;
    max-width: 80vw;
    margin-inline: auto;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 0 2px var(--primary-color);
    }

    /* Prevent multi-line issues if possible */
    display: inline-block;
    min-width: 200px;
    text-align: center;
  }
</style>
