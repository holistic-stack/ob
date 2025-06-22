/**
 * @file Enhanced Navigation Cube System
 * 
 * Professional CAD-style navigation cube with comprehensive features:
 * - 26 clickable faces (6 main + 12 edges + 8 corners)
 * - Directional controls (4 triangular arrows + 2 curved arrows)
 * - Reverse view button
 * - Mini-cube menu (orthographic/perspective toggle, fit controls)
 * - Movable cube with drag functionality
 * - Smooth animations and visual feedback
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 2.0.0
 */

import * as BABYLON from '@babylonjs/core';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Enhanced navigation cube configuration
 */
export interface EnhancedNavigationCubeConfig {
  /** Cube size in world units (default: 1.5) */
  readonly size?: number;
  /** Cube position in screen space [x, y, z] (default: [0.85, 0.85, 0]) */
  readonly position?: readonly [number, number, number];
  /** Enable drag to move functionality (default: true) */
  readonly movable?: boolean;
  /** Enable directional arrows (default: true) */
  readonly showDirectionalControls?: boolean;
  /** Enable mini-cube menu (default: true) */
  readonly showMiniCubeMenu?: boolean;
  /** Animation duration in seconds (default: 0.8) */
  readonly animationDuration?: number;
}

/**
 * Face type enumeration
 */
export type FaceType = 'main' | 'edge' | 'corner';

/**
 * Navigation cube face definition
 */
export interface NavigationFace {
  readonly name: string;
  readonly type: FaceType;
  readonly mesh: BABYLON.Mesh;
  readonly material: BABYLON.StandardMaterial;
  readonly cameraView: {
    readonly alpha: number;
    readonly beta: number;
    readonly radius?: number;
  };
}

/**
 * Directional control definition
 */
export interface DirectionalControl {
  readonly name: string;
  readonly type: 'triangular' | 'curved' | 'reverse';
  readonly mesh: BABYLON.Mesh;
  readonly material: BABYLON.StandardMaterial;
  readonly action: (camera: BABYLON.ArcRotateCamera) => void;
}

/**
 * Mini-cube menu item
 */
export interface MiniCubeMenuItem {
  readonly name: string;
  readonly icon: string;
  readonly mesh: BABYLON.Mesh;
  readonly material: BABYLON.StandardMaterial;
  readonly action: (camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene) => void;
}

/**
 * Enhanced navigation cube data
 */
export interface EnhancedNavigationCubeData {
  readonly mainCube: BABYLON.Mesh;
  readonly faces: readonly NavigationFace[];
  readonly directionalControls: readonly DirectionalControl[];
  readonly miniCubeMenu: readonly MiniCubeMenuItem[];
  readonly config: Required<EnhancedNavigationCubeConfig>;
  readonly dispose: () => void;
}

/**
 * Result type for enhanced navigation cube operations
 */
export type EnhancedNavigationCubeResult = 
  | { readonly success: true; readonly data: EnhancedNavigationCubeData }
  | { readonly success: false; readonly error: string };

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<EnhancedNavigationCubeConfig> = {
  size: 1.5,
  position: [0.85, 0.85, 0],
  movable: true,
  showDirectionalControls: true,
  showMiniCubeMenu: true,
  animationDuration: 0.8
} as const;

// ============================================================================
// Face Definitions
// ============================================================================

/**
 * Standard CAD view definitions for all 26 faces
 */
