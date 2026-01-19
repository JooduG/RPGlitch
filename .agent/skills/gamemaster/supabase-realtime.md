---
trigger: glob
description: Standards for Supabase Realtime, Multiplayer, and Event Broadcasts in RPGlitch
globs: src/gamemaster/**/*.js, src/gamemaster/**/*.svelte.js, src/warden/bridge.js,
---

# Supabase Realtime & Multiplayer (Gamemaster Domain)

You are an expert in Supabase Realtime, optimized for Svelte 5 Runes. This guide governs how `Gamemaster` handles multiplayer states.

## Core Directives

### 1. Communication Channels

- **Primary Mechanism:** Use `broadcast` for 90% of game events (dice rolls, chat, moves).
- **State Sync:** Use `presence` _only_ for "Who is online?" and user cursors.
- **Database Changes:** NEVER use `postgres_changes` for high-frequency game state. It is too slow.
- **Channel Naming:** Follow `scope:entity:id` pattern.
  - ✅ `session:campaign_123:main`
  - ✅ `user:player_456:notifications`
  - ❌ `game_room` (too generic)

### 2. Svelte 5 Integration Pattern

Do not use React `useEffect`. Use `$effect` and `onMount` with explicit teardowns.

```javascript
// Example: src/gamemaster/session.svelte.js
import { onMount, onDestroy } from "svelte";

let channel = $state(null);

export function connectToSession(sessionId) {
  // 1. Check existing connection
  if (channel?.state === "joined") return;

  // 2. Define Channel
  channel = supabase.channel(`session:${sessionId}`, {
    config: {
      broadcast: { self: false, ack: true }, // 'ack' ensures delivery
      presence: { key: userId },
      private: true, // Always use RLS
    },
  });

  // 3. Subscribe with Handlers
  channel
    .on("broadcast", { event: "dice_roll" }, handleDice)
    .on("presence", { event: "sync" }, handlePresence)
    .subscribe((status) => {
      if (status === "SUBSCRIBED") console.log("Connected to Void");
    });

  // 4. Cleanup Function
  return () => supabase.removeChannel(channel);
}
```

## Protocol Decision Matrix

| Game Event              | Function     | Rationale                                            |
| ----------------------- | ------------ | ---------------------------------------------------- |
| **Player moves token**  | `broadcast`  | High frequency, ephemeral, low latency needed.       |
| **Dice Roll Result**    | `broadcast`  | Immediate feedback needed. Persist to DB async.      |
| **Chat Message**        | `broadcast`  | Send via socket for speed; save to DB in background. |
| **Player joins/leaves** | `presence`   | Built-in diffing of user state is efficient.         |
| **Lorebook Update**     | `db trigger` | Low frequency, data integrity is priority.           |

## Security & Performance

- **Private Channels:** Always set `private: true`.
- **Authorization:** Must have RLS policies on `realtime.messages` for `SELECT` and `INSERT`.
- **Cleanup:** All subscriptions MUST have a matching `removeChannel` call in `onDestroy` or the component teardown.
