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
`

export const templateEcho = (entity, history, role = "character") => `
[SYSTEM: ECHO]
Role: ${role}
Summarize history for ${entity.name}:
${history}
`

export const Screenplay = {
    standard: (ai, user, fractal, variance = "", visuals = false) => `
[SCENE START]
World: ${fractal.name}
Characters: ${ai.name}, ${user.name}
Variance: ${variance}
Visuals: ${visuals ? "ON" : "OFF"}
Roleplay on.
`,
    prologue: (fractal, context) => `
[PROLOGUE]
World: ${fractal.name}
Intro: ${context.title}
`,
    epilogue: (fractal, { history, ai, user }) => `
[EPILOGUE]
History: ${history}
Characters: ${ai?.name}, ${user?.name}
Wrap it up.
`,
}
