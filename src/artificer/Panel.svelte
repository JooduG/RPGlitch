<script>
  let { title, children } = $props();
</script>

<div class="panel">
  {#if title}
    <div class="panel-header">
      <span class="title-text">{title}</span>
      <div class="deco"></div>
    </div>
  {/if}
  <div class="panel-body">
    {@render children()}
  </div>
</div>

<style lang="scss">
  .panel {
    background: #09090b; /* Zinc 950 essentially */
    border: 1px solid #27272a;
    border-radius: 8px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.05),
      0 10px 15px -3px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;

    .panel-header {
      background: rgba(255, 255, 255, 0.02);
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #27272a;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title-text {
        font-size: 0.875rem; /* 14px */
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
        color: #a1a1aa; /* Zinc 400 */
        font-family: var(--font-body);
      }

      .deco {
        width: 8px;
        height: 8px;
        background: #ef4444;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      }
    }

    .panel-body {
      padding: 1rem;
      flex: 1;
      overflow-y: auto;
      color: #d4d4d8; /* Zinc 300 */
      font-size: 0.95rem;
    }
  }
</style>
