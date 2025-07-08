/**
 * @file three-object-tracker.ts
 * @description A utility for tracking and disposing Three.js objects in tests.
 */

import * as THREE from 'three';

const trackedObjects = new Set<
  THREE.Object3D | THREE.Material | THREE.BufferGeometry | THREE.Texture
>();

type TrackableObject = THREE.Object3D | THREE.Material | THREE.BufferGeometry | THREE.Texture;

/**
 * Type guard to check if an object is trackable
 */
function isTrackableObject(obj: unknown): obj is TrackableObject {
  return (
    obj instanceof THREE.Object3D ||
    obj instanceof THREE.Material ||
    obj instanceof THREE.BufferGeometry ||
    obj instanceof THREE.Texture
  );
}

/**
 * Tracks a Three.js object for later disposal.
 * @param obj The object to track.
 * @returns The tracked object.
 */
export function track<T extends TrackableObject>(obj: T): T {
  if (obj && isTrackableObject(obj)) {
    trackedObjects.add(obj);
  }
  return obj;
}

/**
 * Disposes of all tracked Three.js objects.
 */
export function disposeAllTrackedObjects() {
  for (const obj of trackedObjects) {
    // Remove from parent if it's an Object3D
    if (obj instanceof THREE.Object3D && obj.parent?.remove) {
      obj.parent.remove(obj);
    }

    // Call dispose if it exists
    if ('dispose' in obj && typeof obj.dispose === 'function') {
      obj.dispose();
    }

    // Special handling for Object3D materials and geometries
    if (obj instanceof THREE.Object3D) {
      // Handle geometry
      if (
        'geometry' in obj &&
        obj.geometry &&
        typeof obj.geometry === 'object' &&
        obj.geometry !== null &&
        'dispose' in obj.geometry &&
        typeof obj.geometry.dispose === 'function'
      ) {
        obj.geometry.dispose();
      }

      // Handle material
      if ('material' in obj && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m: THREE.Material) => {
            if (m.dispose) m.dispose();
            // Dispose textures
            for (const key in m) {
              const value = (m as any)[key];
              if (value instanceof THREE.Texture && value.dispose) {
                value.dispose();
              }
            }
          });
        } else if (
          typeof obj.material === 'object' &&
          obj.material !== null &&
          'dispose' in obj.material &&
          typeof obj.material.dispose === 'function'
        ) {
          obj.material.dispose();
          // Dispose textures
          for (const key in obj.material) {
            const value = (obj.material as any)[key];
            if (value instanceof THREE.Texture && value.dispose) {
              value.dispose();
            }
          }
        }
      }
    }
  }
  trackedObjects.clear();
}
