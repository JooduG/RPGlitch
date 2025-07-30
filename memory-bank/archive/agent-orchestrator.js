// agent_orchestrator.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Configuration ---
const OLD_HTML_FILE = 'RPGlitch.html';
const EDITED_HTML_FILE = 'RPGlitch-edited.html';
const INTEGRATED_HTML_FILE = 'RPGlitch.html'; // Overwrite the old one or create a new one.

const SCSS_FILE = 'RPGlitch.scss'; // Assuming your main SCSS file
const JS_FILE_1 = 'RPGlitch.js'; // Assuming your main JS file
const JS_FILE_2 = 'ProfilePictureComponent.js'; // Assuming your other JS file

// --- Comprehensive HTML Changes List (from your prompt) ---
// This list will be used by the script to perform replacements
const htmlChanges = {
    // 1. Global/Dialog Element Changes
    "globalDialogElements": {
        "id": {
            "hidden-h1-element": "hidden-h1",
            "initial-page-loading-modal": "initial-loading",
            "emergency-export-ctn": "emergency-container",
            "emergency-export-button": "emergency-export",
            "emergency-delete-data-button": "emergency-delete"
        },
        "class": {
            "visually-hidden": "hidden",
            "initial-loading-modal": "initial-loading",
            "emergency-export-container": "emergency-container",
            "emergency-export-content": "emergency-container",
            "emergency-export-warning-text": "emergency-container"
        }
    },
    // 2. Top Bar (nav id="top-bar") Changes
    "topBarChanges": {
        "removedOuterDivs": [ // IDs/Classes of outer divs that were removed
            { "id": "main-content-wrapper", "class": "container app-scrollable-container" },
            { "class": "container" } // The inner container div
        ],
        "navClasses": {
            "top-bar top-bar-nav top-bar-flex": "top-bar"
        },
        "topBarLeftDivClasses": {
            "top-bar-section": "top-bar-left"
        },
        "topBarLeftUlClasses": {
            "no-class": "top-bar-left" // Represents adding class to <ul> that had none
        },
        "buttonAttributes": {
            "data-tab-to-data-chin": { // Change attribute name
                "old": "data-tab",
                "new": "data-chin"
            },
            "data-chin-values": { // Specific data-chin value changes
                "storyboard": "stories" // For the 'Stories' button
            },
            "tabindexChanges": {
                "0": "1",
                "-1-to-2": "2", // For characters
                "-1-to-3": "3", // For worlds
                "-1-to-4": "4"  // For options
            },
            "onclickLogicChanges": {
                "App.selectTopBarTab('storyboard')": "App.selectTopBarTab('stories')", // For 'Stories' button
                "App.toggleOptionsChin()": "App.selectTopBarTab('options')" // For 'Options' button
            },
            "buttonTextChanges": {
                "Storyboard": "Stories",
                "Character Workshop": "Characters",
                "World Creation": "Worlds"
            }
        },
        "topBarCenterRemoved": true, // Indicates removal of top-bar-center div
        "topBarRightDivClasses": {
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
            "form-save-button": "form-save"
        },
        "topBarRightButtonClassesRemoved": "button-hidden" // Class to be removed from these buttons
    },
    // 3. Profile Top Bars (Removed in New Code)
    "profileTopBarsRemoved": [
        "profile-top-bar",
        "world-profile-top-bar",
        "story-profile-top-bar"
    ],
    // 4. "Chin" Section Changes
    "chinChanges": {
        "chinIds": {
            "storyboard-chin": "chin-stories",
            "character-workshop-chin": "chin-characters",
            "world-builder-chin": "chin-worlds",
            "options-chin": "chin-options"
        },
        "chinClasses": {
            "top-bar-chin container hidden": "hidden", // Simplify class for outer chin div
            "chin-options-actions chin-actions-flex": "chin-actions", // Simplify options chin actions
            "chin-actions-right chin-actions-right-flex": "chin-actions-right" // Simplify options chin right actions
        },
        "chinButtonIds": { // For buttons within chins
            "new-story-button": "new-story",
            "create-character-button": "new-character",
            "create-world-button": "new-world",
            "download-backup-button": "download-backup",
            "start-fresh-button": "start-fresh"
        },
        "chinFileInputIds": { // For file inputs within chins
            "upload-story-input": "upload-story",
            "upload-character-input": "upload-character",
            "upload-world-input": "upload-world",
            "upload-backup-input": "upload-backup"
        },
        "chinTextareaPlaceholders": { // For options chin textareas
            "Custom Story JS": "Custom JS"
        },
        "chinTextareaDivRemoved": true, // Indicates removal of div wrapping opening-prompt-textarea
        "characterCardChanges": { // Specific changes for the character card example
            "oldClasses": ["character-card-landscape", "card-grid", "card-info", "profile-picture-default"],
            "newClasses": ["chin-card", "chin-card", "chin-card-left", "chin-card-picture"],
            "footerRemoved": true // Indicates removal of the footer
        }
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

    // Apply ID and Class renames based on the comprehensive list
    // This part is a simplified string replacement. For a real agent,
    // a DOM parser for HTML and AST parsers for SCSS/JS would be used
    // for more robust and accurate transformations.

    // Helper to apply replacements
    function applyReplacements(content, changesMap) {
        let updatedContent = content;
        for (const oldVal in changesMap) {
            const newVal = changesMap[oldVal];
            // Escape special characters for regex if needed
            const escapedOldVal = oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedOldVal, 'g');
            updatedContent = updatedContent.replace(regex, newVal);
        }
        return updatedContent;
    }

    // Global/Dialog Element Changes
    scssContent = applyReplacements(scssContent, htmlChanges.globalDialogElements.id);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.globalDialogElements.id);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.globalDialogElements.id);

    scssContent = applyReplacements(scssContent, htmlChanges.globalDialogElements.class);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.globalDialogElements.class);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.globalDialogElements.class);

    // Top Bar Changes
    scssContent = applyReplacements(scssContent, htmlChanges.topBarChanges.navClasses);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.topBarChanges.navClasses);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.topBarChanges.navClasses);

    scssContent = applyReplacements(scssContent, htmlChanges.topBarChanges.topBarLeftDivClasses);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.topBarChanges.topBarLeftDivClasses);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.topBarChanges.topBarLeftDivClasses);

    scssContent = applyReplacements(scssContent, htmlChanges.topBarChanges.topBarLeftUlClasses);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.topBarChanges.topBarLeftUlClasses);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.topBarChanges.topBarLeftUlClasses);

    // Data attribute changes (data-tab to data-chin)
    scssContent = scssContent.split(htmlChanges.topBarChanges.buttonAttributes["data-tab-to-data-chin"].old).join(htmlChanges.topBarChanges.buttonAttributes["data-tab-to-data-chin"].new);
    jsContent1 = jsContent1.split(htmlChanges.topBarChanges.buttonAttributes["data-tab-to-data-chin"].old).join(htmlChanges.topBarChanges.buttonAttributes["data-tab-to-data-chin"].new);
    jsContent2 = jsContent2.split(htmlChanges.topBarChanges.buttonAttributes["data-tab-to-data-chin"].old).join(htmlChanges.topBarChanges.buttonAttributes["data-tab-to-data-chin"].new);

    // Specific data-chin value changes (storyboard to stories)
    jsContent1 = jsContent1.split(`'${htmlChanges.topBarChanges.buttonAttributes["data-chin-values"].storyboard}'`).join(`'${htmlChanges.topBarChanges.buttonAttributes["data-chin-values"].stories}'`);
    jsContent2 = jsContent2.split(`'${htmlChanges.topBarChanges.buttonAttributes["data-chin-values"].storyboard}'`).join(`'${htmlChanges.topBarChanges.buttonAttributes["data-chin-values"].stories}'`);

    // Onclick logic changes (Options button)
    jsContent1 = jsContent1.split(htmlChanges.topBarChanges.buttonAttributes.onclickLogicChanges["App.toggleOptionsChin()"]).join(htmlChanges.topBarChanges.buttonAttributes.onclickLogicChanges["App.selectTopBarTab('options')"]);
    jsContent2 = jsContent2.split(htmlChanges.topBarChanges.buttonAttributes.onclickLogicChanges["App.toggleOptionsChin()"]).join(htmlChanges.topBarChanges.buttonAttributes.onclickLogicChanges["App.selectTopBarTab('options')"]);

    // Button Text Changes (might be less relevant for JS/SCSS but included for completeness if text is referenced)
    // This would typically be handled in HTML directly or via templating.

    // Top Bar Right changes
    scssContent = applyReplacements(scssContent, htmlChanges.topBarChanges.topBarRightDivClasses);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.topBarChanges.topBarRightDivClasses);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.topBarChanges.topBarRightDivClasses);

    scssContent = applyReplacements(scssContent, htmlChanges.topBarChanges.topBarRightButtonIds);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.topBarChanges.topBarRightButtonIds);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.topBarChanges.topBarRightButtonIds);

    // Remove 'button-hidden' class
    scssContent = scssContent.split(htmlChanges.topBarChanges.topBarRightButtonClassesRemoved).join('');
    jsContent1 = jsContent1.split(htmlChanges.topBarChanges.topBarRightButtonClassesRemoved).join('');
    jsContent2 = jsContent2.split(htmlChanges.topBarChanges.topBarRightButtonClassesRemoved).join('');

    // Chin Section Changes
    scssContent = applyReplacements(scssContent, htmlChanges.chinChanges.chinIds);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.chinChanges.chinIds);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.chinChanges.chinIds);

    scssContent = applyReplacements(scssContent, htmlChanges.chinChanges.chinClasses);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.chinChanges.chinClasses);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.chinChanges.chinClasses);

    scssContent = applyReplacements(scssContent, htmlChanges.chinChanges.chinButtonIds);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.chinChanges.chinButtonIds);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.chinChanges.chinButtonIds);

    scssContent = applyReplacements(scssContent, htmlChanges.chinChanges.chinFileInputIds);
    jsContent1 = applyReplacements(jsContent1, htmlChanges.chinChanges.chinFileInputIds);
    jsContent2 = applyReplacements(jsContent2, htmlChanges.chinChanges.chinFileInputIds);

    // Textarea placeholder
    jsContent1 = jsContent1.split(htmlChanges.chinChanges.chinTextareaPlaceholders["Custom Story JS"]).join(htmlChanges.chinChanges.chinTextareaPlaceholders["Custom JS"]);
    jsContent2 = jsContent2.split(htmlChanges.chinChanges.chinTextareaPlaceholders["Custom Story JS"]).join(htmlChanges.chinChanges.chinTextareaPlaceholders["Custom JS"]);

    // Character Card Changes - this is complex and needs specific handling
    // For classes, apply replacements. For removed footer, it implies removing related JS/SCSS logic.
    scssContent = applyReplacements(scssContent, htmlChanges.chinChanges.characterCardChanges.oldClasses.reduce((acc, curr, idx) => {
        acc[curr] = htmlChanges.chinChanges.characterCardChanges.newClasses[idx];
        return acc;
    }, {}));
    // Removing JS/SCSS for removed elements/logic (like character card footer) is highly contextual
    // and would require deeper AST parsing or specific instructions.

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
            runLinter(`npx eslint ${JS_FILE_1} --fix`);
            runLinter(`npx eslint ${JS_FILE_2} --fix`);
            if (hasLinterErrors(runLinter(`npx eslint ${JS_FILE_1}`)) || hasLinterErrors(runLinter(`npx eslint ${JS_FILE_2}`))) {
                console.error("JavaScript errors persist after fix attempt.");
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
            runLinter(`npx stylelint ${SCSS_FILE} --fix`);
            if (hasLinterErrors(runLinter(`npx stylelint ${SCSS_FILE}`))) {
                console.error("SCSS errors persist after fix attempt. May require manual review or rule adjustments (e.g., PicoCSS specificity).");
            } else {
                console.log("SCSS errors fixed.");
            }
        } else {
            console.log("SCSS is clean. ✅");
        }

        console.log("HTML is assumed clean. ✅"); // HTML linting is done via htmlhint in package.json

        if (!hasErrors) {
            console.log("Codebase is clean! Taking a one-hour break.");
            execSync('sleep 3600'); // Use execSync for sleep in Node.js for shell command
            console.log("Resuming operations after break.");
        } else {
            console.log("Errors persist. Re-running linting cycle immediately to resolve remaining issues.");
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
