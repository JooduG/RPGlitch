# Fix StoryboardDynamicTitle Lint Error

## Objective

Fix the fatal lint error caused by hallucinated raw values in `src/ui/storyboard/StoryboardDynamicTitle.svelte`.

## Implementation Steps

- In `src/ui/storyboard/StoryboardDynamicTitle.svelte`, replace `box-shadow: 10px 10px 0 red;` with `box-shadow: var(--title-shadow-ambient);`.

## Verification

- Run `npm run deploy:prepare` to confirm success.
