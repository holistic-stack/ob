/**
 * @file three-object-tracker.ts
 * @description A utility for tracking and disposing Three.js objects in tests.
 */

import * as THREE from 'three';

const trackedObjects = new Set<any>();

/**
 * Tracks a Three.js object for later disposal.
 * @param obj The object to track.
 * @returns The tracked object.
 */
export function track<T>(obj: T): T {
  if (obj) {
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
    if (obj.parent?.remove) {
      obj.parent.remove(obj);
    }

    // Call dispose if it exists
    if (typeof obj.dispose === 'function') {
      obj.dispose();
    }

    // Special handling for materials and geometries
    if (obj.geometry?.dispose) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => {
          if (m.dispose) m.dispose();
          // Dispose textures
          for (const key in m) {
            const value = m[key];
            if (value instanceof THREE.Texture && value.dispose) {
              value.dispose();
            }
          }
        });
      } else if (obj.material.dispose) {
        obj.material.dispose();
        // Dispose textures
        for (const key in obj.material) {
          const value = obj.material[key];
          if (value instanceof THREE.Texture && value.dispose) {
            value.dispose();
          }
        }
      }
    }
  }
  trackedObjects.clear();
}
