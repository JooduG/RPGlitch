#!/usr/bin/env node

/**
 * Glob Pattern Testing Script
 * Tests which rules should apply to which files based on glob patterns
 */

// Test files to verify
const testFiles = [
    'test-globs.md',
    'test-globs.js', 
    'test-globs.scss'
];

// Rules with their glob patterns (extracted from the analysis)
const rules = {
    // General rules
    'thinking-framework.mdc': ['**/*.md', '**/*.mdc'],
    'thinking-contemplative.mdc': ['**/*.md', '**/*.mdc'],
    'mode-system.mdc': ['**/*.md', '**/*.mdc'],
    'mode-system-enhanced.mdc': ['**/*.md', '**/*.mdc'],
    'mode-orchestrator.mdc': ['**/*.md', '**/*.mdc'],
    'mode-complexity-routing.mdc': ['**/*.md', '**/*.mdc'],
    'memory-bank-optimization.mdc': ['**/*.md', '**/*.mdc'],
    'mcp-time.mdc': ['**/*.md', '**/*.mdc'],
    'mcp-sequential-thinking.mdc': ['**/*.md', '**/*.mdc'],
    'mcp-comprehensive-guide.mdc': ['**/*.md', '**/*.mdc', '**/*.json'],
    'role-3-strategist.mdc': ['**/*.md', '**/*.mdc'],
    'role-2-tactician.mdc': ['**/*.md', '**/*.mdc'],
    'role-1-operator.mdc': ['**/*.md', '**/*.mdc'],
    
    // JavaScript rules
    'js-development.mdc': ['**/*.js', '**/*.mjs', '**/*.ts'],
    'js-cash-dom-usage.mdc': ['**/*.js'],
    'js-dexie-usage.mdc': ['**/*.js'],
    'js-indexeddb-principles.mdc': ['**/*.js', '**/*.ts', '**/*.html'],
    
    // SCSS rules
    'scss-development.mdc': ['**/*.css', '**/*.scss', '**/*.sass'],
    'scss-debugging.mdc': ['**/*.scss', '**/*.sass', '**/*.css'],
    'scss-advanced-patterns.mdc': ['**/*.scss', '**/*.sass', '**/*.css'],
    'scss-pico-usage.mdc': ['**/*.css', '**/*.scss', '**/*.sass'],
    
    // HTML rules
    'html-development.mdc': ['**/*.html'],
    'html-hyperscript-usage.mdc': ['**/*.html'],
    
    // Role rules with broader patterns
    'role-assistant.mdc': ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.html', '**/*.css', '**/*.scss'],
    'role-project-manager.mdc': ['**/*.md', '**/*.mdc', '**/*.js', '**/*.ts', '**/*.php', '**/*.sql'],
    
    // MCP rules
    'mcp-context7.mdc': ['**/*.md', '**/*.mdc', '**/*.js', '**/*.ts'],
    
    // Perchance rules
    'perchance-architecture.mdc': ['**/apps/**'],
    'perchance-development-workflow.mdc': ['**/apps/**'],
    'perchance-build-deployment.mdc': ['**/apps/**'],
    'perchance-plugin-system.mdc': ['**/apps/**']
};

/**
 * Simple glob pattern matcher
 * Supports basic glob patterns like **\/*.ext
 */
function matchesGlob(filename, pattern) {
    // Handle special cases
    if (pattern === '**/apps/**') {
        return filename.includes('apps/');
    }
    
    // Simple pattern matching for common cases
    if (pattern === '**/*.md') {
        return filename.endsWith('.md');
    }
    if (pattern === '**/*.mdc') {
        return filename.endsWith('.mdc');
    }
    if (pattern === '**/*.js') {
        return filename.endsWith('.js');
    }
    if (pattern === '**/*.ts') {
        return filename.endsWith('.ts');
    }
    if (pattern === '**/*.scss') {
        return filename.endsWith('.scss');
    }
    if (pattern === '**/*.css') {
        return filename.endsWith('.css');
    }
    if (pattern === '**/*.html') {
        return filename.endsWith('.html');
    }
    if (pattern === '**/*.json') {
        return filename.endsWith('.json');
    }
    
    // For other patterns, use regex conversion
    let regexPattern = pattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*\*/g, '.*') // ** becomes .*
        .replace(/\*/g, '[^/]*'); // * becomes [^/]*
    
    // For debugging
    console.log(`Testing: "${filename}" against pattern "${pattern}" -> regex "${regexPattern}"`);
    
    const regex = new RegExp(`^${regexPattern}$`);
    const result = regex.test(filename);
    console.log(`Result: ${result}`);
    return result;
}

