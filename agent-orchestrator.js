// agent_orchestrator.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Configuration ---
const OLD_HTML_FILE = 'RPGlitch.html';
const EDITED_HTML_FILE = 'RPGlitch-edited.html';
const INTEGRATED_HTML_FILE = 'RPGlitch.html'; // Overwrite the old one or create a new one? Let's overwrite for simplicity.
const SCSS_FILE = 'RPGlitch.scss'; // Assuming your main SCSS file
const JS_FILE_1 = 'RPGlitch.js'; // Assuming your main JS file
const JS_FILE_2 = 'ProfilePictureComponent.js'; // Assuming your other JS file

// --- Comprehensive HTML Changes List (from your prompt) ---
// This list will be used by the script to perform replacements
const htmlChanges = {
    // 1. Global/Dialog Element Changes
    "id": {
        "hidden-h1-element": "hidden-h1",
        "initial-page-loading-modal": "initial-loading",
        "emergency-export-ctn": "emergency-container",
        "emergency-export-button": "emergency-export",
        "emergency-delete-data-button": "emergency-delete",
    },
    "class": {
        "visually-hidden": "hidden",
        "initial-loading-modal": "initial-loading",
        "emergency-export-container": "emergency-container",
        "emergency-export-content": "emergency-container", // Apply to inner divs
        "emergency-export-warning-text": "emergency-container", // Apply to inner divs
    },
    // 2. Top Bar (nav id="top-bar") Changes
    "topBarNav": { // Special handling for nav classes
        "top-bar top-bar-nav top-bar-flex": "top-bar"
    },
    "topBarLeftDiv": { // Special handling for top-bar-left div class
        "top-bar-section": "top-bar-left"
    },
    "topBarLeftUl": { // Special handling for top-bar-left ul class
        "no-class": "top-bar-left" // Indicates <ul> had no class, now has top-bar-left
    },
    "topBarButtons": { // Data attributes, tabindex, text, onclick
        "data-tab": "data-chin",
        "storyboard-data-tab-value": "stories", // Specific data-tab value change for 'stories'
        "onclick-storyboard": "App.selectTopBarTab('stories')", // Specific onclick change for 'stories'
        "onclick-options": "App.selectTopBarTab('options')", // Specific onclick change for 'options'
        "text-storyboard": "Stories",
        "text-character-workshop": "Characters",
        "text-world-creation": "Worlds",
        "tabindex-0": "1",
        "tabindex--1-to-2": "2", // For characters
        "tabindex--1-to-3": "3", // For worlds
        "tabindex--1-to-4": "4", // For options
    },
    "topBarCenterRemoved": true, // Indicates removal of top-bar-center div
    "topBarRightDiv": {
        "top-bar-section": "top-bar-right"
    },
    "topBarRightRemovedElements": [ // IDs of elements removed from top-bar-right
        "top-bar-user-character-info",
        "top-bar-ai-character-info"
    ],
    "topBarRightButtonIds": {
        "shuffle-button": "shuffle",
        "begin-story-button": "begin-story",
        "form-cancel-button": "form-cancel",
        "form-save-button": "form-save",
    },
    "topBarRightButtonClasses": {
        "button-hidden": "" // Remove this class where found on these buttons
    },
    // 3. Profile Top Bars (Removed)
    "profileTopBarsRemoved": [
        "profile-top-bar",
        "world-profile-top-bar",
        "story-profile-top-bar"
    ],
    // 4. "Chin" Section Changes
    "chinIds": {
        "storyboard-chin": "chin-stories",
        "character-workshop-chin": "chin-characters",
        "world-builder-chin": "chin-worlds",
        "options-chin": "chin-options",
    },
    "chinClasses": {
        "top-bar-chin container hidden": "hidden", // Simplify class for outer chin div
        "chin-options-actions chin-actions-flex": "chin-actions", // Simplify options chin actions
        "chin-actions-right chin-actions-right-flex": "chin-actions-right", // Simplify options chin right actions
    },
    "chinButtonIds": { // For buttons within chins
        "new-story-button": "new-story",
        "create-character-button": "new-character",
        "create-world-button": "new-world",
        "download-backup-button": "download-backup",
        "start-fresh-button": "start-fresh",
    },
    "chinFileInputIds": { // For file inputs within chins
        "upload-story-input": "upload-story",
        "upload-character-input": "upload-character",
        "upload-world-input": "upload-world",
        "upload-backup-input": "upload-backup",
    },
    "chinTextareaPlaceholders": { // For options chin textareas
        "Custom Story JS": "Custom JS"
    },
    "chinTextareaDivRemoved": true, // Indicates removal of div wrapping opening-prompt-textarea
    "characterCardChanges": { // Specific changes for the character card example
        "character-card-landscape": "chin-card",
        "card-grid": "chin-card",
        "card-info": "chin-card-left",
        "profile-picture-default": "chin-card-picture",
        "footer-card-footer-removed": true // Indicates removal of the footer
    }
};


