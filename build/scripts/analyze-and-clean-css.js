#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

/**
 * CSS Analyzer and Cleaner for the project.
 *
 * Combines performance analysis and cleanup operations using PostCSS for robust parsing.
 * - Analyzes selector complexity, specificity, and redundancy.
 * - Cleans the CSS by removing comments and extra whitespace.
 * - Generates a comprehensive JSON report.
 */

// --- Pure Analysis Functions ---

/**
 * Finds rules with empty or minimal declarations.
 * @param {postcss.Root} ast The PostCSS Abstract Syntax Tree.
 * @returns {string[]} An array of selectors for potentially unused rules.
 */
function findUnusedRules(ast) {
    const unusedRules = [];
    ast.walkRules(rule => {
        const properties = rule.nodes.map(node => node.toString()).join('').trim();
        if (rule.nodes.length === 0 || properties.length < 10 || properties.includes('/* empty */')) {
            unusedRules.push(rule.selector);
        }
    });
    return unusedRules;
}

/**
 * Analyzes all selectors in the CSS.
 * @param {postcss.Root} ast The PostCSS Abstract Syntax Tree.
 * @returns {{total: number, selectors: string[], specificityBreakdown: {selector: string, specificity: number}[]}}
 */
function analyzeTotalSelectors(ast) {
    const selectors = [];
    ast.walkRules(rule => {
        // Handle multiple selectors like 'h1, h2'
        rule.selectors.forEach(selector => selectors.push(selector));
    });

    return {
        total: selectors.length,
        selectors: selectors,
        specificityBreakdown: selectors.map(selector => ({
            selector,
            specificity: calculateSpecificity(selector)
        })).sort((a, b) => b.specificity - a.specificity)
    };
}

/**
 * Finds selectors that are defined more than once.
 * @param {postcss.Root} ast The PostCSS Abstract Syntax Tree.
 * @returns {{selector: string, count: number}[]}
 */
function findRedundantSelectors(ast) {
    const selectorCounts = {};
    ast.walkRules(rule => {
        rule.selectors.forEach(selector => {
            selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
        });
    });

    return Object.entries(selectorCounts)
        .filter(([_, count]) => count > 1)
        .map(([selector, count]) => ({ selector, count }));
}

/**
 * Calculates a simplified specificity score for a given selector.
 * Note: This is a basic implementation and does not account for attribute selectors,
 * pseudo-classes, pseudo-elements, or the universal selector. For a more robust
 * solution, a dedicated library like `specificity` would be required.
 * @param {string} selector The CSS selector to analyze.
 * @returns {number} The calculated specificity score.
 */
function calculateSpecificity(selector) {
    const idMatches = (selector.match(/#/g) || []).length * 100;
    const classMatches = (selector.match(/\./g) || []).length * 10;
    const elementMatches = (selector.match(/^[a-z]+|\s[a-z]+/g) || []).length;
    return idMatches + classMatches + elementMatches;
}


class CSSAnalyzerAndCleaner {
    constructor(cssFilePath) {
        this.cssFilePath = cssFilePath;
        this.originalContent = fs.readFileSync(cssFilePath, 'utf8');
        this.ast = postcss.parse(this.originalContent);
    }

    cleanupCSS(writeToFile = false) {
        // This method still operates on the string content for simplicity.
        let cleanedContent = this.originalContent
            .replace(/\/\*\s*Migrated to atomic class:.*?\*\/\s*/g, '') // Remove migration comments
            .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
            .replace(/\s+$/gm, '') // Trim trailing whitespace
            .trim();

        if (writeToFile) {
            fs.writeFileSync(this.cssFilePath, cleanedContent);
            console.log(`CSS file cleaned: ${this.cssFilePath}`);
            // Re-parse the AST with the cleaned content if we want subsequent analysis to be accurate
            this.ast = postcss.parse(cleanedContent);
        }
        return cleanedContent;
    }

    generateReport() {
        const cleanedContent = this.cleanupCSS(false); // Get a theoretical cleaned version for size comparison

        return {
            // Cleanup metrics
            originalSize: this.originalContent.length,
            cleanedSize: cleanedContent.length,
            sizeReduction: Math.round((1 - cleanedContent.length / this.originalContent.length) * 100),
            // Analysis metrics from pure functions operating on the AST
            potentiallyUnusedRules: findUnusedRules(this.ast),
            totalSelectors: analyzeTotalSelectors(this.ast).total,
            topSpecificSelectors: analyzeTotalSelectors(this.ast).specificityBreakdown.slice(0, 10),
            redundantSelectors: findRedundantSelectors(this.ast),
            recommendations: [
                'Consider using more utility classes',
                'Reduce selector specificity where possible',
                'Remove unused CSS rules',
                'Use CSS custom properties for consistent theming'
            ]
        };
    }

    outputReport(writeToFile = false) {
        const report = this.generateReport();
        const reportString = JSON.stringify(report, null, 2);
        console.log('CSS Analysis & Cleanup Report:');
        console.log(reportString);

        if (writeToFile) {
            const outputPath = path.join(path.dirname(this.cssFilePath), 'css-analysis-report.json');
            fs.writeFileSync(outputPath, reportString);
            console.log(`\nReport saved to: ${outputPath}`);
        }
    }
}

// Main execution block
if (require.main === module) {
    const cssPath = path.join(__dirname, '../../apps/rpglitch/html/RPGlitch.css');

    if (!fs.existsSync(cssPath)) {
        console.error(`Error: CSS file not found at ${cssPath}`);
        process.exit(1);
    }

    const analyzer = new CSSAnalyzerAndCleaner(cssPath);

    // Perform both actions: clean the file and write a report.
    analyzer.cleanupCSS(true);
    analyzer.outputReport(true);
}

module.exports = CSSAnalyzerAndCleaner;
