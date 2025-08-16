# Data Flow

Primary pipeline
1) Parse OpenSCAD code into an AST (OpenSCAD Parser)
2) Convert AST into geometry (Geometry Builder)
3) Convert geometry into BabylonJS meshes (Mesh Builder)
4) Render and manage scene (Babylon services, camera controls, overlays)

Error handling
- Use Result<T,E> for structured, type-safe errors
- Prefer explicit branching over exceptions for expected conditions

Performance
- Target <16ms frame time; dispose unused resources; debounce real-time operations (e.g., 300ms for parsing)
