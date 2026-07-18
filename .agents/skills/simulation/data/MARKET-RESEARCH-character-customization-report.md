# **CHARACTER CUSTOMIZATION MATRIX REPORT**

This report logs only the parameters, structural fields, and instructional directives that actively shape prompt logic, character behavior, and LLM text generation across the audited engines.

## **JANITORAI.COM**

### **1\. Context Identifiers**

- **Chat Name**
  - **Type:** Text Field
  - **Active State:** Empty (Placeholder: Shown in chat)
  - **Directives & Instructions:** "Optional nickname shown in chats instead of the character's name. Also used in the LLM prompt."

### **2\. Behavioral Definitions & Context Engines**

- **Pronoun Macros**
  - **Type:** Collapsible Panel Reference List
  - **Active State:** Expanded
  - **Directives & Instructions:** "Use these macros to dynamically insert the user's pronouns: {{user}} (subjective), {{obj}} (objective), {{poss}} (possessive), {{poss\_pl}} (possessive plural), {{refl}} (reflexive)."
- **Personality \***
  - **Type:** Text Area (Permanent Context Block)
  - **Active State:** Empty | 0 tokens counter
  - **Directives & Instructions:** "Describe the character's persona here. Describe your character's persona. This will help define how the character interacts with others."
- **Scenario**
  - **Type:** Text Area (Conditional Context Block)
  - **Active State:** Empty | 0 tokens counter
  - **Directives & Instructions:** "The current circumstances and context of the conversation and the characters. Outline the context and setting for your character's conversations."

### **3\. Messaging Register & Formatting Controls**

- **Initial Messages (First Messages) \***
  - **Type:** Tabbed Text Area (Dialogue Starter Engine)
  - **Active State:** Message 1 / Write tab active, Empty | 0 tokens counter
  - **Directives & Instructions:**
    - "First message from your character. Provide a lengthy first message to encourage the character to give longer responses."
    - "You can create different opening messages so users have options to choose from. Click the \+ icon below."
    - "Use the up/down arrow buttons below to reorder your messages."
    - "Markdown supported — _italics_, **bold**, code"
- **Example Dialogs**
  - **Type:** Text Area (Formatting & Style Few-Shot Prompts)
  - **Active State:** Empty | 0 tokens counter
  - **Directives & Instructions:**
    - "Example chat between you and the character. This section is very important for teaching your character how they should speak."
    - "Best practice example: {{user}}: Hey, I'm Mark. {{char}}: Hello Mark\! {{char}}: Nice to meet you. :)"

## **CHARACTER.AI**

### **1\. Base Parameters**

- **Character Name**
  - **Type:** Text Field
  - **Active State:** Empty (Placeholder: e.g. Albert Einstein) | 0/20 character counter
  - **Directives & Instructions:** Directly establishes the target identity token for the system and the user interface.
