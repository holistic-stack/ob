# Feature Modules Overview (from src)

This document reflects only the current source code under src/.

- babylon-renderer
  - Components: babylon-scene, camera-controls, orientation-gizmo, axis overlays, error boundary, inspector, transformation-gizmo, store-connected-renderer
  - Services: engine, scene, material, inspector, camera-control, camera-store-sync, camera-gizmo-sync, render-cache, memory-management, orientation-gizmo-service, transformation-gizmo-service, axis-overlay-service
  - Hooks: use-babylon-engine, use-babylon-scene, use-babylon-inspector, use-axis-overlay
  - Types & utils: babylon-ast/csg types, webgpu utils, buffer clearing, mesh disposal, scene refresh, csg2 utils
  - Integration tests present under features/babylon-renderer/integration-tests

- openscad-parser
  - AST generation, visitors (primitive, transform, control-structures, functions, variables), extractors (cube, sphere, cylinder, color, parameters, offsets), error handling (strategies + handler), services (module registry, resolver, parsing initialization), node location utilities
  - Strong unit and integration tests (no mocks for core logic)

- openscad-geometry-builder
  - Services: AST→geometry converter, geometry→mesh converter, geometry cache, fragment calculator
  - Primitive generators: 2d (circle, square, polygon), 3d (cube, cylinder, sphere, polyhedron), import primitives (STL, OFF), text primitives (font loader, text generator)
  - 3D operations: boolean ops, vertex operations
  - Pipeline: openscad-rendering-pipeline (integration tests included)
  - Test utilities: result and geometry assertions, performance utilities, data generators
  - Types and math/utils modules

- ast-to-csg-converter
  - Hook use-ast-converter and services for AST→mesh conversion (bridge into renderer)

- code-editor
  - React components for Monaco editor (simple/editor + store-connected-editor)
  - Hook use-monaco-editor and language service for OpenSCAD
  - Types and mocks for tests

- store
  - Zustand store with slices: babylon-rendering, config, editor, openscad-globals, parsing, plus selectors and constants

- visual-testing
  - Component workflows for primitives (cube, sphere, cylinder, square, polygon, circle) with snapshot baselines by view (top/front/side/isometric/back)
  - Services: camera configurations for visual tests
  - Utilities: canvas-ready, playwright debug utils, shared test setup

- shared
  - Components: error-boundary
  - Config: debounce/performance debounce configs
  - Constants: openscad-globals (central source of OpenSCAD defaults)
  - Services: feature detection, operation history, telemetry, user error handler
  - Types: ast/common/functional/operations/result types
  - Utils: functional composition, result helpers, memory, caching, performance

Notes
- All modules follow SRP and co-locate tests next to implementations.
- TypeScript 5.8 strict mode with discriminated unions and Result types.
