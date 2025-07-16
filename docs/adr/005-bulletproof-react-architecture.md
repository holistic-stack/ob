# ADR-005: Use Bulletproof-React Architecture

## Status
Accepted

## Date
2024-12-19

## Context

The OpenSCAD Babylon project requires a scalable and maintainable React application architecture. The primary architectural patterns considered were:

1. **Bulletproof-React** - Feature-based architecture with clear separation of concerns
2. **Atomic Design** - Component-based architecture with atoms, molecules, organisms
3. **Domain-Driven Design** - Business domain-focused architecture
4. **Traditional MVC** - Model-View-Controller pattern adapted for React

### Requirements
- Scalable codebase that can grow with features
- Clear separation of concerns and responsibilities
- Testable architecture with isolated components
- Developer-friendly structure for team collaboration
- Maintainable code organization
- TypeScript-first development approach

### Evaluation Criteria
- **Scalability**: How well the architecture handles growth
- **Maintainability**: Ease of code maintenance and updates
- **Testability**: Support for comprehensive testing strategies
- **Developer Experience**: Ease of understanding and contribution
- **Code Organization**: Logical grouping and discoverability
- **Industry Adoption**: Proven patterns and community support

## Decision

We chose **Bulletproof-React Architecture** for the following reasons:

### 1. Feature-Based Organization
Bulletproof-React organizes code by features rather than technical layers, making it easier to understand and maintain related functionality together.

```
src/
├── features/
│   ├── openscad-parser/     # Parser-related code
│   ├── babylon-renderer/    # 3D rendering code
│   ├── code-editor/         # Editor functionality
│   └── ui-components/       # Reusable UI components
├── shared/                  # Shared utilities and types
└── app/                     # Application-level configuration
```

### 2. Clear Separation of Concerns
Each feature contains its own:
- Components and UI logic
- Business logic and services
- Types and interfaces
- Tests and test utilities
- Hooks and state management

### 3. Scalability Through Modularity
Features can be developed, tested, and maintained independently, allowing teams to work on different features without conflicts.

### 4. TypeScript-First Design
The architecture naturally supports TypeScript with clear type boundaries between features and shared utilities.

### 5. Testing Strategy Alignment
Feature-based organization aligns with our TDD approach, allowing comprehensive testing at the feature level.

### 6. Industry Proven
Bulletproof-React is widely adopted and has proven successful in large-scale React applications.

## Consequences

### Positive
- **Feature Isolation**: Related code is co-located, reducing cognitive load
- **Parallel Development**: Teams can work on different features independently
- **Clear Boundaries**: Well-defined interfaces between features
- **Testability**: Features can be tested in isolation
- **Maintainability**: Changes are localized to specific features
- **Onboarding**: New developers can focus on specific features
- **Code Reuse**: Shared utilities are clearly separated and reusable

### Negative
- **Initial Complexity**: More complex initial setup compared to simple folder structures
- **Learning Curve**: Team needs to understand the architectural patterns
- **Potential Duplication**: Risk of duplicating code across features
- **Abstraction Overhead**: Additional abstraction layers may impact performance

### Mitigation Strategies
- **Documentation**: Comprehensive architecture documentation and guidelines
- **Code Reviews**: Enforce architectural patterns through code reviews
- **Shared Utilities**: Identify and extract common patterns to shared modules
- **Training**: Team training on bulletproof-react principles

## Implementation Notes

### Directory Structure
```
src/
├── features/
│   ├── openscad-parser/
│   │   ├── components/          # Parser-specific components
│   │   ├── hooks/              # Parser-related hooks
│   │   ├── services/           # Parsing business logic
│   │   ├── types/              # Parser type definitions
│   │   ├── utils/              # Parser utilities
│   │   └── index.ts            # Feature public API
│   ├── babylon-renderer/
│   │   ├── components/         # 3D rendering components
│   │   ├── services/           # Rendering services
│   │   ├── hooks/              # Rendering hooks
│   │   └── index.ts            # Feature public API
│   └── code-editor/
│       ├── components/         # Editor components
│       ├── hooks/              # Editor hooks
│       └── index.ts            # Feature public API
├── shared/
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Shared React hooks
│   ├── services/               # Shared business logic
│   ├── types/                  # Shared type definitions
│   ├── utils/                  # Utility functions
│   └── constants/              # Application constants
└── app/
    ├── providers/              # Context providers
    ├── layout/                 # Layout components
    └── routes/                 # Application routing
```

### Feature Public APIs
Each feature exposes a clean public API through its index.ts:

```typescript
// features/openscad-parser/index.ts
export { OpenscadParser } from './services/openscad-parser';
export { useOpenSCADParser } from './hooks/use-openscad-parser';
export type { ASTNode, ParseResult } from './types/ast-types';
```

### Cross-Feature Communication
Features communicate through:
- Shared state management (Zustand)
- Event-driven patterns
- Well-defined interfaces
- Shared services

### Testing Strategy
- **Unit Tests**: Test individual components and utilities
- **Integration Tests**: Test feature interactions
- **E2E Tests**: Test complete user workflows
- **Visual Tests**: Test UI component rendering

## Architectural Principles

### 1. Feature Independence
Features should be as independent as possible, with minimal coupling to other features.

### 2. Shared Utilities
Common functionality is extracted to shared modules to avoid duplication.

### 3. Clear Interfaces
Features expose clean, well-documented public APIs.

### 4. Consistent Patterns
All features follow the same internal structure and patterns.

### 5. Progressive Enhancement
Features can be added or removed without affecting the core application.

## Code Organization Rules

### Feature Structure
```
feature-name/
├── components/              # React components
├── hooks/                   # Custom React hooks
├── services/               # Business logic
├── types/                  # TypeScript types
├── utils/                  # Utility functions
├── constants/              # Feature constants
├── __tests__/              # Feature tests
└── index.ts                # Public API
```

### Import Rules
- Features can import from shared modules
- Features cannot import from other features directly
- Use feature public APIs for cross-feature dependencies
- Shared modules cannot import from features

### Naming Conventions
- Features: kebab-case (e.g., `openscad-parser`)
- Components: PascalCase (e.g., `OpenSCADEditor`)
- Hooks: camelCase with `use` prefix (e.g., `useOpenSCADParser`)
- Services: camelCase with descriptive names (e.g., `parsingService`)

## Performance Considerations

### Code Splitting
Features can be lazy-loaded for better performance:

```typescript
const OpenSCADEditor = lazy(() => import('../features/code-editor'));
```

### Bundle Optimization
Feature-based organization enables:
- Tree-shaking of unused features
- Selective feature loading
- Optimized bundle splitting

## References
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [React Application Architecture](https://reactjs.org/docs/thinking-in-react.html)
- [Feature-Driven Development](https://en.wikipedia.org/wiki/Feature-driven_development)

## Related ADRs
- [ADR-003: Use React 19 and TypeScript 5.8](./003-react-typescript-stack.md)
- [ADR-006: Use Zustand for State Management](./006-zustand-state-management.md)
- [ADR-011: Use Co-located Test Files](./011-co-located-test-files.md)
