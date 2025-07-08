#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class CSSCleaner {
    constructor(cssFilePath) {
        this.cssFilePath = cssFilePath;
        this.cssContent = fs.readFileSync(cssFilePath, 'utf8');
    }

    /**
     * Remove commented migration notes
     * @returns {string} Cleaned CSS content
     */
    removeMigrationComments() {
        // Remove lines containing "Migrated to atomic class:"
        return this.cssContent.replace(/\/\*\s*Migrated to atomic class:.*?\*\/\s*/g, '');
    }

    /**
     * Identify potentially unused CSS rules
     * @returns {Array} Potentially unused selectors
     */
    findUnusedRules() {
        const unusedRules = [];
        const selectorRegex = /([^{]+)\s*{([^}]+)}/g;
        let match;

        while ((match = selectorRegex.exec(this.cssContent)) !== null) {
            const selector = match[1].trim();
            const properties = match[2].trim();

            // Check for empty or minimal rules
            if (properties.length < 10 || 
                properties.includes('/* empty */') || 
                /^\s*$/.test(properties)) {
                unusedRules.push(selector);
            }
        }

        return unusedRules;
    }

    /**
     * Clean up CSS file
     * @param {boolean} [writeToFile=false] Whether to write changes back to file
     * @returns {string} Cleaned CSS content
     */
    cleanupCSS(writeToFile = false) {
        let cleanedContent = this.removeMigrationComments();
        
        // Additional cleanup steps
        cleanedContent = cleanedContent
            .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
            .replace(/\s+$/gm, '')        // Trim trailing whitespace
            .trim();

        if (writeToFile) {
            fs.writeFileSync(this.cssFilePath, cleanedContent);
            console.log(`CSS file cleaned: ${this.cssFilePath}`);
        }

        return cleanedContent;
    }

    /**
     * Generate cleanup report
     * @returns {Object} Cleanup report
     */
    generateReport() {
        const unusedRules = this.findUnusedRules();

        return {
            unusedRules,
            originalSize: this.cssContent.length,
            cleanedSize: this.cleanupCSS().length,
            sizeReduction: Math.round((1 - this.cleanupCSS().length / this.cssContent.length) * 100)
        };
    }

    /**
     * Output cleanup report
     * @param {boolean} [writeToFile=false] Whether to write report to a file
     */
    outputReport(writeToFile = false) {
        const report = this.generateReport();
        const reportString = JSON.stringify(report, null, 2);

        console.log('CSS Cleanup Report:');
        console.log(reportString);

        if (writeToFile) {
            const outputPath = path.join(__dirname, 'css-cleanup-report.json');
            fs.writeFileSync(outputPath, reportString);
            console.log(`\nReport saved to: ${outputPath}`);
        }
    }
}

// Run cleanup if script is called directly
if (require.main === module) {
    const cssPath = path.join(__dirname, '../RPGlitch/RPGlitch.css');
    const cleaner = new CSSCleaner(cssPath);
    cleaner.cleanupCSS(true);
    cleaner.outputReport(true);
}

module.exports = CSSCleaner; 