// --- Helper Functions ---
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        process.exit(1);
    }
}

function writeFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error.message);
        process.exit(1);
    }
}

function runLinter(linterCommand) {
    try {
        console.log(`Running linter: ${linterCommand}`);
        const output = execSync(linterCommand, { encoding: 'utf8', stdio: 'pipe' });
        console.log(output);
        return output;
    } catch (error) {
        console.error(`Linter command failed: ${linterCommand}`);
        console.error(error.stdout);
        console.error(error.stderr);
        return error.stdout || error.stderr; // Return output even on error to parse it
    }
}

function hasLinterErrors(linterOutput) {
    // This is a simplified check. A real agent would parse the output more robustly.
    return linterOutput.includes('error') || linterOutput.includes('errors found');
}

// --- Phase 1: HTML Content Integration ---
function phase1HtmlIntegration() {
    console.log("--- Phase 1: HTML Content Integration ---");
    const oldHtmlContent = readFile(OLD_HTML_FILE);
    const editedHtmlContent = readFile(EDITED_HTML_FILE);

    // This is a simplified integration. A real agent would parse the HTML DOM
    // to find and replace specific sections. For this example, we'll assume
    // the edited HTML is replacing the entire <head> and <header> sections
    // and the chins, and the rest of the old HTML remains.

    // Find the start and end of the <head> in the old HTML
    const oldHeadStart = oldHtmlContent.indexOf('<head>');
    const oldHeadEnd = oldHtmlContent.indexOf('</head>') + '</head>'.length;

    // Find the start and end of the <header> in the old HTML
    const oldHeaderStart = oldHtmlContent.indexOf('<header class="container-fluid">'); // Use a unique identifier
    const oldHeaderEnd = oldHtmlContent.indexOf('</header>') + '</header>'.length;


    // Extract the new <head> and <header> from the edited HTML
    const newHeadStart = editedHtmlContent.indexOf('<head>');
    const newHeadEnd = editedHtmlContent.indexOf('</head>') + '</head>'.length;
    const newHeadContent = editedHtmlContent.substring(newHeadStart, newHeadEnd);

    const newHeaderStart = editedHtmlContent.indexOf('<header class="container-fluid">');
    const newHeaderEnd = editedHtmlContent.indexOf('</header>') + '</header>'.length;
    const newHeaderContent = editedHtmlContent.substring(newHeaderStart, newHeaderEnd);

    let integratedHtml = oldHtmlContent;

    // Replace the old <head> with the new <head>
    if (oldHeadStart !== -1 && oldHeadEnd !== -1 && newHeadContent) {
        integratedHtml = integratedHtml.substring(0, oldHeadStart) + newHeadContent + integratedHtml.substring(oldHeadEnd);
    }

    // Replace the old <header> with the new <header>
    if (oldHeaderStart !== -1 && oldHeaderEnd !== -1 && newHeaderContent) {
        integratedHtml = integratedHtml.substring(0, oldHeaderStart) + newHeaderContent + integratedHtml.substring(oldHeaderEnd);
    } else if (newHeaderContent) {
        // If old header not found, try to insert it after body start or similar
        const bodyStart = integratedHtml.indexOf('<body>');
        if (bodyStart !== -1) {
            integratedHtml = integratedHtml.substring(0, bodyStart + '<body>'.length) + newHeaderContent + integratedHtml.substring(bodyStart + '<body>'.length);
        }
    }


    writeFile(INTEGRATED_HTML_FILE, integratedHtml);
    console.log(`Integrated HTML saved to ${INTEGRATED_HTML_FILE}`);
}

