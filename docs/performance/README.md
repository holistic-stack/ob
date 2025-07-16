# Performance Optimization Guide

## Overview

This comprehensive guide covers performance optimization techniques for OpenSCAD Babylon applications. From efficient OpenSCAD code patterns to browser optimization strategies, this guide helps you achieve optimal performance across all aspects of the system.

## Performance Targets

### Baseline Performance Goals
- **Parse Time**: <50ms for typical OpenSCAD files (<1000 lines)
- **Render Time**: <16ms per frame for smooth 60fps interaction
- **Memory Usage**: <100MB for complex models
- **Startup Time**: <2 seconds for initial application load
- **Export Time**: <5 seconds for typical CAD models

### Performance Monitoring
```typescript
// Built-in performance monitoring
import { usePerformanceMonitor } from 'openscad-babylon';

function PerformanceAwareComponent() {
  const { metrics, startMeasurement } = usePerformanceMonitor();
  
  const handleCodeChange = useCallback(async (code: string) => {
    const measurement = startMeasurement('parse');
    await parseCode(code);
    measurement.end();
  }, []);
  
  return (
    <div>
      <CodeEditor onChange={handleCodeChange} />
      <PerformanceMetrics metrics={metrics} />
    </div>
  );
}
```

## OpenSCAD Code Optimization

### [Efficient Modeling Patterns](./openscad-optimization.md)
Optimize your OpenSCAD code for better parsing and rendering performance.

**Key Topics:**
- Parameter optimization ($fn, $fa, $fs)
- Efficient boolean operations
- Memory-efficient modeling techniques
- Avoiding performance pitfalls

### Quick Optimization Tips

#### 1. Optimize Resolution Parameters
```openscad
// Slow: High resolution for everything
$fn = 100;
sphere(r=1);  // 100 faces for tiny sphere

// Fast: Appropriate resolution
$fn = 32;     // Good default
sphere(r=1);  // 32 faces sufficient

// Best: Conditional resolution
$fn = $preview ? 16 : 64;  // Low res for preview, high for render
```

#### 2. Efficient Boolean Operations
```openscad
// Slow: Multiple separate operations
difference() {
  cube([10, 10, 10]);
  cylinder(h=12, r=1);
}
difference() {
  // Previous result
  cylinder(h=12, r=0.5);
}

// Fast: Single operation with multiple subtractions
difference() {
  cube([10, 10, 10]);
  cylinder(h=12, r=1);
  cylinder(h=12, r=0.5);
}
```

#### 3. Avoid Excessive Nesting
```openscad
// Slow: Deep nesting
for (i = [0:10]) {
  for (j = [0:10]) {
    for (k = [0:10]) {
      translate([i*2, j*2, k*2])
        cube([1, 1, 1]);
    }
  }
}  // 1331 cubes!

// Fast: Simplified approach
cube([20, 20, 20]);  // Single cube with same volume
```

## Parsing Performance

### [Tree-sitter Optimization](./parsing-optimization.md)
Optimize OpenSCAD parsing for real-time applications.

**Key Topics:**
- Debouncing strategies
- Incremental parsing
- Error recovery optimization
- AST processing efficiency

### Debouncing Configuration
```typescript
// Optimal debouncing for different scenarios
const DEBOUNCE_TIMES = {
  TYPING: 300,        // While user is typing
  IDLE: 100,          // When user pauses
  BACKGROUND: 1000,   // Background processing
} as const;

// Adaptive debouncing
function useAdaptiveDebouncing(code: string) {
  const [isTyping, setIsTyping] = useState(false);
  
  const debouncedParse = useMemo(
    () => debounce(
      parseCode, 
      isTyping ? DEBOUNCE_TIMES.TYPING : DEBOUNCE_TIMES.IDLE
    ),
    [isTyping]
  );
  
  return debouncedParse;
}
```

### Parser Optimization
```typescript
// Efficient parser usage
class OptimizedParser {
  private parser: OpenscadParser;
  private lastCode: string = '';
  private lastResult: ParseResult | null = null;
  
  async parseWithCaching(code: string): Promise<ParseResult> {
    // Skip parsing if code hasn't changed
    if (code === this.lastCode && this.lastResult) {
      return this.lastResult;
    }
    
    const result = this.parser.parseASTWithResult(code);
    this.lastCode = code;
    this.lastResult = result;
    
    return result;
  }
}
```

## 3D Rendering Performance

### [BabylonJS Optimization](./rendering-optimization.md)
Optimize 3D scene rendering for smooth interaction.

**Key Topics:**
- Scene management optimization
- Mesh complexity reduction
- Material and texture optimization
- Camera and lighting performance

