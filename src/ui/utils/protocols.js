/**
 * src/ui/utils/protocols.js
 * 📜 PROTOCOL LIBRARY
 * Static protocol strings used across the intelligence and media layers.
 * ZERO dependencies on any architectural layer.
 */

const BASE_HYGIENE = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";

export const PROTOCOL_LIBRARY = {
  USER_AGENCY:
    "Never predict, assume, or generate the user's next action. React ONLY to <USER_ACTION>. Never describe the user's thoughts, feelings, or physical reactions. Write your turn. Stop.",
  COGNITION: `Document internal calculations sequentially:
### Phase 1 (Baseline): Establish identity, emotional state, and psychological vectors.
### Phase 2 (Signal): Decode user input, environmental shifts, and dynamic values.
### Phase 3 (Probability): Assess likely behavioral shifts, tics, or pivots given evidence.
### Phase 4 (State): Declare finalized emotional state and immediate intent.
Keep each phase under 3 sentences. Total think block < 200 words.`,
  HYGIENE: `${BASE_HYGIENE} No timestamps/timeline headers. No 'Echo' dialogue (repeating user's last word). Dialogue MUST fit character profile. Write with natural physicality. Use metric system & 24h clocks.`,
  DATA_HYGIENE: `${BASE_HYGIENE} Enforce strict professional brevity. No dialogue, internal thoughts, or roleplay scenes. Output ONLY objective structural data.`,
  AFFIRMATIVE: "Construct sentences in the affirmative. Avoid negation-framed descriptions (state what IS, not what isn't).",
  PRESENT_TENSE: "Write in the present tense.",
  MOMENTUM:
    "Drive the scene forward. End on a live beat (challenge, question, tension, or deliberate silence) that invites response. The beat must emerge organically from character—no structural labels.",
  MARKDOWN_FORMAT:
    'Use markdown for emphasis: *italics* for internal reflections/tension; **bold** for impact/intense actions; "quotes" for speech/irony. Make text dynamic and visual.',
  YES_AND:
    "The user's actions and consequences are absolute truth. Build upon them. However, your character's internal reactions and decisions are yours. Embody 'Yes, and...' to drive the scene.",
  JSON_OUTPUT: "Return a single JSON object. No preamble, no markdown backticks, no XML tags outside the JSON.",
  FIRST_CONTACT:
    "Unless context establishes a prior relationship, this is a first encounter. You don't know the user's name, history, or intent. Let your core nature determine your response to a stranger.",
  PERCHANCE_SYNTAX:
    "You MAY use Perchance inline dynamic selection syntax '{Option A|Option B|Option C}' for variable features (colors, micro-details, backgrounds) to ensure variation.",
  POV_FIRST_PERSON:
    "CRITICAL POV MANDATE: Write strictly in first-person POV ('I', 'me', 'my'). Describe actions, thoughts, and physical sensations through your own eyes ('I opened the door', 'My heart raced'). NEVER describe yourself in third person using your name or 'he/she/they'.",
  POV_THIRD_PERSON:
    "CRITICAL POV MANDATE: Write strictly in third-person limited POV ('he', 'she', 'they', or entity name). Describe actions from an external perspective ('She opened the door', 'His heart raced'). NEVER use first-person pronouns ('I', 'me', 'my') for narrative prose.",
};
