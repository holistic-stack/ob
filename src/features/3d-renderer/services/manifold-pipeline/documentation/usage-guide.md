# Manifold Pipeline Usage Guide

## Quick Start

### 1. Installation and Setup

```typescript
import { ManifoldPipelineService } from './manifold-pipeline-service';
import { ManifoldPrimitiveProcessor } from './processors/manifold-primitive-processor';
import { ManifoldTransformationProcessor } from './processors/manifold-transformation-processor';
import { ManifoldCSGProcessor } from './processors/manifold-csg-processor';
import { OpenscadParser } from '../../../openscad-parser/openscad-parser';

// Create processors
const primitiveProcessor = new ManifoldPrimitiveProcessor();
const transformationProcessor = new ManifoldTransformationProcessor();
const csgProcessor = new ManifoldCSGProcessor();

// Create pipeline service
const pipelineService = new ManifoldPipelineService({
  primitiveProcessor,
  transformationProcessor,
  csgProcessor
});

// Create OpenSCAD parser
const openscadParser = new OpenscadParser();
```

### 2. Initialize Components

```typescript
// Initialize parser
await openscadParser.init();

// Initialize pipeline
const initResult = await pipelineService.initialize();
if (!initResult.success) {
  throw new Error(`Pipeline initialization failed: ${initResult.error}`);
}
```

### 3. Process OpenSCAD Code

```typescript
const openscadCode = 'cube([2, 3, 4]);';

// Parse OpenSCAD code
const parseResult = openscadParser.parseASTWithResult(openscadCode);
if (!parseResult.success) {
  throw new Error(`Parsing failed: ${parseResult.error}`);
}

// Process through pipeline
const result = await pipelineService.processNodes(parseResult.data);
if (!result.success) {
  throw new Error(`Pipeline processing failed: ${result.error}`);
}

// Use the generated geometries
const { geometries, processingTime, operationsPerformed } = result.data;
console.log(`Generated ${geometries.length} geometries in ${processingTime}ms`);
```

### 4. Cleanup

```typescript
// Always cleanup resources
pipelineService.dispose();
openscadParser.dispose();
```

## Common Use Cases

### Basic Primitives

#### Cube
```typescript
const cubeCode = `
  cube([10, 5, 2]);           // Basic cube
  cube([5, 5, 5], center=true); // Centered cube
`;

const result = await processOpenSCAD(cubeCode);
// Result contains Three.js BufferGeometry for the cube
```

#### Sphere
```typescript
const sphereCode = `
  sphere(r=5);        // Sphere with radius
  sphere(d=10);       // Sphere with diameter
`;

const result = await processOpenSCAD(sphereCode);
```

#### Cylinder
```typescript
const cylinderCode = `
  cylinder(h=10, r=3);           // Basic cylinder
  cylinder(h=8, r1=2, r2=4);     // Tapered cylinder
`;

const result = await processOpenSCAD(cylinderCode);
```

### Transformations

#### Translation
```typescript
const translateCode = `
  translate([5, 10, 15])
    cube([2, 2, 2]);
`;

const result = await processOpenSCAD(translateCode);
```

#### Rotation
```typescript
const rotateCode = `
  rotate([0, 0, 45])
    cube([3, 1, 1]);
`;

const result = await processOpenSCAD(rotateCode);
```

#### Scaling
```typescript
const scaleCode = `
  scale([2, 1, 0.5])
    sphere(r=1);
`;

const result = await processOpenSCAD(scaleCode);
```

#### Combined Transformations
```typescript
const combinedCode = `
  translate([10, 0, 0])
    rotate([0, 0, 45])
      scale([2, 1, 1])
        cube([1, 1, 1]);
`;

const result = await processOpenSCAD(combinedCode);
```

### CSG Operations

#### Union
```typescript
const unionCode = `
  union() {
    cube([4, 4, 4]);
    translate([2, 2, 2])
      sphere(r=2);
  }
`;

const result = await processOpenSCAD(unionCode);
```

#### Difference
```typescript
const differenceCode = `
  difference() {
    cube([6, 6, 6]);
    translate([3, 3, -1])
      cylinder(h=8, r=2);
  }
`;

const result = await processOpenSCAD(differenceCode);
```

#### Intersection
```typescript
const intersectionCode = `
  intersection() {
    cube([4, 4, 4]);
    sphere(r=3);
  }
`;

const result = await processOpenSCAD(intersectionCode);
```

### Complex Examples

#### Bracket Design
```typescript
const bracketCode = `
  difference() {
    // Main bracket body
    cube([20, 10, 5]);
    
    // Mounting holes
    translate([3, 5, -1])
      cylinder(h=7, r=1.5);
    translate([17, 5, -1])
      cylinder(h=7, r=1.5);
    
    // Central cutout
    translate([6, 2, -1])
      cube([8, 6, 7]);
  }