const FACE_DEFINITIONS: Record<string, { type: FaceType; alpha: number; beta: number }> = {
  // 6 Main faces
  'front': { type: 'main', alpha: 0, beta: Math.PI / 2 },
  'back': { type: 'main', alpha: Math.PI, beta: Math.PI / 2 },
  'left': { type: 'main', alpha: -Math.PI / 2, beta: Math.PI / 2 },
  'right': { type: 'main', alpha: Math.PI / 2, beta: Math.PI / 2 },
  'top': { type: 'main', alpha: 0, beta: 0.1 },
  'bottom': { type: 'main', alpha: 0, beta: Math.PI - 0.1 },
  
  // 12 Edge faces
  'front-top': { type: 'edge', alpha: 0, beta: Math.PI / 4 },
  'front-bottom': { type: 'edge', alpha: 0, beta: 3 * Math.PI / 4 },
  'front-left': { type: 'edge', alpha: -Math.PI / 4, beta: Math.PI / 2 },
  'front-right': { type: 'edge', alpha: Math.PI / 4, beta: Math.PI / 2 },
  'back-top': { type: 'edge', alpha: Math.PI, beta: Math.PI / 4 },
  'back-bottom': { type: 'edge', alpha: Math.PI, beta: 3 * Math.PI / 4 },
  'back-left': { type: 'edge', alpha: -3 * Math.PI / 4, beta: Math.PI / 2 },
  'back-right': { type: 'edge', alpha: 3 * Math.PI / 4, beta: Math.PI / 2 },
  'left-top': { type: 'edge', alpha: -Math.PI / 2, beta: Math.PI / 4 },
  'left-bottom': { type: 'edge', alpha: -Math.PI / 2, beta: 3 * Math.PI / 4 },
  'right-top': { type: 'edge', alpha: Math.PI / 2, beta: Math.PI / 4 },
  'right-bottom': { type: 'edge', alpha: Math.PI / 2, beta: 3 * Math.PI / 4 },
  
  // 8 Corner faces
  'front-left-top': { type: 'corner', alpha: -Math.PI / 4, beta: Math.PI / 4 },
  'front-right-top': { type: 'corner', alpha: Math.PI / 4, beta: Math.PI / 4 },
  'front-left-bottom': { type: 'corner', alpha: -Math.PI / 4, beta: 3 * Math.PI / 4 },
  'front-right-bottom': { type: 'corner', alpha: Math.PI / 4, beta: 3 * Math.PI / 4 },
  'back-left-top': { type: 'corner', alpha: -3 * Math.PI / 4, beta: Math.PI / 4 },
  'back-right-top': { type: 'corner', alpha: 3 * Math.PI / 4, beta: Math.PI / 4 },
  'back-left-bottom': { type: 'corner', alpha: -3 * Math.PI / 4, beta: 3 * Math.PI / 4 },
  'back-right-bottom': { type: 'corner', alpha: 3 * Math.PI / 4, beta: 3 * Math.PI / 4 }
} as const;

// ============================================================================
// Color Schemes
// ============================================================================

/**
 * Professional CAD color scheme
 */
const CAD_COLORS = {
  main: {
    front: '#4CAF50',    // Green
    back: '#F44336',     // Red
    left: '#2196F3',     // Blue
    right: '#FF9800',    // Orange
    top: '#9C27B0',      // Purple
    bottom: '#607D8B'    // Blue Grey
  },
  edge: '#E0E0E0',       // Light Grey
  corner: '#BDBDBD',     // Medium Grey
  arrow: '#FFC107',      // Amber
  menu: '#37474F',       // Dark Blue Grey
  hover: '#FFEB3B',      // Yellow
  active: '#FF5722'      // Deep Orange
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create smooth camera animation
 */
function animateCamera(
  camera: BABYLON.ArcRotateCamera,
  targetAlpha: number,
  targetBeta: number,
  targetRadius: number,
  duration: number
): void {
  const scene = camera.getScene();
  const frameRate = 60;
  const totalFrames = Math.round(duration * frameRate);
  
  // Create easing function
  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  
  // Alpha animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraAlpha',
    camera,
    'alpha',
    frameRate,
    totalFrames,
    camera.alpha,
    targetAlpha,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );
  
  // Beta animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraBeta',
    camera,
    'beta',
    frameRate,
    totalFrames,
    camera.beta,
    targetBeta,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );
  
  // Radius animation (if different)
  if (Math.abs(camera.radius - targetRadius) > 0.1) {
    BABYLON.Animation.CreateAndStartAnimation(
      'cameraRadius',
      camera,
      'radius',
      frameRate,
      totalFrames,
      camera.radius,
      targetRadius,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      easing
    );
  }
}

/**
 * Create material with color and hover effects
 */
function createMaterial(
  name: string,
  color: string,
  scene: BABYLON.Scene,
  emissive: boolean = false
): BABYLON.StandardMaterial {
  const material = new BABYLON.StandardMaterial(name, scene);
  const baseColor = BABYLON.Color3.FromHexString(color);
  
  material.diffuseColor = baseColor;
  if (emissive) {
    material.emissiveColor = baseColor.scale(0.3);
  }
  
  return material;
}

/**
 * Add hover effects to mesh
 */
