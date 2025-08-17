# Workflow: From OpenSCAD Code to Babylon Renderer

This document explains the end-to-end path when a user types OpenSCAD code until it renders in the BabylonJS scene, based only on src.

1) User enters OpenSCAD code
- Component: src/features/code-editor/components/store-connected-editor.tsx
- The editor dispatches updates to the Zustand store (editor slice)

2) Debounced parsing (300ms)
- Config: src/shared/config/debounce-config.ts
- Services: src/features/openscad-parser/services/parsing.service.ts and parser-initialization.service.ts
- Result: AST is produced (strict types under src/features/openscad-parser/ast)
- Error handling: Result<T,E> with recovery strategies (error-handling/strategies/*)

3) Store update with AST
- Slice: src/features/store/slices/parsing-slice.ts (+ types)
- Selectors: src/features/store/selectors/store.selectors.ts

4) Convert AST → Geometry
- Service: src/features/openscad-geometry-builder/services/ast-converter/ast-to-geometry-converter.ts
- Fragment rules ($fn/$fs/$fa): src/features/openscad-geometry-builder/services/fragment-calculator/fragment-calculator.ts
- Primitives: 2d/3d factories under primitive-generators/*
- Validation: polygon-operations/polygon-validator.ts
- Caching: geometry-cache.service.ts

5) Convert Geometry → Meshes
- Service: src/features/openscad-geometry-builder/services/mesh-converter/geometry-to-mesh-converter.ts
- Bridge: geometry-bridge/babylon-mesh-builder.ts

6) Attach meshes to Babylon scene
- Renderer entry: src/features/babylon-renderer/components/store-connected-renderer/store-connected-renderer.tsx
- Services: babylon-engine-service.ts, babylon-scene.service.ts, babylon-material-service.ts
- UI: camera-controls, orientation-gizmo, axis-overlay, inspector, gizmo-config-panel
- Sync: camera-store-sync.service.ts for camera persistence

7) Render and interact
- Scene component: src/features/babylon-renderer/components/babylon-scene/babylon-scene.tsx
- Hooks: use-babylon-engine, use-babylon-scene, use-babylon-inspector, use-axis-overlay

Best practices
- Keep components thin; push heavy logic to services and hooks
- Use fragment-calculator and centralized constants; avoid magic numbers
- Use geometry-cache and render-cache to avoid recomputation
- Prefer readonly data and Result<T,E> patterns

Troubleshooting
- If the scene renders empty: check parsing-slice state and AST; confirm ast-to-geometry conversion returns success
- If performance drops: ensure mesh disposal and render-cache usage; check scene-refresh utilities
- If camera state resets: verify camera-store-sync service initialization in store-connected-renderer
