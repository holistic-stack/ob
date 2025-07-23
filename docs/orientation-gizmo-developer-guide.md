# Orientation Gizmo Developer Guide

## Overview

This guide provides comprehensive documentation for developers working with the Orientation Gizmo system in the OpenSCAD Babylon project. The gizmo provides intuitive 3D navigation and camera control for the 3D scene.

## Quick Start

### Basic Integration

```tsx
import { OrientationGizmo } from '../orientation-gizmo';

// Basic usage in a 3D scene
function MyScene() {
  const camera = useCamera(); // Your BabylonJS ArcRotateCamera
  
  return (
    <div className="relative">
      <BabylonScene />
      <OrientationGizmo
        camera={camera}
        className="absolute top-4 left-4 z-10"
        onAxisSelected={(event) => {
          console.log(`User selected ${event.axis} axis`);
        }}
      />
    </div>
  );
}
```

### With Configuration Panel

```tsx
import { OrientationGizmo, GizmoConfigPanel } from '../orientation-gizmo';

function SceneWithConfig() {
  return (
    <div className="flex">
      <div className="flex-1 relative">
        <BabylonScene />
        <OrientationGizmo camera={camera} />
      </div>
      <div className="w-80 p-4">
        <GizmoConfigPanel showAdvancedOptions={true} />
      </div>
    </div>
  );
}
```

## Architecture Overview

### Component Hierarchy

```
OrientationGizmo (React Component)
├── OrientationGizmoService (Core Logic)
├── CameraGizmoSyncService (Camera Sync)
└── Zustand Store Integration
```

### Data Flow

```
User Interaction → Canvas Events → Gizmo Service → Store Updates → Camera Animation
                                                ↓
Store State Changes → React Re-render → UI Updates
```

## Core Components

### 1. OrientationGizmo Component

**Purpose**: Main React component that renders the gizmo and handles user interactions.

**Key Props**:
```tsx
interface OrientationGizmoProps {
  readonly camera: ArcRotateCamera | null;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly position?: GizmoPosition;
  readonly config?: Partial<GizmoConfig>;
  readonly onAxisSelected?: (event: GizmoInteractionEvent) => void;
  readonly onAnimationStart?: (axis: AxisDirection) => void;
  readonly onAnimationComplete?: (axis: AxisDirection) => void;
  readonly onError?: (error: GizmoError) => void;
}
```

**Usage Examples**:

```tsx
// Minimal setup
<OrientationGizmo camera={camera} />

// With custom positioning
<OrientationGizmo 
  camera={camera}
  position={GizmoPosition.BOTTOM_RIGHT}
  className="custom-gizmo"
/>

// With event handlers
<OrientationGizmo
  camera={camera}
  onAxisSelected={(event) => {
    console.log(`Axis: ${event.axis}, Position: ${event.cameraPosition}`);
  }}
  onError={(error) => {
    console.error('Gizmo error:', error.message);
  }}
/>

// With custom configuration
<OrientationGizmo
  camera={camera}
  config={{
    size: 120,
    colors: {
      x: ['#ff0000', '#cc0000'],
      y: ['#00ff00', '#00cc00'],
      z: ['#0000ff', '#0000cc'],
    }
  }}
/>
```

### 2. OrientationGizmoService

**Purpose**: Core service handling canvas rendering, mouse interaction, and gizmo logic.

**Key Methods**:
```typescript
class OrientationGizmoService {
  // Initialize the service
  async initialize(config: GizmoInitConfig): Promise<Result<void, GizmoError>>;
  
  // Update gizmo rendering (call in animation loop)
  update(): Result<GizmoUpdateResult, GizmoError>;
  
  // Handle mouse position updates
  updateMousePosition(position: Vector2 | null): void;
  
  // Select an axis programmatically
  selectAxis(axis: AxisDirection): Promise<Result<GizmoInteractionEvent, GizmoError>>;
  
  // Update configuration
  updateConfig(config: Partial<GizmoConfig>): Result<GizmoConfig, GizmoError>;
  
  // Get current state
  getState(): GizmoServiceState;
  
  // Clean up resources
  dispose(): Result<void, GizmoError>;
}
```