function addHoverEffects(
  mesh: BABYLON.Mesh,
  material: BABYLON.StandardMaterial,
  scene: BABYLON.Scene
): void {
  mesh.actionManager = new BABYLON.ActionManager(scene);
  
  const originalEmissive = material.emissiveColor.clone();
  const hoverColor = BABYLON.Color3.FromHexString(CAD_COLORS.hover);
  
  // Hover in
  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPointerOverTrigger,
      () => {
        material.emissiveColor = hoverColor.scale(0.5);
      }
    )
  );
  
  // Hover out
  mesh.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPointerOutTrigger,
      () => {
        material.emissiveColor = originalEmissive;
      }
    )
  );
}

// ============================================================================
// Main Cube Creation Functions
// ============================================================================

/**
 * Create the main navigation cube with 26 clickable faces
 */
function createMainNavigationCube(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  config: Required<EnhancedNavigationCubeConfig>
): { mainCube: BABYLON.Mesh; faces: NavigationFace[] } {
  console.log('[DEBUG] Creating main navigation cube with 26 faces');

  const { size } = config;

  // Create main cube container
  const mainCube = BABYLON.MeshBuilder.CreateBox('enhanced-navigation-cube', {
    size: size
  }, scene);

  const faces: NavigationFace[] = [];

  // Create all 26 faces
  Object.entries(FACE_DEFINITIONS).forEach(([faceName, faceData]) => {
    const { type, alpha, beta } = faceData;

    // Determine face size based on type
    let faceSize: number;
    let faceOffset: number;

    switch (type) {
      case 'main':
        faceSize = size * 0.8;
        faceOffset = size * 0.51;
        break;
      case 'edge':
        faceSize = size * 0.3;
        faceOffset = size * 0.52;
        break;
      case 'corner':
        faceSize = size * 0.2;
        faceOffset = size * 0.53;
        break;
    }

    // Create face mesh
    const faceMesh = BABYLON.MeshBuilder.CreatePlane(`${faceName}-face`, {
      size: faceSize
    }, scene);

    // Position face based on name
    positionFace(faceMesh, faceName, faceOffset);

    // Create material based on face type
    let color: string;
    if (type === 'main' && CAD_COLORS.main[faceName as keyof typeof CAD_COLORS.main]) {
      color = CAD_COLORS.main[faceName as keyof typeof CAD_COLORS.main];
    } else if (type === 'edge') {
      color = CAD_COLORS.edge;
    } else {
      color = CAD_COLORS.corner;
    }

    const material = createMaterial(`${faceName}-material`, color, scene, true);
    faceMesh.material = material;
    faceMesh.parent = mainCube;

    // Add hover effects
    addHoverEffects(faceMesh, material, scene);

    // Add click action
    if (!faceMesh.actionManager) {
      faceMesh.actionManager = new BABYLON.ActionManager(scene);
    }

    faceMesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => {
          console.log('[DEBUG] Navigation cube face clicked:', faceName);

          // Calculate optimal radius
          const targetRadius = calculateOptimalRadius(camera, scene);

          // Animate to view
          animateCamera(camera, alpha, beta, targetRadius, config.animationDuration);
        }
      )
    );

    faces.push({
      name: faceName,
      type,
      mesh: faceMesh,
      material,
      cameraView: { alpha, beta }
    });
  });

  console.log('[DEBUG] Created', faces.length, 'navigation cube faces');
  return { mainCube, faces };
}

/**
 * Position face mesh based on face name
 */
function positionFace(mesh: BABYLON.Mesh, faceName: string, offset: number): void {
  // Reset position and rotation
  mesh.position = BABYLON.Vector3.Zero();
  mesh.rotation = BABYLON.Vector3.Zero();

  // Position based on face name
  if (faceName.includes('front')) {
    mesh.position.z = offset;
  }
  if (faceName.includes('back')) {
    mesh.position.z = -offset;
    mesh.rotation.y = Math.PI;
  }
  if (faceName.includes('left')) {
    mesh.position.x = -offset;
    mesh.rotation.y = -Math.PI / 2;
  }
  if (faceName.includes('right')) {
    mesh.position.x = offset;
    mesh.rotation.y = Math.PI / 2;
  }
  if (faceName.includes('top')) {
    mesh.position.y = offset;
    mesh.rotation.x = -Math.PI / 2;
  }
  if (faceName.includes('bottom')) {
    mesh.position.y = -offset;
    mesh.rotation.x = Math.PI / 2;
  }

  // Adjust for compound faces (edges and corners)
  if (faceName.includes('-')) {
    const parts = faceName.split('-');
    let xOffset = 0, yOffset = 0, zOffset = 0;

    parts.forEach(part => {
      switch (part) {
        case 'front': zOffset = offset * 0.7; break;
        case 'back': zOffset = -offset * 0.7; break;
        case 'left': xOffset = -offset * 0.7; break;
        case 'right': xOffset = offset * 0.7; break;
        case 'top': yOffset = offset * 0.7; break;
        case 'bottom': yOffset = -offset * 0.7; break;
      }
    });

    mesh.position.x = xOffset;
    mesh.position.y = yOffset;
    mesh.position.z = zOffset;

    // Orient face toward camera
    mesh.lookAt(BABYLON.Vector3.Zero());
  }
}

