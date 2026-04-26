# Objective

Refactor the prompt builder and LLM service to make the AI more conversational and present, rather than acting like a backend simulation engine. We will reduce context bloat, remove duplicate chat histories, and update the task instructions to focus on character immersion, while retaining the SINO_LOGIC protocol.

## Key Files & Context

- `src/core/intelligence/prompt-builder.js`: Contains the XML prompt structures and protocol library.
- `src/core/intelligence/llm-service.js`: Handles appending conversation history and sending the prompt to the AI.

## Implementation Steps

1. **Remove Double-History in `prompt-builder.js`:**
   - Remove the `<SIMULATION_LOG>` block from the `simulation` prompt.
   - Remove the `render_history` function call from the `simulation` payload (if no longer used elsewhere, we can consider removing the function, but for now we just remove it from the template).
   - Rely solely on `llm-service.js` to append the plaintext conversation history, which LLMs natively understand better.

2. **Prune Context Bloat in `prompt-builder.js`:**
   - In the `simulation` prompt, remove the `FUTURE` and `PAST` injections for the `USER_PERSONA` and `FRACTAL`.
   - The AI only needs its own full identity, and the `PRESENT` state of the User and Fractal to react conversationally. This prevents the AI from magically knowing the User's hidden goals.

3. **Refactor `TASK_INSTRUCTION`:**
   - Rewrite the `<TASK_INSTRUCTION>` in the `simulation` prompt.
   - Shift the framing from "Proceed with the simulation" to "You are {aiName}. Respond to {userName} in character."
   - Explicitly instruct the AI to use quotation marks for `"dialogue"` and asterisks for `*actions*`.

4. **Update `PROTOCOL_LIBRARY` & Mechanics:**
   - Keep `SINO_LOGIC` as requested.
   - Simplify fallback for `<INPUT_COMMAND>` (e.g., if empty, instruct the AI to push the conversation forward rather than "follow simulation physics").
   - Ensure protocols focus on conversational `MOMENTUM` and `IMMERSION`.

5. **Verify `llm-service.js` History Appending:**
   - Ensure `chat_history` formatting in `_format_history` cleanly presents `User: ...` and `Character: ...` to seamlessly follow the system prompt.

## Verification & Testing

- Run a chat simulation and verify the AI responds conversationally in the first person.
- Check the console logs/payloads to ensure `<SIMULATION_LOG>` is gone and `chat_history` is appended as plain text at the end of the system prompt.
- Confirm the `SINO_LOGIC` `<think>` block is still generated in Chinese before the English response.
- Ensure the prompt token size is reduced due to pruned User/Fractal RAG context.
