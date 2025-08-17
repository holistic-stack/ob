# Week-1 Roadmap

Day 1
- Read docs-new/README.md and architecture/overview.md
- Run: pnpm install, pnpm dev, pnpm test, pnpm typecheck, pnpm biome:lint

Day 2
- Trace AST→Geometry→Meshes via architecture/workflow.md
- Read src/features/openscad-parser and run its tests

Day 3
- Read geometry-builder services (ast-converter, fragment-calculator, mesh-converter)
- Add one small unit test to fragment-calculator or polygon-validator

Day 4
- Read babylon-renderer components/services (camera-controls, scene, orientation-gizmo)
- Run visual tests: pnpm test:ct; update one snapshot intentionally

Day 5
- Pick a tiny issue (typo/test/doc)
- Open PR with docs-new update (link to the code touched)