`;

const result = await processOpenSCAD(bracketCode);
```

#### Gear Tooth (Simplified)
```typescript
const gearCode = `
  union() {
    // Base cylinder
    cylinder(h=5, r=10);
    
    // Simplified teeth
    translate([9, 0, 0])
      cube([3, 1, 5]);
    rotate([0, 0, 30])
      translate([9, 0, 0])
        cube([3, 1, 5]);
    rotate([0, 0, 60])
      translate([9, 0, 0])
        cube([3, 1, 5]);
  }
`;

const result = await processOpenSCAD(gearCode);
```

## Performance Optimization

### Using Performance Monitor

```typescript
import { PerformanceMonitor } from './performance-monitoring/performance-monitor';

const monitor = new PerformanceMonitor({
  targetDuration: 16,           // 16ms for 60fps
  enableDetailedLogging: true,
  enableMemoryTracking: true
});

// Track operations
monitor.startOperation('complex-processing', 'pipeline', 5);
const result = await pipelineService.processNodes(astNodes);
const metrics = monitor.endOperation('complex-processing', result.success);

if (metrics.success) {
  console.log(`Processing took ${metrics.data.duration}ms`);
  if (metrics.data.duration > 16) {
    console.warn('Performance target exceeded!');
  }
}

// Get overall statistics
const stats = monitor.getStats();
console.log(`Average duration: ${stats.averageDuration}ms`);
console.log(`P95 duration: ${stats.p95Duration}ms`);
console.log(`Target violations: ${stats.targetViolations}`);
```

### Performance Best Practices

1. **Batch Processing**: Process multiple simple operations together
2. **Monitor Complexity**: Use performance monitor to track CSG complexity
3. **Memory Management**: Always dispose resources when done
4. **Optimize CSG**: Minimize nested CSG operations when possible

```typescript
// Good: Batch simple operations
const batchCode = `
  union() {
    cube([1, 1, 1]);
    translate([2, 0, 0]) cube([1, 1, 1]);
    translate([4, 0, 0]) cube([1, 1, 1]);
  }
`;

// Avoid: Deeply nested CSG operations
const avoidCode = `
  difference() {
    difference() {
      difference() {
        cube([10, 10, 10]);
        sphere(r=3);
      }
      cylinder(h=12, r=2);
    }
    translate([5, 5, 5]) cube([2, 2, 2]);
  }
`;
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
async function processOpenSCADSafely(code: string): Promise<THREE.BufferGeometry[]> {
  try {
    // Parse OpenSCAD code
    const parseResult = openscadParser.parseASTWithResult(code);
    if (!parseResult.success) {
      console.error('Parsing failed:', parseResult.error);
      return [];
    }

    // Process through pipeline
    const result = await pipelineService.processNodes(parseResult.data);
    if (!result.success) {
      console.error('Pipeline processing failed:', result.error);
      return [];
    }

    // Validate results
    if (result.data.geometries.length === 0) {
      console.warn('No geometries generated from OpenSCAD code');
      return [];
    }

    return result.data.geometries;
  } catch (error) {
    console.error('Unexpected error during processing:', error);
    return [];
  }
}
```

### Graceful Degradation

```typescript
async function processWithFallback(code: string): Promise<THREE.BufferGeometry[]> {
  const result = await processOpenSCADSafely(code);
  
  if (result.length === 0) {
    // Fallback to simple cube if processing fails
    console.warn('Processing failed, using fallback geometry');
    const fallbackGeometry = new THREE.BoxGeometry(1, 1, 1);
    return [fallbackGeometry];
  }
  
  return result;
}
```

## Integration Examples

### React Three Fiber Component

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { BufferGeometry } from 'three';

interface OpenSCADMeshProps {
  code: string;
  onProcessingComplete?: (geometries: BufferGeometry[]) => void;
  onError?: (error: string) => void;
}

