# OpenSCAD Editor Architecture (Zustand-Based)

## Overview

The OpenSCAD editor implements a modern, performance-optimized architecture using Zustand for centralized state management. This document describes the current architecture after the Zustand migration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenSCAD Editor Architecture                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  MonacoCodeEditor│    │  Zustand Store  │    │Visualization│  │
│  │                 │    │                 │    │   Panel     │  │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │             │  │
│  │ │ Code Input  │─┼────┼→│ updateCode  │ │    │ ┌─────────┐ │  │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ │Babylon  │ │  │
│  │                 │    │                 │    │ │Renderer │ │  │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ └─────────┘ │  │
│  │ │Error Display│←┼────┼─│parseErrors  │ │    │             │  │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ ┌─────────┐ │  │
│  │                 │    │                 │    │ │ Error   │ │  │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ │Display  │ │  │
│  │ │AST Indicator│←┼────┼─│ ast, status │←┼────┼─│         │ │  │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────┘ │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        Data Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input → updateCode() → 300ms Debounce → parseAST() →      │
│  AST Storage → Selective Subscriptions → Component Re-renders   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Zustand Store (`openscad-ast-store.ts`)

**Purpose**: Centralized state management for OpenSCAD AST pipeline

**Key Features**:
- 300ms debounced parsing
- Result<T,E> error handling
- Performance monitoring
- Selective reactivity
- Memory management

**State Structure**:
```typescript
interface OpenSCADState {
  // Core state
  code: OpenSCADCode;
  ast: ASTData;
  parseErrors: readonly ParseError[];
  parseStatus: ParseStatus;
  isParsing: boolean;
  isASTValid: boolean;
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics | null;
  lastParseTime: number | null;
  
  // Actions
  updateCode: (code: string) => void;
  parseAST: (code: string) => Promise<Result<ASTData, ParseError[]>>;
  setParseErrors: (errors: readonly ParseError[]) => void;
  clearErrors: () => void;
  reset: () => void;
  cancelParsing: () => void;
}
```

### 2. MonacoCodeEditor

**Purpose**: Code editing interface with OpenSCAD language support

**Zustand Integration**:
- Uses `useOpenSCADActions().updateCode` for state updates
- Subscribes to `useOpenSCADErrors()` for error display
- Subscribes to `useOpenSCADStatus()` for parsing indicators
- Maintains backward compatibility with existing props

**Key Features**:
- OpenSCAD syntax highlighting
- Real-time error detection
- Performance indicators
- Accessibility compliance

### 3. VisualizationPanel

**Purpose**: 3D visualization of parsed OpenSCAD AST

**Zustand Integration**:
- Subscribes to `useOpenSCADAst()` for 3D data
- Subscribes to `useOpenSCADErrors()` for error display
- Subscribes to `useOpenSCADStatus()` for loading states
- Removed AST-related props (breaking change)

**Key Features**:
- Babylon.js 3D rendering
- Error state visualization
- Loading indicators
- Glass morphism UI

## State Management Patterns

### 1. Selective Subscriptions

Components subscribe only to needed state slices to prevent unnecessary re-renders:

```typescript
// ✅ Good - selective subscription
const astData = useOpenSCADAst();
const parseErrors = useOpenSCADErrors();

// ❌ Avoid - subscribes to entire store
const store = useOpenSCADStore();
```

### 2. Action-Based Updates

All state changes go through store actions:

```typescript
// ✅ Good - use store actions
const { updateCode, clearErrors } = useOpenSCADActions();
updateCode(newCode);

// ❌ Avoid - direct state manipulation
// Not possible with Zustand (good!)
```

### 3. Performance Optimization

The store implements several performance optimizations:

- **Debouncing**: 300ms delay for AST parsing
- **Change Detection**: Only parse when code actually changes
- **Caching**: Snapshot caching to prevent infinite loops
- **Selective Updates**: Components re-render only on relevant changes

## Data Flow

### 1. Code Input Flow
```
User Types → MonacoCodeEditor → updateCode() → Store → 300ms Debounce → parseAST()
```

### 2. AST Update Flow
```
parseAST() → Store Update → Selective Subscriptions → Component Re-renders
```

### 3. Error Handling Flow
```
Parse Error → Store Error State → Error Subscriptions → Error Display
```

## Performance Requirements

### 1. Timing Targets
- **Debouncing**: 300ms (✅ Implemented)
- **AST Parsing**: <300ms target (✅ Monitored)
- **CSG2 Conversion**: <500ms target (🔄 Future)
- **Render Time**: <16ms (✅ Maintained)

### 2. Optimization Strategies
- **Selective Rendering**: Only affected components re-render
- **Debounced Parsing**: Prevents excessive parsing on rapid typing
- **Change Detection**: AST parsing only on actual code changes
- **Memory Management**: Automatic cleanup and garbage collection

## Error Handling

### 1. Result<T,E> Pattern
All error-prone operations return Result types:

```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
const result = await parseAST(code);
if (result.success) {
  // Handle success
  console.log('AST:', result.data);
} else {
  // Handle error
  console.error('Parse error:', result.error);
}
```

### 2. Error Boundaries
Components are wrapped in error boundaries for graceful failure handling.

### 3. Performance Monitoring
Parse operations are monitored for performance compliance:

```typescript
const performanceMetrics = {
  parseTime: 150,
  withinTarget: true, // 150ms < 300ms target
  operation: 'AST_PARSING'
};
```

## Testing Strategy

### 1. Store Testing
- Unit tests for all store actions
- Performance requirement validation
- Error handling verification
- Debouncing behavior testing

### 2. Component Testing
- Mock store hooks for isolated testing
- Integration tests with real store
- Visual regression tests maintained

### 3. Performance Testing
- Parse time monitoring
- Memory usage validation
- Re-render frequency tracking

## Migration Impact

### 1. Breaking Changes
- **VisualizationPanel**: Removed `astData`, `parseErrors`, `isParsing` props
- **Import Changes**: New store hook imports required

### 2. Performance Improvements
- **Debouncing**: Reduced from 500ms to 300ms
- **Re-rendering**: Selective subscriptions reduce unnecessary renders
- **Memory**: Better garbage collection and cleanup

### 3. Developer Experience
- **Centralized State**: Easier debugging and state inspection
- **Type Safety**: Strict TypeScript with branded types
- **Testing**: Improved testability with mockable hooks

## Future Enhancements

### 1. CSG2 Integration
Extend store to manage CSG2 conversion pipeline:

```typescript
interface OpenSCADState {
  // ... existing state
  csg2Data: CSG2Data | null;
  csg2Status: 'idle' | 'converting' | 'success' | 'error';
  
  // New actions
  convertToCSG2: (ast: ASTData) => Promise<Result<CSG2Data, CSG2Error[]>>;
}
```

### 2. State Persistence
Add optional state persistence for user sessions:

```typescript
// Persist code and preferences
const persistedStore = persist(
  useOpenSCADStore,
  { name: 'openscad-editor-state' }
);
```

### 3. Collaborative Editing
Extend for real-time collaborative features:

```typescript
// WebSocket integration for collaborative editing
const collaborativeStore = subscribeWithSelector((set, get) => ({
  // ... existing state
  collaborators: [],
  syncState: (remoteState) => void,
}));
```

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Migration Guide](./zustand-migration-guide.md)
- [Performance Monitoring](./performance-monitoring.md)
- [Testing Guidelines](./testing-guidelines.md)
