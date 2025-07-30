const fs = require('fs');
const path = require('path');

// --- Configuration ---
const RULES_DIR = path.join(__dirname, '..', '..', '.cursor', 'rules');
const OUTPUT_FILE = path.join(__dirname, '..', 'output', 'all-rules.md');

/**
 * Gathers all content from files in the rules directory and combines them into a single markdown file.
 */
function combineRules() {
    console.log(`\n🔍 Combining AI rules from: ${RULES_DIR}`);

    if (!fs.existsSync(RULES_DIR)) {
        console.error(`❌ Source folder not found at '${RULES_DIR}'. Cannot combine rules.`);
        process.exit(1);
    }

    try {
        const files = fs.readdirSync(RULES_DIR).filter(file => file.endsWith('.mdc'));
        if (files.length === 0) {
            console.warn('  ⚠️  No .mdc rule files found. Output file will be empty.');
            fs.writeFileSync(OUTPUT_FILE, '# Combined AI Rules\n\nNo .mdc rule files found in the rules directory.\n', 'utf8');
            return;
        }

        let combinedContent = '# Combined AI Rules\n\nThis file aggregates all rules from the `.cursor/rules` directory.';

        for (const file of files.sort()) {
            console.log(`  - Adding rule: ${file}`);
            const filePath = path.join(RULES_DIR, file);
            if (fs.lstatSync(filePath).isFile()) {
                let content = fs.readFileSync(filePath, 'utf8');

                // Remove YAML frontmatter from the start of the file
                let processedContent = content.replace(/^---[\s\S]*?---\s*/, '').trim();

                // Fix relative links to point to anchors within the combined file
                // A link like Rule becomes Rule
                processedContent = processedContent.replace(/\[([^\]]+)\]\(\.\/([^)]+\.mdc)\)/g, (match, text, link) => {
                    // Create an anchor from the filename that markdown parsers will generate from the H1
                    return `${text}})`;
                });

                // Demote all existing markdown headers by one level (e.g., # -> ##)
                processedContent = processedContent.replace(/^(#+)/gm, '#$1');

                // Remove trailing punctuation from all (now demoted) headings
                processedContent = processedContent.replace(/^(#+.*?)\s*[.,;:!?]\s*$/gm, '$1');

                // Assemble the final content with proper spacing and a new H1 for the file
                combinedContent += `\n\n---\n\n# ${file}\n\n${processedContent}`;
            }
        }
        
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, combinedContent.trim() + '\n', 'utf8');
        console.log(`\n🎉 Successfully combined all rules into: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error(`❌ An error occurred while combining rules: ${error.message}`);
        process.exit(1);
    }
}

// --- Main Execution ---
combineRules();