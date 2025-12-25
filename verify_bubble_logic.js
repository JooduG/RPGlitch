
const sanitizeHtml = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
let cleanText = "Here is a prompt: <image_prompt>A cool dragon</image_prompt>. End.";
const promptMap = new Map();
const promptRegex = /<image_prompt[\s\S]*?>([\s\S]*?)<\/image_prompt>/g;
let promptIdx = 0;

cleanText = cleanText.replace(promptRegex, (match, content) => {
    const placeholder = `[[__IMAGE_PROMPT_${promptIdx}__]]`;
    promptMap.set(placeholder, content.trim());
    promptIdx++;
    return placeholder;
});

let formattedMain = cleanText; // Simulate formatting passing through

if (promptMap.size > 0) {
    promptMap.forEach((content, placeholder) => {
        const debugBlock = `<div class="debug-console-output">
        <span class="debug-label">🎨 PROMPT:</span>
        <span class="debug-content">${sanitizeHtml(content)}</span>
     </div>`;
        formattedMain = formattedMain.split(placeholder).join(debugBlock);
    });
}

console.log(formattedMain);

if (formattedMain.includes('<div class="debug-console-output">') && formattedMain.includes('<span class="debug-label">🎨 PROMPT:</span>')) {
    console.log("SUCCESS: Debug Console Structure");
} else {
    console.log("FAILURE: Debug Console Structure");
}