/**
 * Calculate optimal camera radius for current scene
 */
function calculateOptimalRadius(camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene): number {
  const meshes = scene.meshes.filter(mesh =>
    mesh.isVisible &&
    !mesh.isDisposed &&
    !mesh.name.includes('navigation-cube') &&
    !mesh.name.includes('cad-grid') &&
    !mesh.name.includes('directional-control') &&
    !mesh.name.includes('mini-cube')
  );

  if (meshes.length === 0) {
    return camera.radius; // Keep current radius if no meshes
  }

  // Calculate scene bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    if (boundingInfo) {
      const min = boundingInfo.boundingBox.minimum;
      const max = boundingInfo.boundingBox.maximum;

      minX = Math.min(minX, min.x);
      minY = Math.min(minY, min.y);
      minZ = Math.min(minZ, min.z);
      maxX = Math.max(maxX, max.x);
      maxY = Math.max(maxY, max.y);
      maxZ = Math.max(maxZ, max.z);
    }
  }

  // Calculate optimal radius
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  return Math.max(maxSize * 2.5, 10);
}

// ============================================================================
// Directional Controls Creation
// ============================================================================

/**
 * Create directional control arrows around the navigation cube
 */
function createDirectionalControls(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  mainCube: BABYLON.Mesh,
  config: Required<EnhancedNavigationCubeConfig>
): DirectionalControl[] {
  console.log('[DEBUG] Creating directional controls');

  if (!config.showDirectionalControls) {
    return [];
  }

  const controls: DirectionalControl[] = [];
  const { size } = config;
  const arrowDistance = size * 1.5;

  // 4 Triangular arrows (rotate around perpendicular axis)
  const triangularArrows = [
    { name: 'up-arrow', position: [0, arrowDistance, 0], rotation: [0, 0, 0] },
    { name: 'down-arrow', position: [0, -arrowDistance, 0], rotation: [Math.PI, 0, 0] },
    { name: 'left-arrow', position: [-arrowDistance, 0, 0], rotation: [0, 0, Math.PI / 2] },
    { name: 'right-arrow', position: [arrowDistance, 0, 0], rotation: [0, 0, -Math.PI / 2] }
  ];

  triangularArrows.forEach(arrow => {
    const arrowMesh = BABYLON.MeshBuilder.CreateCylinder(`${arrow.name}`, {
      diameterTop: 0,
      diameterBottom: size * 0.3,
      height: size * 0.4
    }, scene);

    arrowMesh.position = new BABYLON.Vector3(...arrow.position);
    arrowMesh.rotation = new BABYLON.Vector3(...arrow.rotation);
    arrowMesh.parent = mainCube;

    const material = createMaterial(`${arrow.name}-material`, CAD_COLORS.arrow, scene, true);
    arrowMesh.material = material;

    // Add hover effects
    addHoverEffects(arrowMesh, material, scene);

    // Add click action
    arrowMesh.actionManager = new BABYLON.ActionManager(scene);
    arrowMesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => {
          console.log('[DEBUG] Directional arrow clicked:', arrow.name);

          // Rotate camera around perpendicular axis
          const rotationAmount = Math.PI / 6; // 30 degrees

          switch (arrow.name) {
            case 'up-arrow':
              camera.beta = Math.max(0.1, camera.beta - rotationAmount);
              break;
            case 'down-arrow':
              camera.beta = Math.min(Math.PI - 0.1, camera.beta + rotationAmount);
              break;
            case 'left-arrow':
              camera.alpha -= rotationAmount;
              break;
            case 'right-arrow':
              camera.alpha += rotationAmount;
              break;
          }
        }
      )
    );

    controls.push({
      name: arrow.name,
      type: 'triangular',
      mesh: arrowMesh,
      material,
      action: (cam) => {
        // Action is handled in click event above
      }
    });
  });

  // 2 Curved arrows (rotate around view direction)
  const curvedArrows = [
    { name: 'clockwise-arrow', angle: 0 },
    { name: 'counterclockwise-arrow', angle: Math.PI }
  ];

  curvedArrows.forEach(arrow => {
    const arrowMesh = BABYLON.MeshBuilder.CreateTorus(`${arrow.name}`, {
      diameter: size * 0.8,
      thickness: size * 0.1,
      tessellation: 16
    }, scene);

    arrowMesh.position = new BABYLON.Vector3(0, 0, arrowDistance * 0.8);
    arrowMesh.rotation.z = arrow.angle;
    arrowMesh.parent = mainCube;

    const material = createMaterial(`${arrow.name}-material`, CAD_COLORS.arrow, scene, true);
    arrowMesh.material = material;

    // Add hover effects
    addHoverEffects(arrowMesh, material, scene);

    // Add click action
    arrowMesh.actionManager = new BABYLON.ActionManager(scene);
    arrowMesh.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => {
          console.log('[DEBUG] Curved arrow clicked:', arrow.name);

          // Rotate camera around view direction
          const rotationAmount = Math.PI / 4; // 45 degrees

          if (arrow.name === 'clockwise-arrow') {
            camera.alpha += rotationAmount;
          } else {
            camera.alpha -= rotationAmount;
          }
        }
      )
    );

    controls.push({
      name: arrow.name,
      type: 'curved',
      mesh: arrowMesh,
      material,
      action: (cam) => {
        // Action is handled in click event above
      }
    });
  });

  // Reverse view button (top-right)
  const reverseButton = BABYLON.MeshBuilder.CreateSphere('reverse-button', {
    diameter: size * 0.4
  }, scene);

  reverseButton.position = new BABYLON.Vector3(arrowDistance * 0.7, arrowDistance * 0.7, 0);
  reverseButton.parent = mainCube;

  const reverseMaterial = createMaterial('reverse-material', CAD_COLORS.menu, scene, true);
  reverseButton.material = reverseMaterial;

  // Add hover effects
  addHoverEffects(reverseButton, reverseMaterial, scene);

  // Add click action
  reverseButton.actionManager = new BABYLON.ActionManager(scene);
  reverseButton.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPickTrigger,
      () => {
        console.log('[DEBUG] Reverse view button clicked');

        // 180° rotation around vertical axis
        const targetAlpha = camera.alpha + Math.PI;
        animateCamera(camera, targetAlpha, camera.beta, camera.radius, config.animationDuration);
      }
    )
  );

  controls.push({
    name: 'reverse-button',
    type: 'reverse',
    mesh: reverseButton,
    material: reverseMaterial,
    action: (cam) => {
      // Action is handled in click event above
    }
  });

  console.log('[DEBUG] Created', controls.length, 'directional controls');
  return controls;
}

