1. Verify what `\xed\xb4\x96` character is. It's likely a unicode escape for an emoji that got mangled in `07-github-dispatch.md` and the github actions yml files.
2. The PR essentially delegates logic from `.github/workflows` to `.agent/workflows`, making the prompts much more concise and referencing local instructions (`.agent/workflows/10-bug-fix.md` and `.agent/workflows/11-security-scan.md`).
3. The PR removes a lot of logic from `.agent/workflows/08-stitch-loop.md`, notably the generation via MCP Stitch tool, and replaces it with some text about "SDK Extraction" and "Validation Gate". This looks suspicious because `08-stitch-loop.md` previously had concrete instructions on how to use Stitch, and now it just says "Trigger the stitch-design skill". Does `stitch-design` skill exist?
4. I will write a review stating:
    - Good delegation of prompts in GitHub workflows to local `.agent/workflows`.
    - Correctly added permissions `write` in github actions.
    - Mention the character encoding issues (`\xed\xb4\x96`).
    - Point out that `08-stitch-loop.md`'s refactor drops the clear instructions on how to use the Stitch MCP. If the context of this repository relies on MCP Stitch, the agent might fail to know how to use it unless "stitch-design skill" is defined elsewhere.
5. Create a set_plan to format and output this review to the user.
