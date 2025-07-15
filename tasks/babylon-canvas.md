# BabylonJS Canvas Integration - Custom React Implementation

## Project Overview

**PRIORITY: Remove `react-babylonjs` dependency FIRST** before implementing custom React + BabylonJS integration following React 19 best practices. Create a maintainable, performant 3D rendering solution with <16ms render targets.

## Current State Analysis

### ❌ CRITICAL: react-babylonjs Still Present
- **Package.json**: No `react-babylonjs` dependency found ✅
- **Vite Config**: `react-babylonjs` still in manual chunks ❌
- **Source Code**: Active usage in `babylon-scene.tsx` ❌
- **Tests**: Mocked `react-babylonjs` components ❌

### 🔍 Files Using react-babylonjs
- `src/features/babylon-renderer/components/babylon-scene/babylon-scene.tsx` (line 20)
- `src/features/babylon-renderer/components/babylon-scene/babylon-scene.test.tsx` (line 16)
- `vite.config.ts` (line 50)

## Phase 0: Remove react-babylonjs (MANDATORY FIRST STEP)

### Step 1: Remove Vite Configuration
```bash
# Remove react-babylonjs from manual chunks
# Edit vite.config.ts line 50
```

### Step 2: Replace babylon-scene.tsx
```typescript
// BEFORE (using react-babylonjs):
import { Engine, Scene } from 'react-babylonjs';

// AFTER (custom implementation):
import { Engine, Scene } from '@babylonjs/core';
```

### Step 3: Update Tests
```typescript
// BEFORE (mocking react-babylonjs):
vi.mock('react-babylonjs', () => ({ ... }));

// AFTER (using real BabylonJS NullEngine):
import { NullEngine, Scene } from '@babylonjs/core';
```

### Step 4: Validation Commands
```bash
# Must pass before proceeding
pnpm type-check  # Zero errors required
pnpm test        # All tests must pass
pnpm biome:check # Zero violations required
```

## React 19 Best Practices (July 2025)

### Core Patterns
- **Automatic Optimization**: React 19 handles memoization automatically
- **Canvas References**: Use `useRef<HTMLCanvasElement>(null)` with empty dependency arrays
- **Concurrent Features**: Use `useTransition` for non-urgent updates, `useDeferredValue` for smooth interactions
- **Context Hoisting**: Prevent WebGL context loss with stable engine references
- **ResizeObserver**: Replace window resize events for better performance

### Custom Canvas Pattern (No react-babylonjs)
```typescript
const BabylonCanvas: React.FC<BabylonCanvasProps> = ({ onSceneReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      loseContextOnDispose: true
    });
    const scene = new Scene(engine);

    onSceneReady?.(scene);

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};
```

### Critical Pitfalls to Avoid

#### 1. Using react-babylonjs (FORBIDDEN)
```typescript
// ❌ FORBIDDEN: react-babylonjs usage
import { Engine, Scene } from 'react-babylonjs';
return (
  <Engine>
    <Scene>
      <arcRotateCamera />
    </Scene>
  </Engine>
);

// ✅ REQUIRED: Direct BabylonJS integration
import { Engine, Scene, ArcRotateCamera } from '@babylonjs/core';
useEffect(() => {
  const engine = new Engine(canvasRef.current, true);
  const scene = new Scene(engine);
  const camera = new ArcRotateCamera('camera', 0, 0, 10, Vector3.Zero(), scene);
  return () => { scene.dispose(); engine.dispose(); };
}, []);
```

#### 2. WebGL Context Loss
```typescript
// ❌ WRONG: Frequent engine disposal
useEffect(() => {
  const engine = new Engine(canvas, true);
  return () => engine.dispose(); // Creates new context every render
}, [someState]);

// ✅ CORRECT: Context hoisting
const BabylonEngineProvider = ({ children }) => {
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!engineRef.current && canvasRef.current) {
      engineRef.current = new Engine(canvasRef.current, true, {
        loseContextOnDispose: true
      });
    }
    return () => engineRef.current?.dispose();
  }, []);

  return <EngineContext.Provider value={engineRef.current}>{children}</EngineContext.Provider>;
};
```

