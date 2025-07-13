/**
 * 3D Renderer Components - Barrel Exports (Updated for New Architecture)
 *
 * Components follow the three-layer architecture:
 * - Layer 3: Generic Rendering (MeshDataScene, Store3DRendererBridge)
 * - CSG Components for advanced operations
 */

export { MeshDataScene } from './mesh-data-scene/mesh-data-scene';
export { Store3DRendererBridge } from './store-3d-renderer-bridge/store-3d-renderer-bridge';
export { CSGUnion, CSGSubtract, CSGIntersect, useManifoldCSG } from './csg-components/csg-components';
