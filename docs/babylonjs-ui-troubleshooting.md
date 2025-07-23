# BabylonJS UI Components Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when working with BabylonJS UI components including gizmos, grids, and GUI overlays. It covers performance problems, rendering issues, and integration challenges.

## Table of Contents

1. [Gizmo System Issues](#gizmo-system-issues)
2. [Grid Overlay Problems](#grid-overlay-problems)
3. [GUI Component Issues](#gui-component-issues)
4. [Performance Problems](#performance-problems)
5. [Integration Issues](#integration-issues)
6. [Common Error Messages](#common-error-messages)

## Gizmo System Issues

### Gizmo Not Visible

**Symptoms**: Transformation gizmo doesn't appear when mesh is selected

**Diagnosis**:
```typescript
// Check gizmo initialization
console.log('Gizmo initialized:', gizmoService.isInitialized);
console.log('Gizmo manager:', gizmoManager);
console.log('Selected mesh:', selectedMesh);

// Check gizmo visibility
console.log('Position gizmo enabled:', gizmoManager.positionGizmoEnabled);
console.log('Gizmo attached mesh:', gizmoManager.attachedMesh);
```

**Solutions**:

1. **Verify Initialization Order**:
```typescript
// Ensure proper initialization sequence
async function initializeGizmo() {
  const gizmoService = new TransformationGizmoService(scene);
  const result = await gizmoService.initialize();
  
  if (!result.success) {
    console.error('Gizmo initialization failed:', result.error);
    return;
  }
  
  // Only attach after successful initialization
  gizmoService.attachToMesh(selectedMesh);
}
```

2. **Check Scene and Camera Setup**:
```typescript
// Verify scene has active camera
if (!scene.activeCamera) {
  console.error('Scene missing active camera');
  scene.activeCamera = camera;
}

// Ensure camera is properly configured
camera.attachToCanvas(canvas);
```

3. **Validate Mesh Properties**:
```typescript
function validateMeshForGizmo(mesh: AbstractMesh): boolean {
  if (!mesh) {
    console.error('Mesh is null or undefined');
    return false;
  }
  
  if (!mesh.isEnabled()) {
    console.error('Mesh is disabled');
    return false;
  }
  
  if (!mesh.isVisible) {
    console.error('Mesh is not visible');
    return false;
  }
  
  return true;
}
```

### Gizmo Scaling Issues

**Symptoms**: Gizmo appears too large or too small relative to objects

**Solutions**:

1. **Adjust Gizmo Scale Ratio**:
```typescript
// Set appropriate scale based on object size
function adjustGizmoScale(mesh: AbstractMesh, gizmo: PositionGizmo): void {
  const boundingInfo = mesh.getBoundingInfo();
  const size = boundingInfo.maximum.subtract(boundingInfo.minimum);
  const maxDimension = Math.max(size.x, size.y, size.z);
  
  // Scale gizmo relative to object size
  gizmo.scaleRatio = Math.max(0.1, maxDimension * 0.1);
}
```

2. **Dynamic Scaling Based on Camera Distance**:
```typescript
function setupDynamicGizmoScaling(gizmo: PositionGizmo, camera: ArcRotateCamera): void {
  scene.registerBeforeRender(() => {
    const distance = camera.radius;
    gizmo.scaleRatio = Math.max(0.5, distance * 0.05);
  });
}
```

### Gizmo Performance Issues

**Symptoms**: Lag when manipulating gizmo, low frame rate during transformations

**Solutions**:

1. **Optimize Gizmo Update Frequency**:
```typescript
class OptimizedGizmoService {
  private lastUpdateTime = 0;
  private updateThreshold = 16; // 60fps

  onGizmoUpdate(): void {
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateThreshold) {
      return; // Skip update
    }
    
    this.lastUpdateTime = now;
    this.performUpdate();
  }
}
```

2. **Batch Transformation Updates**:
```typescript
class BatchedTransformUpdater {
  private pendingUpdates: TransformUpdate[] = [];
  private rafId: number | null = null;

  queueUpdate(update: TransformUpdate): void {
    this.pendingUpdates.push(update);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.processBatch());
    }
  }

  private processBatch(): void {
    // Apply all pending updates at once
    this.pendingUpdates.forEach(update => this.applyUpdate(update));
    this.pendingUpdates = [];
    this.rafId = null;
  }
}
```

## Grid Overlay Problems

### Grid Not Rendering

**Symptoms**: Grid overlay is invisible or not appearing

**Diagnosis**:
```typescript
// Check grid service state
console.log('Grid initialized:', gridService.isInitialized);
console.log('Grid visible:', gridService.isVisible);
console.log('Grid mesh:', gridService.gridMesh);

// Check material properties
if (gridService.gridMaterial) {
  console.log('Material alpha:', gridService.gridMaterial.alpha);
  console.log('Material wireframe:', gridService.gridMaterial.wireframe);
}
```

**Solutions**:

1. **Verify Material Configuration**:
```typescript
function fixGridMaterial(material: StandardMaterial): void {
  material.alpha = 0.6; // Ensure visibility
  material.wireframe = true;
  material.backFaceCulling = false;
  material.disableLighting = true; // For consistent appearance
}
```

2. **Check Camera Position**:
```typescript
function validateCameraForGrid(camera: ArcRotateCamera): void {
  // Ensure camera is not too close to grid plane
  if (Math.abs(camera.position.y) < 0.1) {
    camera.position.y = 5; // Move camera above grid
  }
}
```

3. **Infinite Grid Shader Issues**:
```typescript
// Verify shader compilation
function checkGridShader(material: ShaderMaterial): void {
  const effect = material.getEffect();
  if (!effect.isReady()) {
    console.error('Grid shader not ready:', effect.getCompilationError());
  }
}
```

### Grid Performance Issues

**Symptoms**: Low frame rate with grid enabled, especially when zooming

**Solutions**:

1. **Implement LOD for Grid**:
```typescript
class LODGridService {
  updateGridLOD(cameraDistance: number): void {
    if (cameraDistance > 100) {
      this.setGridSpacing(10); // Coarse grid
    } else if (cameraDistance > 50) {
      this.setGridSpacing(5);  // Medium grid
    } else {
      this.setGridSpacing(1);  // Fine grid
    }
  }
}
```

2. **Use Instanced Rendering**:
```typescript
function createInstancedGrid(scene: Scene): Mesh {
  const baseLine = CreateLines("gridLine", {
    points: [new Vector3(-50, 0, 0), new Vector3(50, 0, 0)]
  }, scene);

  // Create instances instead of individual meshes
  for (let i = -50; i <= 50; i++) {
    if (i !== 0) { // Skip center line
      const instance = baseLine.createInstance(`line_${i}`);
      instance.position.z = i;
    }
  }

  return baseLine;
}
```

### Grid Snapping Issues

**Symptoms**: Objects don't snap to grid correctly or snap to wrong positions

**Solutions**:

1. **Fix Snapping Algorithm**:
```typescript
function improvedSnapToGrid(position: Vector3, gridSize: number): Vector3 {
  return new Vector3(
    Math.round(position.x / gridSize) * gridSize,
    position.y, // Don't snap Y for 2D grid
    Math.round(position.z / gridSize) * gridSize
  );
}
```

2. **Add Snap Tolerance**:
```typescript
function snapWithTolerance(position: Vector3, gridSize: number, tolerance: number): Vector3 {
  const snapped = improvedSnapToGrid(position, gridSize);
  const distance = Vector3.Distance(position, snapped);
  
  // Only snap if within tolerance
  return distance <= tolerance ? snapped : position;
}
```

## GUI Component Issues

### GUI Elements Not Responding

**Symptoms**: Buttons and controls don't respond to clicks

**Diagnosis**:
```typescript
// Check GUI initialization
console.log('GUI texture:', advancedTexture);
console.log('GUI controls count:', advancedTexture.getChildren().length);

// Check control properties
controls.forEach(control => {
  console.log(`Control ${control.name}:`, {
    isEnabled: control.isEnabled,
    isVisible: control.isVisible,
    isPointerBlocker: control.isPointerBlocker
  });
});
```

**Solutions**:

1. **Verify Event Handling Setup**:
```typescript
function setupGUIEvents(button: Button): void {
  // Ensure proper event registration
  button.onPointerClickObservable.add(() => {
    console.log('Button clicked');
  });

  // Check for event blocking
  button.isPointerBlocker = true;
}
```

2. **Fix Z-Index Issues**:
```typescript
function fixGUILayering(advancedTexture: AdvancedDynamicTexture): void {
  // Ensure GUI is on top
  advancedTexture.layer.layerMask = 0x10000000;
  advancedTexture.renderAtIdealSize = true;
}
```

3. **Handle Canvas Resize**:
```typescript
function handleCanvasResize(advancedTexture: AdvancedDynamicTexture): void {
  window.addEventListener('resize', () => {
    // Force GUI to recalculate layout
    advancedTexture.markAsDirty();
  });
}
```

### GUI Rendering Issues

**Symptoms**: GUI elements appear blurry or pixelated

**Solutions**:

1. **Fix DPI Scaling**:
```typescript
function setupHighDPIGUI(advancedTexture: AdvancedDynamicTexture): void {
  const devicePixelRatio = window.devicePixelRatio || 1;
  advancedTexture.renderAtIdealSize = true;
  advancedTexture.idealWidth = 1920 * devicePixelRatio;
  advancedTexture.idealHeight = 1080 * devicePixelRatio;
}
```

2. **Optimize Font Rendering**:
```typescript
function setupCrispFonts(textBlock: TextBlock): void {
  textBlock.fontFamily = "Arial, sans-serif";
  textBlock.fontSize = "14px";
  textBlock.color = "#ffffff";
  textBlock.outlineWidth = 1;
  textBlock.outlineColor = "#000000";
}
```

## Performance Problems

### UI System Memory Leaks

**Symptoms**: Memory usage increases over time with UI interactions

**Diagnosis**:
```typescript
// Monitor memory usage
function monitorUIMemory(): void {
  setInterval(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('UI Memory:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB'
      });
    }
  }, 5000);
}
```

**Solutions**:

1. **Implement Proper Disposal**:
```typescript
class UIComponentManager {
  private components: IDisposable[] = [];

  addComponent(component: IDisposable): void {
    this.components.push(component);
  }

  dispose(): void {
    this.components.forEach(component => {
      try {
        component.dispose();
      } catch (error) {
        console.warn('Component disposal failed:', error);
      }
    });
    this.components = [];
  }
}
```

2. **Remove Event Listeners**:
```typescript
class EventCleanupManager {
  private observers: Observer<any>[] = [];

  addObserver(observable: Observable<any>, callback: (info: any) => void): void {
    const observer = observable.add(callback);
    this.observers.push(observer);
  }

  dispose(): void {
    this.observers.forEach(observer => {
      observer.remove();
    });
    this.observers = [];
  }
}
```

### Slow UI Updates

**Symptoms**: UI elements update slowly or lag behind user interactions

**Solutions**:

1. **Batch UI Updates**:
```typescript
class UIUpdateBatcher {
  private updateQueue: Set<() => void> = new Set();
  private rafId: number | null = null;

  queueUpdate(updateFn: () => void): void {
    this.updateQueue.add(updateFn);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.processUpdates());
    }
  }

  private processUpdates(): void {
    this.updateQueue.forEach(updateFn => updateFn());
    this.updateQueue.clear();
    this.rafId = null;
  }
}
```

2. **Optimize Render Loop**:
```typescript
function optimizeUIRenderLoop(scene: Scene): void {
  let lastUIUpdate = 0;
  const UI_UPDATE_INTERVAL = 16; // 60fps

  scene.registerBeforeRender(() => {
    const now = performance.now();
    if (now - lastUIUpdate >= UI_UPDATE_INTERVAL) {
      updateUIElements();
      lastUIUpdate = now;
    }
  });
}
```

## Integration Issues

### React Integration Problems

**Symptoms**: UI components don't sync with React state

**Solutions**:

1. **Proper State Synchronization**:
```typescript
function useBabylonUISync(uiService: GUIOverlayService, reactState: UIState) {
  useEffect(() => {
    // Sync React state to BabylonJS
    uiService.setTheme(reactState.theme);
    uiService.setVisibility(reactState.visible);
  }, [reactState, uiService]);

  useEffect(() => {
    // Sync BabylonJS events to React
    const observer = scene.onUIEventObservable.add((event) => {
      setReactState(event.newState);
    });

    return () => observer.remove();
  }, []);
}
```

2. **Handle Component Lifecycle**:
```typescript
function BabylonUIComponent({ scene }: { scene: Scene }) {
  const uiServiceRef = useRef<GUIOverlayService | null>(null);

  useEffect(() => {
    const initUI = async () => {
      const service = new GUIOverlayService(scene);
      await service.initialize();
      uiServiceRef.current = service;
    };

    initUI();

    return () => {
      uiServiceRef.current?.dispose();
    };
  }, [scene]);

  return null; // UI is rendered by BabylonJS
}
```

## Common Error Messages

### "Cannot read property 'dispose' of null"

**Cause**: Attempting to dispose UI components that weren't properly initialized

**Solution**:
```typescript
function safeDispose(component: IDisposable | null): void {
  if (component && typeof component.dispose === 'function') {
    try {
      component.dispose();
    } catch (error) {
      console.warn('Disposal failed:', error);
    }
  }
}
```

### "Gizmo manager not found"

**Cause**: Trying to use gizmo before initialization

**Solution**:
```typescript
async function ensureGizmoReady(gizmoService: TransformationGizmoService): Promise<boolean> {
  if (!gizmoService.isInitialized) {
    const result = await gizmoService.initialize();
    return result.success;
  }
  return true;
}
```

### "GUI texture creation failed"

**Cause**: Canvas or scene not ready when creating GUI

**Solution**:
```typescript
async function createGUIWhenReady(scene: Scene): Promise<AdvancedDynamicTexture> {
  // Wait for scene to be ready
  await scene.whenReadyAsync();
  
  // Ensure canvas exists
  const canvas = scene.getEngine().getRenderingCanvas();
  if (!canvas) {
    throw new Error('Canvas not available');
  }
  
  return AdvancedDynamicTexture.CreateFullscreenUI("gui", true, scene);
}
```

This troubleshooting guide should help resolve most common BabylonJS UI component issues. For additional help, consult the BabylonJS documentation and community forums.
