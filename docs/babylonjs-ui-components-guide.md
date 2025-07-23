# BabylonJS UI Components Guide (2025 Edition)

## Overview

This guide provides comprehensive documentation for building advanced UI components in BabylonJS 8.16.1, including transformation gizmos, 2D grid overlays, and GUI systems. It incorporates the latest 2025 best practices for performance, accessibility, and modern web development.

## Table of Contents

1. [Transformation Gizmo System](#transformation-gizmo-system)
2. [2D Grid Overlay System](#2d-grid-overlay-system)
3. [GUI Overlay Components](#gui-overlay-components)
4. [Integration Patterns](#integration-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Testing Strategies](#testing-strategies)
7. [Accessibility Guidelines](#accessibility-guidelines)

## Transformation Gizmo System

### Modern Gizmo Architecture

The transformation gizmo system provides intuitive 3D object manipulation with visual feedback and precise control.

#### Core Features
- **Multi-mode Support**: Position, rotation, and scale transformations
- **Visual Feedback**: Color-coded axes with hover states
- **Snap-to-Grid**: Configurable grid snapping for precise positioning
- **Performance Optimized**: Efficient rendering with minimal draw calls
- **Event-Driven**: Observable pattern for transformation updates

#### Basic Implementation

```typescript
// Initialize gizmo system
const gizmoService = new TransformationGizmoService(scene);
await gizmoService.initialize();

// Attach to mesh
gizmoService.attachToMesh(selectedMesh);

// Switch modes
gizmoService.setGizmoMode('position'); // 'rotation' | 'scale'

// Handle transformation events
scene.onTransformationChangedObservable.add((event) => {
  console.log('Mesh transformed:', event.mesh.name);
  console.log('New position:', event.position);
});
```

#### Advanced Configuration

```typescript
const gizmoConfig: GizmoConfig = {
  size: 1.2,
  colors: {
    x: new Color3(1, 0.2, 0.2), // Custom red
    y: new Color3(0.2, 1, 0.2), // Custom green
    z: new Color3(0.2, 0.2, 1), // Custom blue
    selected: new Color3(1, 1, 0.2) // Custom yellow
  },
  sensitivity: 0.8,
  snapToGrid: true,
  gridSize: 0.5
};

const gizmoService = new TransformationGizmoService(scene, gizmoConfig);
```

#### React Integration

```typescript
function GizmoControls({ selectedMesh }: { selectedMesh: AbstractMesh | null }) {
  const { gizmoService, isInitialized } = useBabylonGizmo(scene);
  const [gizmoMode, setGizmoMode] = useState<'position' | 'rotation' | 'scale'>('position');

  useEffect(() => {
    if (isInitialized && selectedMesh) {
      gizmoService?.attachToMesh(selectedMesh);
    }
  }, [isInitialized, selectedMesh]);

  const handleModeChange = (mode: 'position' | 'rotation' | 'scale') => {
    setGizmoMode(mode);
    gizmoService?.setGizmoMode(mode);
  };

  return (
    <div className="gizmo-controls">
      <button 
        onClick={() => handleModeChange('position')}
        className={gizmoMode === 'position' ? 'active' : ''}
      >
        Position
      </button>
      <button 
        onClick={() => handleModeChange('rotation')}
        className={gizmoMode === 'rotation' ? 'active' : ''}
      >
        Rotation
      </button>
      <button 
        onClick={() => handleModeChange('scale')}
        className={gizmoMode === 'scale' ? 'active' : ''}
      >
        Scale
      </button>
    </div>
  );
}
```

## 2D Grid Overlay System

### Infinite Grid Implementation

The 2D grid system provides visual reference and snapping capabilities with dynamic scaling based on camera distance.

#### Key Features
- **Infinite Grid**: Shader-based infinite grid for seamless experience
- **Dynamic Scaling**: Automatic grid density adjustment based on zoom level
- **Performance Optimized**: GPU-accelerated rendering
- **Customizable Appearance**: Configurable colors, spacing, and opacity
- **Snap-to-Grid**: Precise object positioning

#### Basic Usage

```typescript
// Initialize grid system
const gridService = new GridOverlayService(scene, camera);
await gridService.initialize();

// Configure grid
gridService.setGridSize(1.0);
gridService.setVisibility(true);

// Snap objects to grid
const snappedPosition = gridService.snapToGrid(mesh.position);
mesh.position = snappedPosition;
```

#### Advanced Grid Configuration

```typescript
const gridConfig: GridConfig = {
  size: 100,
  spacing: 1.0,
  subdivisions: 10,
  colors: {
    major: new Color3(0.6, 0.6, 0.6),
    minor: new Color3(0.3, 0.3, 0.3),
    axis: new Color3(0.9, 0.9, 0.9)
  },
  opacity: 0.7,
  fadeDistance: 75,
  infiniteGrid: true
};

const gridService = new GridOverlayService(scene, camera, gridConfig);
```

#### Shader-Based Infinite Grid

```glsl
// Grid fragment shader for optimal performance
varying vec3 worldPosition;
uniform vec3 cameraPosition;
uniform float gridSize;
uniform vec3 gridColor;
uniform float fadeDistance;

float grid(vec2 coord, float lineWidth) {
  vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
  float line = min(grid.x, grid.y);
  return 1.0 - min(line, 1.0);
}

void main() {
  vec2 coord = worldPosition.xz / gridSize;
  
  float gridLine = grid(coord, 1.0);
  float majorGridLine = grid(coord / 10.0, 2.0);
  
  // Distance-based fading
  float distance = length(worldPosition - cameraPosition);
  float fade = 1.0 - smoothstep(0.0, fadeDistance, distance);
  
  vec3 color = mix(gridColor * 0.5, gridColor, majorGridLine);
  float alpha = (gridLine + majorGridLine) * fade;
  
  gl_FragColor = vec4(color, alpha);
}
```

## GUI Overlay Components

### BabylonJS GUI System

Modern GUI overlays provide responsive UI elements directly integrated with the 3D scene.

#### Core Components
- **Toolbar**: Tool selection and mode switching
- **Status Panel**: Real-time performance and camera information
- **Property Panel**: Object property editing
- **Context Menus**: Right-click contextual actions
- **Responsive Design**: Adaptive layout for different screen sizes

#### Basic GUI Setup

```typescript
// Initialize GUI system
const guiService = new GUIOverlayService(scene);
await guiService.initialize();

// Create UI components
guiService.createToolbar();
guiService.createStatusPanel();

// Handle theme changes
guiService.setTheme('dark'); // or 'light'
```

#### Custom UI Components

```typescript
// Create custom button component
function createCustomButton(text: string, onClick: () => void): Button {
  const button = Button.CreateSimpleButton(`btn_${text}`, text);
  button.widthInPixels = 120;
  button.heightInPixels = 40;
  button.color = "#ffffff";
  button.background = "#3b82f6";
  button.cornerRadius = 6;
  
  // Add modern styling
  button.shadowColor = "#00000040";
  button.shadowOffsetX = 2;
  button.shadowOffsetY = 2;
  button.shadowBlur = 4;
  
  // Hover effects
  button.onPointerEnterObservable.add(() => {
    button.background = "#2563eb";
    button.scaleX = 1.05;
    button.scaleY = 1.05;
  });
  
  button.onPointerOutObservable.add(() => {
    button.background = "#3b82f6";
    button.scaleX = 1.0;
    button.scaleY = 1.0;
  });
  
  button.onPointerClickObservable.add(onClick);
  
  return button;
}
```

#### Responsive Layout System

```typescript
class ResponsiveGUIManager {
  private breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  handleResize(width: number, height: number): void {
    const deviceType = this.getDeviceType(width);
    
    switch (deviceType) {
      case 'mobile':
        this.applyMobileLayout();
        break;
      case 'tablet':
        this.applyTabletLayout();
        break;
      case 'desktop':
        this.applyDesktopLayout();
        break;
    }
  }

  private getDeviceType(width: number): 'mobile' | 'tablet' | 'desktop' {
    if (width < this.breakpoints.mobile) return 'mobile';
    if (width < this.breakpoints.tablet) return 'tablet';
    return 'desktop';
  }

  private applyMobileLayout(): void {
    // Adjust UI for mobile screens
    this.toolbar.widthInPixels = Math.min(250, window.innerWidth - 20);
    this.statusPanel.bottomInPixels = 10;
    this.statusPanel.rightInPixels = 10;
  }
}
```

## Integration Patterns

### Complete UI System Integration

```typescript
// Unified UI system service
class BabylonUISystemService {
  private gizmoService: TransformationGizmoService;
  private gridService: GridOverlayService;
  private guiService: GUIOverlayService;

  async initialize(): Promise<Result<void, UISystemError>> {
    // Initialize all services
    await this.gizmoService.initialize();
    await this.gridService.initialize();
    await this.guiService.initialize();

    // Setup cross-component communication
    this.setupEventHandlers();
    
    return { success: true, data: undefined };
  }

  private setupEventHandlers(): void {
    // GUI → Gizmo communication
    this.scene.onTransformModeChangedObservable.add((event) => {
      this.gizmoService.setGizmoMode(event.mode);
    });

    // Gizmo → Grid snapping
    this.scene.onTransformationChangedObservable.add((event) => {
      const snappedPosition = this.gridService.snapToGrid(event.position);
      event.mesh.position = snappedPosition;
    });
  }
}
```

### React Hook Integration

```typescript
export function useBabylonUISystem(scene: Scene | null, camera: ArcRotateCamera | null) {
  const [uiSystem, setUISystem] = useState<BabylonUISystemService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!scene || !camera) return;

    const initializeUI = async () => {
      const system = new BabylonUISystemService(scene, camera);
      const result = await system.initialize();
      
      if (result.success) {
        setUISystem(system);
        setIsInitialized(true);
      }
    };

    initializeUI();

    return () => {
      uiSystem?.dispose();
    };
  }, [scene, camera]);

  return { uiSystem, isInitialized };
}
```

### Store Integration

```typescript
// Zustand slice for UI state
interface UIState {
  gizmoMode: 'position' | 'rotation' | 'scale';
  gridVisible: boolean;
  gridSize: number;
  selectedMesh: AbstractMesh | null;
  theme: 'light' | 'dark';
}

const useUIStore = create<UIState>((set) => ({
  gizmoMode: 'position',
  gridVisible: true,
  gridSize: 1.0,
  selectedMesh: null,
  theme: 'dark',
  
  setGizmoMode: (mode) => set({ gizmoMode: mode }),
  setGridVisible: (visible) => set({ gridVisible: visible }),
  setGridSize: (size) => set({ gridSize: size }),
  setSelectedMesh: (mesh) => set({ selectedMesh: mesh }),
  setTheme: (theme) => set({ theme }),
}));
```

## Performance Optimization

### GPU-Accelerated Rendering

```typescript
// Optimized grid rendering with instancing
class OptimizedGridRenderer {
  createInstancedGrid(scene: Scene): Mesh {
    const baseLine = CreateLines("baseLine", {
      points: [Vector3.Zero(), new Vector3(1, 0, 0)]
    }, scene);

    // Create instances for better performance
    const instances: InstancedMesh[] = [];
    for (let i = -50; i <= 50; i++) {
      const instance = baseLine.createInstance(`line_${i}`);
      instance.position.z = i;
      instances.push(instance);
    }

    return baseLine;
  }
}
```

### Memory Management

```typescript
class UIResourceManager {
  private resources: Set<IDisposable> = new Set();

  track<T extends IDisposable>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  dispose(): void {
    this.resources.forEach(resource => resource.dispose());
    this.resources.clear();
  }
}
```

### Efficient Update Patterns

```typescript
class BatchedUIUpdater {
  private updateQueue: Map<string, () => void> = new Map();
  private rafId: number | null = null;

  queueUpdate(key: string, updateFn: () => void): void {
    this.updateQueue.set(key, updateFn);
    
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

## Testing Strategies

### Component Testing

```typescript
describe('TransformationGizmoService', () => {
  let scene: Scene;
  let engine: NullEngine;
  let gizmoService: TransformationGizmoService;

  beforeEach(() => {
    engine = new NullEngine();
    scene = new Scene(engine);
    gizmoService = new TransformationGizmoService(scene);
  });

  afterEach(() => {
    gizmoService.dispose();
    scene.dispose();
    engine.dispose();
  });

  it('should initialize successfully', async () => {
    const result = await gizmoService.initialize();
    expect(result.success).toBe(true);
  });

  it('should attach to mesh', () => {
    const mesh = new Mesh("test", scene);
    const result = gizmoService.attachToMesh(mesh);
    expect(result.success).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe('UI System Integration', () => {
  let uiSystem: BabylonUISystemService;

  beforeEach(async () => {
    const scene = new Scene(new NullEngine());
    const camera = new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
    
    uiSystem = new BabylonUISystemService(scene, camera);
    await uiSystem.initialize();
  });

  it('should handle mesh selection', () => {
    const mesh = new Mesh("test", scene);
    const result = uiSystem.setSelectedMesh(mesh);
    expect(result.success).toBe(true);
  });
});
```

## Accessibility Guidelines

### Keyboard Navigation

```typescript
class AccessibleGizmoControls {
  setupKeyboardControls(gizmoService: TransformationGizmoService): void {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'g': // Switch to position mode
          gizmoService.setGizmoMode('position');
          break;
        case 'r': // Switch to rotation mode
          gizmoService.setGizmoMode('rotation');
          break;
        case 's': // Switch to scale mode
          gizmoService.setGizmoMode('scale');
          break;
      }
    });
  }
}
```

### Screen Reader Support

```typescript
// Add ARIA labels to GUI components
function createAccessibleButton(text: string): Button {
  const button = Button.CreateSimpleButton("btn", text);
  
  // Add accessibility metadata
  button.metadata = {
    ariaLabel: text,
    role: 'button',
    tabIndex: 0
  };
  
  return button;
}
```

This comprehensive guide provides modern patterns for building advanced BabylonJS UI components with optimal performance, accessibility, and maintainability following 2025 best practices.
