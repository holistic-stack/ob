/**
 * @file Navigation Cube System
 * 
 * Professional CAD-style navigation cube for Babylon.js scenes
 * Provides 3D navigation cube with face labels and camera control
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';

/**
 * Camera view definition for navigation cube faces
 */
export interface CameraView {
  /** Camera alpha angle (horizontal rotation) */
  readonly alpha: number;
  /** Camera beta angle (vertical rotation) */
  readonly beta: number;
  /** Camera radius (distance from target) */
  readonly radius: number;
}

/**
 * Face label configuration
 */
export interface FaceLabels {
  readonly front?: string;
  readonly back?: string;
  readonly left?: string;
  readonly right?: string;
  readonly top?: string;
  readonly bottom?: string;
}

/**
 * Face color configuration
 */
export interface FaceColors {
  readonly front?: string;
  readonly back?: string;
  readonly left?: string;
  readonly right?: string;
  readonly top?: string;
  readonly bottom?: string;
}

/**
 * Camera views for each face
 */
export interface CameraViews {
  readonly front?: CameraView;
  readonly back?: CameraView;
  readonly left?: CameraView;
  readonly right?: CameraView;
  readonly top?: CameraView;
  readonly bottom?: CameraView;
}

/**
 * Configuration for navigation cube system
 */
export interface NavigationCubeConfig {
  /** Cube size in world units (default: 1) */
  readonly size?: number;
  /** Cube position in screen space [x, y, z] (default: [0.8, 0.8, 0]) */
  readonly position?: readonly [number, number, number];
  /** Face labels (default: Front, Back, Left, Right, Top, Bottom) */
  readonly faceLabels?: FaceLabels;
  /** Face colors (default: standard CAD colors) */
  readonly faceColors?: FaceColors;
  /** Camera views for each face */
  readonly cameraViews?: Partial<CameraViews>;
  /** Callback when face is clicked */
  readonly onFaceClick?: (face: string) => void;
  /** Callback when face is hovered */
  readonly onFaceHover?: (face: string, isHovering: boolean) => void;
}

/**
 * Face data for navigation cube
 */
export interface CubeFace {
  readonly name: string;
  readonly mesh: BABYLON.Mesh;
  readonly material: BABYLON.StandardMaterial;
}

/**
 * Face label data
 */
export interface FaceLabel {
  readonly face: string;
  readonly text: string;
  readonly mesh: BABYLON.Mesh;
}

/**
 * Result of navigation cube creation
 */
export interface NavigationCubeData {
  /** The created cube mesh */
  readonly cubeMesh: BABYLON.Mesh;
  /** Individual face meshes */
  readonly faces: readonly CubeFace[];
  /** Face labels */
  readonly faceLabels: readonly FaceLabel[];
  /** Camera views for each face */
  readonly cameraViews: Required<CameraViews>;
  /** Applied configuration */
  readonly config: Required<NavigationCubeConfig>;
  /** Handle face click interaction */
  readonly handleFaceClick: (face: string) => void;
  /** Handle face hover interaction */
  readonly handleFaceHover: (face: string, isHovering: boolean) => void;
}

/**
 * Result type for navigation cube operations
 */
export type NavigationCubeResult = 
  | { readonly success: true; readonly data: NavigationCubeData }
  | { readonly success: false; readonly error: string };

/**
 * Default configuration for navigation cube
 */
const DEFAULT_CONFIG: Required<NavigationCubeConfig> = {
  size: 1,
  position: [0.8, 0.8, 0],
  faceLabels: {
    front: 'Front',
    back: 'Back',
    left: 'Left',
    right: 'Right',
    top: 'Top',
    bottom: 'Bottom'
  },
  faceColors: {
    front: '#4CAF50',   // Green
    back: '#F44336',    // Red
    left: '#2196F3',    // Blue
    right: '#FF9800',   // Orange
    top: '#9C27B0',     // Purple
    bottom: '#607D8B'   // Blue Grey
  },
  cameraViews: {
    front: { alpha: 0, beta: Math.PI / 2, radius: 10 },
    back: { alpha: Math.PI, beta: Math.PI / 2, radius: 10 },
    left: { alpha: -Math.PI / 2, beta: Math.PI / 2, radius: 10 },
    right: { alpha: Math.PI / 2, beta: Math.PI / 2, radius: 10 },
    top: { alpha: 0, beta: 0.1, radius: 10 },
    bottom: { alpha: 0, beta: Math.PI - 0.1, radius: 10 }
  },
  onFaceClick: () => {},
  onFaceHover: () => {}
} as const;

/**
 * Validate navigation cube configuration
 */
function validateConfig(config: NavigationCubeConfig): string | null {
  if (config.size !== undefined && config.size <= 0) {
    return 'Cube size must be positive';
  }
  
  if (config.position !== undefined) {
    const [x, y] = config.position;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      return 'Cube position must be within screen bounds [0,1]';
    }
  }
  
  return null;
}