/**
 * Test which rules match each file
 */
function testGlobMatching() {
    console.log('🧪 GLOB PATTERN TESTING RESULTS\n');
    console.log('=' .repeat(60));
    
    const results = {};
    
    for (const testFile of testFiles) {
        console.log(`\n📁 Testing file: ${testFile}`);
        console.log('-'.repeat(40));
        
        const matchingRules = [];
        
        for (const [ruleName, patterns] of Object.entries(rules)) {
            for (const pattern of patterns) {
                if (matchesGlob(testFile, pattern)) {
                    matchingRules.push({
                        rule: ruleName,
                        pattern: pattern
                    });
                    break; // Found a match, no need to check other patterns for this rule
                }
            }
        }
        
        results[testFile] = matchingRules;
        
        if (matchingRules.length === 0) {
            console.log('❌ No matching rules found');
        } else {
            console.log(`✅ ${matchingRules.length} matching rules:`);
            matchingRules.forEach(({rule, pattern}) => {
                console.log(`   • ${rule} (pattern: ${pattern})`);
            });
        }
    }
    
    return results;
}

/**
 * Generate summary report
 */
function generateSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY REPORT');
    console.log('='.repeat(60));
    
    const ruleUsage = {};
    
    // Count how many files each rule matches
    for (const [filename, matches] of Object.entries(results)) {
        for (const match of matches) {
            if (!ruleUsage[match.rule]) {
                ruleUsage[match.rule] = [];
            }
            ruleUsage[match.rule].push(filename);
        }
    }
    
    console.log('\n📈 Rule Usage Statistics:');
    console.log('-'.repeat(40));
    
    const sortedRules = Object.entries(ruleUsage)
        .sort(([,a], [,b]) => b.length - a.length);
    
    for (const [rule, files] of sortedRules) {
        console.log(`${rule}: ${files.length} files (${files.join(', ')})`);
    }
    
    console.log('\n🎯 Testing Recommendations:');
    console.log('-'.repeat(40));
    
    // Check for potential issues
    const issues = [];
    
    // Check if any rules have very broad patterns
    for (const [rule, patterns] of Object.entries(rules)) {
        const broadPatterns = patterns.filter(p => p.includes('**/*.md') || p.includes('**/*.mdc'));
        if (broadPatterns.length > 0 && patterns.length === 1) {
            issues.push(`⚠️  ${rule} has very broad patterns: ${patterns.join(', ')}`);
        }
    }
    
    // Check for overlapping rules
    const overlappingRules = [];
    for (const [rule1, patterns1] of Object.entries(rules)) {
        for (const [rule2, patterns2] of Object.entries(rules)) {
            if (rule1 !== rule2) {
                const commonPatterns = patterns1.filter(p => patterns2.includes(p));
                if (commonPatterns.length > 0) {
                    overlappingRules.push(`${rule1} ↔ ${rule2}: ${commonPatterns.join(', ')}`);
                }
            }
        }
    }
    
    if (issues.length > 0) {
        console.log('\n⚠️  Potential Issues:');
        issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    if (overlappingRules.length > 0) {
        console.log('\n🔄 Overlapping Rules:');
        overlappingRules.slice(0, 5).forEach(overlap => console.log(`   ${overlap}`));
        if (overlappingRules.length > 5) {
            console.log(`   ... and ${overlappingRules.length - 5} more`);
        }
    }
    
    console.log('\n✅ Testing Complete!');
}

// Run the tests
const results = testGlobMatching();
generateSummary(results);

// Export for potential use in other scripts
module.exports = { results, rules, testFiles, matchesGlob }; 