- **Description**
  - **Type:** Text Area (Foliage Profile Layer / Secondary Bio Context)
  - **Active State:** Empty (Placeholder: Example: She's a retired pirate queen...) | 0/500 character counter
  - **Directives & Instructions:** "The bio shown on the Character's profile. Share who they are and what makes them interesting." (Under the hood, acts as a secondary foundation context block).

### **2\. Dialogue & Context Anchors**

- **Greeting**
  - **Type:** Text Area (Starting Context Anchor)
  - **Active State:** Empty (Placeholder: Example: Took you long enough. I've been waiting.) | 0/4096 character counter
  - **Directives & Instructions:** "The first message people see when they enter the chat. You can add up to 5 custom greetings. They'll appear in the order you set and people can swipe to pick one before chatting." (Establishes initial perspective, tense, and dialogue style).
- **Lorebook**
  - **Type:** Dynamic Linking Module
  - **Directives & Instructions:** "World-building details your Character brings into chat when keywords come up." (Injects structural definitions on-demand).

### **3\. Behavioral Code & Syntax Controls**

- **Definition**
  - **Type:** Text Area (Advanced Instructions / Few-Shot Dialogue Definitions)
  - **Active State:** Empty (Placeholder: Example: Always speaks with formal, poetic language...) | 0/32000 character counter
  - **Directives & Instructions:** Configures behavioral rules, character motivations, constraints, speech patterns, and structured conversation history templates.
  - **Structural Syntax Injection Helpers:**
    - \+ User message (Injects structural tag {{user}})
    - \+ Character message (Injects structural tag {{char}})
    - \+ End of dialog (Injects loop formatting bounds delimiter)

## **CHUB.AI**

### **1\. Base Variables**

- **In-Chat Name**
  - **Type:** Text Field
  - **Active State:** Empty (Placeholder: Some name, if different from project name)
  - **Directives & Instructions:** "Optional. The name that this character will have inside of a chat, if different from the name to display in search." (Directly overrides default name tags inside structural prompt payloads).

### **2\. Systemic Prompt Layers**

- **Description \***
  - **Type:** Text Area (Core Parameter Definition)
  - **Active State:** Empty | 0 token(s) counter
  - **Directives & Instructions:** "Describe the character's persona here. Think of this as character AI's description \+ definitions in one box."
- **Initial Message \***
  - **Type:** Text Area (Tense & Style Setter)
  - **Active State:** Empty | 0 token(s) counter
  - **Directives & Instructions:** "First message from your character. Provide a lengthy first message to encourage the character to give longer responses."
- **Scenario**
  - **Type:** Text Area (Situational Directive)
  - **Active State:** Empty | 0 token(s) counter
  - **Directives & Instructions:** "The current circumstances and context of the conversation and the characters."
- **Example Dialogs**
  - **Type:** Text Area (Dialogue Styling/Grammar Constraints)
  - **Active State:** Empty | 0 token(s) counter
  - **Directives & Instructions:** "Example chat between you and the character. This section is very important for teaching your character how they should speak."

### **3\. V2 Spec & Context Controls**

- **Alternate Greetings**
  - **Type:** Dynamic Input Group Array
  - **Directives & Instructions:** "Alternate beginning messages from your character."
- **System Prompt**
  - **Type:** Text Area (Prompt Overwrites)
  - **Active State:** Empty | 0 token(s) counter
  - **Directives & Instructions:** "Character-specific system prompt meant to replace the system prompt set by the user. Only used if 'Use V2 Spec.' is enabled."
- **Post Hist Instructions**
  - **Type:** Text Area (Constraint Re-enforcement)
  - **Active State:** Empty | 0 token(s) counter
  - **Directives & Instructions:** "Character-specific post-history instructions meant to replace or supplement the PHI set by the user. Only used if 'Use V2 Spec.' is enabled. Include {{original}} if you want to supplement the PHI instead of replace it."
- **Character's Note**
  - **Type:** Text Area \+ Depth Setting Control
  - **Active State:** Empty / Default depth level 0 | 0 token(s) counter
  - **Directives & Instructions:** "Prompt to be placed within x position of the chat history, where x is the depth." (Injects critical guidelines directly into sliding context windows to limit memory drift).
- **Character Book**
  - **Type:** Dynamic Database Selector / Injected Array
  - **Active State:** Empty | 0 entry, 0 token(s) counter
  - **Directives & Instructions:** "A collection of defined keywords that, when activated, insert specific content about your character to the AI."

## **PERCHANCE.ORG/AI-CHARACTER-CHAT**

### **1\. Identity & Framing Directives**

- **Character Name**
  - **Type:** Text Field
  - **Active State:** Sammy
  - **Directives & Instructions:** Establishes character token framing in chat executions.
- **Character description/personality/traits/lore/role**
  - **Type:** Text Area (Core Memory Node)
  - **Active State:** Template Instructions pre-loaded
  - **Directives & Instructions:** "This should ideally be less than 1000 words. If you have several thousand words of info... scroll down to 'lorebooks'. Also, write {{user}} to refer to the user's name."
- **User's Name**
  - **Type:** Text Field
  - **Active State:** Empty
  - **Directives & Instructions:** "This overrides the user's default username when creating a new chat thread with this character."
- **User's Description/Role**
  - **Type:** Text Area
  - **Active State:** Empty
  - **Directives & Instructions:** "What role do you, the user, play when chatting with this character? This overrides the user's default description."

### **2\. Behavioral Constraints & Reminders**

- **Short Message Length Limit**
  - **Type:** Dropdown Selector
  - **Active State:** No reply length limit
  - **Directives & Instructions:** "Try setting this to one paragraph if the character keeps maternaly-talking/writing on your behalf." (Controls structural parser limitations to prevent bot hijacking).
- **Character Reminder Note**
  - **Type:** Text Area (Floating System Rule)
  - **Active State:** Empty
  - **Directives & Instructions:** "Remind the AI of important things, writing tips, and so on. Use this for important stuff that the AI often forgets. Try to keep this under 100 words."
- **General Writing Instructions**
  - **Type:** Dropdown Preset Selector
  - **Active State:** Roleplay Style 1
  - **Directives & Instructions:** "These instructions apply to the whole chat... defining general writing style, overarching rules, and defining the 'type of experience'."
- **Initial Chat Messages**
  - **Type:** Text Area (Dialogue & Scenario Setup)
  - **Active State:** Mock structural chat template loaded
  - **Directives & Instructions:** "Teach the AI how this character typically speaks, and/or to define an initial scenario. Follow the '{{user}}: ... {{char}}: ...' format."
- **User Reminder Note**
  - **Type:** Text Area (User Persona Constraint)
  - **Active State:** Empty
  - **Directives & Instructions:** "In case you get the AI to write on your behalf, this is the reminder note used in that case."

### **3\. Context Management & Core Developer Anchors**

- **Lorebook URLs \- One URL Per Line**
  - **Type:** Text Area (Dynamic File Parsers)
  - **Active State:** Sample TXT paths loaded
  - **Directives & Instructions:** "URLs should generally end in .txt... Each text file can contain thousands of entries... Each entry within a profile/lore text file should be a fact about the world/character... no longer than one or two sentences. There should be a blank line between entries."
- **Method for Fitting Messages Within Model's Context Limit**
  - **Type:** Dropdown Truncation Selector
  - **Active State:** summarize oldest messages
  - **Directives & Instructions:** Directs how the model trims active memory once the token limit is exceeded, strongly impacting plot continuity.
- **Extended Character Memory**
  - **Type:** Dropdown Selector
  - **Active State:** Long term memory disabled
  - **Directives & Instructions:** Aligns model attention to deeper conversation historical threads.
- **Shortcut Buttons (Above Reply Box)**
  - **Type:** Text Area (Execution Injection Scripts)
  - **Active State:** Shortcut configuration tags loaded
  - **Directives & Instructions:** Generates context-level prompt injection shortcut panels, letting users dynamically force-inject structural commands (e.g. replace, autoSend, custom writing overrides) mid-chat.
- **Custom JavaScript Code**
  - **Type:** Text Area (Direct Context Interception)
  - **Active State:** Execution hook template loaded
  - **Directives & Instructions:** "Allows you to e.g. give your bot access to the internet and do a whole lot of other fancy stuff\!" (Fires client-side or server-side scripts that can programmatically alter the chat payload, intercept incoming messages, append variables, or rewrite historical inputs before execution).
- **System's Name**
  - **Type:** Text Field
  - **Active State:** Empty
  - **Directives & Instructions:** Changes the identity node of systemic prompts, narration elements, and out-of-character (OOC) interjections inside the chat history.

## **COMPARATIVE FUNCTIONAL ANALYSIS**

When we strip away marketing labels and user interface variations, we find a highly standardized prompt architecture across all four systems. This analysis groups the active, behavioral fields according to their actual functional destination inside the LLM's context window.

### **1\. Universal Congruency (Found on ALL 4 Platforms)**

- **Identity Node (The Character Name Anchor)**
  - _Function:_ Pinpoints the primary text token that identifies the agent in system commands, dialog logs, and prompt wrappers.
  - _Platform Map:_ Chat Name (JanitorAI) | Character Name (Character.ai) | In-Chat Name / Name (Chub.ai) | Character Name (Perchance)
- **The Persona Core (The Central Character Definition)**
  - _Function:_ Holds the main description of attributes, behavioral rules, backstories, and traits. This acts as the anchor block of the system context.
  - _Platform Map:_ Personality (JanitorAI) | Description & Definition (Character.ai) | Description (Chub.ai) | Character description/personality/traits/lore/role (Perchance)
- **The Tone Starter (The Initial Greeting / First Message)**
  - _Function:_ Establishes the starting plot point, narration tense (e.g., 1st or 3rd person), narrative perspective, default paragraph length, and general sentence flow.
  - _Platform Map:_ Initial Messages (JanitorAI) | Greeting (Character.ai) | Initial Message (Chub.ai) | Initial Chat Messages (Perchance)
- **Few-Shot Format Templates (Example Dialogues)**
  - _Function:_ Provides the LLM with mock conversational turns (typically using \<START\>, {{user}}, or {{char}} patterns) to teach speech patterns, emotional delivery, and structural formatting rules.
  - _Platform Map:_ Example Dialogs (JanitorAI) | Definition \[Few-shot Syntax Nodes\] (Character.ai) | Example Dialogs (Chub.ai) | Initial Chat Messages \[Dialogue section\] (Perchance)

### **2\. Tri-Platform Alignment (Found on Exactly 3 Platforms)**

- **Branching Narrative Starts (Multiple Greetings)**
  - _Function:_ Gives users different initial greeting options to branch off into distinct scenarios while sharing the same underlying persona.
  - _Platform Map:_ Initial Messages \[+ Message Array\] (JanitorAI) | Greeting \[Up to 5 customizable options\] (Character.ai) | Alternate Greetings (Chub.ai)
  - _(Omitted on Perchance—which relies on a single static opener unless script overrides are written)_
- **On-Demand Fact Injection (Lorebooks & Database Dictionaries)**
  - _Function:_ Injects highly specific background details (world-building facts, secondary character sheets, item descriptions) into active memory only when matching keywords are triggered in the chat. This prevents token bloat.
  - _Platform Map:_ Lorebook (Character.ai) | Character Book (Chub.ai) | Lorebook URLs (Perchance)
  - _(Omitted natively on JanitorAI's basic creation card, requiring creators to hardcode lore directly into the personality or scenario blocks instead)_

### **3\. Bi-Platform Alignment (Found on Exactly 2 Platforms)**

- **Situational Context Triggers (Dedicated Scenario Blocks)**
  - _Function:_ Separates permanent persona details from temporary physical surroundings, current setups, or starting relationships.
  - _Platform Map:_ Scenario (JanitorAI) | Scenario (Chub.ai)
  - _(Character.ai and Perchance blend this directly into the central Personality or Greeting blocks)_
- **System Prompt Modification (Base Rule Overwrites)**
  - _Function:_ Gives the creator deep prompt access to edit or entirely replace the fundamental system-level directives (e.g., formatting constraints, spatial instructions).
  - _Platform Map:_ System Prompt (Chub.ai) | General Writing Instructions (Perchance)
  - _(JanitorAI and Character.ai isolate these rules on the system/server side or lock them behind global account-wide settings)_
- **Anti-Drift Anchors (Floating Reminder Notes / Author's Notes)**
  - _Function:_ Injects custom instructions directly into the history window at a specified depth to prevent the LLM from losing character traits during long conversations.
  - _Platform Map:_ Character's Note (Chub.ai) | Character Reminder Note (Perchance)

### **4\. Platform-Unique Settings (Exclusive to Exactly 1 Platform)**

- **Grammatical Pronoun Macro Array (JanitorAI Exclusive)**
  - _Field:_ Pronoun Macros
  - _Purpose:_ A specialized UI tool listing precise variables ({{obj}}, {{poss}}, etc.) that align with third-person narration.
- **Post-History Rules (Chub.ai Exclusive)**
  - _Field:_ Post Hist Instructions (PHI)
  - _Purpose:_ Injects rules right at the end of the sliding history window, giving them immense weight in the model's immediate text generation.
- **User Persona Context Integration (Perchance Exclusive)**
  - _Fields:_ User's Name, User's Description/Role, and User Reminder Note
  - _Purpose:_ Dictates not just who the _bot_ is, but explicitly tells the LLM who the _user_ is, what role they play, and how the bot should write on their behalf.
- **Client-Side Scripting Hooks (Perchance Exclusive)**
  - _Field:_ Custom JavaScript Code
  - _Purpose:_ Allows creators to run JavaScript to query external APIs, dynamically rewrite payload data, or change context states right before sending the prompt to the model.
- **UI Input Shorthands (Perchance Exclusive)**
  - _Field:_ Shortcut Buttons
  - _Purpose:_ Injects floating utility buttons into the UI to allow quick formatting edits or prompt commands (like forcing the bot to re-generate or switch formats) with a single tap.
