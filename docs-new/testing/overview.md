# Testing Overview

- Unit tests: Vitest (fast, isolated, no mocks unless I/O)
- Integration tests: Vitest across services and features
- Visual tests: Playwright component testing with snapshots
- Coverage: maintain high coverage where critical; value test quality over raw %

Key commands
- pnpm test
- pnpm test:coverage
- pnpm test:ct / pnpm test:ct:update-snapshots