#### 3. React 19 Optimization Conflicts
```typescript
// ❌ WRONG: Manual optimization conflicts with React 19
const MemoizedCanvas = memo(({ onSceneReady }) => {
  const handleReady = useCallback((scene) => onSceneReady(scene), [onSceneReady]);
  return <canvas ref={canvasRef} />;
});

// ✅ CORRECT: Let React 19 auto-optimize
const BabylonCanvas = ({ onSceneReady }) => {
  const handleReady = (scene) => onSceneReady(scene); // Auto-optimized
  return <canvas ref={canvasRef} />;
};
```

#### 4. State Management Anti-patterns
```typescript
// ❌ WRONG: Mixing React state with BabylonJS
const [meshPosition, setMeshPosition] = useState(Vector3.Zero());
useEffect(() => {
  if (mesh) mesh.position = meshPosition; // Causes re-renders
}, [meshPosition, mesh]);

// ✅ CORRECT: Use refs for imperative operations
const meshPositionRef = useRef(Vector3.Zero());
const updateMeshPosition = (newPosition: Vector3) => {
  meshPositionRef.current = newPosition;
  if (meshRef.current) meshRef.current.position = newPosition;
};
```

### Performance Targets
- **Render Performance**: <16ms frame times (62.5 FPS)
- **Memory Management**: Zero leaks with proper WebGL cleanup
- **Bundle Size**: 20-70% reduction through code splitting
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1
- **Quality**: Zero TypeScript/Biome violations, 95%+ test coverage

### Development Standards
- **File Structure**: SRP with co-located tests (no `__tests__` folders)
- **Programming**: Functional patterns, immutable data, Result<T,E> error handling
- **Testing**: TDD with real BabylonJS NullEngine and OpenSCAD parser (no mocks)
- **TypeScript**: Strict mode, branded types, zero `any` usage
- **React 19**: Leverage automatic optimizations, use concurrent features

## Implementation Tasks

### Phase 0: Remove react-babylonjs (MANDATORY FIRST)
- [ ] **Remove Vite Configuration**
  - [ ] Edit `vite.config.ts` line 50 - remove `'react-babylonjs'` from babylon chunk
  - [ ] Verify build still works: `pnpm build`

- [ ] **Replace babylon-scene.tsx**
  - [ ] Remove `import { Engine, Scene } from 'react-babylonjs'` (line 20)
  - [ ] Replace with direct BabylonJS imports: `import { Engine, Scene } from '@babylonjs/core'`
  - [ ] Replace JSX components with imperative BabylonJS API calls
  - [ ] Maintain same props interface for backward compatibility
  - [ ] Follow SRP: file under 500 lines, co-located tests

- [ ] **Update Tests**
  - [ ] Remove `vi.mock('react-babylonjs')` from test files
  - [ ] Use real `BABYLON.NullEngine` instead of mocks
  - [ ] Follow project standard: no mocks for BabylonJS
  - [ ] Ensure 95%+ test coverage maintained

- [ ] **Validation**
  - [ ] `pnpm type-check` = 0 errors
  - [ ] `pnpm test` = all pass
  - [ ] `pnpm biome:check` = 0 violations

### Phase 1: Core Canvas Component (After Phase 0)
- [x] **BabylonCanvas Component** ✅ COMPLETED
  - [x] Create `babylon-canvas/babylon-canvas.tsx` with React 19 patterns
  - [x] Use `useRef<HTMLCanvasElement>` with proper dependency management
  - [x] Implement engine/scene lifecycle with context hoisting
  - [x] Add TypeScript interfaces with readonly props and branded types
  - [x] Include error boundaries with Result<T,E> patterns
  - [x] Add accessibility compliance (WCAG 2.1 AA)
  - [x] Validation: 9/9 tests pass, zero TypeScript/Biome violations

- [x] **Engine Management Service** ✅ COMPLETED
  - [x] Create `babylon-engine-service/babylon-engine.service.ts` with singleton pattern
  - [x] Implement WebGL2/WebGPU support with `loseContextOnDispose: true`
  - [x] Add ResizeObserver-based resize handling
  - [x] Include <16ms performance monitoring
  - [x] Add automatic memory disposal patterns
  - [x] Result<T,E> error handling patterns
  - [x] Validation: 15/15 tests pass, zero TypeScript/Biome violations

