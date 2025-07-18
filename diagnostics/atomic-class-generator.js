#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AtomicClassGenerator {
    constructor(cssFilePath) {
        this.cssFilePath = cssFilePath;
        this.cssContent = fs.readFileSync(cssFilePath, 'utf8');
        this.designTokens = this.extractDesignTokens();
    }

    /**
     * Extract design tokens from CSS variables
     * @returns {Object} Parsed design tokens
     */
    extractDesignTokens() {
        const tokens = {
            spacing: [],
            fontSize: [],
            colors: [],
            borderRadius: []
        };

        // Extract spacing tokens
        const spacingMatches = this.cssContent.match(/--([a-z-]+)-spacing:\s*([^;]+);/g) || [];
        tokens.spacing = spacingMatches.map(match => {
            const [, name, value] = match.match(/--([a-z-]+)-spacing:\s*([^;]+);/);
            return { name, value };
        });

        // Extract font size tokens
        const fontSizeMatches = this.cssContent.match(/--font-size-[a-z0-9-]+:\s*([^;]+);/g) || [];
        tokens.fontSize = fontSizeMatches.map(match => {
            const [, value] = match.match(/--font-size-([a-z0-9-]+):\s*([^;]+);/);
            return { name: `font-size-${value}`, value };
        });

        // Color token extraction
        const colorMatches = this.cssContent.match(/--([a-z-]+)-color:\s*([^;]+);/g) || [];
        tokens.colors = colorMatches.map(match => {
            const [, name, value] = match.match(/--([a-z-]+)-color:\s*([^;]+);/);
            return { name, value };
        });

        // Border radius token extraction
        const borderRadiusMatches = this.cssContent.match(/--([a-z-]+)-border-radius:\s*([^;]+);/g) || [];
        tokens.borderRadius = borderRadiusMatches.map(match => {
            const [, name, value] = match.match(/--([a-z-]+)-border-radius:\s*([^;]+);/);
            return { name, value };
        });

        return tokens;
    }

    /**
     * Generate additional atomic utility classes
     * @returns {string} Generated CSS utility classes
     */
    generateAtomicClasses() {
        let atomicClasses = '/* Dynamically Generated Atomic Utility Classes */\n\n';

        // Spacing utilities
        atomicClasses += '/* Margin Utilities */\n';
        [0, 0.25, 0.5, 1, 1.5, 2].forEach(size => {
            atomicClasses += `.m-${size.toString().replace('.', '-')} { margin: ${size}rem; }\n`;
            atomicClasses += `.mx-${size.toString().replace('.', '-')} { margin-left: ${size}rem; margin-right: ${size}rem; }\n`;
            atomicClasses += `.my-${size.toString().replace('.', '-')} { margin-top: ${size}rem; margin-bottom: ${size}rem; }\n`;
        });

        // Padding utilities
        atomicClasses += '\n/* Padding Utilities */\n';
        [0, 0.25, 0.5, 1, 1.5, 2].forEach(size => {
            atomicClasses += `.p-${size.toString().replace('.', '-')} { padding: ${size}rem; }\n`;
            atomicClasses += `.px-${size.toString().replace('.', '-')} { padding-left: ${size}rem; padding-right: ${size}rem; }\n`;
            atomicClasses += `.py-${size.toString().replace('.', '-')} { padding-top: ${size}rem; padding-bottom: ${size}rem; }\n`;
        });

        // Color utilities
        atomicClasses += '\n/* Color Utilities */\n';
        const colorVariants = ['bg', 'text'];
        this.designTokens.colors.forEach(color => {
            colorVariants.forEach(variant => {
                atomicClasses += `.${variant}-${color.name} { ${variant === 'bg' ? 'background-color' : 'color'}: var(--${color.name}); }\n`;
            });
        });

        // Border radius utilities
        atomicClasses += '\n/* Border Radius Utilities */\n';
        [0, 0.25, 0.5, 1].forEach(size => {
            atomicClasses += `.rounded-${size.toString().replace('.', '-')} { border-radius: ${size}rem; }\n`;
        });

        // Responsive visibility utilities
        atomicClasses += '\n/* Responsive Visibility Utilities */\n';
        ['sm', 'md', 'lg'].forEach(breakpoint => {
            ['hidden', 'block', 'flex', 'inline-block'].forEach(display => {
                atomicClasses += `@media (max-width: ${breakpoint === 'sm' ? 640 : breakpoint === 'md' ? 768 : 1024}px) {\n`;
                atomicClasses += `  .${breakpoint}\\:${display} { display: ${display}; }\n`;
                atomicClasses += `}\n`;
            });
        });

        return atomicClasses;
    }

    /**
     * Append generated atomic classes to CSS file
     * @param {boolean} [writeToFile=false] Whether to write changes back to file
     */
    appendAtomicClasses(writeToFile = false) {
        const generatedClasses = this.generateAtomicClasses();
        
        if (writeToFile) {
            fs.appendFileSync(this.cssFilePath, '\n' + generatedClasses);
            console.log(`Atomic classes appended to: ${this.cssFilePath}`);
        }

        return generatedClasses;
    }

    /**
     * Generate a report of generated atomic classes
     * @returns {Object} Report of generated classes
     */
    generateReport() {
        const generatedClasses = this.generateAtomicClasses();
        
        return {
            totalGeneratedClasses: (generatedClasses.match(/\./g) || []).length,
            classTypes: {
                margin: (generatedClasses.match(/\.m-/g) || []).length,
                padding: (generatedClasses.match(/\.p-/g) || []).length,
                color: (generatedClasses.match(/\.(bg|text)-/g) || []).length,
                borderRadius: (generatedClasses.match(/\.rounded-/g) || []).length,
                responsive: (generatedClasses.match(/@media/g) || []).length
            }
        };
    }

    /**
     * Output generation report
     * @param {boolean} [writeToFile=false] Whether to write report to a file
     */
    outputReport(writeToFile = false) {
        const report = this.generateReport();
        const reportString = JSON.stringify(report, null, 2);

        console.log('Atomic Class Generation Report:');
        console.log(reportString);

        if (writeToFile) {
            const outputPath = path.join(__dirname, 'atomic-class-report.json');
            fs.writeFileSync(outputPath, reportString);
            console.log(`\nReport saved to: ${outputPath}`);
        }
    }
}

// Run generator if script is called directly
if (require.main === module) {
    const cssPath = path.join(__dirname, '../RPGlitch/RPGlitch.css');
    const generator = new AtomicClassGenerator(cssPath);
    generator.appendAtomicClasses(true);
    generator.outputReport(true);
}

module.exports = AtomicClassGenerator; 