// ============================================================================
// Mini-Cube Menu Creation
// ============================================================================

/**
 * Create mini-cube menu with CAD controls
 */
function createMiniCubeMenu(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  mainCube: BABYLON.Mesh,
  config: Required<EnhancedNavigationCubeConfig>
): MiniCubeMenuItem[] {
  console.log('[DEBUG] Creating mini-cube menu');

  if (!config.showMiniCubeMenu) {
    return [];
  }

  const menuItems: MiniCubeMenuItem[] = [];
  const { size } = config;
  const menuDistance = size * 2;

  // Menu items configuration
  const menuItemsConfig = [
    {
      name: 'orthographic-toggle',
      icon: 'O/P',
      position: [menuDistance, -menuDistance, 0],
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] Orthographic/Perspective toggle clicked');
        // Toggle between orthographic and perspective projection
        // Note: This would require camera type switching in a full implementation
        console.log('[INFO] Camera projection toggle - feature placeholder');
      }
    },
    {
      name: 'isometric-view',
      icon: 'ISO',
      position: [menuDistance * 0.7, -menuDistance * 1.3, 0],
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] Isometric view clicked');
        const targetRadius = calculateOptimalRadius(cam, sc);
        animateCamera(cam, -Math.PI / 4, Math.PI / 3, targetRadius, config.animationDuration);
      }
    },
    {
      name: 'fit-all',
      icon: 'FIT',
      position: [menuDistance * 1.3, -menuDistance * 0.7, 0],
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] Fit all objects clicked');
        zoomToFitAllObjects(cam, sc, config.animationDuration);
      }
    },
    {
      name: 'fit-selection',
      icon: 'SEL',
      position: [menuDistance * 1.3, -menuDistance * 1.3, 0],
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] Fit selection clicked');
        // This would fit selected objects in a full implementation
        console.log('[INFO] Fit selection - feature placeholder');
      }
    }
  ];

  menuItemsConfig.forEach(item => {
    // Create menu item cube
    const menuCube = BABYLON.MeshBuilder.CreateBox(`${item.name}-cube`, {
      size: size * 0.3
    }, scene);

    menuCube.position = new BABYLON.Vector3(...item.position);
    menuCube.parent = mainCube;

    const material = createMaterial(`${item.name}-material`, CAD_COLORS.menu, scene, true);
    menuCube.material = material;

    // Add hover effects
    addHoverEffects(menuCube, material, scene);

    // Add click action
    menuCube.actionManager = new BABYLON.ActionManager(scene);
    menuCube.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => {
          console.log('[DEBUG] Mini-cube menu item clicked:', item.name);
          item.action(camera, scene);
        }
      )
    );

    menuItems.push({
      name: item.name,
      icon: item.icon,
      mesh: menuCube,
      material,
      action: item.action
    });
  });

  console.log('[DEBUG] Created', menuItems.length, 'mini-cube menu items');
  return menuItems;
}

