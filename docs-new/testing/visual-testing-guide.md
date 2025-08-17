# Visual Testing Guide (Playwright CT)

Where
- src/features/visual-testing/components/openscad-workflow-test-scene/*
- Config: playwright-ct.config.ts

Run
- pnpm test:ct
- pnpm test:ct:ui
- pnpm test:ct:update-snapshots

Tips
- Use provided camera configurations (services/camera-configurations)
- Keep deterministic ordering; avoid animations during capture
- No fallback visuals: geometry generation failures should surface as explicit errors
- If Playwright APIs (e.g., page.evaluate) are not present in the test env, skip gracefully with a clear message

