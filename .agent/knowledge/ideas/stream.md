# 🌊 Feature Plan: True Streaming (The Typewriter Engine)

**Objective:** Replace the "All-at-once" text generation with real-time token streaming from the Perchance AI plugin.

## 1. The Brain: `src/js/gamemaster/llm.js`

Modify `LlmService.generate` to hook into the underlying `onChunk` callback.

```javascript
// Inside LlmService.generate options construction:
if (options.onToken) {
  // Map our internal 'onToken' param to Perchance's 'onChunk'
  genOptions.onChunk = (data) => {
    // data.textChunk contains just the new characters
    options.onToken(data.textChunk || "");
  };
}
```

## 2. The State: `src/artificer/stores/app.svelte.js`

Add a dedicated streaming buffer to the global store.

```javascript
streaming: {
    active: false,
    content: "",
    role: "model",
    characterName: "AI"
},

startStream(role, characterName) {
    this.streaming.active = true;
    this.streaming.content = "";
    this.streaming.role = role;
    this.streaming.characterName = characterName;
},

updateStream(chunk) {
    this.streaming.content += chunk;
},

endStream() {
    this.streaming.active = false;
    this.streaming.content = "";
}
```

## 3. The UI: `src/artificer/chat/ChatLog.svelte`

Add a "Phantom Message" that only appears while streaming is active.

```svelte
{#if app.streaming.active}
    <div class="streaming-wrapper">
        <Message
            text={app.streaming.content + "█"}
            sender={app.streaming.role}
            characterName={app.streaming.characterName}
            timestamp={Date.now()}
        />
    </div>
{/if}
```

## 4. The Trigger: `src/js/gamemaster/director.js`

Update the `execute` loop to manage the stream lifecycle.

```javascript
// Inside Director.execute:
if (app.settings.streamText) {
  app.startStream(role, characterName);
}

// Pass the callback
const response = await LlmService.generate(payload, {
  onToken: (chunk) => app.updateStream(chunk),
  // ...other options
});

if (app.settings.streamText) {
  app.endStream();
}
```
