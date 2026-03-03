# Plan: Sino-Logic Optimization

## 1. State Hub (Data Layer)

_No changes required to the persistence layer (Dexie.js)._

## 2. Logic Layer (The Kernel)

### Phase 1: Protocol Injection [ < 1hr ]

- [ ] Update `PROTOCOL_LIBRARY.COGNITION` in `prompt_builder.js` to reinforce the mandatory `<think>` start.
- [ ] Implement `PROTOCOL_LIBRARY.SINO_LOGIC` directive.
- [ ] Implement `PROTOCOL_LIBRARY.OUTPUT_LANGUAGE` directive.
- [ ] Modify `SYSTEM_PROMPTS.simulation` to include these protocols in the dynamic assembly.

### Phase 2: Broker Verification [ < 1hr ]

- [ ] Audit `ContextBroker.assemble` in `intelligence_broker.js`.
- [ ] Ensure the "target language" (English/Swedish) is correctly resolved from either the `active_user` or `active_ai` entity state.
- [ ] Pass the target language as a parameter to the prompt template.

## 3. UI Layer (The Sensory)

_No changes to Svelte components required._

## 4. Quality Gate (QA)

### Verification Steps

- [ ] Run `npm test` to ensure no breaks in `prompt_builder.js`.
- [ ] Manual Check: Inspect the `system` prompt payload in the browser console.
- [ ] AI Validation: Verify the LLM follows the zh-CN `<think>` rule in a live turn.

## 5. Deployment

- [ ] Run `npm run deploy` to verify bundle size (< 350KB).
- [ ] Commit changes with checkpoint tag.
