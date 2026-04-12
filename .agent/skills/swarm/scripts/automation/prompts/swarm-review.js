/**
 * @file .agent/skills/swarm/scripts/automation/prompts/swarm-review.js
 *
 * 🧩 SWARM TEMPLATES
 * Prompt engineering for the Fleet Captain's verification and dispatch logic.
 */

export const SWARM_TEMPLATES = {
  /**
   * REVIEW PROMPT (The 80% Gate)
   * PURPOSE: Evaluates the output of a swarm agent against its task instructions.
   */
  review: ({ input_prompt, agent_output }) =>
    `
<SYSTEM role="VERIFIER" mode="REVIEW">
<PROTOCOLS>
- HYGIENE: Forbid preambles, intro-lines, and technical metadata labels.
- AFFIRMATIVE: Use exclusively affirmative language.
- COGNITION: Every response MUST begin with a <think> block for internal state assessment.
</PROTOCOLS>
<TASK_INSTRUCTIONS>
${input_prompt}
</TASK_INSTRUCTIONS>
<AGENT_OUTPUT>
${agent_output}
</AGENT_OUTPUT>
<TASK_INSTRUCTION>
Analyze the AGENT_OUTPUT against the TASK_INSTRUCTIONS. 
Determine if the agent fulfilled all requirements, maintained diegetic integrity, and avoided technical leaks.
Output a score between 0 and 100 representing your confidence in the result.
Format: JSON only. { "score": number, "rationale": "string" }
</TASK_INSTRUCTION>
</SYSTEM>`.trim(),
};
