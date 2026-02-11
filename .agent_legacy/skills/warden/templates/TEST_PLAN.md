# 🧪 Test Plan: {{feature_name}}

## 1. Unit Tests (Vitest)

**Location**: `src/core/tests/{{feature}}.test.js`

- [ ] **Happy Path**: Verify standard input returns expected state.
- [ ] **Edge Case**: Verify `null`, `undefined`, or empty array inputs.
- [ ] **Error State**: Verify logic handles exceptions gracefully.

## 2. Component Tests (Svelte)

**Location**: `src/ui/tests/{{component}}.test.js`

- [ ] **Render**: Component mounts without crashing.
- [ ] **Reactivity**: `$state` updates reflect in the DOM correctly.
- [ ] **Events**: Dispatch events fire correctly.

## 3. E2E Scenarios (Playwright)

**Location**: `tests/e2e/{{feature}}.spec.js`

- [ ] **User Flow**: Simulate complete user journey (Click -> Action -> Result).
- [ ] **Visual Regression**: Snapshot comparison (if UI heavy).
