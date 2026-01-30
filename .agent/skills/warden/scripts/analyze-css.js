#!/usr/bin/env node

import autoprefixer from "autoprefixer"
import fs from "fs"
import path from "path"
import postcss from "postcss"
import * as sass from "sass"
import { fileURLToPath } from "url"

// ESM replacement for __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function compileScssToString() {
    // UPDATED PATH: ../../../../src/mesmer/scss/app.scss
    const scssPath = path.join(
        __dirname,
        "../../../../src/mesmer/scss/app.scss"
    )
    // UPDATED PATH: ../../../../libs
    const picoCssPath = path.resolve(
        __dirname,
        "../../../..",
        "libs",
        "pico.min.css"
    )

    if (!fs.existsSync(scssPath)) {
        throw new Error(`SCSS file not found at ${scssPath}`)
    }

    let picoCss = ""
    if (fs.existsSync(picoCssPath)) {
        picoCss = fs.readFileSync(picoCssPath, "utf8")
    } else {
        console.warn(`Warning: Pico CSS not found at ${picoCssPath}`)
    }

    const sassResult = sass.compile(scssPath)
    const combinedCss = picoCss + "\n" + sassResult.css
    const postcssResult = await postcss([autoprefixer]).process(combinedCss, {
        from: undefined,
    })
    return postcssResult.css
}

// --- PURE ANALYSIS FUNCTIONS ---