/**
 * Zoom camera to fit all visible objects in scene
 */
function zoomToFitAllObjects(
  camera: BABYLON.ArcRotateCamera,
  scene: BABYLON.Scene,
  duration: number
): void {
  const meshes = scene.meshes.filter(mesh =>
    mesh.isVisible &&
    !mesh.isDisposed &&
    !mesh.name.includes('navigation-cube') &&
    !mesh.name.includes('cad-grid') &&
    !mesh.name.includes('directional-control') &&
    !mesh.name.includes('mini-cube')
  );

  if (meshes.length === 0) {
    console.log('[DEBUG] No meshes to fit');
    return;
  }

  // Calculate scene bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const boundingInfo = mesh.getBoundingInfo();
    if (boundingInfo) {
      const min = boundingInfo.boundingBox.minimum;
      const max = boundingInfo.boundingBox.maximum;

      minX = Math.min(minX, min.x);
      minY = Math.min(minY, min.y);
      minZ = Math.min(minZ, min.z);
      maxX = Math.max(maxX, max.x);
      maxY = Math.max(maxY, max.y);
      maxZ = Math.max(maxZ, max.z);
    }
  }

  // Calculate optimal camera position
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  const targetRadius = Math.max(maxSize * 2.5, 10);
  const targetPosition = new BABYLON.Vector3(centerX, centerY, centerZ);

  // Animate camera to new position
  const frameRate = 60;
  const totalFrames = Math.round(duration * frameRate);
  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

  // Target animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraTarget',
    camera,
    'target',
    frameRate,
    totalFrames,
    camera.getTarget(),
    targetPosition,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );

  // Radius animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cameraRadius',
    camera,
    'radius',
    frameRate,
    totalFrames,
    camera.radius,
    targetRadius,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );

  console.log('[DEBUG] Zoom to fit animation started:', {
    meshCount: meshes.length,
    targetRadius,
    targetPosition: targetPosition.toString()
  });
}

// ============================================================================
// Drag Functionality
// ============================================================================

/**
 * Add drag functionality to make the navigation cube movable
 */
