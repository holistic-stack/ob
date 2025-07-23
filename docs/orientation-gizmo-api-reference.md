# Orientation Gizmo API Reference

## Table of Contents

1. [Components](#components)
2. [Services](#services)
3. [Types & Interfaces](#types--interfaces)
4. [Store Actions & Selectors](#store-actions--selectors)
5. [Error Handling](#error-handling)
6. [Constants](#constants)

## Components

### OrientationGizmo

Main React component for rendering the 3D orientation gizmo.

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
  readonly onConfigChange?: (config: GizmoConfig) => void;
}
```

**Props:**
- `camera` - BabylonJS ArcRotateCamera instance (required)
- `className` - CSS class name for styling
- `style` - Inline CSS styles
- `position` - Gizmo position on screen
- `config` - Partial configuration override
- `onAxisSelected` - Callback when user selects an axis
- `onAnimationStart` - Callback when camera animation starts
- `onAnimationComplete` - Callback when camera animation completes
- `onError` - Callback for error handling
- `onConfigChange` - Callback when configuration changes

**Example:**
```tsx
<OrientationGizmo
  camera={arcRotateCamera}
  className="absolute top-4 left-4 z-10"
  position={GizmoPosition.TOP_LEFT}
  config={{ size: 120 }}
  onAxisSelected={(event) => console.log('Axis:', event.axis)}
/>
```

### GizmoConfigPanel

Configuration panel component for gizmo customization.

```tsx
interface GizmoConfigPanelProps {
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly showAdvancedOptions?: boolean;
  readonly enablePreview?: boolean;
  readonly onConfigChange?: (config: GizmoConfig) => void;
  readonly onVisibilityToggle?: (visible: boolean) => void;
  readonly onPositionChange?: (position: GizmoPosition) => void;
}
```

**Props:**
- `className` - CSS class name for styling
- `style` - Inline CSS styles
- `showAdvancedOptions` - Show advanced configuration options
- `enablePreview` - Enable real-time preview
- `onConfigChange` - Callback when configuration changes
- `onVisibilityToggle` - Callback when visibility toggles
- `onPositionChange` - Callback when position changes

**Example:**
```tsx
<GizmoConfigPanel
  showAdvancedOptions={true}
  onConfigChange={(config) => console.log('Config:', config)}
/>
```

## Services

### OrientationGizmoService

Core service for gizmo rendering and interaction.

```typescript
class OrientationGizmoService {
  constructor();
  
  async initialize(config: GizmoInitConfig): Promise<Result<void, GizmoError>>;
  update(): Result<GizmoUpdateResult, GizmoError>;
  updateMousePosition(position: Vector2 | null): void;
  async selectAxis(axis: AxisDirection): Promise<Result<GizmoInteractionEvent, GizmoError>>;
  updateConfig(config: Partial<GizmoConfig>): Result<GizmoConfig, GizmoError>;
  getState(): GizmoServiceState;
  dispose(): Result<void, GizmoError>;
}
```

**Methods:**

#### `initialize(config: GizmoInitConfig)`
Initializes the gizmo service with camera and canvas.

**Parameters:**
- `config.camera` - BabylonJS ArcRotateCamera
- `config.canvas` - HTML canvas element
- `config.config?` - Optional gizmo configuration
- `config.position?` - Optional gizmo position

**Returns:** `Promise<Result<void, GizmoError>>`

#### `update()`
Updates gizmo rendering. Call in animation loop.

**Returns:** `Result<GizmoUpdateResult, GizmoError>`

#### `updateMousePosition(position: Vector2 | null)`
Updates mouse position for interaction.

**Parameters:**
- `position` - Mouse position relative to canvas, or null to clear

#### `selectAxis(axis: AxisDirection)`
Programmatically selects an axis.

**Parameters:**
- `axis` - Axis direction to select

**Returns:** `Promise<Result<GizmoInteractionEvent, GizmoError>>`

#### `updateConfig(config: Partial<GizmoConfig>)`
Updates gizmo configuration.

**Parameters:**
- `config` - Partial configuration to merge

**Returns:** `Result<GizmoConfig, GizmoError>`

#### `getState()`
Gets current service state.

**Returns:** `GizmoServiceState`

#### `dispose()`
Cleans up resources.

**Returns:** `Result<void, GizmoError>`

### CameraGizmoSyncService

Service for bidirectional camera-gizmo synchronization.

```typescript
class CameraGizmoSyncService {
  constructor(scene: Scene, store: ReturnType<typeof useAppStore>);
  
  async initialize(config: CameraGizmoSyncConfig): Promise<Result<void, CameraGizmoSyncError>>;
  async animateCameraToAxis(axis: AxisDirection): Promise<Result<void, CameraGizmoSyncError>>;
  getState(): SyncState;
  dispose(): Result<void, CameraGizmoSyncError>;
}
```

**Methods:**

#### `initialize(config: CameraGizmoSyncConfig)`
Initializes camera-gizmo synchronization.

**Parameters:**
- `config.camera` - BabylonJS ArcRotateCamera
- `config.gizmoService` - OrientationGizmoService instance
- `config.enableBidirectionalSync?` - Enable bidirectional sync (default: true)
- `config.animationDuration?` - Animation duration in ms (default: 500)
- `config.updateThrottleMs?` - Update throttle in ms (default: 16)
- `config.easingFunction?` - Easing function type
- `config.onCameraMove?` - Camera movement callback
- `config.onGizmoSelect?` - Gizmo selection callback

**Returns:** `Promise<Result<void, CameraGizmoSyncError>>`

#### `animateCameraToAxis(axis: AxisDirection)`
Animates camera to axis view.

**Parameters:**
- `axis` - Target axis direction

**Returns:** `Promise<Result<void, CameraGizmoSyncError>>`

## Types & Interfaces

### GizmoConfig

```typescript
interface GizmoConfig {
  readonly size: number;                    // 60-200 pixels
  readonly padding: number;                 // 5-20 pixels
  readonly showSecondary: boolean;          // Show secondary axes
  readonly colors: {
    readonly x: readonly [string, string];  // X-axis [primary, secondary]
    readonly y: readonly [string, string];  // Y-axis [primary, secondary]
    readonly z: readonly [string, string];  // Z-axis [primary, secondary]
  };
  readonly animation?: {
    readonly animationDuration: number;     // Animation duration in ms
    readonly easingFunction: string;        // Easing function type
  };
}
```

### GizmoPosition

```typescript
enum GizmoPosition {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}
```

### AxisDirection

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

### GizmoInteractionEvent

```typescript
interface GizmoInteractionEvent {
  readonly axis: AxisDirection;
  readonly cameraPosition: Vector3;
  readonly timestamp: Date;
  readonly animationDuration: number;
}
```

### GizmoError

```typescript
interface GizmoError {
  readonly code: GizmoErrorCode;
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}
```

### GizmoErrorCode

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

### GizmoState

```typescript
interface GizmoState {
  readonly isVisible: boolean;
  readonly position: GizmoPosition;
  readonly config: GizmoConfig;
  readonly selectedAxis: AxisDirection | null;
  readonly mouseState: GizmoMouseState;
  readonly cameraAnimation: GizmoCameraAnimation;
  readonly lastInteraction: Date | null;
  readonly isInitialized: boolean;
  readonly error: GizmoError | null;
}
```

### GizmoServiceState

```typescript
interface GizmoServiceState {
  readonly isInitialized: boolean;
  readonly selectedAxis: AxisDirection | null;
  readonly mousePosition: Vector2 | null;
  readonly lastUpdateTime: number;
  readonly frameTime: number;
}
```

### GizmoUpdateResult

```typescript
interface GizmoUpdateResult {
  readonly frameTime: number;
  readonly selectedAxis: AxisDirection | null;
  readonly mousePosition: Vector2 | null;
}
```

## Store Actions & Selectors

### Actions

```typescript
// Visibility control
setGizmoVisibility(visible: boolean): void;

// Position management
setGizmoPosition(position: GizmoPosition): void;

// Configuration updates
updateGizmoConfig(config: Partial<GizmoConfig>): void;

// Interaction handling
setGizmoSelectedAxis(axis: AxisDirection | null): void;
setGizmoAnimating(isAnimating: boolean): void;

// Error management
setGizmoError(error: GizmoError | null): void;

// Lifecycle management
initializeGizmo(): void;
resetGizmo(): void;
```

### Selectors

```typescript
// Basic selectors
selectGizmoIsVisible(state: AppState): boolean;
selectGizmoPosition(state: AppState): GizmoPosition;
selectGizmoConfig(state: AppState): GizmoConfig;
selectGizmoSelectedAxis(state: AppState): AxisDirection | null;
selectGizmoIsAnimating(state: AppState): boolean;
selectGizmoError(state: AppState): GizmoError | null;
selectGizmoIsInitialized(state: AppState): boolean;
selectGizmoLastInteraction(state: AppState): Date | null;

// Composite selectors
selectGizmoState(state: AppState): GizmoState;
selectGizmoStats(state: AppState): GizmoStats;
selectGizmoInteractionState(state: AppState): GizmoInteractionState;
```

### Selector Usage

```typescript
// In React components
const isVisible = useAppStore(selectGizmoIsVisible);
const position = useAppStore(selectGizmoPosition);
const config = useAppStore(selectGizmoConfig);

// Composite selectors for performance
const stats = useAppStore(selectGizmoStats);
const interactionState = useAppStore(selectGizmoInteractionState);
```

## Error Handling

### Result<T, E> Pattern

All service methods use the Result pattern for error handling:

```typescript
type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
const result = await gizmoService.initialize(config);
if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Error Handling Best Practices

```typescript
// Service level
const handleServiceError = (result: Result<any, GizmoError>) => {
  if (!result.success) {
    console.error(`[${result.error.code}] ${result.error.message}`);
    
    // Update store
    useAppStore.getState().setGizmoError(result.error);
    
    // Handle specific errors
    switch (result.error.code) {
      case GizmoErrorCode.CAMERA_NOT_SUPPORTED:
        showNotification('Camera not supported');
        break;
      case GizmoErrorCode.ANIMATION_FAILED:
        showNotification('Animation failed');
        break;
    }
  }
};

// Component level
const handleGizmoError = useCallback((error: GizmoError) => {
  console.error('Gizmo error:', error);
  setGizmoError(error);
  showErrorToast(error.message);
}, [setGizmoError]);
```

## Constants

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

### Performance Constants

```typescript
export const PERFORMANCE_TARGETS = {
  MAX_FRAME_TIME: 16,        // ms
  TARGET_FPS: 60,            // fps
  UPDATE_THROTTLE: 16,       // ms
  ANIMATION_DURATION: 500,   // ms
} as const;
```

### Size Constraints

```typescript
export const GIZMO_CONSTRAINTS = {
  MIN_SIZE: 60,              // pixels
  MAX_SIZE: 200,             // pixels
  MIN_PADDING: 5,            // pixels
  MAX_PADDING: 20,           // pixels
} as const;
```

## Usage Examples

### Complete Integration

```typescript
// 1. Initialize services
const gizmoService = new OrientationGizmoService();
const syncService = new CameraGizmoSyncService(scene, useAppStore);

// 2. Setup gizmo
await gizmoService.initialize({
  camera: arcRotateCamera,
  canvas: canvasElement,
  config: DEFAULT_GIZMO_CONFIG,
});

// 3. Setup synchronization
await syncService.initialize({
  camera: arcRotateCamera,
  gizmoService,
  enableBidirectionalSync: true,
});

// 4. Render component
<OrientationGizmo
  camera={arcRotateCamera}
  onAxisSelected={(event) => {
    console.log(`Selected ${event.axis} at ${event.timestamp}`);
  }}
  onError={(error) => {
    console.error('Gizmo error:', error);
  }}
/>

// 5. Configuration panel
<GizmoConfigPanel
  showAdvancedOptions={true}
  onConfigChange={(config) => {
    console.log('Config updated:', config);
  }}
/>
```

### Performance Monitoring

```typescript
// Monitor gizmo performance
const monitorPerformance = () => {
  const updateResult = gizmoService.update();
  
  if (updateResult.success) {
    const { frameTime } = updateResult.data;
    
    if (frameTime > PERFORMANCE_TARGETS.MAX_FRAME_TIME) {
      console.warn(`Performance warning: ${frameTime}ms > ${PERFORMANCE_TARGETS.MAX_FRAME_TIME}ms`);
    }
    
    // Log performance metrics
    console.log('Gizmo performance:', {
      frameTime,
      fps: 1000 / frameTime,
      target: PERFORMANCE_TARGETS.TARGET_FPS
    });
  }
};

// Call in animation loop
function animate() {
  monitorPerformance();
  requestAnimationFrame(animate);
}
```

This API reference provides complete documentation for all public interfaces, methods, and types in the Orientation Gizmo system. Use this as a reference when implementing or extending the gizmo functionality.
