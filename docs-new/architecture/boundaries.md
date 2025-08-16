# Boundaries

Public vs internal boundaries
- Keep React components thin; heavy logic in services
- Babylon services are framework-agnostic and do not depend on React
- Parser and geometry builder layers are consumed via well-defined interfaces

Dependency rules
- features/* should not import from app-specific UI layers
- shared/ contains reusable types, constants, and pure utilities
- Centralized constants/config are the single source of truth for defaults
