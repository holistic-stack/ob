# Performance Guides

Reference (legacy during migration)
- docs/performance/README.md
- docs/performance/openscad-optimization.md

Key practices
- Target <16ms frame times
- Prefer disposal and pooling for Babylon resources
- Debounce high-frequency operations (e.g., 300ms for parsing while typing)
