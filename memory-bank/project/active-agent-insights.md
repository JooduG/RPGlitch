# Active Agent Insights

- Fallbacks for `hideEl` and `showEl` prevent crashes when utilities are missing.
- Tracking attached listeners avoids duplicate handlers in tests.
- Top bar tabs update ARIA state for accessibility.
- Search filtering relies on `data-title` attributes within chin lists.
- DOMContentLoaded init ensures listeners attach after chin elements exist.
- Building chin cards with `createElement` avoids HTML injection.
- Roving `tabindex` confines focus to the selected tab.
- Outside click handler prevents navigation when closing the chin.