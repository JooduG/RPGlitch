#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const postcss = require('postcss');
const sass = require('sass');
const autoprefixer = require('autoprefixer');

async function compileScssToString() {
    const scssPath = path.join(__dirname, '../../apps/rpglitch/scss/index.scss');
    const picoCssPath = path.resolve(__dirname, "..", "..", "build", "local_libs", "pico.min.css");

    if (!fs.existsSync(scssPath)) {
        throw new Error(`SCSS file not found at ${scssPath}`);
    }

    const picoCss = fs.readFileSync(picoCssPath, "utf8");
    const sassResult = sass.compile(scssPath);
    const combinedCss = picoCss + '\n' + sassResult.css;
    const postcssResult = await postcss([autoprefixer]).process(combinedCss, { from: undefined });
    return postcssResult.css;
}

// --- PURE ANALYSIS FUNCTIONS (from CSSAnalyzerAndCleaner) ---

/**
 * Calculates a simplified specificity score for a given selector.
 * Note: This is a basic implementation.
 * @param {string} selector The CSS selector to analyze.
 * @returns {number} The calculated specificity score.
 */
function calculateSpecificity(selector) {
    const idMatches = (selector.match(/#/g) || []).length * 100;
    const classMatches = (selector.match(/\./g) || []).length * 10;
    const elementMatches = (selector.match(/^[a-z]+|\s[a-z]+/g) || []).length;
    return idMatches + classMatches + elementMatches;
}

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
 * @returns {{total: number, specificityBreakdown: {selector: string, specificity: number}[]}}
 */
function analyzeTotalSelectors(ast) {
    const selectors = [];
    ast.walkRules(rule => {
        rule.selectors.forEach(selector => selectors.push(selector));
    });

    return {
        total: selectors.length,
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


// --- MAIN BUILD PIPELINE CLASS (Combination) ---

class CSSBuildPipeline {
    constructor(cssFilePath, originalContent = null) {
        this.cssFilePath = cssFilePath;
        this.originalContent = originalContent || fs.readFileSync(cssFilePath, 'utf8');
        this.ast = postcss.parse(this.originalContent);
        this.cleanedContent = this.originalContent; // Placeholder
        this.finalContent = this.originalContent;   // Placeholder
        this.designTokens = this.extractDesignTokens(this.ast);
        this.initialAnalysis = {};
        this.finalAnalysis = {};
    }

    /**
     * Extracts design tokens from a given CSS string.
     * @param {postcss.Root} ast The PostCSS Abstract Syntax Tree.
     * @returns {Object} Parsed design tokens.
     */
    extractDesignTokens(ast) {
        const tokens = { spacing: [], fontSize: [], colors: [], borderRadius: [] };

        ast.walkDecls(decl => {
            if (decl.prop.startsWith('--')) {
                const name = decl.prop.substring(2); // remove --
                if (name.includes('spacing')) {
                    tokens.spacing.push({ name });
                } else if (name.includes('color')) {
                    tokens.colors.push({ name });
                } else if (name.includes('font-size')) {
                    tokens.fontSize.push({ name });
                } else if (name.includes('border-radius')) {
                    tokens.borderRadius.push({ name });
                }
            }
        });

        return tokens;
    }

    /**
     * Step 1: Cleans the CSS by removing comments and unnecessary newlines.
     */
    runCleanup() {
        // Run initial analysis before cleaning to report on the *original* file quality
        this.initialAnalysis = {
            totalSelectors: analyzeTotalSelectors(this.ast).total,
            topSpecificSelectors: analyzeTotalSelectors(this.ast).specificityBreakdown.slice(0, 5),
            redundantSelectors: findRedundantSelectors(this.ast),
            potentiallyUnusedRules: findUnusedRules(this.ast)
        };


        this.cleanedContent = this.originalContent
            .replace(/\/\*\s*Migrated to atomic class:.*?\*\/\s*/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s+$/gm, '')
            .trim();

        console.log("✅ Cleanup complete: Comments and excess whitespace removed.");
    }

    /**
     * Step 2: Generates and appends atomic utility classes.
     * @returns {string} The generated classes.
     */
    generateAtomicClasses() {
        let atomicClasses = "\n\n/* --- DYNAMICALLY GENERATED ATOMIC UTILITIES --- */\n\n";

        // --- MARGIN/PADDING (Hard-coded) ---
        [0, 0.25, 0.5, 1, 1.5, 2].forEach((size) => {
            const sizeStr = size.toString().replace(".", "-");
            atomicClasses += `.m-${sizeStr} { margin: ${size}rem; }\n`;
            atomicClasses += `.p-${sizeStr} { padding: ${size}rem; }\n`;
        });

        // --- COLOR UTILITIES (From Extracted Tokens) ---
        atomicClasses += "\n/* Color Utilities from Design Tokens */\n";
        const colorVariants = ["bg", "text"];
        this.designTokens.colors.forEach((color) => {
            colorVariants.forEach((variant) => {
                atomicClasses += `.${variant}-${color.name} { ${variant === "bg" ? "background-color" : "color"
                    }: var(--${color.name}-color); }\n`;
            });
        });

        // --- RESPONSIVE UTILITIES (Hard-coded) ---
        atomicClasses += "\n/* Responsive Display */\n";
        atomicClasses += `@media (max-width: 768px) { .md\\:hidden { display: none; } }\n`;

        return atomicClasses;
    }

    /**
     * Step 3: Executes the full build pipeline and writes the file.
     * @param {boolean} [writeToFile=false] Whether to write the final CSS and reports to disk.
     */
    runBuild(writeToFile = false) {
        this.runCleanup();
        const generatedClasses = this.generateAtomicClasses();
        this.finalContent = this.cleanedContent + generatedClasses;

        // Run final analysis on the *combined* content
        const astFinal = postcss.parse(this.finalContent);
        this.finalAnalysis = analyzeTotalSelectors(astFinal);

        // Count generated classes for the report
        const generatedClassCount = (generatedClasses.match(/\./g) || []).length;

        if (writeToFile) {
            fs.writeFileSync(this.cssFilePath, this.finalContent, 'utf8');
            console.log(`\n🎉 Build complete. Final CSS file written to: ${this.cssFilePath}`);
            this.outputReport();
        }

        return { initialAnalysis: this.initialAnalysis, finalContent: this.finalContent, generatedClasses: generatedClassCount };
    }


    /**
     * Outputs the final consolidated report.
     */
    outputReport() {
        const report = {
            metadata: {
                targetFile: path.basename(this.cssFilePath),
                buildTimestamp: new Date().toISOString(),
            },
            sizeMetrics: {
                originalSize: this.originalContent.length,
                cleanedSize: this.cleanedContent.length,
                finalSize: this.finalContent.length,
                sizeReductionPercent: Math.round((1 - this.cleanedContent.length / this.originalContent.length) * 100),
                totalGeneratedClasses: (this.finalContent.match(/\.m-/g) || []).length + (this.finalContent.match(/\.(bg|text)-/g) || []).length // Simplified count
            },
            qualityAnalysis_Initial: this.initialAnalysis,
            qualityAnalysis_Final: {
                totalSelectors_Final: this.finalAnalysis.total,
                topSpecificSelectors_Final: this.finalAnalysis.specificityBreakdown.slice(0, 5),
                // Note: Redundancy check on the FINAL output should ideally be done before generation, but included here for completeness
            },
            recommendations: [
                'Continue migration to auto-generated utility classes to simplify hand-written CSS.',
                'Inspect initial redundancy report for opportunities to combine rules before cleanup.',
                'Ensure Pico.css components are minimally overridden to maintain low final specificity.'
            ]
        };

        const outputPath = path.join(path.dirname(this.cssFilePath), 'css-build-report.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
        console.log(`\n📝 Consolidated Report saved to: ${outputPath}`);
    }
}

// Main execution block
if (require.main === module) {
    (async () => {
        try {
            const cssContent = await compileScssToString();
            const pipeline = new CSSBuildPipeline('in-memory.css', cssContent); // Pass content directly
            const report = pipeline.runBuild(false); // Run the pipeline without writing to disk
            console.log(JSON.stringify(report.initialAnalysis, null, 2));
        } catch (error) {
            console.error("❌ An error occurred during the CSS build pipeline:", error);
            process.exit(1);
        }
    })();
}

module.exports = CSSBuildPipeline;