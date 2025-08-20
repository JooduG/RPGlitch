#!/usr/bin/env node

/**
 * Glob Pattern Testing for Cursor Rules
 * Tests which rules should apply to which files based on glob patterns
 */

const fs = require('fs');
const path = require('path');

// Test files to verify
const testFiles = [
    'test.md',
    'test.js', 
    'test.scss',
    'test.html'
];

// Rules with their glob patterns
const rules = {
    // General rules
    'thinking-framework.md': ['**/*.md', '**/*.mdc'],
    'memory-bank-optimization.md': ['**/*.md', '**/*.mdc'],
    'mcp-time.md': ['**/*.md', '**/*.mdc'],
    
    // JavaScript rules
    'js-development.md': ['**/*.js', '**/*.mjs', '**/*.ts'],
    'js-cash-dom-usage.md': ['**/*.js'],
    'js-dexie-usage.md': ['**/*.js'],
    'js-indexeddb-principles.md': ['**/*.js', '**/*.ts', '**/*.html'],
    
    // SCSS rules
    'scss-advanced-patterns.md': ['**/*.scss', '**/*.sass', '**/*.css'],
    'scss-debugging.md': ['**/*.scss', '**/*.sass', '**/*.css'],
    
    // HTML rules
    'html-development.md': ['**/*.html'],
    'html-hyperscript-usage.md': ['**/*.html'],
    
    // Perchance rules
    'perchance-architecture.md': ['**/apps/**'],
    'perchance-build-deployment.md': ['**/apps/**']
};

/**
 * Simple glob pattern matcher
 */
function matchesGlob(filename, pattern) {
    if (pattern === '**/apps/**') {
        return filename.includes('apps/');
    }
    
    const extensions = {
        '**/*.md': '.md',
        '**/*.mdc': '.mdc',
        '**/*.js': '.js',
        '**/*.ts': '.ts',
        '**/*.scss': '.scss',
        '**/*.css': '.css',
        '**/*.html': '.html',
        '**/*.json': '.json'
    };
    
    return extensions[pattern] ? filename.endsWith(extensions[pattern]) : false;
}

/**
 * Test which rules match each file
 */
function testGlobMatching() {
    console.log('🧪 GLOB PATTERN TESTING RESULTS\n');
    
    const results = {};
    
    for (const testFile of testFiles) {
        console.log(`📁 Testing file: ${testFile}`);
        
        const matchingRules = [];
        
        for (const [ruleName, patterns] of Object.entries(rules)) {
            for (const pattern of patterns) {
                if (matchesGlob(testFile, pattern)) {
                    matchingRules.push({ rule: ruleName, pattern });
                    break;
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
        console.log('');
    }
    
    return results;
}

// Jest tests
describe('Glob Pattern Matching', () => {
    test('JavaScript files match JS rules', () => {
        expect(matchesGlob('test.js', '**/*.js')).toBe(true);
        expect(matchesGlob('test.js', '**/*.scss')).toBe(false);
    });
    
    test('SCSS files match SCSS rules', () => {
        expect(matchesGlob('test.scss', '**/*.scss')).toBe(true);
        expect(matchesGlob('test.scss', '**/*.js')).toBe(false);
    });
    
    test('Markdown files match markdown rules', () => {
        expect(matchesGlob('test.md', '**/*.md')).toBe(true);
        expect(matchesGlob('test.md', '**/*.js')).toBe(false);
    });
    
    test('HTML files match HTML rules', () => {
        expect(matchesGlob('test.html', '**/*.html')).toBe(true);
        expect(matchesGlob('test.html', '**/*.scss')).toBe(false);
    });
});

// Run tests if called directly
if (require.main === module) {
    testGlobMatching();
}

module.exports = { testGlobMatching, matchesGlob, rules, testFiles };