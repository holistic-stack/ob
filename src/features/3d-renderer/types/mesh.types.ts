/**
 * 3D Mesh types for renderer
 */

import type { BufferGeometry, Material, Object3D } from 'three';
import type { Result } from '../../../shared/types/result.types.js';

export interface Mesh3D extends Object3D {
  readonly geometry: BufferGeometry;
  readonly material: Material | Material[];
  readonly userData: {
    readonly nodeId?: string;
    readonly nodeType?: string;
    readonly metadata?: Record<string, unknown>;
  };
}

export type MeshResult = Result<Mesh3D, string>;

export interface MeshMetadata {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly depth: number;
  readonly parentId?: string;
  readonly childrenIds: ReadonlyArray<string>;
  readonly size: number;
  readonly complexity: number;
  readonly isOptimized: boolean;
  readonly lastAccessed: Date;
  readonly meshId: string;
  readonly triangleCount: number;
  readonly vertexCount: number;
  readonly boundingBox: unknown; // THREE.Box3 type
  readonly material: string;
  readonly color: string;
  readonly opacity: number;
  readonly visible: boolean;
}
