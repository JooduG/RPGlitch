# Scripting API (oc Object)

## Section 6: Programming with the `oc` Object

**⚠️ ARCHITECTURAL NOTE:** This section details the standard Perchance API (oc). This is the default for most chat characters. However, RPGlitch utilizes Pattern C (The Simulation Engine) and bypasses the oc object entirely in favor of a custom state machine. If you are working on RPGlitch core logic, ignore this section and reference [src/gamemaster/chrono.svelte.js](../../../../src/gamemaster/chrono.svelte.js).

The `oc` (Online-Character or Online-Chat) object is the central hub for scripting in the standard AI Character Chat environment.

**Note:** For advanced applications using the "Simulation Engine" pattern (Section 7, Pattern C), reliance on the `oc` object is often minimized or bypassed in favor of direct state management. However, understanding it is crucial for modifying existing chat behaviors.

### Manipulating Messages and History

The entire chat history is accessible as a mutable array at `oc.thread.messages`.

| Property       | Type    | Description                                    |
| :------------- | :------ | :--------------------------------------------- |
| `author`       | String  | "user", "ai", or "system"                      |
| `content`      | String  | The message text                               |
| `hiddenFrom`   | Array   | Controls visibility. `["user"]` hides from UI. |
| `expectsReply` | Boolean | If true, triggers AI generation immediately.   |

#### The Message Rendering Pipeline

For advanced UI manipulation (e.g., converting text commands into clickable buttons), the `oc.messageRenderingPipeline` allows middleware-style processing of messages before display.

### Calling AI APIs

The `oc` object provides direct access to underlying AI models:

**`oc.getInstructCompletion({instruction, ...})`**
Makes a direct call to the text generation LLM.

**`oc.textToImage({prompt, ...})`**
Programmatically calls the text-to-image model.
