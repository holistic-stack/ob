# API Reference (Curated)

This page consolidates the stable, non-deprecated API information for new developers.

Primary source
- See legacy docs (kept during migration): docs/api/README.md
  - This document describes the OpenSCAD Parser API, BabylonJS renderer concepts, React components, hooks, and error handling patterns.

Guidance
- Treat docs/api/README.md as authoritative while we migrate sections incrementally into docs-new.
- Prefer using Result<T,E> returns, strict types, and avoid any. Follow examples from docs/api/README.md for usage patterns.

Next steps
- As APIs stabilize, we will copy specific sections here and split into focused pages per area (parser, renderer services, React hooks/components), keeping them concise and aligned with TypeScript 5.8+.
