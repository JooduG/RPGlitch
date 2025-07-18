#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CSS Performance Analyzer for RPGlitch Project
 * 
 * Purpose:
 * - Analyze CSS file for performance bottlenecks
 * - Provide insights into selector complexity
 * - Identify potential optimization opportunities
 * 
 * Key Metrics:
 * - Total number of selectors
 * - Selector specificity
 * - Redundant or overly complex selectors
 * - Unused CSS rules
 */
class CSSPerformanceAnalyzer {
    constructor(cssFilePath) {
        this.cssFilePath = cssFilePath;
        this.cssContent = fs.readFileSync(cssFilePath, 'utf8');
    }

    /**
     * Calculate selector specificity
     * @param {string} selector CSS selector to analyze
     * @returns {number} Specificity score
     */
    calculateSpecificity(selector) {
        const idMatches = (selector.match(/#/g) || []).length * 100;
        const classMatches = (selector.match(/\./g) || []).length * 10;
        const elementMatches = (selector.match(/^[a-z]+|\s[a-z]+/g) || []).length;
        return idMatches + classMatches + elementMatches;
    }

    /**
     * Analyze total number of selectors
     * @returns {Object} Selector analysis results
     */
    analyzeTotalSelectors() {
        const selectorRegex = /([^{]+)\s*{/g;
        const selectors = [];
        let match;

        while ((match = selectorRegex.exec(this.cssContent)) !== null) {
            selectors.push(match[1].trim());
        }

        return {
            total: selectors.length,
            selectors: selectors,
            specificityBreakdown: selectors.map(selector => ({
                selector,
                specificity: this.calculateSpecificity(selector)
            })).sort((a, b) => b.specificity - a.specificity)
        };
    }

    /**
     * Identify potentially redundant selectors
     * @returns {Array} Potentially redundant selectors
     */
    findRedundantSelectors() {
        const selectorCounts = {};
        const selectorRegex = /([^{]+)\s*{/g;
        let match;

        while ((match = selectorRegex.exec(this.cssContent)) !== null) {
            const selector = match[1].trim();
            selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
        }

        return Object.entries(selectorCounts)
            .filter(([_, count]) => count > 1)
            .map(([selector, count]) => ({ selector, count }));
    }

    /**
     * Generate performance report
     * @returns {Object} Comprehensive CSS performance report
     */
    generateReport() {
        const selectorAnalysis = this.analyzeTotalSelectors();
        const redundantSelectors = this.findRedundantSelectors();

        return {
            totalSelectors: selectorAnalysis.total,
            topSpecificSelectors: selectorAnalysis.specificityBreakdown.slice(0, 10),
            redundantSelectors,
            recommendations: [
                'Consider using more utility classes',
                'Reduce selector specificity where possible',
                'Remove unused CSS rules',
                'Use CSS custom properties for consistent theming'
            ]
        };
    }

    /**
     * Output report to console and optionally to a file
     * @param {boolean} [writeToFile=false] Whether to write report to a file
     */
    outputReport(writeToFile = false) {
        const report = this.generateReport();
        const reportString = JSON.stringify(report, null, 2);

        console.log('CSS Performance Analysis Report:');
        console.log(reportString);

        if (writeToFile) {
            const outputPath = path.join(__dirname, 'css-performance-report.json');
            fs.writeFileSync(outputPath, reportString);
            console.log(`\nReport saved to: ${outputPath}`);
        }
    }
}

// Run analysis if script is called directly
if (require.main === module) {
    const cssPath = path.join(__dirname, '../RPGlitch/RPGlitch.css');
    const analyzer = new CSSPerformanceAnalyzer(cssPath);
    analyzer.outputReport(true);
}

module.exports = CSSPerformanceAnalyzer; 