# First Issue Checklist

Before coding
- Pick a tiny change (doc/test/refactor under 50 LOC)
- Create branch: git checkout -b feat/short-name

While coding
- Co-locate tests next to code (kebab-case)
- Use strict types; no any
- Prefer pure functions and Result<T,E>

Run
- pnpm biome:lint
- pnpm typecheck
- pnpm test

Open PR
- Include: what/why, screenshots if visual
- Link updated docs-new page
- Ensure CI green

