# Zustand Migration Guide: OpenSCAD Editor State Management

## Overview

This guide documents the migration from React state management to Zustand for the OpenSCAD editor components. The refactor centralizes AST state management while maintaining all existing functionality and performance requirements.

## Migration Summary

### Before (React State)
- **MonacoCodeEditor**: Managed local state for AST data, parse errors, and parsing status
- **VisualizationPanel**: Received AST data and errors via props
- **Manual debouncing**: Implemented with `setTimeout` in Monaco editor
- **Prop drilling**: AST data passed through component hierarchy

### After (Zustand Store)
- **Centralized state**: All AST-related state managed in `useOpenSCADStore`
- **Selective subscriptions**: Components subscribe only to needed state slices
- **Built-in debouncing**: 300ms debouncing handled by the store
- **Performance optimization**: Renderer only executes on actual AST changes

## Key Changes

### 1. New Zustand Store (`src/features/ui-components/editor/stores/openscad-ast-store.ts`)

```typescript
// Store provides centralized state management
export const useOpenSCADStore = create<OpenSCADState>()(
  subscribeWithSelector((set, get) => ({
    // State
    code: '' as OpenSCADCode,
    ast: [] as ASTData,
    parseErrors: [] as readonly ParseError[],
    isParsing: false,
    
    // Actions
    updateCode: (code: string) => void,
    parseAST: (code: string) => Promise<Result<ASTData, ParseError[]>>,
    // ... other actions
  }))
);
```

### 2. Selective Subscription Hooks

```typescript
// Optimized hooks for specific state slices
export const useOpenSCADCode = () => useOpenSCADStore(state => state.code);
export const useOpenSCADAst = () => useOpenSCADStore(state => state.ast);
export const useOpenSCADErrors = () => useOpenSCADStore(state => state.parseErrors);
export const useOpenSCADStatus = () => useOpenSCADStore(state => ({ 
  isParsing: state.isParsing, 
  parseStatus: state.parseStatus,
  isASTValid: state.isASTValid
}));
export const useOpenSCADActions = () => useOpenSCADStore(state => ({
  updateCode: state.updateCode,
  parseAST: state.parseAST,
  // ... other actions
}));
```

### 3. MonacoCodeEditor Changes

**Before:**
```typescript
const [parseResult, setParseResult] = useState<ParseResult>({ success: true, errors: [], ast: [] });
const [isParsing, setIsParsing] = useState(false);

const handleCodeChange = useCallback((newValue: string | undefined) => {
  const codeValue = newValue ?? '';
  onChange?.(codeValue);
  
  // Manual debouncing with setTimeout
  if (parseTimeoutRef.current) {
    clearTimeout(parseTimeoutRef.current);
  }
  
  parseTimeoutRef.current = setTimeout(() => {
    void parseCodeToAST(codeValue);
  }, 500);
}, [onChange, parseCodeToAST]);
```

**After:**
```typescript
// Zustand store hooks
const { updateCode } = useOpenSCADActions();
const parseErrors = useOpenSCADErrors();
const { isParsing, isASTValid } = useOpenSCADStatus();
const ast = useOpenSCADAst();

const handleCodeChange = useCallback((newValue: string | undefined) => {
  const codeValue = newValue ?? '';
  onChange?.(codeValue);
  
  // Store handles debouncing internally
  if (enableASTParsing && language === 'openscad') {
    updateCode(codeValue);
  }
}, [onChange, enableASTParsing, language, updateCode]);
```

### 4. VisualizationPanel Changes

**Before:**
```typescript
export interface VisualizationPanelProps {
  readonly astData?: readonly ASTNode[];
  readonly parseErrors?: readonly ParseError[];
  readonly isParsing?: boolean;
  // ... other props
}

export const VisualizationPanel = ({ astData, parseErrors, isParsing, ... }) => {
  // Component implementation
};
```

**After:**
```typescript
export interface VisualizationPanelProps {
  // AST-related props removed - now managed by Zustand
  readonly mode?: VisualizationMode;
  readonly loading?: boolean;
  // ... other non-AST props
}

export const VisualizationPanel = ({ mode, loading, ... }) => {
  // Zustand store hooks
  const astData = useOpenSCADAst();
  const parseErrors = useOpenSCADErrors();
  const { isParsing, isASTValid } = useOpenSCADStatus();
  
  // Component implementation
};
```

## Performance Improvements

### 1. Debouncing Optimization
- **Before**: 500ms debouncing in Monaco editor
- **After**: 300ms debouncing in Zustand store (meets performance requirement)

### 2. Selective Re-rendering
- **Before**: Components re-render on any state change
- **After**: Components only re-render when subscribed state slices change

### 3. AST Change Detection
- **Before**: Parsing triggered on every code change
- **After**: Parsing only triggered when code actually changes (content comparison)

## Breaking Changes

### Component Props
- **VisualizationPanel**: Removed `astData`, `parseErrors`, and `isParsing` props
- **MonacoCodeEditor**: No breaking changes (maintains backward compatibility)

### Import Changes
```typescript
// New imports needed
import {
  useOpenSCADAst,
  useOpenSCADErrors,
  useOpenSCADStatus,
  useOpenSCADActions
} from '../stores';
```

## Migration Steps

### For Existing Components Using VisualizationPanel

1. **Remove AST-related props:**
```typescript
// Before
<VisualizationPanel
  astData={astData}
  parseErrors={parseErrors}
  isParsing={isParsing}
  // ... other props
/>

// After
<VisualizationPanel
  // AST props removed
  // ... other props
/>
```

2. **Add Zustand store provider (if needed):**
The store is automatically available - no provider setup required.

### For Custom Components Needing AST Data

1. **Import store hooks:**
```typescript
import { useOpenSCADAst, useOpenSCADErrors, useOpenSCADStatus } from '../stores';
```

2. **Subscribe to needed state:**
```typescript
const astData = useOpenSCADAst();
const parseErrors = useOpenSCADErrors();
const { isParsing, isASTValid } = useOpenSCADStatus();
```

## Testing Changes

### Unit Tests
- Mock Zustand store hooks in test setup
- Use `vi.mocked()` for store hook mocking
- Test components with mocked store state

### Integration Tests
- Mock store hooks with realistic state transitions
- Test complete pipeline with store state changes
- Verify performance requirements are maintained

## Performance Validation

The migration maintains all performance requirements:

- ✅ **300ms debouncing**: Implemented in store
- ✅ **<300ms AST parsing**: Tracked and validated
- ✅ **Selective rendering**: Only on actual state changes
- ✅ **Memory management**: Automatic cleanup

## Troubleshooting

### Common Issues

1. **Infinite re-renders**: Ensure `getSnapshot` function returns stable references
2. **Missing state updates**: Check that components subscribe to correct state slices
3. **Performance degradation**: Verify selective subscriptions are used correctly

### Debug Tools

```typescript
// Get current store state for debugging
const snapshot = useOpenSCADActions().getSnapshot();
console.log('Store state:', snapshot);
```

## Next Steps

1. **Monitor performance**: Ensure 300ms targets are maintained in production
2. **Extend store**: Add CSG2 data management when needed
3. **Add persistence**: Consider adding state persistence for user sessions
4. **Error boundaries**: Ensure proper error handling around store operations

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React 19 Compatibility](https://react.dev/blog/2024/04/25/react-19)
- [Performance Monitoring Guide](./performance-monitoring.md)
- [OpenSCAD Editor Architecture](./openscad-editor-architecture.md)
