# BabylonJS Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when working with BabylonJS in the OpenSCAD Babylon project. It covers performance problems, memory leaks, rendering issues, and debugging techniques.

## Table of Contents

1. [Performance Issues](#performance-issues)
2. [Memory Leaks](#memory-leaks)
3. [Rendering Problems](#rendering-problems)
4. [WebGL Errors](#webgl-errors)
5. [CSG Operation Issues](#csg-operation-issues)
6. [Debugging Techniques](#debugging-techniques)
7. [Common Error Messages](#common-error-messages)

## Performance Issues

### Low Frame Rate (< 30 FPS)

**Symptoms**: Choppy animations, slow camera movement, delayed interactions

**Diagnosis**:
```typescript
// Check frame rate
const monitor = new PerformanceMonitor();
monitor.startMonitoring(scene);
console.log('Average FPS:', monitor.getFPS());

// Check draw calls
console.log('Draw calls:', scene.getEngine().drawCalls);

// Check active meshes
console.log('Active meshes:', scene.getActiveMeshes().length);
```

**Solutions**:

1. **Enable Frustum Culling**:
```typescript
scene.setRenderingAutoClearDepthStencil(0, true, true, true);
scene.freezeActiveMeshes(); // For static scenes
```

2. **Implement LOD (Level of Detail)**:
```typescript
function setupLOD(mesh: AbstractMesh) {
  const lowDetail = mesh.createInstance("low");
  lowDetail.scaling = new Vector3(0.5, 0.5, 0.5);
  
  mesh.addLODLevel(100, lowDetail);
  mesh.addLODLevel(200, null); // Cull at distance
}
```

3. **Merge Static Meshes**:
```typescript
const staticMeshes = scene.meshes.filter(m => !m.animations.length);
const merged = Mesh.MergeMeshes(staticMeshes);
```

### High Memory Usage

**Symptoms**: Browser becomes slow, eventual crashes, memory warnings

**Diagnosis**:
```typescript
// Check WebGL memory info
function checkMemoryUsage(engine: Engine) {
  const gl = engine.getRenderingCanvas()?.getContext('webgl2');
  const info = gl?.getExtension('WEBGL_debug_renderer_info');
  
  console.log('Renderer:', gl?.getParameter(info?.UNMASKED_RENDERER_WEBGL));
  console.log('Max texture size:', gl?.getParameter(gl.MAX_TEXTURE_SIZE));
}

// Track scene objects
console.log('Scene stats:', {
  meshes: scene.meshes.length,
  materials: scene.materials.length,
  textures: scene.textures.length
});
```

**Solutions**:

1. **Implement Resource Tracking**:
```typescript
class ResourceTracker {
  private resources: Set<IDisposable> = new Set();
  
  track<T extends IDisposable>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }
  
  dispose(): void {
    this.resources.forEach(r => r.dispose());
    this.resources.clear();
  }
}
```

2. **Use Texture Compression**:
```typescript
function createOptimizedTexture(url: string, scene: Scene): Texture {
  const texture = new Texture(url, scene);
  
  // Enable compression if supported
  if (scene.getEngine().getCaps().s3tc) {
    texture.format = Engine.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
  }
  
  return texture;
}
```

## Memory Leaks

### Event Listeners Not Removed

**Symptoms**: Memory usage increases over time, performance degrades

**Diagnosis**:
```typescript
// Check for orphaned observers
console.log('Pointer observers:', scene.onPointerObservable.observers.length);
console.log('Before render callbacks:', scene._onBeforeRenderObserver?.observers.length);
```

**Solution**:
```typescript
class EventManager {
  private disposables: (() => void)[] = [];
  
  addListener(scene: Scene): void {
    const observer = scene.onPointerObservable.add((info) => {
      // Handle event
    });
    
    // Track for cleanup
    this.disposables.push(() => {
      scene.onPointerObservable.remove(observer);
    });
  }
  
  dispose(): void {
    this.disposables.forEach(dispose => dispose());
    this.disposables = [];
  }
}
```

### Circular References

**Symptoms**: Objects not garbage collected, memory usage grows

**Diagnosis**:
```typescript
// Check for circular references
function checkCircularRefs(obj: any, visited = new Set()): boolean {
  if (visited.has(obj)) return true;
  visited.add(obj);
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (checkCircularRefs(obj[key], visited)) return true;
    }
  }
  
  visited.delete(obj);
  return false;
}
```

**Solution**:
```typescript
// Use WeakMap for references
class MeshManager {
  private meshData = new WeakMap<AbstractMesh, MeshMetadata>();
  
  setMeshData(mesh: AbstractMesh, data: MeshMetadata): void {
    this.meshData.set(mesh, data);
  }
  
  getMeshData(mesh: AbstractMesh): MeshMetadata | undefined {
    return this.meshData.get(mesh);
  }
}
```

## Rendering Problems

### Black Screen / Nothing Renders

**Symptoms**: Canvas is black, no 3D content visible

**Diagnosis**:
```typescript
// Check engine state
console.log('Engine running:', !engine.isDisposed);
console.log('Scene ready:', scene.isReady());
console.log('Camera active:', scene.activeCamera !== null);
console.log('Meshes count:', scene.meshes.length);

// Check WebGL context
const gl = engine.getRenderingCanvas()?.getContext('webgl2');
console.log('WebGL context:', gl !== null);
console.log('WebGL error:', gl?.getError());
```

**Solutions**:

1. **Check Camera Setup**:
```typescript
function setupCamera(scene: Scene): ArcRotateCamera {
  const camera = new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
  
  // Ensure camera is active
  scene.activeCamera = camera;
  
  // Attach controls
  camera.attachToCanvas(scene.getEngine().getRenderingCanvas());
  
  return camera;
}
```

2. **Verify Lighting**:
```typescript
function setupLighting(scene: Scene): void {
  // Add default lighting if none exists
  if (scene.lights.length === 0) {
    const light = new HemisphericLight("default", new Vector3(0, 1, 0), scene);
    light.intensity = 1.0;
  }
}
```

3. **Check Mesh Visibility**:
```typescript
function debugMeshVisibility(scene: Scene): void {
  scene.meshes.forEach(mesh => {
    console.log(`Mesh ${mesh.name}:`, {
      enabled: mesh.isEnabled(),
      visible: mesh.isVisible,
      inFrustum: mesh.isInFrustum(scene.activeCamera!),
      hasGeometry: mesh.geometry !== null
    });
  });
}
```

### Flickering or Z-Fighting

**Symptoms**: Surfaces flicker between different depths

**Solutions**:

1. **Adjust Camera Near/Far Planes**:
```typescript
camera.minZ = 0.1;  // Increase near plane
camera.maxZ = 1000; // Decrease far plane if possible
```

2. **Use Depth Bias**:
```typescript
material.depthBias = -0.0001;
```

3. **Separate Overlapping Geometry**:
```typescript
function separateOverlapping(meshA: AbstractMesh, meshB: AbstractMesh): void {
  const offset = 0.001;
  meshB.position.y += offset;
}
```

## WebGL Errors

### Context Lost

**Symptoms**: "WebGL context lost" error, rendering stops

**Solution**:
```typescript
class WebGLContextManager {
  setupContextLossHandling(canvas: HTMLCanvasElement, engine: Engine): void {
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL context lost');
    });
    
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      // Recreate engine and scene
      this.recreateEngine(canvas);
    });
  }
  
  private recreateEngine(canvas: HTMLCanvasElement): void {
    // Implement engine recreation logic
  }
}
```

### Shader Compilation Errors

**Symptoms**: Custom materials don't render, shader errors in console

**Diagnosis**:
```typescript
function checkShaderCompilation(material: ShaderMaterial): void {
  const effect = material.getEffect();
  if (effect.isReady()) {
    console.log('Shader compiled successfully');
  } else {
    console.error('Shader compilation failed:', effect.getCompilationError());
  }
}
```

**Solution**:
```typescript
// Validate shader code
function createSafeShaderMaterial(name: string, scene: Scene): ShaderMaterial {
  const material = new ShaderMaterial(name, scene, {
    vertex: "custom",
    fragment: "custom"
  }, {
    attributes: ["position", "normal"],
    uniforms: ["world", "worldViewProjection"]
  });
  
  // Add error handling
  material.onError = (effect, errors) => {
    console.error('Shader error:', errors);
  };
  
  return material;
}
```

## CSG Operation Issues

### CSG Operations Fail

**Symptoms**: Boolean operations return null or throw errors

**Diagnosis**:
```typescript
function debugCSGOperation(meshA: AbstractMesh, meshB: AbstractMesh): void {
  console.log('Mesh A:', {
    vertices: meshA.getTotalVertices(),
    indices: meshA.getTotalIndices(),
    hasNormals: meshA.getVerticesData(VertexBuffer.NormalKind) !== null
  });
  
  console.log('Mesh B:', {
    vertices: meshB.getTotalVertices(),
    indices: meshB.getTotalIndices(),
    hasNormals: meshB.getVerticesData(VertexBuffer.NormalKind) !== null
  });
}
```

**Solutions**:

1. **Ensure Manifold Geometry**:
```typescript
function validateMeshForCSG(mesh: AbstractMesh): boolean {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  
  if (!positions || !indices) {
    console.error('Mesh missing vertex data');
    return false;
  }
  
  // Check for degenerate triangles
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    
    if (a === b || b === c || a === c) {
      console.warn('Degenerate triangle found');
      return false;
    }
  }
  
  return true;
}
```

2. **Handle CSG Errors Gracefully**:
```typescript
async function performCSGOperation(
  meshA: AbstractMesh, 
  meshB: AbstractMesh, 
  operation: 'union' | 'subtract' | 'intersect'
): Promise<Result<AbstractMesh, CSGError>> {
  try {
    // Validate inputs
    if (!validateMeshForCSG(meshA) || !validateMeshForCSG(meshB)) {
      return {
        success: false,
        error: {
          code: 'INVALID_MESH_GEOMETRY',
          message: 'Mesh geometry is not suitable for CSG operations',
          timestamp: new Date()
        }
      };
    }
    
    // Perform operation
    const result = await csgService.performOperation(meshA, meshB, operation);
    
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CSG_OPERATION_FAILED',
        message: error.message,
        timestamp: new Date()
      }
    };
  }
}
```

## Debugging Techniques

### Enable BabylonJS Inspector

```typescript
async function enableInspector(scene: Scene): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    const { Inspector } = await import('@babylonjs/inspector');
    Inspector.Show(scene, {
      embedMode: false,
      showExplorer: true,
      showInspector: true
    });
  }
}
```

### Performance Profiling

```typescript
class BabylonProfiler {
  startProfiling(scene: Scene): void {
    scene.registerBeforeRender(() => {
      performance.mark('frame-start');
    });
    
    scene.registerAfterRender(() => {
      performance.mark('frame-end');
      performance.measure('frame-time', 'frame-start', 'frame-end');
      
      const measures = performance.getEntriesByName('frame-time');
      const lastMeasure = measures[measures.length - 1];
      
      if (lastMeasure.duration > 16.67) {
        console.warn(`Slow frame: ${lastMeasure.duration.toFixed(2)}ms`);
      }
    });
  }
}
```

### Memory Monitoring

```typescript
class MemoryMonitor {
  startMonitoring(): void {
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }
    }, 5000);
  }
}
```

## Common Error Messages

### "Cannot read property 'dispose' of null"

**Cause**: Trying to dispose already disposed objects

**Solution**:
```typescript
function safeDispose(disposable: IDisposable | null): void {
  if (disposable && !disposable.isDisposed) {
    disposable.dispose();
  }
}
```

### "WebGL: INVALID_OPERATION: useProgram: program not valid"

**Cause**: Shader program compilation failed

**Solution**:
```typescript
function validateShaderProgram(material: ShaderMaterial): boolean {
  const effect = material.getEffect();
  if (!effect.isReady()) {
    console.error('Shader not ready:', effect.getCompilationError());
    return false;
  }
  return true;
}
```

### "Maximum call stack size exceeded"

**Cause**: Circular references or infinite recursion

**Solution**:
```typescript
// Use iterative approach instead of recursive
function traverseMeshHierarchy(mesh: AbstractMesh): AbstractMesh[] {
  const result: AbstractMesh[] = [];
  const stack: AbstractMesh[] = [mesh];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    
    // Add children to stack
    current.getChildren().forEach(child => {
      if (child instanceof AbstractMesh) {
        stack.push(child);
      }
    });
  }
  
  return result;
}
```

### "Out of memory"

**Cause**: Memory leak or excessive resource usage

**Solution**:
```typescript
class MemoryManager {
  private readonly maxMemoryMB = 512;
  
  checkMemoryUsage(): boolean {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1048576;
      
      if (usedMB > this.maxMemoryMB) {
        console.warn('Memory usage too high, cleaning up...');
        this.forceCleanup();
        return false;
      }
    }
    return true;
  }
  
  private forceCleanup(): void {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Clear caches
    this.clearTextureCache();
    this.clearMeshCache();
  }
}
```

This troubleshooting guide should help resolve most common BabylonJS issues encountered in the OpenSCAD Babylon project. For additional help, consult the BabylonJS documentation and community forums.
