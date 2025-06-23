/**
 * @file R3F Scene Factory
 * 
 * React Three Fiber scene factory service that generates complete R3F scenes
 * from processed meshes, including lighting, camera setup, and material configuration.
 * 
 * Features:
 * - Complete scene generation from mesh arrays
 * - Professional lighting setup (three-point lighting)
 * - Camera configuration with controls
 * - Material optimization and management
 * - Performance monitoring and optimization
 * - Comprehensive error handling with Result types
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import * as THREE from 'three';
import type { Result, R3FMaterialConfig, Transform3D, SceneFactoryConfig } from '../../types/r3f-csg-types';

// ============================================================================
// Scene Factory Configuration
// ============================================================================

/**
 * Scene generation result
 */
export type SceneFactoryResult = Result<THREE.Scene, string>;

/**
 * Scene statistics for monitoring
 */
export interface SceneStatistics {
  readonly meshCount: number;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly materialCount: number;
  readonly lightCount: number;
  readonly memoryEstimate: number;
  readonly boundingBox: THREE.Box3;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_SCENE_CONFIG: Required<SceneFactoryConfig> = {
  enableLighting: true,
  enableShadows: true,
  enableFog: false,
  enableGrid: true,
  enableAxes: true,
  backgroundColor: '#2c3e50',
  ambientLightIntensity: 0.4,
  directionalLightIntensity: 1.0,
  pointLightIntensity: 0.5,
  fogNear: 50,
  fogFar: 200,
  gridSize: 20,
  axesSize: 5,
  enableOptimization: true,
  enableLogging: true
} as const;

// ============================================================================
// R3F Scene Factory Implementation
// ============================================================================

/**
 * React Three Fiber scene factory
 * 
 * Creates complete Three.js scenes from mesh arrays with professional
 * lighting, camera setup, and material configuration.
 */
export class R3FSceneFactory {
  private readonly config: Required<SceneFactoryConfig>;
  private readonly disposables: Set<THREE.Object3D> = new Set();

  constructor(config: SceneFactoryConfig = {}) {
    console.log('[INIT] Creating R3F Scene Factory');
    
    this.config = { ...DEFAULT_SCENE_CONFIG, ...config };

    if (this.config.enableLogging) {
      console.log('[DEBUG] R3F Scene Factory configuration:', this.config);
    }
  }

  /**
   * Create complete scene from mesh array
   */
  public createScene(meshes: readonly THREE.Mesh[]): SceneFactoryResult {
    console.log('[DEBUG] Creating scene from', meshes.length, 'meshes');

    try {
      // Validate input meshes
      const validationResult = this.validateMeshes(meshes);
      if (!validationResult.success) {
        return validationResult;
      }

      // Create new scene
      const scene = new THREE.Scene();
      scene.name = 'R3F_Generated_Scene';

      // Set background color
      if (typeof this.config.backgroundColor === 'string') {
        scene.background = new THREE.Color(this.config.backgroundColor);
      }

      // Add fog if enabled
      if (this.config.enableFog) {
        const fogColor = (typeof this.config.backgroundColor === 'string' 
          ? this.config.backgroundColor 
          : DEFAULT_SCENE_CONFIG.backgroundColor) as string;
        scene.fog = new THREE.Fog(
          fogColor,
          this.config.fogNear,
          this.config.fogFar
        );
        console.log('[DEBUG] Scene fog configured');
      }

      // Setup lighting
      if (this.config.enableLighting) {
        const lightingResult = this.setupLighting(scene);
        if (!lightingResult.success) {
          console.warn('[WARN] Lighting setup failed:', lightingResult.error);
          // Continue without lighting - not fatal
        }
      }

      // Add grid helper
      if (this.config.enableGrid) {
        const gridResult = this.addGrid(scene);
        if (!gridResult.success) {
          console.warn('[WARN] Grid setup failed:', gridResult.error);
          // Continue without grid - not fatal
        }
      }

      // Add axes helper
      if (this.config.enableAxes) {
        const axesResult = this.addAxes(scene);
        if (!axesResult.success) {
          console.warn('[WARN] Axes setup failed:', axesResult.error);
          // Continue without axes - not fatal
        }
      }

      // Optimize scene if enabled
      if (this.config.enableOptimization) {
        this.optimizeScene(scene);
      }

      // Track for disposal
      this.disposables.add(scene);

      console.log('[DEBUG] Scene created successfully with', scene.children.length, 'objects');
      return { success: true, data: scene };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scene creation error';
      console.error('[ERROR] Scene creation failed:', errorMessage);
      return { success: false, error: `Scene creation failed: ${errorMessage}` };
    }
  }