**Usage Example**:
```typescript
// Create and initialize service
const gizmoService = new OrientationGizmoService();

const result = await gizmoService.initialize({
  camera: arcRotateCamera,
  canvas: canvasElement,
  config: {
    size: 90,
    showSecondary: true,
  }
});

if (result.success) {
  // Service is ready
  console.log('Gizmo service initialized');
} else {
  console.error('Initialization failed:', result.error.message);
}

// In animation loop
function animate() {
  const updateResult = gizmoService.update();
  if (updateResult.success) {
    // Check performance
    if (updateResult.data.frameTime > 16) {
      console.warn('Gizmo render time exceeded target');
    }
  }
  requestAnimationFrame(animate);
}
```

### 3. CameraGizmoSyncService

**Purpose**: Handles bidirectional synchronization between camera movements and gizmo interactions.

**Key Features**:
- Camera position changes → Gizmo orientation updates
- Gizmo axis selection → Camera animation
- Throttled updates for performance
- Smooth animation transitions

**Usage Example**:
```typescript
// Create sync service
const syncService = new CameraGizmoSyncService(scene, useAppStore);

await syncService.initialize({
  camera: arcRotateCamera,
  gizmoService: gizmoService,
  enableBidirectionalSync: true,
  animationDuration: 500,
  updateThrottleMs: 16, // 60fps
  onCameraMove: (position, rotation) => {
    console.log('Camera moved:', position);
  },
  onGizmoSelect: (axis) => {
    console.log('Gizmo axis selected:', axis);
  }
});
```

### 4. GizmoConfigPanel Component

**Purpose**: User interface for configuring gizmo appearance and behavior.

**Key Features**:
- Visibility toggle
- Position selection (4 corners)
- Size presets and custom sizing
- Color theme selection
- Advanced options (individual colors, padding, secondary axes)

**Usage Example**:
```tsx
// Basic configuration panel
<GizmoConfigPanel />

// With advanced options
<GizmoConfigPanel 
  showAdvancedOptions={true}
  onConfigChange={(config) => {
    console.log('Configuration updated:', config);
  }}
/>

// With event handlers
<GizmoConfigPanel
  onVisibilityToggle={(visible) => {
    console.log('Visibility changed:', visible);
  }}
  onPositionChange={(position) => {
    console.log('Position changed:', position);
  }}
/>
```

## Store Integration

### State Structure

The gizmo state is managed through Zustand store:

```typescript
interface GizmoState {
  isVisible: boolean;
  position: GizmoPosition;
  config: GizmoConfig;
  selectedAxis: AxisDirection | null;
  mouseState: GizmoMouseState;
  cameraAnimation: GizmoCameraAnimation;
  lastInteraction: Date | null;
  isInitialized: boolean;
  error: GizmoError | null;
}
```

### Store Actions

```typescript
// Visibility control
useAppStore.getState().setGizmoVisibility(true);

// Position management
useAppStore.getState().setGizmoPosition(GizmoPosition.TOP_LEFT);

// Configuration updates
useAppStore.getState().updateGizmoConfig({
  size: 120,
  colors: {
    x: ['#ff0000', '#cc0000'],
    y: ['#00ff00', '#00cc00'],
    z: ['#0000ff', '#0000cc'],
  }
});

// Interaction handling
useAppStore.getState().setGizmoSelectedAxis(AxisDirection.POSITIVE_X);
useAppStore.getState().setGizmoAnimating(true);

// Error management
useAppStore.getState().setGizmoError(null);

// Lifecycle management
useAppStore.getState().initializeGizmo();
useAppStore.getState().resetGizmo();
```

### Store Selectors

Use memoized selectors for optimal performance:

```typescript
import { 
  selectGizmoIsVisible,
  selectGizmoPosition,
  selectGizmoConfig,
  selectGizmoSelectedAxis,
  selectGizmoStats,
  selectGizmoInteractionState
} from '../store/selectors';

// In React components
const isVisible = useAppStore(selectGizmoIsVisible);
const position = useAppStore(selectGizmoPosition);
const config = useAppStore(selectGizmoConfig);

// Get comprehensive stats
const stats = useAppStore(selectGizmoStats);
console.log('Gizmo stats:', {
  isVisible: stats.isVisible,
  isInitialized: stats.isInitialized,
  isAnimating: stats.isAnimating,
  hasError: stats.hasError,
  selectedAxis: stats.selectedAxis,
  lastInteraction: stats.lastInteraction
});
```

## Configuration Options

### GizmoConfig Interface

