# Prompt: UI / UX “vibe check” review

**Goal**  
Do a *UI and UX design review* of this application’s front end, focusing on how it feels to use: clarity, consistency, readability, and general attractiveness. Ignore implementation details and my existing design docs; judge it like a fresh user.  

**Scope**  
- Repository: `JooduG/RPGlitch`  
- Tech stack: `Svelte 5 + Native CSS + Dexie.js`  
- Key UI areas I care about:
  - Global design system (Chalk, Gunmetal, Frozen, Frisk tokens).  
  - Storyboard & StoryCards (clarity of the 12-column grid and glass surfaces).  
  - Library Drawer & Profile Modals (transparency, readability, and blur states).  
  - Kinetic Animations (Svelte actions like use:tilt and momentum decay).  
 
**What to critique**  
1. **Visual design & consistency**  
   - How coherent is the design system across components (colors, radii, shadows, spacing)?  
   - Are there elements that are too transparent / low-contrast / hard to read? Call them out specifically.  
   - **Perceived Performance**: Identify any "visual friction"—animations that are too slow, jarring transitions, or layout shifts (CLS) that break immersion.
   - Identify components that look visually noisy, cluttered, or just plain ugly, and explain *why*.  
 
2. **UX & interaction patterns**  
   - For key flows (auth, main dashboard, primary actions), is it obvious what the user should do next?  
   - Do modals, drawers, and toasts appear and behave in a way that feels natural (focus, escape behavior, sizing, scroll, etc.)?  
   - **Accessibility & Navigability**: Test for "Keyboard-Only" operation. Can a user navigate the entire simulation without a mouse? Are focus states visible and aesthetically consistent?
   - Point out any interactions that feel annoying, surprising, or confusing.  
 
3. **Copy, labels, and structure**  
   - Are labels, button texts, headings, and helper texts clear and specific?  
   - Are there places where the language is vague, overloaded, or inconsistent?  
   - Suggest clearer wording where it would reduce friction or cognitive load.  
 
**Deliverable**  
- Create a Markdown file: `docs/ui-ux-review.md`  
- Use these sections:
  - `High-level impression` (how the app *feels* overall).  
  - `Design system & visual language` (what works / what doesn’t).  
  - `Components & patterns to fix` (bulleted list: “modal X”, “primary button”, etc., with reasons).  
  - `Accessibility & readability` (contrast, font sizes, motion, focus states).  
  - `Concrete improvement suggestions` (short list of targeted changes that would have the biggest impact).  
 
**Tone / constraints**  
- Be honest and specific rather than polite. If something looks bad, say so and explain why.  
- Suggest improvements using generic UI/UX best practices; do not try to reverse-engineer or follow any internal design guidelines I may have.  
- Limit the report to something I can read in under 10 minutes.  
