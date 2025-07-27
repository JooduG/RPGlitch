// Test JavaScript File
// This is a test file to verify that glob patterns are working correctly

/**
 * Test function to verify JavaScript glob patterns
 * This file should match ** /*.js patterns 
 */
function testGlobPatterns() {
    console.log('Testing glob patterns for JavaScript files');
    
    // This file should be matched by rules with these glob patterns:
    // - ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx", "**/*.html", "**/*.css", "**/*.scss"]
    // - ["**/*.js", "**/*.mjs", "**/*.ts"]
    // - ["**/*.js"]
    
    return {
        testDate: '2025-07-24 (from Time MCP)',
        purpose: 'Testing glob patterns and frontmatter functionality',
        fileType: 'JavaScript',
        expectedRules: [
            'role-assistant.mdc',
            'js-development.mdc',
            'js-cash-dom-usage.mdc',
            'js-dexie-usage.mdc',
            'js-dom-manipulation.mdc',
            'js-ecosystem-overview.mdc',
            'js-indexeddb-principles.mdc',
            'js-modern-apis.mdc',
            'js-modern-features.mdc',
            'js-patterns-practices.mdc',
            'js-storage-strategy.mdc'
        ]
    };
}

// Export for testing
module.exports = { testGlobPatterns };