<script>
  import Layout from "../Layout.svelte";
  import StoryboardCard from "../storyboard/StoryboardCard.svelte";
  import Skeleton from "../Skeleton.svelte";
  import { app } from "../state.svelte.js";
  import { session } from "../../gamemaster/session.svelte.js";

  // --- STATE ---
  let inputVal = $state("");
  let scrollRef = $state(null);

  // Derived
  let feed = $derived(app.simulation.feed || []);
  let isThinking = $derived(app.simulation.loading);

  // --- ACTIONS ---
  async function submitTurn() {
    if (!inputVal.trim() || isThinking) return;
    const text = inputVal;
    inputVal = ""; // Optimistic clear
    await session.send(text);
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitTurn();
    }
  }

  // Auto-scroll logic
  $effect(() => {
    if (feed.length && scrollRef) {
      scrollRef.scrollTop = scrollRef.scrollHeight;
    }
  });
</script>

<div class="storymode-container">
  <Layout>
    {#snippet header()}
      <div class="header-container">
        <h1>{app.story?.storyTitle || "Simulation in Progress"}</h1>
      </div>
    {/snippet}

    <!-- LEFT: AI Companion -->
    {#snippet left()}
      <StoryboardCard
        type="ai"
        entity={app.selectedAi}
        roleLabel="AI Companion"
        onViewProfile={() => app.toggleProfile(true, app.selectedAi)}
      />
    {/snippet}

    <!-- CENTER: Feed & Input -->
    {#snippet center()}
      <div class="game-stage">
        <!-- Narrative Feed -->
        <div class="feed-scroll" bind:this={scrollRef}>
          {#each feed as msg}
            <div class="msg-bubble {msg.role}">
              <span class="sender">{msg.characterName}</span>
              <p>{@html msg.text}</p>
            </div>
          {/each}

          {#if isThinking}
            <div class="msg-bubble ai thinking">
              <Skeleton variant="text" width="60%" />
            </div>
          {/if}
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <input
            type="text"
            bind:value={inputVal}
            onkeydown={onKey}
            placeholder="What do you do?"
            disabled={isThinking}
            autocomplete="off"
          />
        </div>
      </div>
    {/snippet}

    <!-- RIGHT: User Persona -->
    {#snippet right()}
      <StoryboardCard
        type="user"
        entity={app.selectedUser}
        roleLabel="User Persona"
        onViewProfile={() => app.toggleProfile(true, app.selectedUser)}
      />
    {/snippet}
  </Layout>
</div>

<style lang="scss">
  .storymode-container {
    width: 100%;
    height: 100%;
  }

  .header-container {
    text-align: center;
    h1 {
      font-size: 1.5rem;
      color: #fff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
  }

  .game-stage {
    width: 100%;
    height: 100%; // Fill Layout center slot
    display: flex;
    flex-direction: column;
    position: relative;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .feed-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    /* Hide Scrollbar */
    &::-webkit-scrollbar {
      width: 0px;
    }
    scrollbar-width: none;
  }

  .msg-bubble {
    background: rgba(0, 0, 0, 0.5);
    padding: 1rem;
    border-radius: 12px;
    max-width: 90%;
    align-self: flex-start;
    animation: fadeIn 0.3s ease-out;

    &.user {
      align-self: flex-end;
      background: rgba(var(--pico-primary-rgb), 0.2);
      text-align: right;
    }

    .sender {
      font-size: 0.7rem;
      opacity: 0.7;
      display: block;
      margin-bottom: 0.2rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    p {
      margin: 0;
      line-height: 1.5;
    }
  }

  .input-area {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);

    input {
      width: 100%;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #333;
      background: #111;
      color: #fff;
      font-size: 1rem;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: var(--pico-primary);
        box-shadow: 0 0 10px rgba(var(--pico-primary-rgb), 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
