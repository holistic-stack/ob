# Architecture Decision Records (ADRs)

## Overview

This directory contains Architecture Decision Records (ADRs) for the OpenSCAD Babylon project. ADRs document the architectural decisions made throughout the project, providing context, rationale, and consequences for future reference.

## ADR Format

Each ADR follows this structure:

- **Title**: Short noun phrase describing the decision
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Date**: When the decision was made
- **Context**: The issue or problem being addressed
- **Decision**: The change or solution being proposed
- **Consequences**: What becomes easier or more difficult as a result

## ADR Index

### Technology Stack Decisions

- [ADR-001: Use BabylonJS for 3D Rendering](./001-babylonjs-for-3d-rendering.md)
- [ADR-002: Use Tree-sitter for OpenSCAD Parsing](./002-tree-sitter-for-parsing.md)
- [ADR-003: Use React 19 and TypeScript 5.8](./003-react-typescript-stack.md)
- [ADR-004: Use Vite for Build Tooling](./004-vite-build-tooling.md)

### Architecture Pattern Decisions

- [ADR-005: Use Bulletproof-React Architecture](./005-bulletproof-react-architecture.md)
- [ADR-006: Use Zustand for State Management](./006-zustand-state-management.md)
- [ADR-007: Use Result Types for Error Handling](./007-result-types-error-handling.md)
- [ADR-008: Use Functional Programming Patterns](./008-functional-programming-patterns.md)

### Implementation Decisions

- [ADR-009: Use Manifold for CSG Operations](./009-manifold-csg-operations.md)
- [ADR-010: Use Real Implementations in Tests](./010-real-implementations-testing.md)
- [ADR-011: Use Co-located Test Files](./011-co-located-test-files.md)
- [ADR-012: Use TDD Development Approach](./012-tdd-development-approach.md)

### Performance Decisions

- [ADR-013: Use 300ms Debouncing for Parsing](./013-300ms-debouncing-parsing.md)
- [ADR-014: Target Sub-16ms Render Performance](./014-sub-16ms-render-performance.md)
- [ADR-015: Use Headless Testing Strategy](./015-headless-testing-strategy.md)

## Decision Status

### Accepted
All current ADRs are accepted and actively implemented.

### Deprecated
None currently.

### Superseded
None currently.

## Contributing to ADRs

When making significant architectural decisions:

1. Create a new ADR following the numbering convention
2. Use the standard format and structure
3. Provide clear context and rationale
4. Document consequences (both positive and negative)
5. Update this index with the new ADR

## References

- [Architecture Decision Records](https://adr.github.io/) - ADR methodology
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original concept
- [ADR Tools](https://github.com/npryce/adr-tools) - Command-line tools for ADRs
