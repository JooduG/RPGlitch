#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Automated Conversation Summary Saver (Node.js version)
 *
 * Usage: node tools/save-conversation-summary.js "Your conversation summary content here"
 */
function main() {
    const summaryContent = process.argv.slice(2).join(' ');

    if (!summaryContent) {
        console.error('Error: No summary content provided.');
        console.error('Usage: node tools/save-conversation-summary.js "Your conversation summary content here"');
        process.exit(1);
    }

    // Get current date and time
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const time = now.toISOString().slice(11, 19).replace(/:/g, ''); // HHMMSS from UTC
    const timestamp = now.toISOString(); // Full ISO 8601 timestamp

    // Create directory structure relative to the project root
    const projectRoot = path.resolve(__dirname, '..', '..');
    const summaryDir = path.join(projectRoot, 'memory-bank', 'conversation-summaries', date);

    try {
        if (!fs.existsSync(summaryDir)) {
            fs.mkdirSync(summaryDir, { recursive: true });
        }
    } catch (error) {
        console.error(`Failed to create directory: ${summaryDir}`, error);
        process.exit(1);
    }

    // Create summary file
    const filename = path.join(summaryDir, `summary-${time}.md`);
    const content = `
# Conversation Summary - ${timestamp}

${summaryContent}

---
*Automatically saved by save-conversation-summary.js*
`;

    try {
        fs.writeFileSync(filename, content.trim(), 'utf8');
        console.log(`Conversation summary saved to: ${filename}`);
    } catch (error) {
        console.error(`Failed to write summary file: ${filename}`, error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
