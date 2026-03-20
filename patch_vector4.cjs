const fs = require("fs")
const path = "src/ui/organisms/profile/VectorCard.svelte"
let content = fs.readFileSync(path, "utf8")

// 1. Replace parse_markdown regex
const old_parse = `            let tokens = []
            const regex = /\\*\\*([\\s\\S]*?)\\*\\*|\\*([\\s\\S]*?)\\*/g
            let lastIndex = 0
            let match

            while ((match = regex.exec(normalized)) !== null) {
                if (match.index > lastIndex) {
                    tokens.push({ type: "text", content: normalized.substring(lastIndex, match.index) })
                }
                if (match[1] !== undefined) {
                    tokens.push({ type: "strong", content: match[1] })
                } else if (match[2] !== undefined) {
                    tokens.push({ type: "em", content: match[2] })
                }
                lastIndex = match.index + match[0].length
            }`

const new_parse = `            let tokens = []
            const regex = /\\*\\*\\*([\\s\\S]*?)\\*\\*\\*|\\*\\*([\\s\\S]*?)\\*\\*|\\*([\\s\\S]*?)\\*/g
            let lastIndex = 0
            let match

            while ((match = regex.exec(normalized)) !== null) {
                if (match.index > lastIndex) {
                    tokens.push({ type: "text", content: normalized.substring(lastIndex, match.index) })
                }
                if (match[1] !== undefined) {
                    tokens.push({ type: "strong-em", content: match[1] })
                } else if (match[2] !== undefined) {
                    tokens.push({ type: "strong", content: match[2] })
                } else if (match[3] !== undefined) {
                    tokens.push({ type: "em", content: match[3] })
                }
                lastIndex = match.index + match[0].length
            }`
content = content.replace(old_parse, new_parse)

// 2. Replace HTML block
const old_html = `                            {#each paragraph as token, j (j)}
                                {#if token.type === "strong"}
                                    <strong>{token.content}</strong>
                                {:else if token.type === "em"}
                                    <em>{token.content}</em>
                                {:else}
                                    {token.content}
                                {/if}
                            {/each}`

const new_html = `                            {#each paragraph as token, j (j)}
                                {#if token.type === "strong"}
                                    <strong>{token.content}</strong>
                                {:else if token.type === "strong-em"}
                                    <strong><em>{token.content}</em></strong>
                                {:else if token.type === "em"}
                                    <em>{token.content}</em>
                                {:else}
                                    {token.content}
                                {/if}
                            {/each}`
content = content.replace(old_html, new_html)

// 3. Replace CSS block
const old_css = `    .display-area .content .markdown-paragraph {
        margin: 0 0 var(--spacing-m) 0;
    }

    .display-area .content .markdown-paragraph:last-child {
        margin-bottom: 0;
    }`

const new_css = `    .display-area .content .markdown-paragraph {
        margin: 0;
    }

    .display-area .content .markdown-paragraph + .markdown-paragraph {
        margin-top: var(--spacing-m);
    }`

content = content.replace(old_css, new_css)

fs.writeFileSync(path, content, "utf8")
console.log("Patched VectorCard.svelte with review feedback")
