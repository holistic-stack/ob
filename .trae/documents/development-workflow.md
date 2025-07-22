# OpenSCAD Babylon Development Workflow

## Development Environment Setup

### Prerequisites

- **Node.js 22.14.0+** (LTS version)
- **pnpm 10.10.0+** (Package manager)
- **VS Code** (Recommended IDE)
- **Git** for version control

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd openscad-babylon

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Code quality check
pnpm biome:check
```

### VS Code Extensions

- **Biome**: Code formatting and linting
- **TypeScript Importer**: Auto-import management
- **Error Lens**: Inline error display
- **GitLens**: Git integration
- **Thunder Client**: API testing

## Development Commands

### Core Commands

```bash
# Development server (http://localhost:5173)
pnpm dev

# Production build
pnpm build

# Type checking
pnpm typecheck

# Run all tests
pnpm test

# Test with coverage
pnpm test:coverage

# Test in watch mode
pnpm test:watch

# E2E tests
pnpm test:ct

# Visual regression tests
pnpm test:visual
```

### Code Quality Commands

```bash
# Check code quality (lint + format)
pnpm biome:check

# Fix auto-fixable issues
pnpm biome:fix

# Format code
pnpm biome:format

# Lint only
pnpm biome:lint
```

### Validation Commands

```bash
# Validate types
pnpm validate:types

# Validate code quality
pnpm validate:quality

# Validate everything
pnpm validate:all

# Validate complete pipeline
pnpm validate
```

## Development Workflow

### 1. Feature Development Process

#### Step 1: Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

#### Step 2: Set Up Feature Structure

```bash
# Create feature directory
mkdir -p src/features/your-feature
cd src/features/your-feature

# Create standard structure
mkdir components hooks services types utils __tests__
touch index.ts
```

#### Step 3: Implement with TDD

```typescript
// 1. Write test first
// your-feature.test.ts
describe('YourFeature', () => {
  it('should do something', () => {
    // Test implementation
  });
});

// 2. Implement minimal code to pass
// your-feature.ts
export function yourFeature() {
  // Minimal implementation
}

// 3. Refactor and improve
// Enhance implementation while keeping tests green
```

#### Step 4: Validate Implementation

```bash
# Run tests
pnpm test src/features/your-feature

# Type check
pnpm typecheck

# Code quality
pnpm biome:check

# Integration test
pnpm test:ct
```

### 2. Code Review Process

#### Pre-Review Checklist

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Code quality checks pass
- [ ] Feature is documented
- [ ] Integration tests added
- [ ] Performance impact assessed

#### Review Guidelines

- **Architecture**: Does it follow bulletproof-react patterns?
- **Performance**: Does it meet <16ms render requirements?
- **Type Safety**: Are all types explicit and correct?
- **Error Handling**: Uses Result<T,E> pattern?
- **Testing**: Comprehensive test coverage?
- **Documentation**: Clear and up-to-date?

### 3. Debugging Workflow

#### Common Issues and Solutions

**TypeScript Errors**
```bash
# Check specific file
npx tsc --noEmit src/path/to/file.ts

# Check all files
pnpm typecheck

# Clear TypeScript cache
rm -rf .tsbuildinfo*
```

**Test Failures**
```bash
# Run specific test
pnpm test src/path/to/test.test.ts

# Run with verbose output
pnpm test --reporter=verbose

# Run with coverage
pnpm test:coverage

# Debug test
pnpm test --inspect-brk
```

**Performance Issues**
```bash
# Profile rendering
# Add performance markers in code
console.time('render');
// rendering code
console.timeEnd('render');

# Use React DevTools Profiler
# Monitor BabylonJS Inspector
```

**Build Issues**
```bash
# Clear all caches
rm -rf node_modules/.vite
rm -rf dist
pnpm install

# Check bundle size
pnpm build
npx vite-bundle-analyzer dist
```

## Code Quality Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types
function parseOpenSCAD(code: string): Result<OpenSCADNode, ParseError> {
  // Implementation
}

// ❌ Bad: Implicit any
function parseOpenSCAD(code) {
  // Implementation
}

// ✅ Good: Branded types
type NodeId = string & { __brand: 'NodeId' };

// ✅ Good: Result pattern
function riskyOperation(): Result<Data, Error> {
  try {
    const data = doSomething();
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

// ❌ Bad: Throwing exceptions
function riskyOperation(): Data {
  return doSomething(); // May throw
}
```

### React Guidelines

