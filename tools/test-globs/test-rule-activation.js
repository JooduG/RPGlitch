/* eslint-disable */
// Test JavaScript file to check rule activation
// This file should trigger rules with globs: ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"]

/**
 * Test function to verify which rules are active
 * This should trigger JavaScript-related rules
 */
function testRuleActivation() {
    console.log('Testing rule activation for JavaScript files');
    
    // This should trigger rules like:
    // - js-development.mdc
    // - js-cash-dom-usage.mdc  
    // - js-dexie-usage.mdc
    // - role-assistant.mdc (has globs for JS files)
    // - mcp-context7.mdc (has globs for JS files)
    
    return {
        message: 'JavaScript rule activation test',
        timestamp: new Date().toISOString(),
        expectedRules: [
            'js-development.mdc',
            'js-cash-dom-usage.mdc',
            'js-dexie-usage.mdc',
            'role-assistant.mdc',
            'mcp-context7.mdc'
        ]
    };
}

// Test modern JavaScript features (js-development.mdc should help with this)
const modernJSFeatures = {
    // Optional chaining
    optionalChaining: obj?.property?.nested,
    
    // Nullish coalescing
    nullishCoalescing: value ?? 'default',
    
    // Array methods
    arrayMethods: [1, 2, 3].map(x => x * 2).filter(x => x > 2),
    
    // Template literals
    templateLiteral: `Current time: ${new Date().toLocaleTimeString()}`,
    
    // Destructuring
    destructuring: ({ a, b, ...rest } = {}) => ({ a, b, rest })
};

// Test Cash DOM usage (js-cash-dom-usage.mdc should help with this)
// Note: This would require Cash DOM to be available
const cashDOMExample = {
    // These are examples of what Cash DOM would provide
    selector: '$(".test-element")',
    manipulation: '$(".test-element").addClass("active")',
    events: '$(".test-element").on("click", handleClick)'
};

// Test Dexie.js usage (js-dexie-usage.mdc should help with this)
// Note: This would require Dexie.js to be available
const dexieExample = {
    // These are examples of what Dexie.js would provide
    database: 'const db = new Dexie("testDB")',
    operations: 'await db.table("items").add({ name: "test" })',
    queries: 'await db.table("items").where("name").equals("test").toArray()'
};

// Test the function
const result = testRuleActivation();
console.log('Rule activation test result:', result);
console.log('Modern JS features:', modernJSFeatures); 