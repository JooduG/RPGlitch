# 🏗️ The Ultimate AI Roleplay Prompt Architecture

To build a top-tier experience, think of your prompt not as a single block of text, but as a **dynamic stack** that reassembles itself every time the user hits "Send."

## 1. The "Global Rules" (The System Prompt)

- **The Logic:** This is the unshakeable foundation. It defines the "how" of the storytelling.
- **Must-Have Features:**
- **The Formatting Anchor:** Explicitly define that `*asterisks are for actions/internal thoughts*` and `"quotes are for speech"`.
- **The "One-Reply" Constraint:** A hard instruction to never speak for the `{{user}}`.
- **Sensory Directives:** Instructions to prioritize "Show, Don't Tell" (smell, touch, sound, and micro-expressions).

## 2. The "Persona File" (The Character Data)

- **The Logic:** Instead of one big bio, break this into searchable "traits" that the AI can weigh differently.
- **Key Fields:**
- **Core Identity:** Name, age, role, and a "One-Sentence Hook" (e.g., "A weary knight who hates his king").
- **Mental Model:** How the character processes information (e.g., "Uses sarcasm to hide fear," or "Highly logical and dismissive of emotions").
- **Speech Patterns:** Specific slang, accents, or verbal tics.

## 3. The "Lorebook" (Dynamic World-Building)

- **The Logic:** Don't feed the AI the whole world history at once. Use **Keyword Triggers**.
- **Feature to Add:**
- **The Scanner:** Your app should scan the last 5 messages for keywords (e.g., "Dragon," "Kingdom," "Magic").
- **Injected Context:** If a keyword is found, inject a 2-sentence summary of that lore item into the prompt. This keeps the "Context Window" clean and prevents the AI from getting confused by irrelevant data.

## 4. The "Injection Depth" System (The Secret Sauce)

- **The Logic:** This is where you beat the "Goldfish Memory" of standard AI.
- **Author’s Note:** Create a field for "Global Vibe" (e.g., _Style: Slow-burn romance, Victorian English_).
- **Strategic Placement:** Instead of putting this at the top, inject it **exactly 3 or 4 messages back** from the end of the chat history.
- _Why?_ It’s close enough to the bottom to have a massive influence on the AI's current tone, but far enough up that it doesn't break the immediate flow of the conversation.

---

## 🛠️ Feature "Inspiration List" for Your App

| Feature Name           | Inspiration Source | Why you should add it                                                                                              |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Stop Strings**       | SillyTavern        | Stops the AI from rambling or hallucinating the User's next response.                                              |
| **Dialogue Prefix**    | SillyTavern        | Forces the AI to start its reply with `{{char}}:` to ensure it stays in its own shoes.                             |
| **Variable Injection** | Perchance          | Allows users to use tags like `[happy]`                                                                            |
| **Lore Probability**   | Perchance          | Adds a bit of randomness. Sometimes a lore fact triggers, sometimes it doesn't, keeping the world feeling "alive." |
| **Recursive Scanning** | SillyTavern        | Lore entries can trigger _other_ lore entries (e.g., mentioning a King triggers the entry for his Kingdom).        |

---

## 💡 Pro-Tip: The "Memory Summary" Logic

As your chat app grows, the history will eventually exceed the AI's memory. Implement a **Summarization Loop**:

1. When the chat hits 30 messages, take the first 15.
2. Ask a background AI to "Summarize the key plot points of these messages in 100 words."
3. Store that as a `{{summary}}` tag at the top of the prompt.
4. Delete the 15 old messages to free up space for new ones.
