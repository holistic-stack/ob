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

