# RPGlitch Story Implementation Analysis

Date: 2025-11-16 (Updated)
Codebase: apps/rpglitch/

## Terminology Reference

**RPGlitch uses the following terminology:**
- **Story** = A conversation session (replaces "thread" or "chat")
- **Narrator** = AI assistant role (replaces "assistant")
- **Director** = User/player role (replaces "user" in UI context)
- **Message** = Individual story turn from either narrator or director

## Executive Summary

The RPGlitch application has a well-defined database schema for stories and messages. Most persistence functionality is now working, but story loading on startup is still missing.

## Database Schema (db.js)

Three tables define story functionality:

### stories table
- Primary Key: ++id (auto-increment)
- Fields: id, characterId, title, settingsSnapshot, createdAt, updatedAt
- Stores: One record per story session

### messages table
- Primary Key: ++id (auto-increment)
- Fields: id, storyId, role ("user"|"narrator"), text, seed, meta, createdAt
- Stores: Individual messages within stories

### Strengths
✅ Proper foreign key relationships
✅ Timestamps for ordering
✅ Settings snapshot for context preservation
✅ Simple, normalized structure

## Story Usage Throughout Application

### 1. Story Creation (index.js:247-268) - ✅ WORKING
Creates story in database and updates App.state.
Called when user clicks "Begin Story" button.

**Current implementation:**
```javascript
createFromSelection: async ({ storyTitle, characterId, worldId }) => {
  const storyId = await db.stories.add({
    characterId,
    title,
    settingsSnapshot: { ...App.state.settings },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  App.applyPatch({ story: { activeId: storyId }, ui: { title } });
  return storyId;
}
```

### 2. Active Story Management (index.js:200-206) - ✅ FIXED
Now properly throws error instead of creating dummy data.

**Current implementation:**
```javascript
requireActive: () => {
  if (!App.state.story.activeId) {
    error("No active story found. Please create a new story first.");
    throw new Error("No active story. Please create a new story.");
  }
  return App.state.story.activeId;
}
```

**Status:** No longer creates dummy data ✅

### 3. Message Handling

#### Director (User) Messages - ✅ PERSISTED
Saved to db.messages via db.messages.add() in App.story.send()

**Current implementation (index.js:332-337):**
```javascript
await db.messages.add({
  storyId,
  role: "user",
  text: userText,
  createdAt: Date.now(),
});
```

#### Narrator (Assistant) Messages - ✅ NOW PERSISTED
Saved after AI streaming completes.

**Current implementation (index.js:453-479):**
```javascript
_finalizeAssistantMessage: async (storyId) => {
  const messages = App.state.messages.byStoryId[storyId] || [];
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "narrator") {
    error("No narrator message to finalize");
    return;
  }

  // Save the completed narrator message to database
  await db.messages.add({
    storyId,
    role: "narrator",
    text: lastMessage.text,
    createdAt: lastMessage.createdAt || Date.now(),
  });

  // Update story's updatedAt timestamp
  await db.stories.update(storyId, { updatedAt: Date.now() });
}
```

#### Message Loading - ✅ IMPLEMENTED
Function exists to load messages from database.

**Current implementation (index.js:270-293):**
```javascript
loadMessages: async (storyId) => {
  const messages = await db.messages
    .where("storyId")
    .equals(storyId)
    .sortBy("createdAt");

  App.applyPatch({
    messages: {
      byStoryId: {
        [storyId]: messages,
      },
    },
  });

  log(`Loaded ${messages.length} messages for story ${storyId}`);
  return messages;
}
```

**Note:** Function exists but only called after user sends message, not on app startup.

### 4. Story Rendering - ✅ FUNCTIONAL
Renders messages from App.state to DOM.

**Current implementation (index.js:295-321):**
```javascript
render: async (storyId) => {
  const storyFeed = document.querySelector("#story-feed");
  const noMessagesEl = document.querySelector("#no-messages");

  const messages = App.state.messages.byStoryId[storyId] || [];

  messages.forEach((msg) => {
    const messageEl = document.createElement("div");
    messageEl.classList.add("story-message", `${msg.role}-message`);
    messageEl.textContent = msg.text;
    storyFeed.appendChild(messageEl);
  });
}
```

**⚠️ Styling Bug:** CSS expects `role="director"` and `role="narrator"` attributes, but code only adds class names `user-message` and `narrator-message`.

## Critical Gaps

### Gap 1: No Story Loading on Startup - ❌ CRITICAL
**Status:** `App.story.loadActive()` exists (index.js:208-245) but is **NEVER CALLED** in `initializeWhenReady()`

**Impact:**
- Stories created/saved to DB ✅
- But never loaded when app initializes ❌
- User refreshes page → story context lost ❌
- Must create new story every time ❌

**Solution:** Add `await App.story.loadActive()` call in `initializeWhenReady()` after database initialization.

### Gap 2: Message Role Attribute Bug - ⚠️ STYLING
**CSS expects:**
```scss
.story-message[role="director"] { /* user messages */ }
.story-message[role="narrator"] { /* AI messages */ }
```

**JS creates:**
```javascript
messageEl.classList.add("story-message", `${msg.role}-message`);
// Results in class="story-message user-message" (no role attribute!)
```

