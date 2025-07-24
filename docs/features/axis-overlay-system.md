# 3D Axis Overlay System

## Overview

The 3D Axis Overlay System provides visual reference and scale information directly in the BabylonJS 3D viewport. It displays graduated tick marks and numeric labels along the X, Y, and Z axes, helping users understand scale and spatial relationships in their 3D models.

## Features

- **Real-time 3D Axis Display**: X (red), Y (green), Z (blue) axes with graduated tick marks
- **Dynamic Tick Spacing**: Automatically adjusts tick intervals based on camera distance
- **Customizable Configuration**: Font size, opacity, units, tick intervals, and visibility options
- **Interactive Controls**: UI panel for real-time configuration changes
- **Performance Optimized**: <16ms render targets maintained with efficient BabylonJS GUI integration
- **Accessibility Compliant**: Full keyboard navigation and screen reader support

## Architecture

### Core Components

1. **AxisOverlayService** (`src/features/babylon-renderer/services/axis-overlay-service/`)
   - BabylonJS service for rendering 3D axis overlay
   - Uses BabylonJS GUI system for in-scene rendering
   - Handles dynamic tick calculation and label positioning

2. **useAxisOverlay Hook** (`src/features/babylon-renderer/hooks/use-axis-overlay/`)
   - React hook for axis overlay management
   - Integrates with Zustand store for state management
   - Provides automatic cleanup and disposal

3. **AxisOverlayControls Component** (`src/features/babylon-renderer/components/axis-overlay-controls/`)
   - UI control panel for axis overlay configuration
   - Real-time updates with form validation
   - Accessibility-compliant form controls

4. **State Management** (`src/features/store/slices/babylon-rendering-slice.ts`)
   - Zustand store integration for reactive state management
   - Actions for visibility, configuration, and dynamic updates

### Data Flow

```
User Interaction → AxisOverlayControls → Zustand Store → useAxisOverlay Hook → AxisOverlayService → BabylonJS Scene
```

## Usage

### Basic Integration

```typescript
import { useAxisOverlay } from '../hooks/use-axis-overlay';

function MyBabylonComponent() {
  const { initialize, setVisibility } = useAxisOverlay();

  useEffect(() => {
    if (scene && camera) {
      initialize(scene, camera);
      setVisibility(true);
    }
  }, [scene, camera, initialize, setVisibility]);

  return <BabylonScene />;
}
```

### Configuration

```typescript
import { useAppStore } from '../store/app-store';

function ConfigureAxisOverlay() {
  const updateAxisOverlayConfig = useAppStore((state) => state.updateAxisOverlayConfig);

  const handleConfigChange = () => {
    updateAxisOverlayConfig({
      tickInterval: 2.0,
      fontSize: 16,
      opacity: 0.9,
      units: { type: 'mm', precision: 2, showUnitSuffix: true },
    });
  };
}
```

### Control Panel Integration

```tsx
import { AxisOverlayControls } from '../components/axis-overlay-controls';

function App() {
  return (
    <div className="relative">
      <BabylonRenderer />
      <div className="absolute top-4 right-4">
        <AxisOverlayControls />
      </div>
    </div>
  );
}
```

## Configuration Options

### AxisOverlayConfig Interface

```typescript
interface AxisOverlayConfig {
  isVisible: boolean;           // Show/hide the overlay
  showTicks: boolean;           // Display tick marks
  showLabels: boolean;          // Display numeric labels
  tickInterval: number;         // Base tick spacing
  majorTickCount: number;       // Number of major ticks
  minorTickCount: number;       // Minor ticks between major ticks
  fontSize: number;             // Label font size in pixels
  fontFamily: string;           // Font family for labels
  opacity: number;              // Overall opacity (0-1)
  colors: AxisOverlayColors;    // Color scheme
  units: AxisOverlayUnits;      // Unit configuration
  position: AxisOverlayPosition; // Positioning settings
}
```

### Color Customization

```typescript
interface AxisOverlayColors {
  xAxis: Color3;      // Red by default
  yAxis: Color3;      // Green by default
  zAxis: Color3;      // Blue by default
  majorTicks: Color3; // Light gray by default
  minorTicks: Color3; // Dark gray by default
  labels: Color3;     // White by default
  background: Color3; // Black by default
}
```

### Units Configuration

```typescript
interface AxisOverlayUnits {
  type: 'mm' | 'cm' | 'in' | 'units';
  precision: number;        // Decimal places
  showUnitSuffix: boolean; // Append unit suffix to labels
}
```

## Dynamic Features

### Camera-Based Tick Scaling

The system automatically adjusts tick intervals based on camera distance:

```typescript
// Logarithmic scaling for smooth transitions
const scale = Math.pow(10, Math.floor(Math.log10(cameraDistance / 10)));
const dynamicInterval = baseInterval * scale;
```

### Real-time Updates

- **Camera Movement**: Tick intervals update automatically as users zoom in/out
- **Configuration Changes**: Immediate visual feedback for all setting changes
- **Performance Monitoring**: Built-in performance metrics and error tracking

## Testing

### Test Coverage

- **58 Total Tests** across all components
- **Service Tests**: 23 tests covering initialization, configuration, and error handling
- **Hook Tests**: 18 tests for React integration and state management
- **Component Tests**: 17 tests for UI controls and accessibility

### Testing Patterns

```typescript
// Service testing with real BabylonJS NullEngine
describe('AxisOverlayService', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  it('should initialize successfully', async () => {
    const service = createAxisOverlayService();
    const result = await service.initialize(scene, camera);
    expect(result.success).toBe(true);
  });
});
```

## Performance Considerations

- **Efficient Rendering**: Uses BabylonJS GUI for optimal performance
- **Memory Management**: Automatic cleanup and disposal of resources
- **Dynamic Updates**: Throttled camera distance updates to prevent excessive recalculation
- **Render Optimization**: Maintains <16ms render targets

## Error Handling

The system uses Result<T,E> patterns for comprehensive error handling:

```typescript
type AxisOverlayError = {
  type: 'INITIALIZATION_FAILED' | 'RENDER_FAILED' | 'CONFIG_INVALID' | 'GUI_CREATION_FAILED';
  message: string;
  details?: unknown;
  timestamp: Date;
};
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Configurable colors for visibility needs
- **Form Validation**: Clear error messages and input constraints

## Future Enhancements

- **3D-to-Screen Projection**: Improved label positioning using proper coordinate transformation
- **Custom Axis Origins**: Support for non-zero origin points
- **Grid Integration**: Coordinate with existing grid overlay systems
- **Export Functionality**: Save axis overlay configurations
- **Animation Support**: Smooth transitions for configuration changes

## Dependencies

- **@babylonjs/core**: 3D rendering engine
- **@babylonjs/gui**: UI overlay system
- **React 19**: Component framework
- **Zustand**: State management
- **TypeScript**: Type safety and development experience
