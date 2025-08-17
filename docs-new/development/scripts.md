# Scripts

Docs quality (optional)
- docs:check: npx markdownlint "docs-new/**/*.md"

Core commands (from package.json)
- dev: vite
- build: tsc --project tsconfig.lib.json && vite build
- test: node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run
- test:coverage: vitest run --coverage --pool=forks --maxConcurrency=1
- test:ui: vitest --ui
- test:visual: playwright test --config playwright-ct.config.ts --reporter=line
- test:visual:update: playwright test --config=playwright-ct.config.ts --update-snapshots --reporter=line
- typecheck: npx tsc --noEmit
- biome:lint: biome lint .
- biome:format: biome format --write .

Convenience
- validate:all: types + quality + unit tests + coverage
- storybook: storybook dev -p 6006
- build-storybook: storybook build

Tip
- Prefer specific test script variants to minimize flakiness in CI (e.g., test:code-editor).
