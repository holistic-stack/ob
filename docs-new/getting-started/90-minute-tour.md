# 90-Minute Tour

Goal: run dev, type OpenSCAD, trace AST→Geometry→Meshes, and run tests.

1) Run locally (5m)
- pnpm install
- pnpm dev
- Open http://localhost:5173

2) Type simple OpenSCAD (10m)
- In the editor (src/features/code-editor/components/store-connected-editor.tsx), type:
  - cube([10,10,10]);
  - $fn=6; cylinder(h=10, r=5);

3) Observe parsing (10m)
- Debounce config: src/shared/config/debounce-config.ts
- Parser services: src/features/openscad-parser/services/parsing.service.ts
- AST updates stored in: src/features/store/slices/parsing-slice.ts

4) Trace conversion (15m)
- AST→Geometry: src/features/openscad-geometry-builder/services/ast-converter/ast-to-geometry-converter.ts
- Fragments ($fn/$fs/$fa): services/fragment-calculator/fragment-calculator.ts
- Geometry→Meshes: services/mesh-converter/geometry-to-mesh-converter.ts

5) Babylon render (10m)
- Renderer entry: src/features/babylon-renderer/components/store-connected-renderer/store-connected-renderer.tsx
- Scene: components/babylon-scene/babylon-scene.tsx
- Controls/Gizmo: components/camera-controls, components/orientation-gizmo

6) Inspect services (10m)
- Engine/Scene: services/babylon-engine-service, babylon-scene.service.ts
- Caching: src/features/openscad-geometry-builder/services/geometry-cache/geometry-cache.service.ts

7) Run tests (20m)
- pnpm test
- pnpm test:coverage
- pnpm test:ct (component/visual)
- Open a focused test: src/features/openscad-geometry-builder/services/fragment-calculator/fragment-calculator.test.ts

Do
- Keep changes small; run pnpm typecheck, pnpm biome:lint

Don’t
- Don’t bypass fragment-calculator; don’t introduce any types.