export function OpenSCADMesh({ code, onProcessingComplete, onError }: OpenSCADMeshProps) {
  const [geometries, setGeometries] = useState<BufferGeometry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const pipelineRef = useRef<ManifoldPipelineService | null>(null);

  useEffect(() => {
    const initializePipeline = async () => {
      if (!pipelineRef.current) {
        pipelineRef.current = new ManifoldPipelineService({
          primitiveProcessor: new ManifoldPrimitiveProcessor(),
          transformationProcessor: new ManifoldTransformationProcessor(),
          csgProcessor: new ManifoldCSGProcessor()
        });
        
        await pipelineRef.current.initialize();
      }
    };

    initializePipeline();

    return () => {
      if (pipelineRef.current) {
        pipelineRef.current.dispose();
        pipelineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const processCode = async () => {
      if (!pipelineRef.current || !code.trim()) return;

      setIsProcessing(true);
      try {
        const result = await processOpenSCADSafely(code);
        setGeometries(result);
        onProcessingComplete?.(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError?.(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    processCode();
  }, [code, onProcessingComplete, onError]);

  if (isProcessing) {
    return <mesh><boxGeometry args={[0.1, 0.1, 0.1]} /><meshBasicMaterial color="gray" /></mesh>;
  }

  return (
    <>
      {geometries.map((geometry, index) => (
        <mesh key={index}>
          <primitive object={geometry} />
          <meshStandardMaterial color="orange" />
        </mesh>
      ))}
    </>
  );
}
```

### Zustand Store Integration

```typescript
import { create } from 'zustand';

interface OpenSCADStore {
  code: string;
  geometries: BufferGeometry[];
  isProcessing: boolean;
  error: string | null;
  
  setCode: (code: string) => void;
  processCode: () => Promise<void>;
  clearError: () => void;
}

export const useOpenSCADStore = create<OpenSCADStore>((set, get) => ({
  code: '',
  geometries: [],
  isProcessing: false,
  error: null,

  setCode: (code: string) => set({ code }),

  processCode: async () => {
    const { code } = get();
    if (!code.trim()) return;

    set({ isProcessing: true, error: null });

    try {
      const geometries = await processOpenSCADSafely(code);
      set({ geometries, isProcessing: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      set({ error: errorMessage, isProcessing: false, geometries: [] });
    }
  },

  clearError: () => set({ error: null })
}));
```

## Testing Your Implementation

### Unit Testing

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('OpenSCAD Processing', () => {
  let pipelineService: ManifoldPipelineService;
  let openscadParser: OpenscadParser;

  beforeEach(async () => {
    openscadParser = new OpenscadParser();
    await openscadParser.init();

    pipelineService = new ManifoldPipelineService({
      primitiveProcessor: new ManifoldPrimitiveProcessor(),
      transformationProcessor: new ManifoldTransformationProcessor(),
      csgProcessor: new ManifoldCSGProcessor()
    });

    await pipelineService.initialize();
  });

  afterEach(() => {
    pipelineService.dispose();
    openscadParser.dispose();
  });

  test('should process simple cube', async () => {
    const parseResult = openscadParser.parseASTWithResult('cube([2, 3, 4]);');
    expect(parseResult.success).toBe(true);

    if (parseResult.success) {
      const result = await pipelineService.processNodes(parseResult.data);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.geometries).toHaveLength(1);
        expect(result.data.manifoldness).toBe(true);
      }
    }
  });
});
```

### Integration Testing

```typescript
test('should handle complex CSG operations', async () => {
  const complexCode = `
    difference() {
      union() {
        cube([4, 4, 4]);
        sphere(r=2);
      }
      cylinder(h=6, r=1);
    }
  `;

  const parseResult = openscadParser.parseASTWithResult(complexCode);
  expect(parseResult.success).toBe(true);

  if (parseResult.success) {
    const result = await pipelineService.processNodes(parseResult.data);
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.data.geometries).toHaveLength(1);
      expect(result.data.operationsPerformed).toContain('csg_operations');
      expect(result.data.processingTime).toBeLessThan(100); // Performance check
    }
  }
});
```

## Troubleshooting

### Common Issues

1. **Memory Leaks**: Always call `dispose()` on pipeline and parser
2. **Performance Issues**: Use PerformanceMonitor to identify bottlenecks
3. **Parsing Errors**: Check OpenSCAD syntax and supported features
4. **CSG Failures**: Ensure geometries are manifold before CSG operations

### Debug Logging

```typescript
import { logger } from '../../../../../shared/services/logger.service';

// Enable debug logging
logger.setLevel('DEBUG');

// Process with detailed logging
const result = await pipelineService.processNodes(astNodes);
```

### Performance Debugging

```typescript
const monitor = new PerformanceMonitor({
  enableDetailedLogging: true,
  targetDuration: 16
});

// Track specific operations
monitor.startOperation('debug-operation', 'pipeline', astNodes.length);
const result = await pipelineService.processNodes(astNodes);
const metrics = monitor.endOperation('debug-operation', result.success);

if (metrics.success && metrics.data.duration > 16) {
  console.warn('Performance issue detected:', {
    duration: metrics.data.duration,
    nodeCount: astNodes.length,
    operations: result.success ? result.data.operationsPerformed : []
  });
}
```
