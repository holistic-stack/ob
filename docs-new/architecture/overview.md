# Architecture Overview

This project converts OpenSCAD code to interactive 3D scenes using BabylonJS through a unified, test-first pipeline.

High-level flow
- OpenSCAD code → OpenSCAD Parser → AST
- AST → Geometry Builder → Geometry Data (or Explicit Error)
- Geometry → Babylon Mesh Builder → BabylonJS Meshes
- Meshes → Babylon Scene Services → Rendered Scene (with controls, overlays, gizmos)

Policies
- No Babylon fallbacks or placeholder meshes
- On failure in Geometry Builder, throw explicit errors with clear messages
- For implementation guidance, see docs/openscad-desktop-sourcecode/src/

Key principles
- SRP: Each service/component has a single responsibility with co-located tests
- TDD: Write failing tests first; prefer real implementations (avoid mocks except I/O)
- Strict TypeScript 5.8+: zero any, explicit types, functional error handling (Result/Either)
- DRY/KISS: Prefer clarity and composability over cleverness
- Centralized constants/config for reuse across features

See also
- architecture/modules.md — feature and service layout
- docs/openscad-babylon-architecture.md — legacy deep-dive (reference)