- [ ] **Scene Management Service** 🔄 NEXT
  - [ ] Create `babylon-scene-service/babylon-scene.service.ts` with reactive lifecycle
  - [ ] Configure `autoClear: false`, `autoClearDepthAndStencil: false`
  - [ ] Add camera, lighting, environment setup with disposal
  - [ ] Include React 19 concurrent features for callbacks
  - [ ] Add proper WebGL state management

### Phase 2: Component Integration
- [ ] **Replace react-babylonjs Components**
  - [ ] Update `BabylonScene` with React 19 auto-optimization
  - [ ] Replace imports with context-based providers
  - [ ] Update camera/lighting with proper disposal
  - [ ] Migrate mesh rendering with CSG2 integration
  - [ ] Use readonly interfaces and branded types
  - [ ] Ensure zero TypeScript `any` types

- [ ] **Store Integration**
  - [ ] Update `StoreConnectedRenderer` with concurrent features
  - [ ] Use `useTransition` for non-urgent updates
  - [ ] Use `useDeferredValue` for AST changes
  - [ ] Optimize re-render performance for <16ms targets
  - [ ] Add error boundaries with Result<T,E> patterns

- [ ] **Hook Implementation**
  - [ ] Create `useBabylonEngine` with context hoisting
  - [ ] Create `useBabylonScene` with automatic cleanup
  - [ ] Create `useBabylonInspector` for debugging
  - [ ] Add `useBabylonResize` with ResizeObserver
  - [ ] Add `useBabylonPerformance` for monitoring
  - [ ] Add `useBabylonCSG` for CSG2 operations

### Phase 3: Advanced Features
- [ ] **Inspector Integration**
  - [ ] Update inspector with React 19 concurrent features
  - [ ] Add inspector toggle with `useTransition` for smooth UX
  - [ ] Include performance debugging with Web Vitals
  - [ ] Add scene graph visualization with lazy loading
  - [ ] Implement state persistence across hot reloads

- [ ] **CSG Operations Integration**
  - [ ] Ensure CSG works with custom canvas and WebGL state management
  - [ ] Maintain Manifold WASM with memory-safe patterns
  - [ ] Preserve <16ms performance optimizations
  - [ ] Add real-time debugging and visualization
  - [ ] Include automatic memory cleanup
  - [ ] Implement operation queuing with `useTransition`

- [ ] **Performance Optimization**
  - [ ] Implement render loop optimization with frame targeting
  - [ ] Add adaptive quality based on device capabilities
  - [ ] Include memory monitoring with garbage collection triggers
  - [ ] Add bundle optimization with code splitting
  - [ ] Implement lazy loading with React.lazy and Suspense
  - [ ] Add Web Vitals monitoring for production

### Phase 4: Testing & Validation
- [ ] **Unit Tests**
  - [ ] Test canvas component with BABYLON.NullEngine (no mocks)
  - [ ] Test engine/scene lifecycle with proper disposal
  - [ ] Test hooks with React Testing Library and React 19 patterns
  - [ ] Test error handling with Result<T,E> patterns
  - [ ] Test memory management with WebGL context validation
  - [ ] Test React 19 automatic optimization behavior

- [ ] **Integration Tests**
  - [ ] Test OpenSCAD → AST → BabylonJS pipeline with real parser
  - [ ] Test Zustand store with concurrent features
  - [ ] Test CSG operations with Manifold WASM integration
  - [ ] Test inspector in development/production modes
  - [ ] Test <16ms render time validation
  - [ ] Test Web Vitals compliance

- [ ] **Visual Regression Tests**
  - [ ] Update Playwright tests with screenshot comparison
  - [ ] Test cross-browser rendering (Chrome, Firefox, Safari)
  - [ ] Test ResizeObserver-based responsive behavior
  - [ ] Test CSG visual output with pixel validation
  - [ ] Test inspector UI across screen sizes
  - [ ] Test WCAG 2.1 AA accessibility compliance

## Technical Specifications

