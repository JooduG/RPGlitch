<script>
  import { app } from "../state.svelte.js";
  import { runtime } from "../../scholar/runtime.svelte.js";

  // Auto-scroll the log feed
  let logContainer = $state(null);

  $effect(() => {
    if (app.logs.length && logContainer) {
      logContainer.scrollTop = 0; // Newest on top, or reversed? User said "scrolling text panel"
      // Usually debug logs scroll to bottom if newest is at bottom.
      // My state pushes to unshift (newest at top).
    }
  });

  const getLogColor = (type) => {
    switch (type) {
      case "system":
        return "#38bdf8"; // Sky
      case "ai":
        return "#a855f7"; // Purple
      case "db":
        return "#eab308"; // Yellow
      case "error":
        return "#ef4444"; // Red
      default:
        return "#94a3b8"; // Slate
    }
  };
</script>

<div class="debug-panel">
  <header class="debug-header">
    <div class="debug-title">TELEMETRY v1.0</div>
    <div class="debug-stats">
      <span>TURN: {app.simulation.turn}</span>
      <span>STATUS: {app.simulation.status.toUpperCase()}</span>
    </div>
  </header>

  <section class="causality-grid">
    <div class="metric">
      <span class="label">ENTROPY</span>
      <div class="val">{app.causalityReport.entropy}%</div>
      <div class="bar-bg">
        <div
          class="bar-fill"
          style:width="{app.causalityReport.entropy}%"
        ></div>
      </div>
    </div>
    <div class="metric">
      <span class="label">VELOCITY</span>
      <div class="val">{app.causalityReport.velocity}%</div>
      <div class="bar-bg">
        <div
          class="bar-fill"
          style:width="{app.causalityReport.velocity}%"
        ></div>
      </div>
    </div>
    <div class="metric full">
      <span class="label">REFLEX</span>
      <div class="val">{app.causalityReport.reflex}</div>
    </div>
  </section>

  <div class="log-feed" bind:this={logContainer}>
    {#each app.logs as entry (entry.id)}
      <div class="log-entry" style:border-left-color={getLogColor(entry.type)}>
        <span class="timestamp">[{entry.timestamp}]</span>
        <span class="type" style:color={getLogColor(entry.type)}
          >{entry.type.toUpperCase()}</span
        >
        <p class="message">{entry.message}</p>
      </div>
    {/each}
  </div>

  <footer class="debug-footer">
    ACTIVE: {runtime.isReady ? "LINKED" : "PENDING"}
  </footer>
</div>

<style lang="scss">
  .debug-panel {
    width: 100%;
    height: 100%;
    background: rgba(10, 10, 15, 0.9);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    font-family: "JetBrains Mono", monospace;
    font-size: 11px;
    color: #94a3b8;
    backdrop-filter: blur(8px);
    overflow: hidden;
  }

  .debug-header {
    padding: 10px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .debug-title {
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
      letter-spacing: 1px;
    }

    .debug-stats {
      display: flex;
      justify-content: space-between;
      color: #38bdf8;
    }
  }

  .causality-grid {
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .metric {
      display: flex;
      flex-direction: column;
      gap: 3px;

      &.full {
        grid-column: span 2;
      }
      .label {
        font-size: 9px;
        opacity: 0.6;
      }
      .val {
        color: #fff;
        font-weight: 600;
      }

      .bar-bg {
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        .bar-fill {
          height: 100%;
          background: #38bdf8;
          transition: width 0.3s ease;
        }
      }
    }
  }

  .log-feed {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    /* Custom Scrollbar */
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
    }

    .log-entry {
      border-left: 2px solid;
      padding-left: 8px;
      line-height: 1.4;

      .timestamp {
        opacity: 0.4;
        margin-right: 4px;
      }
      .type {
        font-weight: 800;
        margin-right: 4px;
      }
      .message {
        margin: 0;
        color: #cbd5e1;
        word-break: break-all;
      }
    }
  }

  .debug-footer {
    padding: 8px;
    background: rgba(0, 0, 0, 0.3);
    text-align: center;
    font-size: 9px;
    letter-spacing: 0.5px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
</style>