### Scene Optimization
```typescript
// Efficient scene management
function OptimizedScene({ openscadCode }: { openscadCode: string }) {
  const sceneRef = useRef<Scene | null>(null);
  
  // Optimize render loop
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Enable optimizations
    scene.skipPointerMovePicking = true;  // Faster mouse interaction
    scene.autoClear = false;              // Manual clearing
    scene.autoClearDepthAndStencil = false;
    
    // Optimize culling
    scene.setRenderingAutoClearDepthStencil(0, false, false, false);
    
    return () => {
      // Cleanup
      scene.dispose();
    };
  }, []);
  
  return <BabylonCanvas onSceneReady={setScene} />;
}
```

### Mesh Optimization
```typescript
// Efficient mesh management
class MeshOptimizer {
  static optimizeMesh(mesh: AbstractMesh): void {
    // Enable optimizations
    mesh.freezeWorldMatrix();           // Static objects
    mesh.doNotSyncBoundingInfo = true; // Skip bounds updates
    mesh.alwaysSelectAsActiveMesh = true; // Skip frustum culling
    
    // Optimize materials
    if (mesh.material) {
      mesh.material.freeze();           // Freeze material state
    }
  }
  
  static createLOD(mesh: AbstractMesh, distances: number[]): void {
    // Level of Detail for complex meshes
    const lod1 = mesh.createInstance("lod1");
    const lod2 = mesh.createInstance("lod2");
    
    mesh.addLODLevel(distances[0], lod1);
    mesh.addLODLevel(distances[1], lod2);
    mesh.addLODLevel(distances[2], null); // Cull at distance
  }
}
```

## CSG Operation Performance

### [Manifold Optimization](./csg-optimization.md)
Optimize CSG operations for complex boolean modeling.

**Key Topics:**
- Manifold operation efficiency
- Memory management for CSG
- Complex geometry handling
- Boolean operation optimization

### CSG Best Practices
```typescript
// Efficient CSG operations
class CSGOptimizer {
  static async optimizeCSGChain(operations: CSGOperation[]): Promise<Mesh> {
    // Batch operations for efficiency
    const batches = this.batchOperations(operations);
    
    let result: Mesh | null = null;
    
    for (const batch of batches) {
      const batchResult = await this.processBatch(batch);
      
      if (result) {
        result = await this.combineResults(result, batchResult);
      } else {
        result = batchResult;
      }
      
      // Clean up intermediate results
      this.cleanupIntermediateResults(batch);
    }
    
    return result!;
  }
  
  private static batchOperations(operations: CSGOperation[]): CSGOperation[][] {
    // Group operations by type for efficiency
    const unions = operations.filter(op => op.type === 'union');
    const differences = operations.filter(op => op.type === 'difference');
    const intersections = operations.filter(op => op.type === 'intersection');
    
    return [unions, differences, intersections].filter(batch => batch.length > 0);
  }
}
```

## Browser and Platform Optimization

### [WebGL Performance](./webgl-optimization.md)
Optimize for different browsers and devices.

**Key Topics:**
- WebGL context optimization
- Memory management in browsers
- Platform-specific optimizations
- Mobile device considerations

### Browser-Specific Optimizations
```typescript
// Browser detection and optimization
class BrowserOptimizer {
  static detectCapabilities(): BrowserCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    
    return {
      webgl2: !!gl,
      maxTextureSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE) || 2048,
      maxVertexAttribs: gl?.getParameter(gl.MAX_VERTEX_ATTRIBS) || 16,
      extensions: gl?.getSupportedExtensions() || [],
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      memory: (navigator as any).deviceMemory || 4, // GB estimate
    };
  }
  
  static applyOptimizations(capabilities: BrowserCapabilities): void {
    if (capabilities.isMobile) {
      // Mobile optimizations
      Engine.audioEngine?.setGlobalVolume(0); // Disable audio
      Scene.DefaultMaterialMakesRoomForLightData = false;
    }
    
    if (capabilities.memory < 4) {
      // Low memory optimizations
      Engine.CollisionsEpsilon = 0.1; // Reduce precision
    }
  }
}
```

### Memory Management
```typescript
// Efficient memory management
class MemoryManager {
  private static readonly MAX_MEMORY_MB = 200;
  private static currentUsage = 0;
  
  static trackMemoryUsage(operation: string, size: number): void {
    this.currentUsage += size;
    
    if (this.currentUsage > this.MAX_MEMORY_MB) {
      console.warn(`Memory usage high: ${this.currentUsage}MB`);
      this.triggerCleanup();
    }
  }
  
  static triggerCleanup(): void {
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    // Clean up unused resources
    Engine.LastCreatedScene?.dispose();
    
    this.currentUsage = 0;
  }
}
```

