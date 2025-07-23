# Orientation Gizmo Usage Examples

## Table of Contents

1. [Basic Integration](#basic-integration)
2. [Advanced Configuration](#advanced-configuration)
3. [Event Handling](#event-handling)
4. [Store Integration](#store-integration)
5. [Performance Optimization](#performance-optimization)
6. [Error Handling](#error-handling)
7. [Testing Examples](#testing-examples)
8. [Common Patterns](#common-patterns)

## Basic Integration

### Minimal Setup

```tsx
import { OrientationGizmo } from '../orientation-gizmo';

function BasicScene() {
  const camera = useBabylonCamera(); // Your camera hook
  
  return (
    <div className="relative w-full h-full">
      <BabylonScene />
      <OrientationGizmo camera={camera} />
    </div>
  );
}
```

### With Custom Positioning

```tsx
import { OrientationGizmo, GizmoPosition } from '../orientation-gizmo';

function PositionedGizmo() {
  return (
    <div className="relative w-full h-full">
      <BabylonScene />
      
      {/* Top-left corner */}
      <OrientationGizmo
        camera={camera}
        position={GizmoPosition.TOP_LEFT}
        className="absolute top-4 left-4 z-10"
      />
      
      {/* Bottom-right corner with custom styling */}
      <OrientationGizmo
        camera={camera}
        position={GizmoPosition.BOTTOM_RIGHT}
        className="absolute bottom-4 right-4 z-10"
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      />
    </div>
  );
}
```

## Advanced Configuration

### Custom Colors and Sizing

```tsx
import { OrientationGizmo, DEFAULT_GIZMO_CONFIG } from '../orientation-gizmo';

function CustomGizmo() {
  const customConfig = {
    ...DEFAULT_GIZMO_CONFIG,
    size: 120,
    showSecondary: false,
    colors: {
      x: ['#e74c3c', '#c0392b'], // Red theme
      y: ['#2ecc71', '#27ae60'], // Green theme
      z: ['#3498db', '#2980b9'], // Blue theme
    },
    animation: {
      animationDuration: 750,
      easingFunction: 'cubic',
    },
  };

  return (
    <OrientationGizmo
      camera={camera}
      config={customConfig}
      className="absolute top-4 right-4"
    />
  );
}
```

### Theme-Based Configuration

```tsx
function ThemedGizmo() {
  const { theme } = useTheme(); // Your theme hook
  
  const gizmoConfig = useMemo(() => {
    const baseConfig = DEFAULT_GIZMO_CONFIG;
    
    if (theme === 'dark') {
      return {
        ...baseConfig,
        colors: {
          x: ['#ff6b6b', '#ee5a52'],
          y: ['#51cf66', '#40c057'],
          z: ['#74c0fc', '#339af0'],
        },
      };
    }
    
    return {
      ...baseConfig,
      colors: {
        x: ['#d63031', '#b71c1c'],
        y: ['#00b894', '#00695c'],
        z: ['#0984e3', '#1565c0'],
      },
    };
  }, [theme]);

  return (
    <OrientationGizmo
      camera={camera}
      config={gizmoConfig}
    />
  );
}
```

## Event Handling

### Comprehensive Event Handling

```tsx
function InteractiveGizmo() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastSelectedAxis, setLastSelectedAxis] = useState<AxisDirection | null>(null);
  
  const handleAxisSelected = useCallback((event: GizmoInteractionEvent) => {
    console.log('Axis selected:', {
      axis: event.axis,
      cameraPosition: event.cameraPosition,
      timestamp: event.timestamp,
      duration: event.animationDuration,
    });
    
    setLastSelectedAxis(event.axis);
    
    // Custom logic based on axis
    switch (event.axis) {
      case AxisDirection.POSITIVE_Z:
        console.log('Top view selected');
        break;
      case AxisDirection.NEGATIVE_Z:
        console.log('Bottom view selected');
        break;
      case AxisDirection.POSITIVE_X:
        console.log('Right view selected');
        break;
      case AxisDirection.NEGATIVE_X:
        console.log('Left view selected');
        break;
      case AxisDirection.POSITIVE_Y:
        console.log('Front view selected');
        break;
      case AxisDirection.NEGATIVE_Y:
        console.log('Back view selected');
        break;
    }
  }, []);

  const handleAnimationStart = useCallback((axis: AxisDirection) => {
    console.log(`Starting animation to ${axis}`);
    setIsAnimating(true);
  }, []);

  const handleAnimationComplete = useCallback((axis: AxisDirection) => {
    console.log(`Animation to ${axis} completed`);
    setIsAnimating(false);
  }, []);

  const handleError = useCallback((error: GizmoError) => {
    console.error('Gizmo error:', error);
    
    // Show user-friendly error messages
    switch (error.code) {
      case GizmoErrorCode.CAMERA_NOT_SUPPORTED:
        toast.error('Camera type not supported for gizmo');
        break;
      case GizmoErrorCode.ANIMATION_FAILED:
        toast.error('Camera animation failed');
        break;
      case GizmoErrorCode.RENDER_FAILED:
        toast.error('Gizmo rendering failed');
        break;
      default:
        toast.error('Gizmo error occurred');
    }
  }, []);

  return (
    <div className="relative">
      <BabylonScene />
      
      <OrientationGizmo
        camera={camera}
        onAxisSelected={handleAxisSelected}
        onAnimationStart={handleAnimationStart}
        onAnimationComplete={handleAnimationComplete}
        onError={handleError}
      />
      
      {/* Status indicator */}
      {isAnimating && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            Animating to {lastSelectedAxis}...
          </div>
        </div>
      )}
    </div>
  );
}
```

## Store Integration

### Using Store Selectors

```tsx
import { 
  selectGizmoIsVisible,
  selectGizmoPosition,
  selectGizmoConfig,
  selectGizmoStats 
} from '../store/selectors';

function StoreConnectedGizmo() {
  // Use memoized selectors for performance
  const isVisible = useAppStore(selectGizmoIsVisible);
  const position = useAppStore(selectGizmoPosition);
  const config = useAppStore(selectGizmoConfig);
  const stats = useAppStore(selectGizmoStats);
  
  // Store actions
  const { setGizmoVisibility, updateGizmoConfig } = useAppStore();
  
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="relative">
      <BabylonScene />
      
      <OrientationGizmo
        camera={camera}
        position={position}
        config={config}
        onConfigChange={(newConfig) => {
          updateGizmoConfig(newConfig);
        }}
      />
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Visible: {stats.isVisible ? 'Yes' : 'No'}</div>
          <div>Initialized: {stats.isInitialized ? 'Yes' : 'No'}</div>
          <div>Animating: {stats.isAnimating ? 'Yes' : 'No'}</div>
          <div>Error: {stats.hasError ? 'Yes' : 'No'}</div>
          <div>Selected: {stats.selectedAxis || 'None'}</div>
        </div>
      )}
    </div>
  );
}
```

### Store Actions Example

```tsx
function GizmoControls() {
  const { 
    setGizmoVisibility,
    setGizmoPosition,
    updateGizmoConfig,
    resetGizmo 
  } = useAppStore();
  
  const isVisible = useAppStore(selectGizmoIsVisible);
  const position = useAppStore(selectGizmoPosition);
  
  return (
    <div className="flex gap-2 p-4">
      <button
        onClick={() => setGizmoVisibility(!isVisible)}
        className="px-3 py-1 bg-blue-500 text-white rounded"
      >
        {isVisible ? 'Hide' : 'Show'} Gizmo
      </button>
      
      <select
        value={position}
        onChange={(e) => setGizmoPosition(e.target.value as GizmoPosition)}
        className="px-2 py-1 border rounded"
      >
        <option value={GizmoPosition.TOP_LEFT}>Top Left</option>
        <option value={GizmoPosition.TOP_RIGHT}>Top Right</option>
        <option value={GizmoPosition.BOTTOM_LEFT}>Bottom Left</option>
        <option value={GizmoPosition.BOTTOM_RIGHT}>Bottom Right</option>
      </select>
      
      <button
        onClick={() => updateGizmoConfig({ size: 120 })}
        className="px-3 py-1 bg-green-500 text-white rounded"
      >
        Large Size
      </button>
      
      <button
        onClick={() => resetGizmo()}
        className="px-3 py-1 bg-red-500 text-white rounded"
      >
        Reset
      </button>
    </div>
  );
}
```

## Performance Optimization

### Performance Monitoring

```tsx
function PerformanceMonitoredGizmo() {
  const [performanceStats, setPerformanceStats] = useState({
    averageFrameTime: 0,
    maxFrameTime: 0,
    frameCount: 0,
  });
  
  const gizmoServiceRef = useRef<OrientationGizmoService | null>(null);
  
  useEffect(() => {
    if (!gizmoServiceRef.current) return;
    
    const frameTimeSamples: number[] = [];
    const maxSamples = 60; // Track last 60 frames
    
    const monitorPerformance = () => {
      const updateResult = gizmoServiceRef.current?.update();
      
      if (updateResult?.success) {
        const frameTime = updateResult.data.frameTime;
        frameTimeSamples.push(frameTime);
        
        if (frameTimeSamples.length > maxSamples) {
          frameTimeSamples.shift();
        }
        
        const averageFrameTime = frameTimeSamples.reduce((a, b) => a + b) / frameTimeSamples.length;
        const maxFrameTime = Math.max(...frameTimeSamples);
        
        setPerformanceStats({
          averageFrameTime,
          maxFrameTime,
          frameCount: frameTimeSamples.length,
        });
        
        // Performance warning
        if (frameTime > 16) {
          console.warn(`[PERF] Gizmo frame time: ${frameTime.toFixed(2)}ms > 16ms target`);
        }
      }
    };
    
    const intervalId = setInterval(monitorPerformance, 1000); // Check every second
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="relative">
      <BabylonScene />
      <OrientationGizmo camera={camera} />
      
      {/* Performance overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Avg Frame Time: {performanceStats.averageFrameTime.toFixed(2)}ms</div>
          <div>Max Frame Time: {performanceStats.maxFrameTime.toFixed(2)}ms</div>
          <div>Frame Count: {performanceStats.frameCount}</div>
          <div className={performanceStats.averageFrameTime > 16 ? 'text-red-400' : 'text-green-400'}>
            Performance: {performanceStats.averageFrameTime <= 16 ? 'Good' : 'Poor'}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Optimized Configuration

```tsx
function OptimizedGizmo() {
  // Memoize configuration to prevent unnecessary re-renders
  const optimizedConfig = useMemo(() => ({
    size: 90,                    // Optimal size for performance
    padding: 10,                 // Minimal padding
    showSecondary: true,         // Enable secondary axes
    colors: {
      x: ['#ff4444', '#cc3333'], // Pre-computed colors
      y: ['#44ff44', '#33cc33'],
      z: ['#4444ff', '#3333cc'],
    },
    animation: {
      animationDuration: 500,    // Smooth but fast
      easingFunction: 'quadratic', // Efficient easing
    },
  }), []);
  
  // Debounced event handlers
  const debouncedAxisSelected = useMemo(
    () => debounce((event: GizmoInteractionEvent) => {
      console.log('Axis selected:', event.axis);
    }, 100),
    []
  );
  
  return (
    <OrientationGizmo
      camera={camera}
      config={optimizedConfig}
      onAxisSelected={debouncedAxisSelected}
    />
  );
}
```

## Error Handling

### Comprehensive Error Handling

```tsx
function RobustGizmo() {
  const [gizmoError, setGizmoError] = useState<GizmoError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleGizmoError = useCallback((error: GizmoError) => {
    console.error('Gizmo error:', error);
    setGizmoError(error);
    
    // Auto-retry for certain errors
    if (error.code === GizmoErrorCode.RENDER_FAILED && retryCount < 3) {
      setTimeout(() => {
        setGizmoError(null);
        setRetryCount(prev => prev + 1);
      }, 1000);
    }
  }, [retryCount]);
  
  const handleRetry = useCallback(() => {
    setGizmoError(null);
    setRetryCount(0);
  }, []);
  
  if (gizmoError) {
    return (
      <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="font-bold">Gizmo Error</div>
        <div className="text-sm">{gizmoError.message}</div>
        <button
          onClick={handleRetry}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <OrientationGizmo
      camera={camera}
      onError={handleGizmoError}
    />
  );
}
```

## Testing Examples

### Component Testing

```tsx
// orientation-gizmo.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { OrientationGizmo } from './orientation-gizmo';
import * as BABYLON from '@babylonjs/core';

describe('OrientationGizmo', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;

  beforeEach(() => {
    // Use real BabylonJS instances (no mocks)
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera('test', 0, 0, 10, BABYLON.Vector3.Zero(), scene);
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  it('should render with camera', async () => {
    render(<OrientationGizmo camera={camera} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('orientation-gizmo')).toBeInTheDocument();
    });
  });

  it('should handle axis selection', async () => {
    const onAxisSelected = vi.fn();
    render(<OrientationGizmo camera={camera} onAxisSelected={onAxisSelected} />);
    
    const canvas = screen.getByTestId('gizmo-canvas');
    fireEvent.click(canvas);
    
    // Verify interaction
    expect(canvas).toBeInTheDocument();
  });
});
```

### Service Testing

```tsx
// orientation-gizmo.service.test.ts
import { OrientationGizmoService } from './orientation-gizmo.service';
import * as BABYLON from '@babylonjs/core';

describe('OrientationGizmoService', () => {
  let service: OrientationGizmoService;
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;

  beforeEach(() => {
    service = new OrientationGizmoService();
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera('test', 0, 0, 10, BABYLON.Vector3.Zero(), scene);
  });

  afterEach(() => {
    service.dispose();
    scene.dispose();
    engine.dispose();
  });

  it('should initialize successfully', async () => {
    const canvas = document.createElement('canvas');
    const result = await service.initialize({ camera, canvas });
    
    expect(result.success).toBe(true);
    expect(service.getState().isInitialized).toBe(true);
  });

  it('should update with performance targets', () => {
    const updateResult = service.update();
    
    if (updateResult.success) {
      expect(updateResult.data.frameTime).toBeLessThan(16);
    }
  });
});
```

## Common Patterns

### Conditional Rendering

```tsx
function ConditionalGizmo() {
  const { user, preferences } = useAuth();
  const isVisible = useAppStore(selectGizmoIsVisible);
  
  // Only show gizmo for certain user types or preferences
  const shouldShowGizmo = useMemo(() => {
    return (
      isVisible &&
      user?.role !== 'viewer' &&
      preferences?.showNavigationAids !== false
    );
  }, [isVisible, user?.role, preferences?.showNavigationAids]);
  
  if (!shouldShowGizmo) {
    return null;
  }
  
  return <OrientationGizmo camera={camera} />;
}
```

### Responsive Sizing

```tsx
function ResponsiveGizmo() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const gizmoConfig = useMemo(() => {
    const baseSize = windowSize.width < 768 ? 60 : 90; // Smaller on mobile
    
    return {
      ...DEFAULT_GIZMO_CONFIG,
      size: baseSize,
      padding: windowSize.width < 768 ? 5 : 10,
    };
  }, [windowSize]);
  
  return (
    <OrientationGizmo
      camera={camera}
      config={gizmoConfig}
      position={windowSize.width < 768 ? GizmoPosition.BOTTOM_RIGHT : GizmoPosition.TOP_RIGHT}
    />
  );
}
```

### Integration with Settings

```tsx
function SettingsIntegratedGizmo() {
  const gizmoSettings = useAppStore(selectGizmoConfig);
  const { updateGizmoConfig } = useAppStore();
  
  return (
    <div className="flex">
      <div className="flex-1 relative">
        <BabylonScene />
        <OrientationGizmo
          camera={camera}
          config={gizmoSettings}
          onConfigChange={updateGizmoConfig}
        />
      </div>
      
      <div className="w-80 p-4 bg-gray-100">
        <GizmoConfigPanel
          showAdvancedOptions={true}
          onConfigChange={updateGizmoConfig}
        />
      </div>
    </div>
  );
}
```

These examples demonstrate the flexibility and power of the Orientation Gizmo system. Use them as starting points for your own implementations and customize as needed for your specific use cases.
