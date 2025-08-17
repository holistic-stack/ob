# Test Setup (from src)

Unit/Integration
- Vitest is configured; tests are co-located next to implementations across features.
- Shared helpers in vitest-helpers/ (e.g., openscad-parser-test-utils.ts) and vitest-setup.ts

Run
```bash
pnpm test               # full suite (unit+integration)
pnpm test:coverage      # coverage with forks
pnpm test:unit          # targeted suites
pnpm test:integration   # targeted suites
```

Visual/Component
- Visual workflows under src/features/visual-testing/components/openscad-workflow-test-scene/
- Playwright CT configuration in playwright-ct.config.ts
- Camera configurations in src/features/visual-testing/services/camera-configurations/

Run
```bash
pnpm test:ct
pnpm test:ct:ui
pnpm test:ct:update-snapshots
```

Conventions
- Prefer real implementations; avoid mocks except for external I/O.
- Use provided assertions in openscad-geometry-builder/test-utilities for geometry and Result types.
- Use shared-test-setup utilities for deterministic canvas readiness.
