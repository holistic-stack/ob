/**
 * CSG Lighting Setup based on three-csg-ts working example
 * 
 * Key findings from https://sbcode.net/threejs/csg/:
 * 1. Uses TWO SpotLights with shadows for proper interior illumination
 * 2. Specific light positioning and shadow configuration
 * 3. Materials use MeshStandardMaterial (which we already have)
 * 4. Shadow casting and receiving enabled on meshes
 * 
 * This addresses the visual rendering issue where difference operations
 * create correct geometry but interior surfaces aren't visible.
 */

import * as THREE from 'three';

/**
 * Configuration for CSG-optimized lighting setup
 */
export interface CSGLightingConfig {
  enableShadows?: boolean;
  shadowMapSize?: number;
  lightIntensity?: number;
  lightDistance?: number;
  ambientIntensity?: number;
}

/**
 * Default configuration based on working three-csg-ts example
 */
const DEFAULT_CSG_LIGHTING_CONFIG: Required<CSGLightingConfig> = {
  enableShadows: true,
  shadowMapSize: 1024,
  lightIntensity: 100, // Key: High intensity for interior visibility
  lightDistance: 20,
  ambientIntensity: 0.3, // Add ambient light for interior surfaces
};

/**
 * Creates CSG-optimized lighting setup based on three-csg-ts working example
 * 
 * The key insight is that CSG operations create interior surfaces that need
 * proper lighting to be visible. The working example uses:
 * - Two SpotLights positioned at opposite angles
 * - High intensity (100) for proper interior illumination
 * - Shadow casting enabled for depth perception
 * - Ambient light to ensure no surfaces are completely dark
 * 
 * @param config - Lighting configuration options
 * @returns Array of lights to add to the scene
 */
export function createCSGLighting(config: CSGLightingConfig = {}): THREE.Light[] {
  const finalConfig = { ...DEFAULT_CSG_LIGHTING_CONFIG, ...config };
  const lights: THREE.Light[] = [];

  // Light 1: Positioned at (2.5, 5, 5) - matches working example
  const light1 = new THREE.SpotLight(0xffffff, finalConfig.lightIntensity);
  light1.position.set(2.5, 5, 5);
  light1.angle = Math.PI / 4;
  light1.penumbra = 0.5;
  
  if (finalConfig.enableShadows) {
    light1.castShadow = true;
    light1.shadow.mapSize.width = finalConfig.shadowMapSize;
    light1.shadow.mapSize.height = finalConfig.shadowMapSize;
    light1.shadow.camera.near = 0.5;
    light1.shadow.camera.far = finalConfig.lightDistance;
  }
  
  lights.push(light1);

  // Light 2: Positioned at (-2.5, 5, 5) - opposite angle for interior illumination
  const light2 = new THREE.SpotLight(0xffffff, finalConfig.lightIntensity);
  light2.position.set(-2.5, 5, 5);
  light2.angle = Math.PI / 4;
  light2.penumbra = 0.5;
  
  if (finalConfig.enableShadows) {
    light2.castShadow = true;
    light2.shadow.mapSize.width = finalConfig.shadowMapSize;
    light2.shadow.mapSize.height = finalConfig.shadowMapSize;
    light2.shadow.camera.near = 0.5;
    light2.shadow.camera.far = finalConfig.lightDistance;
  }
  
  lights.push(light2);

  // Ambient light: Critical for interior surface visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, finalConfig.ambientIntensity);
  lights.push(ambientLight);

  return lights;
}

/**
 * Configures renderer for CSG operations based on working example
 * 
 * @param renderer - Three.js WebGL renderer
 */
export function configureRendererForCSG(renderer: THREE.WebGLRenderer): void {
  // Enable shadows for proper depth perception in CSG operations
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for better quality
  
  // Ensure proper color space for material rendering
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Enable tone mapping for better lighting
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
}

/**
 * Creates CSG-optimized material based on working example
 * 
 * Key differences from our current implementation:
 * - Ensures castShadow and receiveShadow are enabled
 * - Uses specific material properties for CSG visibility
 * 
 * @param color - Material color
 * @param options - Additional material options
 * @returns Configured MeshStandardMaterial
 */
export function createCSGMaterial(
  color: number | string = 0x00ff88,
  options: {
    metalness?: number;
    roughness?: number;
    side?: THREE.Side;
    transparent?: boolean;
    opacity?: number;
  } = {}
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0.1,
    roughness: options.roughness ?? 0.8,
    side: options.side ?? THREE.DoubleSide, // Critical for interior surfaces
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1.0,
  });

  return material;
}

/**
 * Configures mesh for CSG operations based on working example
 * 
 * @param mesh - Three.js mesh to configure
 */
export function configureCSGMesh(mesh: THREE.Mesh): void {
  // Critical: Enable shadow casting and receiving for proper CSG visualization
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Ensure the mesh is visible
  mesh.visible = true;
  
  // Update matrix world for proper positioning
  mesh.updateMatrixWorld();
}

/**
 * Complete CSG scene setup based on working three-csg-ts example
 * 
 * @param scene - Three.js scene
 * @param renderer - Three.js renderer
 * @param config - Lighting configuration
 * @returns Array of lights added to the scene
 */
export function setupCSGScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  config: CSGLightingConfig = {}
): THREE.Light[] {
  // Configure renderer for CSG
  configureRendererForCSG(renderer);
  
  // Create and add CSG-optimized lighting
  const lights = createCSGLighting(config);
  lights.forEach(light => scene.add(light));
  
  return lights;
}

/**
 * Debug helper to verify CSG lighting setup
 * 
 * @param scene - Three.js scene to analyze
 * @returns Lighting analysis report
 */
export function analyzeCSGLighting(scene: THREE.Scene): {
  lightCount: number;
  hasAmbientLight: boolean;
  hasDirectionalLights: boolean;
  hasSpotLights: boolean;
  shadowsEnabled: boolean;
} {
  let lightCount = 0;
  let hasAmbientLight = false;
  let hasDirectionalLights = false;
  let hasSpotLights = false;
  let shadowsEnabled = false;

  scene.traverse((object) => {
    if (object instanceof THREE.Light) {
      lightCount++;
      
      if (object instanceof THREE.AmbientLight) {
        hasAmbientLight = true;
      } else if (object instanceof THREE.DirectionalLight) {
        hasDirectionalLights = true;
        if (object.castShadow) shadowsEnabled = true;
      } else if (object instanceof THREE.SpotLight) {
        hasSpotLights = true;
        if (object.castShadow) shadowsEnabled = true;
      }
    }
  });

  return {
    lightCount,
    hasAmbientLight,
    hasDirectionalLights,
    hasSpotLights,
    shadowsEnabled,
  };
}