**Impact:** Story message speech bubble styling may not work correctly.

**Solution:** Add `messageEl.setAttribute("role", msg.role === "user" ? "director" : "narrator");`

### Gap 3: No Story List/History UI - ⚠️ MEDIUM
- No way to view list of previous stories
- No way to switch between story sessions
- No story metadata display
- Can only create new stories, not access old ones

### Gap 4: Settings Snapshot Unused - ⚠️ LOW
- Saved at story creation time
- But never used in prompt building
- Current implementation uses global App.state.settings for all stories

## UI Components

### Story Screen (index.html:434-469)
- #stage-container: Main story view
- #story-feed: Message log (role=log, aria-live=polite)
- #story-form: Input with message field and send button
- #user-character-display: Director's character visual (left)
- #narrator-character-display: Narrator's character visual (right)
- #no-messages, #story-concluded: Status elements

### Story Form Listener (index.js:1794-1823)
- Validates input
- Manages button state
- Calls App.story.send() on submit
- Clears input after sending
- ✅ Implementation is solid

## Implementation Recommendations

### Critical (Must Fix)

1. **✅ DONE: Persist Narrator Messages**
   - `App.story._finalizeAssistantMessage()` now saves to db.messages
   - Updates story's updatedAt timestamp
   - Implementation complete (index.js:453-479)

2. **✅ DONE: Load Messages from Database**
   - `App.story.loadMessages(storyId)` implemented
   - Queries db.messages where storyId = X
   - Populates App.state.messages.byStoryId
   - Implementation complete (index.js:270-293)

3. **✅ DONE: Fix requireActive()**
   - Throws error if no active story (instead of creating dummy)
   - No longer creates fake data
   - Implementation complete (index.js:200-206)

4. **❌ TODO: Load Stories on App Startup**
   - `App.story.loadActive()` exists but NOT CALLED (index.js:208-245)
   - Add call in `initializeWhenReady()` after db.open()
   - Should load most recent story from db.stories
   - Should load messages for active story
   - **This is the main missing piece!**

5. **⚠️ TODO: Fix Message Role Attributes**
   - Add `role` attribute to message elements in render()
   - Map "user" → "director" for CSS compatibility
   - Fix in `App.story.render()` (index.js:312-317)

### Medium Priority

6. **Story List/Session History View**
   - Show list of available story sessions
   - Display last message preview
   - Show creation date
   - Allow quick switching between stories

7. **Use Settings Snapshot**
   - Use story.settingsSnapshot in prompt building (index.js:104-124)
   - Display snapshot info in story header
   - Show "using original settings" indicator

### Low Priority

8. Story metadata display (title, date, character, message count)
9. Export/import story sessions
10. Story continuation suggestions
11. Message editing/deletion in UI

## Code Quality Observations

Strengths:
✅ Clear separation of concerns
✅ Proper async/await usage
✅ DOMPurify sanitization
✅ Accessibility attributes (aria-live, role)
✅ FSM state management
✅ Comprehensive error handling

Improvements Needed:
⚠️ Tight state-to-database coupling
⚠️ Limited transaction safety
⚠️ Minimal validation of data integrity
⚠️ No cleanup of old messages

## Files to Modify

| File | Method | Status | Priority |
|------|--------|--------|----------|
| index.js | App.story._finalizeAssistantMessage() | ✅ DONE | - |
| index.js | App.story.loadMessages() | ✅ DONE | - |
| index.js | App.story.requireActive() | ✅ DONE | - |
| index.js | App.story.loadActive() | ✅ EXISTS | - |
| index.js | initializeWhenReady() | ❌ TODO | **Critical** |
| index.js | App.story.render() | ⚠️ TODO | Medium |
| index.html | Story UI enhancements | - | Low |

## Summary of Current State

### Working ✅
✅ Story creation and storage
✅ Director (user) message persistence
✅ **Narrator (assistant) message persistence** - NOW WORKING!
✅ **Message loading from database** - Function implemented
✅ Story form and rendering
✅ AI plugin integration and streaming
✅ FSM state management
✅ Database initialization
✅ **Story validation** - No more dummy data

### Broken/Missing ❌
❌ **Story loading on startup** - Function exists but not called
⚠️ Message role attributes for CSS styling
❌ Story switching/history UI
❌ Settings snapshot usage

### Result
Stories **partially persist** - saved to database correctly, but not reloaded on page refresh. User must create new story each session.

## Conclusion

**Major Progress:** The database schema is sound, and most persistence is now working:
- ✅ Stories save to database
- ✅ Director messages save to database
- ✅ Narrator messages save to database
- ✅ Message loading function exists

**One Critical Gap Remains:**
`App.story.loadActive()` exists (lines 208-245) but is **never called** in `initializeWhenReady()`.

**To complete story persistence:**
1. ✅ ~~Save narrator messages~~ - DONE
2. ✅ ~~Load messages from database~~ - DONE
3. ✅ ~~Fix requireActive() validation~~ - DONE
4. ❌ **Call `App.story.loadActive()` in `initializeWhenReady()`** - TODO
5. ⚠️ Fix message role attributes for CSS styling - TODO

Once step 4 is complete, RPGlitch will have full persistent story support with messages surviving page refreshes.

