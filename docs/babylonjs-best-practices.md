# BabylonJS Best Practices Guide

## Overview

This guide provides comprehensive best practices for working with BabylonJS 8.16.1 in the OpenSCAD Babylon project. It covers performance optimization, memory management, architecture patterns, and modern development techniques.

## Table of Contents

1. [Core Architecture Principles](#core-architecture-principles)
2. [Performance Optimization](#performance-optimization)
3. [Memory Management](#memory-management)
4. [Service Layer Patterns](#service-layer-patterns)
5. [Testing Strategies](#testing-strategies)
6. [Debugging and Profiling](#debugging-and-profiling)
7. [Common Pitfalls](#common-pitfalls)

## Core Architecture Principles

### 1. Service-Based Architecture

**✅ DO**: Encapsulate BabylonJS functionality in services
```typescript
class BabylonSceneService {
  private engine: Engine;
  private scene: Scene;
  
  async initialize(canvas: HTMLCanvasElement): Promise<Result<Scene, BabylonError>> {
    // Service handles all BabylonJS complexity
  }
  
  dispose(): Result<void, BabylonError> {
    // Proper cleanup
  }
}
```

**❌ DON'T**: Use BabylonJS directly in React components
```typescript
// Avoid this pattern
function BadComponent() {
  const [engine, setEngine] = useState<Engine>();
  const [scene, setScene] = useState<Scene>();
  // Direct BabylonJS manipulation in component
}
```

### 2. Result<T,E> Error Handling

**✅ DO**: Use functional error handling patterns
```typescript
async function createMesh(): Promise<Result<AbstractMesh, BabylonError>> {
  try {
    const mesh = new Mesh("test", scene);
    return { success: true, data: mesh };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'MESH_CREATION_FAILED',
        message: error.message,
        timestamp: new Date()
      }
    };
  }
}
```

**❌ DON'T**: Use try/catch for business logic
```typescript
// Avoid this pattern
function badCreateMesh() {
  try {
    return new Mesh("test", scene);
  } catch (error) {
    throw error; // Propagates exceptions
  }
}
```

### 3. Resource Tracking

**✅ DO**: Track all created resources for disposal
```typescript
class ResourceManager {
  private meshes: Set<AbstractMesh> = new Set();
  private materials: Set<Material> = new Set();
  
  createMesh(name: string): AbstractMesh {
    const mesh = new Mesh(name, this.scene);
    this.meshes.add(mesh);
    return mesh;
  }
  
  dispose(): void {
    this.meshes.forEach(mesh => mesh.dispose());
    this.materials.forEach(material => material.dispose());
    this.meshes.clear();
    this.materials.clear();
  }
}
```

## Performance Optimization

### 1. Mesh Optimization

**Instancing for Repeated Geometry**
```typescript
class InstanceManager {
  createInstances(baseMesh: AbstractMesh, count: number): AbstractMesh[] {
    const instances: AbstractMesh[] = [];
    
    for (let i = 0; i < count; i++) {
      const instance = baseMesh.createInstance(`instance_${i}`);
      instances.push(instance);
    }
    
    // Hide original mesh if only using instances
    baseMesh.setEnabled(false);
    
    return instances;
  }
}
```

**Level of Detail (LOD)**
```typescript
class LODManager {
  setupLOD(mesh: AbstractMesh): void {
    const mediumDetail = this.createMediumDetailVersion(mesh);
    const lowDetail = this.createLowDetailVersion(mesh);
    
    mesh.addLODLevel(50, mediumDetail);   // Switch at 50 units
    mesh.addLODLevel(100, lowDetail);     // Switch at 100 units
    mesh.addLODLevel(200, null);          // Cull at 200 units
  }
}
```

**Mesh Merging**
```typescript
class MeshMerger {
  mergeStaticMeshes(meshes: AbstractMesh[]): AbstractMesh {
    // Only merge meshes that don't move
    const staticMeshes = meshes.filter(mesh => !mesh.animations.length);
    
    const merged = Mesh.MergeMeshes(staticMeshes, true, true, undefined, false, true);
    
    // Dispose original meshes
    staticMeshes.forEach(mesh => mesh.dispose());
    
    return merged;
  }
}
```

### 2. Rendering Optimization

**Frustum Culling**
```typescript
class CullingManager {
  enableOptimalCulling(scene: Scene): void {
    // Enable frustum culling
    scene.setRenderingAutoClearDepthStencil(0, true, true, true);
    
    // Optimize for static scenes
    scene.freezeActiveMeshes();
    
    // Use octree for large scenes
    scene.createOrUpdateSelectionOctree();
  }
}
```

**Texture Optimization**
```typescript
class TextureManager {
  createOptimizedTexture(url: string, scene: Scene): Texture {
    const texture = new Texture(url, scene);
    
    // Optimize texture settings
    texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    texture.anisotropicFilteringLevel = 4;
    
    // Use compressed formats when available
    if (scene.getEngine().getCaps().s3tc) {
      texture.format = Engine.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
    }
    
    return texture;
  }
}
```

### 3. Animation Performance

**Animation Pooling**
```typescript
class AnimationPool {
  private availableAnimations: Animation[] = [];
  private activeAnimations: Set<Animation> = new Set();
  
  getAnimation(): Animation {
    let animation = this.availableAnimations.pop();
    
    if (!animation) {
      animation = new Animation("pooled", "position", 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
    }
    
    this.activeAnimations.add(animation);
    return animation;
  }
  
  returnAnimation(animation: Animation): void {
    if (this.activeAnimations.has(animation)) {
      animation.dispose();
      this.activeAnimations.delete(animation);
      this.availableAnimations.push(animation);
    }
  }
}
```

## Memory Management

### 1. Proper Disposal Patterns

**Scene Disposal Order**
```typescript
class SceneManager {
  dispose(): void {
    // 1. Stop render loop first
    this.engine.stopRenderLoop();
    
    // 2. Dispose animations
    this.scene.stopAllAnimations();
    
    // 3. Dispose meshes (scene.dispose() handles this)
    this.scene.dispose();
    
    // 4. Dispose engine last
    this.engine.dispose();
    
    // 5. Clear references
    this.scene = null;
    this.engine = null;
  }
}
```

**Material Disposal**
```typescript
class MaterialManager {
  private materials: Map<string, Material> = new Map();
  
  getMaterial(name: string, scene: Scene): Material {
    let material = this.materials.get(name);
    
    if (!material) {
      material = new StandardMaterial(name, scene);
      this.materials.set(name, material);
    }
    
    return material;
  }
  
  dispose(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }
}
```

### 2. Memory Leak Prevention

**Event Listener Cleanup**
```typescript
class EventManager {
  private disposables: (() => void)[] = [];
  
  addEventListeners(scene: Scene): void {
    const onPointerObservable = scene.onPointerObservable.add((pointerInfo) => {
      // Handle pointer events
    });
    
    const onBeforeRender = scene.registerBeforeRender(() => {
      // Handle before render
    });
    
    // Track for disposal
    this.disposables.push(() => {
      scene.onPointerObservable.remove(onPointerObservable);
      scene.unregisterBeforeRender(onBeforeRender);
    });
  }
  
  dispose(): void {
    this.disposables.forEach(dispose => dispose());
    this.disposables = [];
  }
}
```

**Texture Memory Management**
```typescript
class TextureCache {
  private cache: Map<string, Texture> = new Map();
  private refCounts: Map<string, number> = new Map();
  
  getTexture(url: string, scene: Scene): Texture {
    let texture = this.cache.get(url);
    
    if (!texture) {
      texture = new Texture(url, scene);
      this.cache.set(url, texture);
      this.refCounts.set(url, 0);
    }
    
    this.refCounts.set(url, this.refCounts.get(url)! + 1);
    return texture;
  }
  
  releaseTexture(url: string): void {
    const refCount = this.refCounts.get(url);
    if (refCount && refCount > 1) {
      this.refCounts.set(url, refCount - 1);
    } else {
      // Last reference, dispose texture
      const texture = this.cache.get(url);
      if (texture) {
        texture.dispose();
        this.cache.delete(url);
        this.refCounts.delete(url);
      }
    }
  }
}
```

## UI Component Architecture Patterns

### 1. Gizmo System Separation of Concerns

**✅ DO**: Separate orientation gizmos from transformation gizmos
```typescript
// Orientation gizmo - always visible for camera navigation
<SimpleOrientationGizmo
  camera={camera}
  style={{
    position: 'absolute', // Relative to 3D renderer
    top: '16px',
    right: '112px',
    zIndex: 20,
  }}
  onAxisSelected={handleCameraNavigation}
/>

// Transformation gizmo - conditional on object selection
{selectedMesh && (
  <TransformationGizmo
    scene={scene}
    selectedMesh={selectedMesh}
    mode={transformationMode}
    onTransformationComplete={handleObjectTransform}
  />
)}
```

**❌ DON'T**: Mix navigation and manipulation concerns
```typescript
// Avoid combining different gizmo types
function BadGizmoComponent({ camera, selectedMesh }) {
  // This mixes camera navigation with object manipulation
  return (
    <UnifiedGizmo
      camera={camera}
      selectedMesh={selectedMesh}
      mode={mode} // Unclear what this controls
    />
  );
}
```

### 2. Positioning Strategy

**✅ DO**: Position UI elements relative to their functional context
```typescript
// Position orientation gizmo relative to 3D renderer
<div className="relative h-full w-full"> {/* 3D renderer container */}
  <BabylonScene />
  <SimpleOrientationGizmo
    camera={camera}
    style={{
      position: 'absolute', // Relative to renderer
      top: '16px',
      right: '112px',
      zIndex: 20,
    }}
  />
</div>
```

**❌ DON'T**: Use viewport-relative positioning for 3D UI
```typescript
// Avoid positioning relative to entire viewport
<SimpleOrientationGizmo
  camera={camera}
  style={{
    position: 'fixed', // Wrong - relative to viewport
    top: '16px',
    right: '16px',
  }}
/>
```

### 3. Store State Safety

**✅ DO**: Add safety checks to prevent undefined access
```typescript
const setGizmoVisibility = (visible: boolean) => {
  set((state: WritableDraft<AppStore>) => {
    // Ensure gizmo object exists before setting properties
    if (!state.babylonRendering.gizmo) {
      state.babylonRendering.gizmo = createInitialGizmoState() as WritableDraft<GizmoState>;
    }
    state.babylonRendering.gizmo.isVisible = visible;
  });
};
```

**❌ DON'T**: Access nested properties without safety checks
```typescript
// This can cause "Cannot set properties of undefined" errors
const badSetGizmoVisibility = (visible: boolean) => {
  set((state: WritableDraft<AppStore>) => {
    state.babylonRendering.gizmo.isVisible = visible; // May fail if gizmo is undefined
  });
};
```

### 4. Component Implementation Strategy

**✅ DO**: Use appropriate rendering techniques for each component type
```typescript
// Canvas-based rendering for 2D-looking 3D widgets
class OrientationGizmo {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  update(): void {
    this.clear();
    this.drawAxes();
    this.drawLabels();
  }
}

// BabylonJS-based rendering for true 3D manipulation
class TransformationGizmo {
  private gizmoManager: GizmoManager;
  private positionGizmo: PositionGizmo;

  attachToMesh(mesh: AbstractMesh): void {
    this.gizmoManager.attachToMesh(mesh);
  }
}
```

**❌ DON'T**: Use complex 3D rendering for simple navigation widgets
```typescript
// Avoid over-engineering simple UI elements
class OverEngineeredOrientationGizmo {
  private scene: Scene; // Unnecessary complexity
  private meshes: AbstractMesh[]; // Too heavy for navigation widget
  private materials: Material[]; // Overkill for simple compass
}
```

## Service Layer Patterns

### 1. Service Initialization

**Dependency Injection Pattern**
```typescript
interface ServiceContainer {
  engine: BabylonEngineService;
  scene: BabylonSceneService;
  meshGen: MeshGenerationService;
  materials: MaterialService;
}

class ServiceFactory {
  async createServices(canvas: HTMLCanvasElement): Promise<Result<ServiceContainer, BabylonError>> {
    try {
      // Initialize in dependency order
      const engineService = new BabylonEngineService();
      const engineResult = await engineService.initialize(canvas);
      
      if (!engineResult.success) {
        return { success: false, error: engineResult.error };
      }
      
      const sceneService = new BabylonSceneService();
      const sceneResult = await sceneService.initialize(engineResult.data);
      
      if (!sceneResult.success) {
        return { success: false, error: sceneResult.error };
      }
      
      const materialService = new MaterialService(sceneResult.data);
      const meshGenService = new MeshGenerationService(sceneResult.data, materialService);
      
      return {
        success: true,
        data: {
          engine: engineService,
          scene: sceneService,
          meshGen: meshGenService,
          materials: materialService
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SERVICE_INITIALIZATION_FAILED',
          message: error.message,
          timestamp: new Date()
        }
      };
    }
  }
}
```

### 2. Service Communication

**Event-Driven Architecture**
```typescript
class ServiceEventBus {
  private listeners: Map<string, Function[]> = new Map();
  
  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }
  
  on(event: string, listener: Function): () => void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(listener);
    this.listeners.set(event, eventListeners);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
}
```

## Testing Strategies

### 1. Service Testing with NullEngine

**Headless Testing Setup**
```typescript
describe('BabylonJS Service Tests', () => {
  let engine: NullEngine;
  let scene: Scene;
  
  beforeEach(() => {
    // Create headless engine for testing
    engine = new NullEngine({
      renderWidth: 512,
      renderHeight: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    scene = new Scene(engine);
  });
  
  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });
  
  it('should create mesh successfully', () => {
    const mesh = new Mesh("test", scene);
    expect(mesh).toBeInstanceOf(Mesh);
    expect(mesh.name).toBe("test");
  });
});
```

### 2. Integration Testing

**Complete Workflow Testing**
```typescript
describe('Mesh Generation Workflow', () => {
  let services: ServiceContainer;
  
  beforeEach(async () => {
    const canvas = document.createElement('canvas');
    const factory = new ServiceFactory();
    const result = await factory.createServices(canvas);
    
    if (result.success) {
      services = result.data;
    } else {
      throw new Error('Service initialization failed');
    }
  });
  
  afterEach(() => {
    Object.values(services).forEach(service => service.dispose());
  });
  
  it('should generate mesh from OpenSCAD AST', async () => {
    const ast = createTestCubeAST();
    const result = await services.meshGen.generateMeshFromAST(ast);
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toBeInstanceOf(AbstractMesh);
  });
});
```

## Debugging and Profiling

### 1. Performance Monitoring

**Frame Rate Monitoring**
```typescript
class PerformanceMonitor {
  private frameTimeSamples: number[] = [];
  private maxSamples = 60;
  
  startMonitoring(scene: Scene): void {
    scene.registerBeforeRender(() => {
      const frameTime = scene.getEngine().getDeltaTime();
      
      this.frameTimeSamples.push(frameTime);
      if (this.frameTimeSamples.length > this.maxSamples) {
        this.frameTimeSamples.shift();
      }
      
      // Log performance warnings
      if (frameTime > 16.67) {
        console.warn(`Frame time: ${frameTime.toFixed(2)}ms (target: 16.67ms)`);
      }
    });
  }
  
  getAverageFrameTime(): number {
    return this.frameTimeSamples.reduce((a, b) => a + b, 0) / this.frameTimeSamples.length;
  }
  
  getFPS(): number {
    return 1000 / this.getAverageFrameTime();
  }
}
```

### 2. Memory Profiling

**WebGL Memory Tracking**
```typescript
class MemoryProfiler {
  getWebGLInfo(engine: Engine): WebGLMemoryInfo {
    const gl = engine.getRenderingCanvas()?.getContext('webgl2') as WebGL2RenderingContext;
    
    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    };
  }
  
  trackMemoryUsage(scene: Scene): void {
    const stats = {
      meshCount: scene.meshes.length,
      materialCount: scene.materials.length,
      textureCount: scene.textures.length,
      lightCount: scene.lights.length,
      cameraCount: scene.cameras.length,
    };
    
    console.log('Scene Memory Stats:', stats);
  }
}
```

## Common Pitfalls

### 1. Memory Leaks

**❌ AVOID**: Forgetting to dispose resources
```typescript
// This will cause memory leaks
function badMeshCreation() {
  const mesh = new Mesh("temp", scene);
  // Mesh is never disposed
  return mesh;
}
```

**✅ FIX**: Always track and dispose resources
```typescript
class MeshManager {
  private meshes: Set<AbstractMesh> = new Set();
  
  createMesh(name: string): AbstractMesh {
    const mesh = new Mesh(name, this.scene);
    this.meshes.add(mesh);
    return mesh;
  }
  
  dispose(): void {
    this.meshes.forEach(mesh => mesh.dispose());
    this.meshes.clear();
  }
}
```

### 2. Performance Issues

**❌ AVOID**: Creating materials in render loop
```typescript
// This creates new materials every frame
scene.registerBeforeRender(() => {
  const material = new StandardMaterial("temp", scene); // BAD!
  mesh.material = material;
});
```

**✅ FIX**: Cache and reuse materials
```typescript
class MaterialCache {
  private materials: Map<string, Material> = new Map();
  
  getMaterial(key: string, factory: () => Material): Material {
    let material = this.materials.get(key);
    if (!material) {
      material = factory();
      this.materials.set(key, material);
    }
    return material;
  }
}
```

### 3. Incorrect Disposal Order

**❌ AVOID**: Disposing engine before scene
```typescript
// Wrong order - will cause errors
engine.dispose();
scene.dispose(); // Error: scene references disposed engine
```

**✅ FIX**: Dispose in correct order
```typescript
// Correct order
scene.dispose();    // Dispose scene first
engine.dispose();   // Then dispose engine
```

This guide provides the foundation for building high-performance, maintainable BabylonJS applications with proper resource management and modern development practices.