  /**
   * Create scene with automatic camera positioning
   */
  public createSceneWithCamera(meshes: readonly THREE.Mesh[]): Result<{scene: THREE.Scene, camera: THREE.Camera}, string> {
    console.log('[DEBUG] Creating scene with automatic camera positioning');

    try {
      // Create scene
      const sceneResult = this.createScene(meshes);
      if (!sceneResult.success) {
        return sceneResult;
      }

      const scene = sceneResult.data;

      // Calculate scene bounds
      const boundingBox = this.calculateSceneBounds(meshes);
      
      // Create camera with optimal positioning
      const camera = this.createOptimalCamera(boundingBox);

      console.log('[DEBUG] Scene with camera created successfully');
      return { 
        success: true, 
        data: { scene, camera } 
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown scene with camera creation error';
      console.error('[ERROR] Scene with camera creation failed:', errorMessage);
      return { success: false, error: `Scene with camera creation failed: ${errorMessage}` };
    }
  }

  /**
   * Get scene statistics
   */
  public getSceneStatistics(scene: THREE.Scene): SceneStatistics {
    let meshCount = 0;
    let vertexCount = 0;
    let triangleCount = 0;
    let lightCount = 0;
    const materials = new Set<THREE.Material>();
    const boundingBox = new THREE.Box3();

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshCount++;
        
        if (object.geometry) {
          const positions = object.geometry.attributes.position;
          if (positions) {
            vertexCount += positions.count;
            triangleCount += positions.count / 3;
          }
          
          // Update bounding box
          object.geometry.computeBoundingBox();
          if (object.geometry.boundingBox) {
            boundingBox.union(object.geometry.boundingBox);
          }
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => materials.add(material));
          } else {
            materials.add(object.material);
          }
        }
      } else if (object instanceof THREE.Light) {
        lightCount++;
      }
    });

    // Estimate memory usage (rough calculation)
    const memoryEstimate = (vertexCount * 12) + (triangleCount * 6) + (materials.size * 1024);

    return {
      meshCount,
      vertexCount,
      triangleCount,
      materialCount: materials.size,
      lightCount,
      memoryEstimate,
      boundingBox
    };
  }

  /**
   * Dispose all created resources
   */
  public dispose(): void {
    console.log('[DEBUG] Disposing R3F Scene Factory resources');

    this.disposables.forEach(object => {
      if (object instanceof THREE.Scene) {
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        object.clear();
      }
    });

    this.disposables.clear();
    console.log('[DEBUG] R3F Scene Factory disposed successfully');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private validateMeshes(meshes: readonly THREE.Mesh[]): Result<void, string> {
    if (!meshes) {
      return { success: false, error: 'Meshes array is null or undefined' };
    }

    if (meshes.length === 0) {
      return { success: false, error: 'No meshes provided for scene creation' };
    }

    // Validate each mesh
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      
      if (!mesh) {
        return { success: false, error: `Mesh at index ${i} is null or undefined` };
      }

      if (!mesh.geometry) {
        return { success: false, error: `Mesh at index ${i} has no geometry` };
      }

      if (!mesh.material) {
        return { success: false, error: `Mesh at index ${i} has no material` };
      }
    }

    return { success: true, data: undefined };
  }

  private addMeshesToScene(scene: THREE.Scene, meshes: readonly THREE.Mesh[]): Result<void, string> {
    try {
      meshes.forEach((mesh, index) => {
        // Clone mesh to avoid modifying original
        const clonedMesh = mesh.clone();
        clonedMesh.name = mesh.name || `mesh_${index}`;
        
        // Enable shadows if configured
        if (this.config.enableShadows) {
          clonedMesh.castShadow = true;
          clonedMesh.receiveShadow = true;
        }

        scene.add(clonedMesh);
      });

      console.log('[DEBUG] Added', meshes.length, 'meshes to scene');
      return { success: true, data: undefined };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown mesh addition error';
      return { success: false, error: `Failed to add meshes to scene: ${errorMessage}` };
    }
  }

  private setupLighting(scene: THREE.Scene): Result<void, string> {
    try {
      // Ambient light for overall illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, this.config.ambientLightIntensity);
      ambientLight.name = 'ambientLight';
      scene.add(ambientLight);

      // Main directional light (key light)
      const directionalLight = new THREE.DirectionalLight(0xffffff, this.config.directionalLightIntensity);
      directionalLight.position.set(10, 10, 5);
      directionalLight.name = 'directionalLight';
      
      if (this.config.enableShadows) {
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
      }
      
      scene.add(directionalLight);

      // Fill light (point light)
      const pointLight = new THREE.PointLight(0xffffff, this.config.pointLightIntensity, 100);
      pointLight.position.set(-5, 5, 5);
      pointLight.name = 'pointLight';
      scene.add(pointLight);

      // Rim light (directional from behind)
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
      rimLight.position.set(-10, 5, -5);
      rimLight.name = 'rimLight';
      scene.add(rimLight);

      console.log('[DEBUG] Professional lighting setup complete');
      return { success: true, data: undefined };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown lighting setup error';
      return { success: false, error: `Lighting setup failed: ${errorMessage}` };
    }
  }

  private addGrid(scene: THREE.Scene): Result<void, string> {
    try {
      const gridHelper = new THREE.GridHelper(this.config.gridSize, this.config.gridSize, 0x808080, 0xe0e0e0);
      gridHelper.name = 'gridHelper';
      scene.add(gridHelper);

      console.log('[DEBUG] Grid helper added to scene');
      return { success: true, data: undefined };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown grid setup error';
      return { success: false, error: `Grid setup failed: ${errorMessage}` };
    }
  }

  private addAxes(scene: THREE.Scene): Result<void, string> {
    try {
      const axesHelper = new THREE.AxesHelper(this.config.axesSize);
      axesHelper.name = 'axesHelper';
      scene.add(axesHelper);

      console.log('[DEBUG] Axes helper added to scene');
      return { success: true, data: undefined };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown axes setup error';
      return { success: false, error: `Axes setup failed: ${errorMessage}` };
    }
  }

  private optimizeScene(scene: THREE.Scene): void {
    try {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry) {
          // Compute normals if not present
          if (!object.geometry.attributes.normal) {
            object.geometry.computeVertexNormals();
          }

          // Compute bounding box and sphere
          object.geometry.computeBoundingBox();
          object.geometry.computeBoundingSphere();
        }
      });

      console.log('[DEBUG] Scene optimization complete');

    } catch (error) {
      console.warn('[WARN] Scene optimization failed:', error);
    }
  }

  private calculateSceneBounds(meshes: readonly THREE.Mesh[]): THREE.Box3 {
    const boundingBox = new THREE.Box3();

    meshes.forEach(mesh => {
      if (mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          boundingBox.union(mesh.geometry.boundingBox);
        }
      }
    });

    return boundingBox;
  }

  private createOptimalCamera(boundingBox: THREE.Box3): THREE.PerspectiveCamera {
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Position camera at optimal distance
    const distance = maxDim * 2;
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, distance * 10);
    
    camera.position.set(
      center.x + distance * 0.7,
      center.y + distance * 0.7,
      center.z + distance * 0.7
    );
    
    camera.lookAt(center);
    camera.name = 'optimalCamera';

    return camera;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new R3F scene factory instance
 */
export function createR3FSceneFactory(config?: SceneFactoryConfig): R3FSceneFactory {
  return new R3FSceneFactory(config);
}

// Default export
export default R3FSceneFactory;