// --- Phase 2: SCSS & JS Migration ---
function phase2Migration() {
    console.log("--- Phase 2: SCSS & JS Migration ---");

    let scssContent = readFile(SCSS_FILE);
    let jsContent1 = readFile(JS_FILE_1);
    let jsContent2 = readFile(JS_FILE_2);

    // Apply ID and Class renames
    for (const type in htmlChanges) {
        if (typeof htmlChanges[type] === 'object' && !Array.isArray(htmlChanges[type])) {
            for (const oldName in htmlChanges[type]) {
                const newName = htmlChanges[type][oldName];
                // Simple string replacement - a real agent would use AST parsing for robustness
                scssContent = scssContent.split(oldName).join(newName);
                jsContent1 = jsContent1.split(oldName).join(newName);
                jsContent2 = jsContent2.split(oldName).join(newName);
            }
        }
    }

    // Specific attribute and logic changes (simplified examples)
    // data-tab to data-chin
    scssContent = scssContent.split('data-tab').join('data-chin');
    jsContent1 = jsContent1.split('data-tab').join('data-chin');
    jsContent2 = jsContent2.split('data-tab').join('data-chin');

    // Update onclick logic for options button
    jsContent1 = jsContent1.split("App.toggleOptionsChin()").join("App.selectTopBarTab('options')");

    // Handle removed elements (e.g., remove their styles from SCSS)
    // This would require more advanced parsing to remove entire CSS blocks
    // For now, simple replacements for classes/IDs will handle some of it.

    // Write updated files
    writeFile(SCSS_FILE, scssContent);
    writeFile(JS_FILE_1, jsContent1);
    writeFile(JS_FILE_2, jsContent2);

    console.log("SCSS and JS migration complete.");
}

// --- Phase 3: Continuous Code Quality Maintenance ---
function phase3ContinuousLinting() {
    console.log("--- Phase 3: Continuous Code Quality Maintenance ---");

    while (true) {
        console.log("\n--- Running Linter Scan ---");
        let hasErrors = false;

        // Run ESLint for JS files
        const eslintOutput1 = runLinter(`npx eslint ${JS_FILE_1}`);
        const eslintOutput2 = runLinter(`npx eslint ${JS_FILE_2}`);
        if (hasLinterErrors(eslintOutput1) || hasLinterErrors(eslintOutput2)) {
            hasErrors = true;
            console.log("JavaScript errors found. Attempting to fix...");
            // In a real agent, this would trigger a fix function
            // For now, we'll just re-run with --fix if available
            runLinter(`npx eslint ${JS_FILE_1} --fix`);
            runLinter(`npx eslint ${JS_FILE_2} --fix`);
            // Re-validate after fix
            if (hasLinterErrors(runLinter(`npx eslint ${JS_FILE_1}`)) || hasLinterErrors(runLinter(`npx eslint ${JS_FILE_2}`))) {
                console.error("JavaScript errors persist after fix attempt.");
                // A real agent might log, alert, or try a different strategy
            } else {
                console.log("JavaScript errors fixed.");
            }
        } else {
            console.log("JavaScript is clean. ✅");
        }

        // Run Stylelint for SCSS files
        const stylelintOutput = runLinter(`npx stylelint ${SCSS_FILE}`);
        if (hasLinterErrors(stylelintOutput)) {
            hasErrors = true;
            console.log("SCSS errors found. Attempting to fix...");
            // For PicoCSS specificity, we might need to add disable comments or ignore rules
            // This is complex and would require more advanced parsing.
            // For now, we'll assume `stylelint --fix` handles simple cases.
            runLinter(`npx stylelint ${SCSS_FILE} --fix`);
            // Re-validate after fix
            if (hasLinterErrors(runLinter(`npx stylelint ${SCSS_FILE}`))) {
                console.error("SCSS errors persist after fix attempt. May require manual review or rule adjustments (e.g., PicoCSS specificity).");
                // A real agent might suggest adding disable comments for specific lines/rules
            } else {
                console.log("SCSS errors fixed.");
            }
        } else {
            console.log("SCSS is clean. ✅");
        }

        // HTML linting (assuming a tool like HTMLHint or similar)
        // For simplicity, we'll assume HTML is clean as per previous reports
        console.log("HTML is assumed clean. ✅");


        if (!hasErrors) {
            console.log("Codebase is clean! Taking a one-hour break.");
            time.sleep(3600); // Pause for 1 hour (3600 seconds)
            console.log("Resuming operations after break.");
        } else {
            console.log("Errors persist. Re-running linting cycle immediately to resolve remaining issues.");
            // Loop continues immediately
        }
    }
}

// --- Main Execution Flow ---
async function main() {
    try {
        await phase1HtmlIntegration();
        await phase2Migration();
        await phase3ContinuousLinting();
    } catch (error) {
        console.error("Agent encountered a critical error and stopped:", error);
        process.exit(1);
    }
}

main();