/**
 * Create cube geometry with individual faces
 */
function createCubeGeometry(
  scene: BABYLON.Scene,
  config: Required<NavigationCubeConfig>
): { cubeMesh: BABYLON.Mesh; faces: CubeFace[] } {
  console.log('[DEBUG] Creating navigation cube geometry');
  
  const { size } = config;
  
  // Create main cube mesh
  const cubeMesh = BABYLON.MeshBuilder.CreateBox('navigation-cube', {
    size: size
  }, scene);
  
  // Create individual face meshes for interaction
  const faces: CubeFace[] = [];
  const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  
  faceNames.forEach((faceName, index) => {
    const faceMesh = BABYLON.MeshBuilder.CreatePlane(`${faceName}-face`, {
      size: size * 0.9
    }, scene);
    
    // Position face on cube
    switch (faceName) {
      case 'front':
        faceMesh.position.z = size / 2;
        break;
      case 'back':
        faceMesh.position.z = -size / 2;
        faceMesh.rotation.y = Math.PI;
        break;
      case 'left':
        faceMesh.position.x = -size / 2;
        faceMesh.rotation.y = -Math.PI / 2;
        break;
      case 'right':
        faceMesh.position.x = size / 2;
        faceMesh.rotation.y = Math.PI / 2;
        break;
      case 'top':
        faceMesh.position.y = size / 2;
        faceMesh.rotation.x = -Math.PI / 2;
        break;
      case 'bottom':
        faceMesh.position.y = -size / 2;
        faceMesh.rotation.x = Math.PI / 2;
        break;
    }
    
    // Create material for face
    const material = new BABYLON.StandardMaterial(`${faceName}-material`, scene);
    const color = config.faceColors[faceName as keyof FaceColors] || '#cccccc';
    material.diffuseColor = BABYLON.Color3.FromHexString(color);
    material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.2);
    
    faceMesh.material = material;
    faceMesh.parent = cubeMesh;
    
    faces.push({
      name: faceName,
      mesh: faceMesh,
      material
    });
  });
  
  return { cubeMesh, faces };
}

/**
 * Create face labels (with fallback for headless environments)
 */
function createFaceLabels(
  scene: BABYLON.Scene,
  cubeMesh: BABYLON.Mesh,
  config: Required<NavigationCubeConfig>
): FaceLabel[] {
  console.log('[DEBUG] Creating navigation cube face labels');

  const labels: FaceLabel[] = [];
  const faceNames = ['front', 'back', 'left', 'right', 'top', 'bottom'];

  faceNames.forEach(faceName => {
    const labelText = config.faceLabels[faceName as keyof FaceLabels] || faceName;

    try {
      // Create text plane for label
      const labelMesh = BABYLON.MeshBuilder.CreatePlane(`${faceName}-label`, {
        size: 0.3
      }, scene);

      // Try to create dynamic texture for text (may fail in headless environment)
      const dynamicTexture = new BABYLON.DynamicTexture(`${faceName}-text`, {
        width: 256,
        height: 256
      }, scene);

      dynamicTexture.drawText(
        labelText,
        null,
        null,
        'bold 60px Arial',
        '#ffffff',
        'transparent',
        true
      );

      // Create material with text texture
      const labelMaterial = new BABYLON.StandardMaterial(`${faceName}-label-material`, scene);
      labelMaterial.diffuseTexture = dynamicTexture;
      labelMaterial.emissiveTexture = dynamicTexture;
      labelMaterial.disableLighting = true;

      labelMesh.material = labelMaterial;
      labelMesh.parent = cubeMesh;

      // Position label slightly in front of face
      const offset = 0.6;
      switch (faceName) {
        case 'front':
          labelMesh.position.z = offset;
          break;
        case 'back':
          labelMesh.position.z = -offset;
          labelMesh.rotation.y = Math.PI;
          break;
        case 'left':
          labelMesh.position.x = -offset;
          labelMesh.rotation.y = -Math.PI / 2;
          break;
        case 'right':
          labelMesh.position.x = offset;
          labelMesh.rotation.y = Math.PI / 2;
          break;
        case 'top':
          labelMesh.position.y = offset;
          labelMesh.rotation.x = -Math.PI / 2;
          break;
        case 'bottom':
          labelMesh.position.y = -offset;
          labelMesh.rotation.x = Math.PI / 2;
          break;
      }

      labels.push({
        face: faceName,
        text: labelText,
        mesh: labelMesh
      });

    } catch (error) {
      console.warn('[WARN] Failed to create face label for', faceName, '- creating fallback');

      // Create simple colored plane as fallback
      const labelMesh = BABYLON.MeshBuilder.CreatePlane(`${faceName}-label-fallback`, {
        size: 0.2
      }, scene);

      const fallbackMaterial = new BABYLON.StandardMaterial(`${faceName}-fallback-material`, scene);
      fallbackMaterial.diffuseColor = BABYLON.Color3.White();
      fallbackMaterial.emissiveColor = BABYLON.Color3.White().scale(0.3);

      labelMesh.material = fallbackMaterial;
      labelMesh.parent = cubeMesh;

      labels.push({
        face: faceName,
        text: labelText,
        mesh: labelMesh
      });
    }
  });

  return labels;
}

