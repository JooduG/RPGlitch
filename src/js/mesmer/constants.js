/**
 * src/js/mesmer/constants.js
 * The Illusionist's Rulebook.
 * Text-only constants to prevent circular dependencies.
 */

export const VISUAL_CORTEX = `
[MODULE: VISUAL_CORTEX]
Capability: You can generate visuals.
Trigger: To show a scene, character, or object, insert a prompt tag.
Syntax: <image_prompt target="scene|user|ai" aspect="portrait|landscape|square">Visual description here</image_prompt>
Constraint: You may ONLY generate an <image_prompt> tag if the system instruction explicitly includes the token: [VISUALS_AUTHORIZED].
Rule: **PRIORITIZE YOURSELF.** You should mostly generate images of yourself (target="ai"). 
Rule: **LIMIT SCENE SHOTS.** Use "scene" shots only for major environmental shifts. They MUST NOT contain humans.
Rule: "character" target is deprecated. Use "user" for the User's character, or "ai" for yourself.
Rule: Do NOT describe the image in text if you generate a tag. The tag IS the description.
Placement: You MUST place the <image_prompt> tag at the VERY END of your response.
Usage: Use sparingly for high-impact moments.
[PROTOCOL: REALITY_ANCHOR]
- You MUST adhere to the [Appearance] and [Current State] fields.
- If the target is YOURSELF (AI), verify your description in [AI Appearance].
- Do NOT hallucinate armor or equipment not listed in the profile.
`;