function addDragFunctionality(
  mainCube: BABYLON.Mesh,
  scene: BABYLON.Scene,
  config: Required<EnhancedNavigationCubeConfig>
): void {
  if (!config.movable) {
    return;
  }

  console.log('[DEBUG] Adding drag functionality to navigation cube');

  let isDragging = false;
  let dragStartPosition = BABYLON.Vector3.Zero();
  let cubeStartPosition = BABYLON.Vector3.Zero();

  // Add drag behavior
  mainCube.actionManager = mainCube.actionManager || new BABYLON.ActionManager(scene);

  // Mouse down - start drag
  mainCube.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnPointerDownTrigger,
      (evt) => {
        if (evt.sourceEvent?.button === 0) { // Left mouse button
          isDragging = true;
          dragStartPosition = evt.sourceEvent ?
            new BABYLON.Vector3(evt.sourceEvent.clientX, evt.sourceEvent.clientY, 0) :
            BABYLON.Vector3.Zero();
          cubeStartPosition = mainCube.position.clone();

          console.log('[DEBUG] Started dragging navigation cube');
        }
      }
    )
  );

  // Mouse move - drag
  scene.onPointerObservable.add((pointerInfo) => {
    if (isDragging && pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
      const currentPosition = new BABYLON.Vector3(
        pointerInfo.event.clientX,
        pointerInfo.event.clientY,
        0
      );

      const delta = currentPosition.subtract(dragStartPosition);
      const sensitivity = 0.01;

      mainCube.position.x = cubeStartPosition.x + delta.x * sensitivity;
      mainCube.position.y = cubeStartPosition.y - delta.y * sensitivity; // Invert Y
    }
  });

  // Mouse up - end drag
  scene.onPointerObservable.add((pointerInfo) => {
    if (isDragging && pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
      isDragging = false;
      console.log('[DEBUG] Stopped dragging navigation cube');
    }
  });
}

// ============================================================================
// Main Creation Function
// ============================================================================

/**
 * Create enhanced navigation cube with comprehensive CAD features
 */
export function createEnhancedNavigationCube(
  scene: BABYLON.Scene | null,
  camera: BABYLON.ArcRotateCamera | null,
  userConfig: EnhancedNavigationCubeConfig = {}
): EnhancedNavigationCubeResult {
  console.log('[INIT] Creating enhanced navigation cube system');

  try {
    // Validate inputs
    if (!scene || scene.isDisposed) {
      return { success: false, error: 'Invalid scene provided' };
    }

    if (!camera || camera.isDisposed()) {
      return { success: false, error: 'Invalid camera provided' };
    }

    // Merge configuration
    const config: Required<EnhancedNavigationCubeConfig> = {
      ...DEFAULT_CONFIG,
      ...userConfig
    };

    console.log('[DEBUG] Enhanced navigation cube config:', config);

    // Create main navigation cube with 26 faces
    const { mainCube, faces } = createMainNavigationCube(scene, camera, config);

    // Create directional controls
    const directionalControls = createDirectionalControls(scene, camera, mainCube, config);

    // Create mini-cube menu
    const miniCubeMenu = createMiniCubeMenu(scene, camera, mainCube, config);

    // Position cube in screen space
    const [x, y, z] = config.position;
    mainCube.position = new BABYLON.Vector3(x * 10 - 5, y * 10 - 5, z);

    // Scale cube for UI
    mainCube.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);

    // Add drag functionality
    addDragFunctionality(mainCube, scene, config);

    // Configure mesh properties
    mainCube.isPickable = true;
    mainCube.renderingGroupId = 1; // Render on top

    // Dispose function
    const dispose = () => {
      console.log('[DEBUG] Disposing enhanced navigation cube');

      if (mainCube && !mainCube.isDisposed()) {
        mainCube.dispose();
      }

      faces.forEach(face => {
        if (face.mesh && !face.mesh.isDisposed()) {
          face.mesh.dispose();
        }
        if (face.material && !face.material.isDisposed()) {
          face.material.dispose();
        }
      });

      directionalControls.forEach(control => {
        if (control.mesh && !control.mesh.isDisposed()) {
          control.mesh.dispose();
        }
        if (control.material && !control.material.isDisposed()) {
          control.material.dispose();
        }
      });

      miniCubeMenu.forEach(item => {
        if (item.mesh && !item.mesh.isDisposed()) {
          item.mesh.dispose();
        }
        if (item.material && !item.material.isDisposed()) {
          item.material.dispose();
        }
      });
    };

    console.log('[END] Enhanced navigation cube created successfully');

    return {
      success: true,
      data: {
        mainCube,
        faces,
        directionalControls,
        miniCubeMenu,
        config,
        dispose
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown enhanced navigation cube error';
    console.error('[ERROR] Failed to create enhanced navigation cube:', errorMessage);
    return { success: false, error: `Failed to create enhanced navigation cube: ${errorMessage}` };
  }
}
