<!-- path: present/chin-button-sync-summary.md -->

# Chin button sync and layout fixes — Summary

## Decisions

- Use MutationObserver on `.chin` panels to toggle matching button `.selected` and `body.chin-open`.
- Prefer CSS `background-attachment: fixed` for gradient; no pseudo-element fallback yet.
- Apply shared `--app-container-max` to align `#profile-screen` with top bar container.
- Rely on observer to trigger `syncButton` and `syncBodyFlag`; removed manual calls in click handlers.
- Drop duplicate `#profile-screen` rule to satisfy linter.

## Outcomes

- Top-bar buttons now reflect chin open state and deselect on close.
- Gradient background stays fixed during scroll.
- Profile screen right edge lines up with top bar.
- Removed redundant chin sync calls; MutationObserver now sole source of state.
- Chin click handlers simplified without redundant synchronization calls.
- Lint passes without duplicate selector warning.