## Development Workflow Performance

### [Build Optimization](./build-optimization.md)
Optimize development and build processes.

**Key Topics:**
- Vite configuration optimization
- Hot reload performance
- Bundle size optimization
- Development server tuning

### Vite Configuration
```typescript
// Optimized Vite configuration
export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'babylon': ['@babylonjs/core'],
          'openscad': ['@holistic-stack/openscad-parser'],
          'vendor': ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['@babylonjs/core', 'react', 'react-dom'],
    exclude: ['@holistic-stack/openscad-parser'], // WebAssembly module
  },
  server: {
    hmr: {
      overlay: false, // Disable error overlay for performance
    },
  },
});
```

### Hot Reload Optimization
```typescript
// Efficient hot reload handling
function useHotReload() {
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        // Selective hot reload
        if (newModule?.shouldReload) {
          window.location.reload();
        }
      });
      
      // Preserve state during hot reload
      import.meta.hot.dispose((data) => {
        data.preservedState = getCurrentState();
      });
    }
  }, []);
}
```

## Profiling and Monitoring

### [Performance Profiling](./profiling-guide.md)
Tools and techniques for performance analysis.

**Key Topics:**
- Browser DevTools profiling
- Custom performance metrics
- Bottleneck identification
- Performance regression detection

### Performance Metrics Collection
```typescript
// Comprehensive performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  
  startMeasurement(name: string): PerformanceMeasurement {
    const start = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration);
        return duration;
      },
    };
  }
  
  recordMetric(name: string, value: number): void {
    const existing = this.metrics.get(name);
    
    if (existing) {
      existing.count++;
      existing.total += value;
      existing.average = existing.total / existing.count;
      existing.min = Math.min(existing.min, value);
      existing.max = Math.max(existing.max, value);
    } else {
      this.metrics.set(name, {
        count: 1,
        total: value,
        average: value,
        min: value,
        max: value,
      });
    }
  }
  
  getMetrics(): Record<string, PerformanceMetric> {
    return Object.fromEntries(this.metrics);
  }
}
```

## Performance Testing

### Automated Performance Tests
```typescript
// Performance regression tests
describe('Performance Tests', () => {
  it('should parse simple models within target time', async () => {
    const parser = new OpenscadParser();
    await parser.init();
    
    const start = performance.now();
    const result = parser.parseASTWithResult('cube([1,1,1]);');
    const duration = performance.now() - start;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(50); // 50ms target
    
    parser.dispose();
  });
  
  it('should render complex scenes within target time', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    
    const start = performance.now();
    
    // Create complex scene
    for (let i = 0; i < 100; i++) {
      CreateBox(`box${i}`, { size: 1 }, scene);
    }
    
    scene.render();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(16); // 16ms target for 60fps
    
    scene.dispose();
    engine.dispose();
  });
});
```

## Performance Checklist

### Development Phase
- [ ] Use appropriate $fn values for OpenSCAD models
- [ ] Implement efficient debouncing for real-time editing
- [ ] Optimize boolean operations and avoid excessive nesting
- [ ] Enable BabylonJS scene optimizations
- [ ] Implement proper memory management and cleanup

### Production Phase
- [ ] Bundle size optimization with code splitting
- [ ] Enable compression and caching
- [ ] Implement performance monitoring
- [ ] Test on target devices and browsers
- [ ] Set up performance regression testing

### Monitoring Phase
- [ ] Track key performance metrics
- [ ] Monitor memory usage and leaks
- [ ] Analyze user interaction patterns
- [ ] Identify and fix performance bottlenecks
- [ ] Regular performance audits and optimization

## Performance Resources

- **[OpenSCAD Optimization](./openscad-optimization.md)** - Efficient modeling techniques
- **[Parsing Optimization](./parsing-optimization.md)** - Tree-sitter and AST optimization
- **[Rendering Optimization](./rendering-optimization.md)** - BabylonJS performance tuning
- **[CSG Optimization](./csg-optimization.md)** - Manifold operation efficiency
- **[Browser Optimization](./browser-optimization.md)** - Platform-specific optimizations
- **[Profiling Guide](./profiling-guide.md)** - Performance analysis tools

## Support and Community

- **Performance Issues**: Report performance problems on GitHub
- **Optimization Tips**: Share techniques in community discussions
- **Benchmarking**: Contribute to performance benchmark suite
- **Best Practices**: Help improve this guide with your experience
