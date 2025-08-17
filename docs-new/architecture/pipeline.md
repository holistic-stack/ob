# Rendering Pipeline (from src)

Source-of-truth modules
- src/features/openscad-geometry-builder/services/pipeline/
- src/features/babylon-renderer/services/ast-bridge-converter/
- src/features/ast-to-csg-converter/

Flow
1) Parse OpenSCAD → AST (openscad-parser)
2) Convert AST → Geometry (openscad-geometry-builder/services/ast-converter)
3) Convert Geometry → Mesh (openscad-geometry-builder/services/mesh-converter)
4) Bridge to Babylon scene (babylon-renderer/services/ast-bridge-converter)
5) Manage scene (engine, scene, materials, cache, memory) and UI (gizmos, overlays)

Usage example (high-level)
```ts
// Pseudocode illustrating the pipeline usage with Result<T,E>
import { createScene } from '@/features/babylon-renderer/services/babylon-scene-service';
import { parseOpenscad } from '@/features/openscad-parser'; // index barrel
import { convertAstToGeometry } from '@/features/openscad-geometry-builder/services/ast-converter';
import { geometryToMeshes } from '@/features/openscad-geometry-builder/services/mesh-converter';

const code = 'cube([5,5,5]);';

const parseResult = parseOpenscad(code);
if (!parseResult.success) throw new Error(parseResult.error.message);

const geometryResult = convertAstToGeometry(parseResult.data);
if (!geometryResult.success) throw new Error(geometryResult.error.message);

const meshesResult = geometryToMeshes(geometryResult.data);
if (!meshesResult.success) throw new Error(meshesResult.error.message);

const scene = createScene(/* engine/canvas */);
// add meshesResult.data to scene via Babylon mesh builder/bridge services
```

Testing
- Integration tests under geometry-builder pipeline and babylon-renderer integration-tests validate end-to-end correctness with real implementations.
