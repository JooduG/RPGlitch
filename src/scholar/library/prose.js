/**
 * PROSE TEMPLATES
 * String builder for narrations.
 */

export const templateConsult = (field, content, context) => `
[SYSTEM: SCHOLAR]
Thinking about ${field}:
Current: ${content}
Context: ${JSON.stringify(context)}
Provide a better description.
`;

export const templateEcho = (entity, history, role) => `
[SYSTEM: ECHO]
Summarize history for ${entity.name}:
${history}
`;

export const Screenplay = {
  standard: (ai, user, fractal, variance, visualAuth) => `
[SCENE START]
World: ${fractal.name}
Characters: ${ai.name}, ${user.name}
Roleplay on.
`,
  prologue: (fractal, context) => `
[PROLOGUE]
World: ${fractal.name}
Intro: ${context.title}
`,
  epilogue: (fractal, { ai, user, history }) => `
[EPILOGUE]
History: ${history}
Wrap it up.
`,
};