### File Structure (SRP-Based)
```
src/features/babylon-renderer/
├── babylon-canvas/
│   ├── babylon-canvas.tsx
│   ├── babylon-canvas.test.tsx
│   └── babylon-canvas.types.ts
├── babylon-engine-service/
│   ├── babylon-engine.service.ts
│   └── babylon-engine.service.test.ts
├── babylon-scene-service/
│   ├── babylon-scene.service.ts
│   └── babylon-scene.service.test.ts
├── use-babylon-engine/
│   ├── use-babylon-engine.ts
│   └── use-babylon-engine.test.ts
└── store-connected-renderer/
    ├── store-connected-renderer.tsx
    └── store-connected-renderer.test.tsx
```

### Implementation Patterns

#### 1. Canvas Component (React 19 + TypeScript)
```typescript
interface BabylonCanvasProps {
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onEngineReady?: (engine: Engine) => void;
  readonly engineOptions?: EngineOptions;
  readonly sceneOptions?: SceneOptions;
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
}

const BabylonCanvas: React.FC<BabylonCanvasProps> = ({
  onSceneReady,
  onEngineReady,
  engineOptions,
  sceneOptions,
  'data-testid': dataTestId = 'babylon-canvas',
  'aria-label': ariaLabel = 'BabylonJS 3D Canvas',
  ...canvasProps
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      ...engineOptions,
      loseContextOnDispose: true
    });

    const scene = new Scene(engine, {
      ...sceneOptions,
      autoClear: false,
      autoClearDepthAndStencil: false
    });

    onEngineReady?.(engine);
    onSceneReady?.(scene);

    return () => {
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      role="img"
      {...canvasProps}
    />
  );
};
```

#### 2. Context-Based Engine Management
```typescript
const BabylonEngineContext = createContext<{
  engine: Engine | null;
  isReady: boolean;
} | null>(null);

const useBabylonEngine = () => {
  const context = useContext(BabylonEngineContext);
  if (!context) {
    throw new Error('useBabylonEngine must be used within BabylonEngineProvider');
  }
  return context;
};

const BabylonEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engineRef = useRef<Engine | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initializeEngine = (canvas: HTMLCanvasElement, options?: EngineOptions) => {
    if (engineRef.current) return engineRef.current;

    engineRef.current = new Engine(canvas, true, {
      ...options,
      loseContextOnDispose: true,
      preserveDrawingBuffer: true
    });

    setIsReady(true);
    return engineRef.current;
  };

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        setIsReady(false);
      }
    };
  }, []);

  return (
    <BabylonEngineContext.Provider value={{ engine: engineRef.current, isReady, initializeEngine }}>
      {children}
    </BabylonEngineContext.Provider>
  );
};
```

#### 3. Store Integration (React 19 Concurrent)
```typescript
const StoreConnectedRenderer: React.FC = () => {
  const ast = useAppStore(state => state.parsing.ast);
  const [isPending, startTransition] = useTransition();
  const deferredAST = useDeferredValue(ast);

  const handleSceneReady = (scene: Scene) => {
    startTransition(() => {
      convertASTToBabylonMeshes(scene, ast);
    });
  };

  useEffect(() => {
    if (sceneRef.current && deferredAST) {
      updateSceneFromAST(sceneRef.current, deferredAST);
    }
  }, [deferredAST]);

  return (
    <div className="relative w-full h-full">
      <BabylonCanvas
        onSceneReady={handleSceneReady}
        className="w-full h-full"
        data-testid="store-connected-renderer"
        aria-label="OpenSCAD 3D Visualization"
      />
      {isPending && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded">
          Updating...
        </div>
      )}
    </div>
  );
};

const StoreConnectedRendererWithErrorBoundary: React.FC = () => (
  <ErrorBoundary
    fallback={<div>3D rendering failed. Please refresh.</div>}
    onError={(error) => console.error('[ERROR] BabylonJS rendering:', error)}
  >
    <StoreConnectedRenderer />
  </ErrorBoundary>
);
```

## Migration Strategy

### Step 1: Parallel Implementation
- Create custom components alongside existing react-babylonjs
- Implement feature parity with React 19 patterns
- Add testing with real BabylonJS NullEngine (no mocks)
- Establish <16ms performance baselines
- Ensure zero TypeScript `any` types

### Step 2: Gradual Migration
- Update components one at a time with feature flags
- Maintain backward compatibility with error boundaries
- Run parallel implementations for validation
- Monitor Web Vitals during migration
- Validate CSG and OpenSCAD parser integration