```typescript
// ✅ Good: Functional component with explicit props
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

function Component({ value, onChange }: ComponentProps) {
  // Implementation
}

// ✅ Good: Custom hook
function useFeature() {
  const [state, setState] = useState();
  // Hook logic
  return { state, setState };
}

// ✅ Good: Error boundary
function FeatureWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <Feature />
    </ErrorBoundary>
  );
}
```

### Performance Guidelines

```typescript
// ✅ Good: Memoization
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(props);
}, [props.dependency]);

// ✅ Good: Debouncing
const debouncedUpdate = useCallback(
  debounce((value: string) => {
    updateValue(value);
  }, 300),
  []
);

// ✅ Good: Resource cleanup
useEffect(() => {
  const resource = createResource();
  return () => resource.dispose();
}, []);
```

## Testing Strategy

### Test Organization

```
src/features/feature-name/
├── components/
│   ├── component.tsx
│   └── component.test.tsx          # Co-located unit tests
├── hooks/
│   ├── use-hook.ts
│   └── use-hook.test.ts           # Co-located unit tests
├── services/
│   ├── service.ts
│   └── service.test.ts            # Co-located unit tests
└── __tests__/
    ├── feature.integration.test.ts # Integration tests
    └── feature.e2e.test.ts        # E2E tests
```

### Test Types

**Unit Tests**
```typescript
// Test individual functions
describe('parseOpenSCAD', () => {
  it('should parse valid cube syntax', () => {
    const result = parseOpenSCAD('cube([1, 2, 3]);');
    expect(result.success).toBe(true);
  });
});

// Test React components
describe('OpenSCADEditor', () => {
  it('should display syntax errors', async () => {
    render(<OpenSCADEditor value="invalid" />);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
```

**Integration Tests**
```typescript
// Test feature interactions
describe('Editor to Renderer Integration', () => {
  it('should update 3D scene when code changes', async () => {
    const { getByRole } = render(<App />);
    const editor = getByRole('textbox');
    
    await userEvent.type(editor, 'cube([2, 2, 2]);');
    
    // Verify scene updates
    await waitFor(() => {
      expect(getSceneMeshCount()).toBe(1);
    });
  });
});
```

**E2E Tests**
```typescript
// Test complete user workflows
test('complete modeling workflow', async ({ page }) => {
  await page.goto('/');
  
  // Type OpenSCAD code
  await page.fill('[data-testid="editor"]', 'cube([1, 1, 1]);');
  
  // Verify 3D rendering
  await expect(page.locator('[data-testid="scene"]')).toBeVisible();
  
  // Take screenshot for visual regression
  await expect(page).toHaveScreenshot('cube-render.png');
});
```

### Performance Testing

```typescript
// Performance benchmarks
describe('Rendering Performance', () => {
  it('should render cube in <16ms', async () => {
    const start = performance.now();
    
    const result = await renderOpenSCAD('cube([1, 1, 1]);');
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(16);
  });
});
```

## Deployment Workflow

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Type checking passes
- [ ] Code quality checks pass
- [ ] Performance benchmarks pass
- [ ] Visual regression tests pass
- [ ] Documentation updated
- [ ] Changelog updated

### Build Process

```bash
# Production build
pnpm build

# Analyze bundle
npx vite-bundle-analyzer dist

# Test production build
npx serve dist
```

### Performance Monitoring

```typescript
// Add performance monitoring
function trackPerformance(operation: string, duration: number) {
  if (duration > 16) {
    console.warn(`Performance warning: ${operation} took ${duration}ms`);
  }
}

// Monitor render times
const renderStart = performance.now();
// rendering code
const renderDuration = performance.now() - renderStart;
trackPerformance('render', renderDuration);
```

## Troubleshooting Guide

### Common Issues

**Module Resolution Errors**
```bash
# Check tsconfig paths
cat tsconfig.json | grep paths

# Verify file exists
ls -la src/path/to/module

# Clear module cache
rm -rf node_modules/.cache
```

**Memory Issues**
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
node --inspect-brk node_modules/.bin/vite
```

**BabylonJS Issues**
```typescript
// Check WebGL support
if (!BABYLON.Engine.isSupported()) {
  console.error('WebGL not supported');
}

// Monitor memory leaks
scene.onDisposeObservable.add(() => {
  console.log('Scene disposed');
});
```

### Debug Tools

- **React DevTools**: Component inspection
- **BabylonJS Inspector**: 3D scene debugging
- **Chrome DevTools**: Performance profiling
- **VS Code Debugger**: Breakpoint debugging

This workflow ensures consistent, high-quality development practices across the OpenSCAD Babylon project.