```typescript
interface GizmoConfig {
  readonly size: number;                    // Gizmo size in pixels (60-200)
  readonly padding: number;                 // Internal padding (5-20)
  readonly showSecondary: boolean;          // Show secondary axes
  readonly colors: {
    readonly x: readonly [string, string];  // X-axis colors [primary, secondary]
    readonly y: readonly [string, string];  // Y-axis colors [primary, secondary]
    readonly z: readonly [string, string];  // Z-axis colors [primary, secondary]
  };
  readonly animation?: {
    readonly animationDuration: number;     // Animation duration in ms
    readonly easingFunction: string;        // Easing function type
  };
}
```

### Default Configuration

```typescript
export const DEFAULT_GIZMO_CONFIG: GizmoConfig = {
  size: 90,
  padding: 10,
  showSecondary: true,
  colors: {
    x: ['#ff4444', '#cc3333'],
    y: ['#44ff44', '#33cc33'],
    z: ['#4444ff', '#3333cc'],
  },
  animation: {
    animationDuration: 500,
    easingFunction: 'quadratic',
  },
};
```

### Position Options

```typescript
enum GizmoPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}
```

### Axis Directions

```typescript
enum AxisDirection {
  POSITIVE_X = '+x',
  NEGATIVE_X = '-x',
  POSITIVE_Y = '+y',
  NEGATIVE_Y = '-y',
  POSITIVE_Z = '+z',
  NEGATIVE_Z = '-z',
}
```

## Event Handling

### GizmoInteractionEvent

```typescript
interface GizmoInteractionEvent {
  readonly axis: AxisDirection;
  readonly cameraPosition: Vector3;
  readonly timestamp: Date;
  readonly animationDuration: number;
}
```

### Event Handler Examples

```tsx
<OrientationGizmo
  camera={camera}
  onAxisSelected={(event) => {
    console.log('Axis selected:', {
      axis: event.axis,
      position: event.cameraPosition,
      time: event.timestamp,
      duration: event.animationDuration
    });
    
    // Custom logic after axis selection
    if (event.axis === AxisDirection.POSITIVE_Z) {
      console.log('Top view selected');
    }
  }}
  
  onAnimationStart={(axis) => {
    console.log(`Starting animation to ${axis}`);
    // Show loading indicator
    setIsAnimating(true);
  }}
  
  onAnimationComplete={(axis) => {
    console.log(`Animation to ${axis} completed`);
    // Hide loading indicator
    setIsAnimating(false);
  }}
  
  onError={(error) => {
    console.error('Gizmo error:', {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      details: error.details
    });
    
    // Handle specific error types
    switch (error.code) {
      case GizmoErrorCode.CAMERA_NOT_SUPPORTED:
        showNotification('Camera type not supported');
        break;
      case GizmoErrorCode.ANIMATION_FAILED:
        showNotification('Animation failed');
        break;
      default:
        showNotification('Gizmo error occurred');
    }
  }}
/>
```

## Performance Optimization

### Performance Targets

- **Render Time**: <16ms per frame (achieved: 3.94ms average)
- **Update Frequency**: 60fps with throttling
- **Memory Usage**: Automatic cleanup and disposal

### Best Practices

```typescript
// 1. Use memoized selectors
const gizmoStats = useAppStore(selectGizmoStats);

// 2. Throttle updates
const debouncedConfigUpdate = useMemo(
  () => debounce((config: Partial<GizmoConfig>) => {
    updateGizmoConfig(config);
  }, 100),
  [updateGizmoConfig]
);

// 3. Proper cleanup
useEffect(() => {
  return () => {
    gizmoService.dispose();
    syncService.dispose();
  };
}, []);

// 4. Monitor performance
const updateResult = gizmoService.update();
if (updateResult.success && updateResult.data.frameTime > 16) {
  console.warn('Performance warning: frame time exceeded target');
}
```

## Error Handling

### Error Types

```typescript
enum GizmoErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CAMERA_NOT_SUPPORTED = 'CAMERA_NOT_SUPPORTED',
  CANVAS_NOT_FOUND = 'CANVAS_NOT_FOUND',
  ANIMATION_FAILED = 'ANIMATION_FAILED',
  RENDER_FAILED = 'RENDER_FAILED',
  INTERACTION_FAILED = 'INTERACTION_FAILED',
  CONFIGURATION_INVALID = 'CONFIGURATION_INVALID',
}
```

### Error Handling Pattern

