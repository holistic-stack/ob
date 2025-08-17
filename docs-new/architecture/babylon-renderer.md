# Babylon Renderer (from src)

Components
- babylon-scene: scene container
- camera-controls: interaction controls
- orientation-gizmo: canvas-based navigation widget
- axis-overlay-controls, gizmo-config-panel, error boundary, inspector, store-connected-renderer

Quick usage (React)
```tsx
import { BabylonScene } from '@/features/babylon-renderer/components/babylon-scene';
import { CameraControls } from '@/features/babylon-renderer/components/camera-controls';
import { SimpleOrientationGizmo } from '@/features/babylon-renderer/components/orientation-gizmo';

export function Viewer() {
  return (
    <div className="h-screen w-screen">
      <BabylonScene>
        <CameraControls />
        <SimpleOrientationGizmo />
      </BabylonScene>
    </div>
  );
}
```

Services
- babylon-engine-service, babylon-scene-service, babylon-material-service, babylon-inspector-service
- camera-control.service, camera-store-sync.service, camera-gizmo-sync.service
- render-cache.service, memory-manager.service, memory-pool.service
- axis-overlay-service (colors, creator, validation, errors, shared geometry/material/mesh factories, tick-creator)
- transformation-gizmo.service

Hooks
- use-babylon-engine, use-babylon-scene, use-babylon-inspector, use-axis-overlay

Utilities
- webgpu-utils, buffer-clearing, mesh-disposal, scene-refresh, csg2-utils, generic-mesh-utils

Types
- axis-overlay, babylon-ast, babylon-csg/engine/scene/orientation types

Best practices
- Use memory-manager and mesh-disposal utilities to prevent leaks
- Prefer render-cache for repeated geometry
- Keep components thin; move Babylon-specific logic into services/hooks

Notes
- Tests are co-located; integration tests validate real Babylon with NullEngine patterns.