/**
 * Create professional CAD-style navigation cube system
 *
 * @param scene - Babylon.js scene to add cube to
 * @param camera - Camera to control with cube interactions
 * @param userConfig - Optional cube configuration
 * @returns Result containing cube data or error
 *
 * @example
 * ```typescript
 * const result = createNavigationCube(scene, camera, {
 *   size: 1.2,
 *   position: [0.9, 0.9, 0],
 *   faceLabels: {
 *     front: 'F',
 *     back: 'B',
 *     left: 'L',
 *     right: 'R',
 *     top: 'T',
 *     bottom: 'Bot'
 *   },
 *   onFaceClick: (face) => console.log('Clicked:', face)
 * });
 *
 * if (result.success) {
 *   console.log('Navigation cube created:', result.data.cubeMesh.name);
 * }
 * ```
 */
export function createNavigationCube(
  scene: BABYLON.Scene | null,
  camera: BABYLON.ArcRotateCamera | null,
  userConfig: NavigationCubeConfig = {}
): NavigationCubeResult {
  console.log('[INIT] Creating navigation cube system');

  try {
    // Validate inputs
    if (!scene || scene.isDisposed) {
      return { success: false, error: 'Invalid scene provided' };
    }

    if (!camera || camera.isDisposed()) {
      return { success: false, error: 'Invalid camera provided' };
    }

    // Validate and merge configuration
    const configError = validateConfig(userConfig);
    if (configError) {
      return { success: false, error: `Invalid configuration: ${configError}` };
    }

    const config: Required<NavigationCubeConfig> = {
      ...DEFAULT_CONFIG,
      ...userConfig,
      faceLabels: { ...DEFAULT_CONFIG.faceLabels, ...userConfig.faceLabels },
      faceColors: { ...DEFAULT_CONFIG.faceColors, ...userConfig.faceColors },
      cameraViews: { ...DEFAULT_CONFIG.cameraViews, ...userConfig.cameraViews }
    };

    console.log('[DEBUG] Navigation cube config:', config);

    // Create cube geometry and faces
    const { cubeMesh, faces } = createCubeGeometry(scene, config);

    // Create face labels
    const faceLabels = createFaceLabels(scene, cubeMesh, config);

    // Position cube in screen space
    const [x, y, z] = config.position;
    cubeMesh.position = new BABYLON.Vector3(x * 10 - 5, y * 10 - 5, z);

    // Configure mesh properties
    cubeMesh.isPickable = true;
    cubeMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5); // Make it smaller for UI

    // Create interaction handlers
    const handleFaceClick = (face: string) => {
      console.log('[DEBUG] Navigation cube face clicked:', face);
      if (config.onFaceClick) {
        config.onFaceClick(face);
      }

      // Apply camera view if defined
      const cameraView = config.cameraViews[face as keyof CameraViews];
      if (cameraView) {
        camera.alpha = cameraView.alpha;
        camera.beta = cameraView.beta;
        camera.radius = cameraView.radius;
      }
    };

    const handleFaceHover = (face: string, isHovering: boolean) => {
      console.log('[DEBUG] Navigation cube face hover:', face, isHovering);
      if (config.onFaceHover) {
        config.onFaceHover(face, isHovering);
      }

      // Visual feedback for hover
      const faceData = faces.find(f => f.name === face);
      if (faceData) {
        if (isHovering) {
          faceData.material.emissiveColor = faceData.material.diffuseColor.scale(0.5);
        } else {
          faceData.material.emissiveColor = faceData.material.diffuseColor.scale(0.2);
        }
      }
    };

    // Setup face interactions
    faces.forEach(face => {
      face.mesh.actionManager = new BABYLON.ActionManager(scene);

      // Click action
      face.mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => handleFaceClick(face.name)
        )
      );

      // Hover actions
      face.mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOverTrigger,
          () => handleFaceHover(face.name, true)
        )
      );

      face.mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPointerOutTrigger,
          () => handleFaceHover(face.name, false)
        )
      );
    });

    console.log('[END] Navigation cube created successfully');

    return {
      success: true,
      data: {
        cubeMesh,
        faces,
        faceLabels,
        cameraViews: config.cameraViews as Required<CameraViews>,
        config,
        handleFaceClick,
        handleFaceHover
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] Failed to create navigation cube:', errorMessage);
    return { success: false, error: `Failed to create navigation cube: ${errorMessage}` };
  }
}