function calculateSpecificity(selector) {
    const idMatches = (selector.match(/#/g) || []).length * 100
    const classMatches = (selector.match(/\./g) || []).length * 10
    const elementMatches = (selector.match(/^[a-z]+|\s[a-z]+/g) || []).length
    return idMatches + classMatches + elementMatches
}

function findUnusedRules(ast) {
    const unusedRules = []
    ast.walkRules((rule) => {
        const properties = rule.nodes
            .map((node) => node.toString())
            .join("")
            .trim()
        if (
            rule.nodes.length === 0 ||
            properties.length < 10 ||
            properties.includes("/* empty */")
        ) {
            unusedRules.push(rule.selector)
        }
    })
    return unusedRules
}

function analyzeTotalSelectors(ast) {
    const selectors = []
    ast.walkRules((rule) => {
        rule.selectors.forEach((selector) => selectors.push(selector))
    })

    return {
        total: selectors.length,
        specificityBreakdown: selectors
            .map((selector) => ({
                selector,
                specificity: calculateSpecificity(selector),
            }))
            .sort((a, b) => b.specificity - a.specificity),
    }
}

function findRedundantSelectors(ast) {
    const selectorCounts = {}
    ast.walkRules((rule) => {
        rule.selectors.forEach((selector) => {
            selectorCounts[selector] = (selectorCounts[selector] || 0) + 1
        })
    })

    return Object.entries(selectorCounts)
        .filter(([, count]) => count > 1)
        .map(([selector, count]) => ({ selector, count }))
}

// --- MAIN BUILD PIPELINE CLASS ---

export default class CSSBuildPipeline {
    constructor(cssFilePath, originalContent = null) {
        this.cssFilePath = cssFilePath
        this.originalContent =
            originalContent || fs.readFileSync(cssFilePath, "utf8")
        this.ast = postcss.parse(this.originalContent)
        this.cleanedContent = this.originalContent // Placeholder
        this.finalContent = this.originalContent // Placeholder
        this.designTokens = this.extractDesignTokens(this.ast)
        this.initialAnalysis = {}
        this.finalAnalysis = {}
    }

    extractDesignTokens(ast) {
        const tokens = {
            spacing: [],
            fontSize: [],
            colors: [],
            borderRadius: [],
        }

        ast.walkDecls((decl) => {
            if (decl.prop.startsWith("--")) {
                const name = decl.prop.substring(2) // remove --
                if (name.includes("spacing")) {
                    tokens.spacing.push({ name })
                } else if (name.includes("color")) {
                    tokens.colors.push({ name })
                } else if (name.includes("font-size")) {
                    tokens.fontSize.push({ name })
                } else if (name.includes("border-radius")) {
                    tokens.borderRadius.push({ name })
                }
            }
        })

        return tokens
    }

    runCleanup() {
        this.initialAnalysis = {
            totalSelectors: analyzeTotalSelectors(this.ast).total,
            topSpecificSelectors: analyzeTotalSelectors(
                this.ast
            ).specificityBreakdown.slice(0, 5),
            redundantSelectors: findRedundantSelectors(this.ast),
            potentiallyUnusedRules: findUnusedRules(this.ast),
        }

        this.cleanedContent = this.originalContent
            .replace(/\/\*\s*Migrated to atomic class:.*?\*\/\s*/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/\s+$/gm, "")
            .trim()

        console.log(
            "✅ Cleanup complete: Comments and excess whitespace removed."
        )
    }

    generateAtomicClasses() {
        let atomicClasses =
            "\n\n/* --- DYNAMICALLY GENERATED ATOMIC UTILITIES --- */\n\n"

        ;[0, 0.25, 0.5, 1, 1.5, 2].forEach((size) => {
            const sizeStr = size.toString().replace(".", "-")
            atomicClasses += `.m-${sizeStr} { margin: ${size}rem; }\n`
            atomicClasses += `.p-${sizeStr} { padding: ${size}rem; }\n`
        })

        atomicClasses += "\n/* Color Utilities from Design Tokens */\n"
        const colorVariants = ["bg", "text"]
        this.designTokens.colors.forEach((color) => {
            colorVariants.forEach((variant) => {
                atomicClasses += `.${variant}-${color.name} { ${
                    variant === "bg" ? "background-color" : "color"
                }: var(--${color.name}-color); }\n`
            })
        })

        atomicClasses += "\n/* Responsive Display */\n"
        atomicClasses += `@media (max-width: 768px) { .md\\:hidden { display: none; } }\n`

        return atomicClasses
    }

    runBuild(writeToFile = false) {
        this.runCleanup()
        const generatedClasses = this.generateAtomicClasses()
        this.finalContent = this.cleanedContent + generatedClasses

        const astFinal = postcss.parse(this.finalContent)
        this.finalAnalysis = analyzeTotalSelectors(astFinal)

        const generatedClassCount = (generatedClasses.match(/\./g) || []).length

        if (writeToFile) {
            fs.writeFileSync(this.cssFilePath, this.finalContent, "utf8")
            console.log(
                `\n🎉 Build complete. Final CSS file written to: ${this.cssFilePath}`
            )
            this.outputReport()
        }

        return {
            initialAnalysis: this.initialAnalysis,
            finalContent: this.finalContent,
            generatedClasses: generatedClassCount,
        }
    }

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
                sizeReductionPercent: Math.round(
                    (1 -
                        this.cleanedContent.length /
                            this.originalContent.length) *
                        100
                ),
                totalGeneratedClasses:
                    (this.finalContent.match(/\.m-/g) || []).length +
                    (this.finalContent.match(/\.(bg|text)-/g) || []).length,
            },
            qualityAnalysis_Initial: this.initialAnalysis,
            qualityAnalysis_Final: {
                totalSelectors_Final: this.finalAnalysis.total,
                topSpecificSelectors_Final:
                    this.finalAnalysis.specificityBreakdown.slice(0, 5),
            },
            recommendations: [
                "Continue migration to auto-generated utility classes to simplify hand-written CSS.",
                "Inspect initial redundancy report for opportunities to combine rules before cleanup.",
            ],
        }

        const outputPath = path.join(
            path.dirname(this.cssFilePath),
            "css-build-report.json"
        )
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8")
        console.log(`\n📝 Consolidated Report saved to: ${outputPath}`)
    }
}

// Main execution block (ESM compatible)
// In ESM, import.meta.url is the current file URL.
// process.argv[1] is the entry point file path.
// We compare them to check if this file is being run directly.

import { pathToFileURL } from "url"

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    ;(async () => {
        try {
            console.log(`🔍 Analyzing SCSS/CSS...`)
            const cssContent = await compileScssToString()
            const pipeline = new CSSBuildPipeline("in-memory.css", cssContent)
            const report = pipeline.runBuild(false)
            console.log(JSON.stringify(report.initialAnalysis, null, 2))
        } catch (error) {
            console.error(
                "❌ An error occurred during the CSS build pipeline:",
                error
            )
            process.exit(1)
        }
    })()
}
