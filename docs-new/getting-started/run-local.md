# Run Locally

Development server
- pnpm dev

Run tests
- pnpm test                # Full Vitest suite
- pnpm test:unit           # Unit tests
- pnpm test:integration    # Integration tests
- pnpm test:coverage       # Coverage report

Visual/component tests (Playwright CT)
- pnpm test:ct             # Run component tests
- pnpm test:ct:ui          # Open CT UI
- pnpm test:ct:headed      # Headed mode
- pnpm test:ct:update-snapshots  # Update screenshots

Quality validation
- pnpm typecheck
- pnpm biome:lint
- pnpm biome:format
- pnpm validate:all        # Types, quality, coverage
