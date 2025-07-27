# Test Globs Tools

This folder contains testing utilities for verifying glob pattern matching in Cursor rules.

## Files

- **test-globs-verification.js** - Main verification script for testing glob patterns
- **test-rule-activation.js** - Script to test rule activation based on file types
- **test-globs.md** - Test markdown file for glob pattern verification
- **test-globs.js** - Test JavaScript file for glob pattern verification  
- **test-globs.scss** - Test SCSS file for glob pattern verification

## Usage

Run the verification script to test if glob patterns in `.cursor/rules/` files are working correctly:

```bash
node tools/test-globs/test-globs-verification.js
```

This will test all the glob patterns defined in the rule files against the test files in this directory.