```typescript
// Service-level error handling
const result = await gizmoService.initialize(config);
if (!result.success) {
  console.error('Initialization failed:', result.error);
  
  // Handle specific errors
  switch (result.error.code) {
    case GizmoErrorCode.CAMERA_NOT_SUPPORTED:
      // Show user-friendly message
      break;
    case GizmoErrorCode.CANVAS_NOT_FOUND:
      // Check canvas setup
      break;
    default:
      // Generic error handling
  }
}

// Component-level error handling
const handleGizmoError = useCallback((error: GizmoError) => {
  // Log error for debugging
  console.error('[Gizmo Error]', {
    code: error.code,
    message: error.message,
    timestamp: error.timestamp,
    details: error.details
  });
  
  // Update store
  setGizmoError(error);
  
  // Show user notification
  showErrorNotification(error.message);
}, [setGizmoError]);
```

## Testing Guidelines

### Unit Testing

```typescript
// Use real BabylonJS instances (no mocks)
describe('OrientationGizmo', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera('test', 0, 0, 10, Vector3.Zero(), scene);
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  it('should initialize successfully', async () => {
    const gizmoService = new OrientationGizmoService();
    const canvas = document.createElement('canvas');
    
    const result = await gizmoService.initialize({ camera, canvas });
    
    expect(result.success).toBe(true);
    expect(gizmoService.getState().isInitialized).toBe(true);
  });
});
```

### Integration Testing

```typescript
// Test complete system integration
it('should handle complete axis selection workflow', async () => {
  const gizmoService = new OrientationGizmoService();
  const syncService = new CameraGizmoSyncService(scene, useAppStore);
  
  await gizmoService.initialize({ camera, canvas });
  await syncService.initialize({ camera, gizmoService });

  // Simulate axis selection
  useAppStore.getState().setGizmoSelectedAxis(AxisDirection.POSITIVE_X);

  // Verify system response
  expect(gizmoService.getState().selectedAxis).toBe(AxisDirection.POSITIVE_X);
  expect(syncService.getState().isAnimating).toBe(true);
});
```

## Troubleshooting

### Common Issues

1. **Gizmo Not Visible**
   ```typescript
   // Check visibility state
   console.log('Gizmo visible:', useAppStore.getState().babylonRendering.gizmo.isVisible);
   
   // Verify camera initialization
   console.log('Camera:', camera);
   
   // Check canvas element
   console.log('Canvas:', canvasRef.current);
   ```

2. **Animation Not Working**
   ```typescript
   // Verify camera type
   console.log('Camera type:', camera.getClassName());
   
   // Check sync service
   console.log('Sync service state:', syncService.getState());
   
   // Monitor store animation state
   console.log('Animation state:', useAppStore.getState().babylonRendering.gizmo.cameraAnimation);
   ```

3. **Performance Issues**
   ```typescript
   // Monitor frame times
   const updateResult = gizmoService.update();
   console.log('Frame time:', updateResult.data?.frameTime);
   
   // Check throttling
   console.log('Update throttle:', syncService.getConfig()?.updateThrottleMs);
   ```

### Debug Commands

```typescript
// Enable debug logging
localStorage.setItem('DEBUG', 'OrientationGizmo,CameraGizmoSync');

// Performance monitoring
console.log('Gizmo stats:', useAppStore.getState().selectGizmoStats());

// State inspection
console.log('Full gizmo state:', useAppStore.getState().babylonRendering.gizmo);

// Service state
console.log('Service state:', gizmoService.getState());
console.log('Sync state:', syncService.getState());
```

## Migration Guide

### From Previous Versions

If migrating from an older implementation:

1. **Update imports**:
   ```typescript
   // Old
   import { Gizmo } from './old-gizmo';
   
   // New
   import { OrientationGizmo } from '../orientation-gizmo';
   ```

2. **Update props**:
   ```typescript
   // Old
   <Gizmo camera={camera} size={90} />
   
   // New
   <OrientationGizmo 
     camera={camera} 
     config={{ size: 90 }}
   />
   ```

3. **Update store usage**:
   ```typescript
   // Old
   store.gizmo.setVisible(true);
   
   // New
   useAppStore.getState().setGizmoVisibility(true);
   ```

## Contributing

When contributing to the gizmo system:

1. **Follow TDD**: Write tests before implementation
2. **Use real implementations**: No mocks for BabylonJS or services
3. **Maintain performance**: Keep render times <16ms
4. **Document changes**: Update this guide for new features
5. **Test thoroughly**: Include unit, integration, and performance tests

## Conclusion

The Orientation Gizmo system provides a robust, performant, and accessible 3D navigation solution. This guide covers all aspects of integration, configuration, and usage. For additional examples and advanced use cases, refer to the test files and implementation code.
