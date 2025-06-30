import * as THREE from 'three';
import type { MaterialConfig } from '../types/renderer.types';

/**
 * Create Three.js material from configuration
 */
export const createMaterial = (config: MaterialConfig): THREE.MeshStandardMaterial => {
  console.log(`[DEBUG][MaterialUtils] Creating material with color: ${config.color}`);

  return new THREE.MeshStandardMaterial({
    color: config.color,
    opacity: config.opacity,
    metalness: config.metalness,
    roughness: config.roughness,
    wireframe: config.wireframe,
    transparent: config.transparent,
    side:
      config.side === 'front'
        ? THREE.FrontSide
        : config.side === 'back'
          ? THREE.BackSide
          : THREE.DoubleSide,
  });
};