### Step 3: Complete Replacement
- Remove all react-babylonjs imports after validation
- Update tests for 95%+ coverage
- Validate cross-browser performance
- Ensure WCAG 2.1 AA accessibility compliance
- Deploy with monitoring and rollback capabilities

### Step 4: Optimization
- Optimize bundle size (20-70% reduction target)
- Add React 19 concurrent features
- Implement OpenSCAD-specific optimizations
- Fine-tune Core Web Vitals compliance
- Add production monitoring and alerting

## Success Criteria

### Functional Requirements
- [ ] All BabylonJS functionality preserved
- [ ] OpenSCAD → AST → BabylonJS pipeline works
- [ ] CSG operations render correctly
- [ ] Inspector integration functional
- [ ] Store reactivity maintained

### Performance Requirements
- [ ] <16ms render targets maintained
- [ ] Zero memory leaks
- [ ] Bundle size reduction vs react-babylonjs
- [ ] Improved startup time

### Quality Requirements
- [ ] Zero TypeScript/Biome violations
- [ ] 95%+ test coverage
- [ ] All integration tests pass
- [ ] Visual regression tests pass

## Development Guidelines

### Code Standards
- TypeScript-first with SRP file structure
- Co-located tests (no `__tests__` folders)
- Functional programming with Result<T,E>
- Immutable data structures
- TDD methodology

### Testing Standards
- Real BabylonJS NullEngine (no mocks)
- Real OpenSCAD parser instances
- Property-based testing for transformations
- Comprehensive integration coverage

### Documentation Standards
- JSDoc for all public APIs
- React 19 pattern documentation
- Performance optimization notes
- Troubleshooting guides

## Essential Resources

### React 19 (July 2025)
- [React 19 Automatic Optimization](https://react.dev/blog/2024/04/25/react-19) - Official features
- [useTransition/useDeferredValue](https://react.dev/reference/react/useTransition) - Concurrent patterns
- [Canvas Performance](https://web.dev/canvas-performance/) - 2025 guidelines

### BabylonJS Integration
- [React Integration Guide](https://doc.babylonjs.com/communityExtensions/Babylon.js+ExternalLibraries/BabylonJS_and_ReactJS)
- [WebGL Context Management](https://forum.babylonjs.com/t/react-babylonjs-webgl-context-lost/48898)
- [Performance Optimization](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene)

### Project Standards
- [TypeScript Guidelines](docs/typescript-guidelines.md)
- [Bulletproof React Structure](docs/bulletproof-react-structure.md)
- [Testing Standards](docs/testing-standards.md)

## Implementation Roadmap

### Week 1: Remove react-babylonjs (MANDATORY FIRST)
1. **Day 1-2**: Remove react-babylonjs from vite.config.ts and source code
2. **Day 3-4**: Replace babylon-scene.tsx with custom implementation
3. **Day 5**: Update tests to use real BabylonJS NullEngine (no mocks)
4. **Validation**: `pnpm type-check && pnpm test && pnpm biome:check` = all pass

### Week 2: Foundation
5. Create `BabylonCanvas` component with React 19 patterns
6. Implement `BabylonEngineProvider` with WebGL context management
7. Ensure zero TypeScript/Biome violations
8. Set up TDD with real BabylonJS NullEngine

### Week 3-4: Core Services
9. Build engine/scene management services with Result<T,E>
10. Create reusable hooks with context-based state
11. Integrate Zustand with React 19 concurrent features
12. Establish <16ms performance monitoring

### Week 5-8: Migration
13. Replace remaining react-babylonjs patterns with custom implementation
14. Ensure Manifold WASM works with custom implementation
15. Achieve 95%+ test coverage
16. Fine-tune Core Web Vitals compliance

### Week 9-12: Production
17. Deploy with monitoring and rollback capabilities
18. Implement React 19 concurrent features
19. Create comprehensive documentation
20. Set up production monitoring

### Success Metrics
- **Performance**: <16ms render, LCP < 2.5s, INP < 200ms
- **Quality**: Zero violations, 95%+ coverage
- **Bundle**: 20-70% size reduction
- **Accessibility**: WCAG 2.1 AA compliance
- **Reliability**: Zero memory leaks, proper context management
