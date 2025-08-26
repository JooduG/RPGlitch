# CI-safe build & test stabilization summary

- Mark tests with `__TEST__` flag and reset timers after each test
- Make App.initializeWhenReady test-aware with capped retries
- Simplify chin button sync and add idempotent Escape handling
