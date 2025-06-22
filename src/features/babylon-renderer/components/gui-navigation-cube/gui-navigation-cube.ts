/**
 * @file Professional CAD Navigation Cube - 2D GUI Overlay System
 *
 * Professional CAD-style navigation cube using proper Babylon.js 2D GUI patterns:
 * - AdvancedDynamicTexture.CreateFullscreenUI() for true 2D overlay positioning
 * - Fixed screen-space positioning (top-right corner) independent of camera
 * - Professional CAD navigation patterns matching Fusion 360/SolidWorks/Inventor
 * - Consistent sizing using pixel-based measurements
 * - Proper GUI layering above all 3D scene content
 * - Industry-standard hover states and visual feedback
 *
 * @author OpenSCAD-Babylon Pipeline
 * @version 4.0.0 - Professional 2D GUI Overlay Implementation
 */

import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Professional CAD navigation cube configuration for 2D GUI overlay
 */
export interface CADNavigationCubeConfig {
  /** Navigation cube size in pixels (default: 120) */
  readonly cubeSize?: number;
  /** Margin from screen edges in pixels (default: 20) */
  readonly marginPixels?: number;
  /** Enable directional arrows around cube (default: true) */
  readonly showDirectionalControls?: boolean;
  /** Enable mini-cube menu below main cube (default: true) */
  readonly showMiniCubeMenu?: boolean;
  /** Camera animation duration in seconds (default: 0.8) */
  readonly animationDuration?: number;
  /** Corner position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' (default: 'top-right') */
  readonly cornerPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Face button size in pixels (default: 35) */
  readonly faceButtonSize?: number;
  /** Control button size in pixels (default: 25) */
  readonly controlButtonSize?: number;
}

/**
 * CAD navigation cube face button (2D GUI)
 */
export interface CADFaceButton {
  readonly name: string;
  readonly type: 'main' | 'edge' | 'corner';
  readonly button: GUI.Button;
  readonly cameraView: {
    readonly alpha: number;
    readonly beta: number;
    readonly radius?: number;
  };
}

/**
 * CAD directional control button (2D GUI)
 */
export interface CADDirectionalControl {
  readonly name: string;
  readonly type: 'triangular' | 'curved' | 'reverse';
  readonly button: GUI.Button;
  readonly action: (camera: BABYLON.ArcRotateCamera) => void;
}

/**
 * CAD mini-cube menu item (2D GUI)
 */
export interface CADMiniCubeMenuItem {
  readonly name: string;
  readonly label: string;
  readonly button: GUI.Button;
  readonly action: (camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene) => void;
}

/**
 * Professional CAD navigation cube data (2D GUI overlay)
 */
export interface CADNavigationCubeData {
  readonly overlayTexture: GUI.AdvancedDynamicTexture;
  readonly mainContainer: GUI.StackPanel;
  readonly cubeContainer: GUI.Grid;
  readonly faceButtons: readonly CADFaceButton[];
  readonly directionalControls: readonly CADDirectionalControl[];
  readonly miniCubeMenu: readonly CADMiniCubeMenuItem[];
  readonly config: Required<CADNavigationCubeConfig>;
  readonly dispose: () => void;
}

/**
 * Result type for CAD navigation cube operations
 */
export type CADNavigationCubeResult =
  | { readonly success: true; readonly data: CADNavigationCubeData }
  | { readonly success: false; readonly error: string };

// ============================================================================
// Default Configuration - Professional CAD Standards
// ============================================================================

const DEFAULT_CAD_CONFIG: Required<CADNavigationCubeConfig> = {
  cubeSize: 120,                    // Professional CAD cube size in pixels
  marginPixels: 20,                 // Standard margin from screen edges
  showDirectionalControls: true,    // Enable directional arrows
  showMiniCubeMenu: true,          // Enable mini-cube menu
  animationDuration: 0.8,          // Smooth professional animations
  cornerPosition: 'top-right',     // Industry standard position
  faceButtonSize: 35,              // Optimal face button size for clicking
  controlButtonSize: 25            // Optimal control button size
} as const;

// ============================================================================
// Face Definitions
// ============================================================================

/**
 * Professional CAD view definitions for 2D navigation cube
 * Based on industry standards from Fusion 360, SolidWorks, and Inventor
 */
const CAD_FACE_DEFINITIONS: Record<string, {
  type: 'main' | 'edge' | 'corner';
  alpha: number;
  beta: number;
  label: string;
  color: string;
  gridRow: number;
  gridColumn: number;
}> = {
  // 6 Main faces arranged in professional CAD cube layout
  'front': { type: 'main', alpha: 0, beta: Math.PI / 2, label: 'F', color: '#4CAF50', gridRow: 1, gridColumn: 1 },
  'back': { type: 'main', alpha: Math.PI, beta: Math.PI / 2, label: 'B', color: '#F44336', gridRow: 1, gridColumn: 3 },
  'left': { type: 'main', alpha: -Math.PI / 2, beta: Math.PI / 2, label: 'L', color: '#2196F3', gridRow: 1, gridColumn: 0 },
  'right': { type: 'main', alpha: Math.PI / 2, beta: Math.PI / 2, label: 'R', color: '#FF9800', gridRow: 1, gridColumn: 2 },
  'top': { type: 'main', alpha: 0, beta: 0.1, label: 'T', color: '#9C27B0', gridRow: 0, gridColumn: 1 },
  'bottom': { type: 'main', alpha: 0, beta: Math.PI - 0.1, label: 'B', color: '#607D8B', gridRow: 2, gridColumn: 1 },

  // 4 Corner faces for isometric views (professional CAD standard)
  'front-left-top': { type: 'corner', alpha: -Math.PI / 4, beta: Math.PI / 4, label: '↖', color: '#BDBDBD', gridRow: 0, gridColumn: 0 },
  'front-right-top': { type: 'corner', alpha: Math.PI / 4, beta: Math.PI / 4, label: '↗', color: '#BDBDBD', gridRow: 0, gridColumn: 2 },
  'back-left-bottom': { type: 'corner', alpha: -3 * Math.PI / 4, beta: 3 * Math.PI / 4, label: '↙', color: '#BDBDBD', gridRow: 2, gridColumn: 0 },
  'back-right-bottom': { type: 'corner', alpha: 3 * Math.PI / 4, beta: 3 * Math.PI / 4, label: '↘', color: '#BDBDBD', gridRow: 2, gridColumn: 2 }
} as const;

// ============================================================================
// Professional CAD Camera Animation Functions
// ============================================================================

/**
 * Create smooth professional CAD camera animation
 * Matches industry-standard camera transitions from Fusion 360/SolidWorks
 */
function animateCADCamera(
  camera: BABYLON.ArcRotateCamera,
  targetAlpha: number,
  targetBeta: number,
  targetRadius: number,
  duration: number
): void {
  const scene = camera.getScene();
  const frameRate = 60;
  const totalFrames = Math.round(duration * frameRate);

  // Professional CAD easing - smooth and predictable
  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

  // Alpha animation (horizontal rotation)
  BABYLON.Animation.CreateAndStartAnimation(
    'cadCameraAlpha',
    camera,
    'alpha',
    frameRate,
    totalFrames,
    camera.alpha,
    targetAlpha,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );

  // Beta animation (vertical rotation)
  BABYLON.Animation.CreateAndStartAnimation(
    'cadCameraBeta',
    camera,
    'beta',
    frameRate,
    totalFrames,
    camera.beta,
    targetBeta,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );

  // Radius animation (zoom level)
  if (Math.abs(camera.radius - targetRadius) > 0.1) {
    BABYLON.Animation.CreateAndStartAnimation(
      'cadCameraRadius',
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
 * Calculate optimal camera radius for professional CAD framing
 * Uses industry-standard framing algorithms similar to CAD software
 */
function calculateCADOptimalRadius(camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene): number {
  const meshes = scene.meshes.filter(mesh =>
    mesh.isVisible &&
    !mesh.isDisposed &&
    !mesh.name.includes('cad-navigation') &&
    !mesh.name.includes('cad-grid') &&
    !mesh.name.includes('navigation-cube') &&
    !mesh.name.includes('gui-')
  );

  if (meshes.length === 0) {
    return camera.radius; // Keep current radius if no meshes
  }

  // Calculate scene bounds using professional CAD algorithms
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

  // Professional CAD framing - ensure all objects are visible with comfortable margin
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  // CAD-standard framing factor (2.5x for comfortable viewing)
  return Math.max(maxSize * 2.5, 10);
}

// ============================================================================
// Professional 2D GUI Button Creation Functions
// ============================================================================

/**
 * Create professional CAD face button using 2D GUI
 * Matches industry-standard CAD navigation button styling
 */
function createCADFaceButton(
  name: string,
  label: string,
  color: string,
  size: number
): GUI.Button {
  const button = GUI.Button.CreateSimpleButton(name, label);

  // Professional CAD button styling
  button.widthInPixels = size;
  button.heightInPixels = size;
  button.color = 'white';
  button.background = color;
  button.cornerRadius = 4;
  button.thickness = 2;

  // Professional typography
  button.fontSize = Math.max(12, size / 3);
  button.fontFamily = 'Segoe UI, Arial, sans-serif';
  button.fontWeight = 'bold';

  // Professional hover and press states
  button.hoverColor = '#FFEB3B';           // CAD-standard yellow hover
  button.pressedColor = '#FF5722';         // CAD-standard orange pressed
  button.shadowColor = 'rgba(0,0,0,0.3)';
  button.shadowOffsetX = 1;
  button.shadowOffsetY = 1;
  button.shadowBlur = 2;

  return button;
}

/**
 * Create professional CAD directional control button
 * Smaller size for directional arrows and controls
 */
function createCADControlButton(
  name: string,
  label: string,
  size: number
): GUI.Button {
  const button = GUI.Button.CreateSimpleButton(name, label);

  // Control button styling (smaller, more subtle)
  button.widthInPixels = size;
  button.heightInPixels = size;
  button.color = 'white';
  button.background = 'rgba(55, 71, 79, 0.8)';  // Semi-transparent dark blue grey
  button.cornerRadius = 3;
  button.thickness = 1;

  // Control typography
  button.fontSize = Math.max(10, size / 2.5);
  button.fontFamily = 'Segoe UI, Arial, sans-serif';
  button.fontWeight = 'bold';

  // Subtle hover states for controls
  button.hoverColor = '#FFEB3B';
  button.pressedColor = '#FFC107';
  button.shadowColor = 'rgba(0,0,0,0.2)';
  button.shadowOffsetX = 1;
  button.shadowOffsetY = 1;
  button.shadowBlur = 1;

  return button;
}

/**
 * Create professional CAD menu button
 * For mini-cube menu items
 */
function createCADMenuButton(
  name: string,
  label: string,
  width: number,
  height: number
): GUI.Button {
  const button = GUI.Button.CreateSimpleButton(name, label);

  // Menu button styling
  button.widthInPixels = width;
  button.heightInPixels = height;
  button.color = 'white';
  button.background = 'rgba(76, 175, 80, 0.8)';  // Semi-transparent green
  button.cornerRadius = 3;
  button.thickness = 1;

  // Menu typography
  button.fontSize = 11;
  button.fontFamily = 'Segoe UI, Arial, sans-serif';
  button.fontWeight = '500';

  // Menu hover states
  button.hoverColor = '#FFEB3B';
  button.pressedColor = '#4CAF50';

  return button;
}

// ============================================================================
// Professional 2D CAD Navigation Cube Creation
// ============================================================================

/**
 * Create professional CAD navigation cube using 2D GUI overlay
 * Positioned as fixed screen-space overlay (top-right corner)
 * Independent of camera transformations - true viewport control
 */
function createCADNavigationCubeInternal(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  config: Required<CADNavigationCubeConfig>
): {
  overlayTexture: GUI.AdvancedDynamicTexture;
  mainContainer: GUI.StackPanel;
  cubeContainer: GUI.Grid;
  faceButtons: CADFaceButton[]
} {
  console.log('[DEBUG] Creating professional 2D CAD navigation cube');

  // Create fullscreen UI overlay - this is the key to proper 2D positioning
  const overlayTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('cad-navigation-overlay');

  // Create main container positioned in corner
  const mainContainer = new GUI.StackPanel();
  mainContainer.widthInPixels = config.cubeSize + (config.marginPixels * 2);
  mainContainer.heightInPixels = config.cubeSize + (config.marginPixels * 2);

  // Professional CAD positioning - fixed screen-space corner
  switch (config.cornerPosition) {
    case 'top-right':
      mainContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      mainContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      break;
    case 'top-left':
      mainContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      mainContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
      break;
    case 'bottom-right':
      mainContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
      mainContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      break;
    case 'bottom-left':
      mainContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
      mainContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
      break;
  }

  // Set margins from screen edges
  mainContainer.paddingRightInPixels = config.marginPixels;
  mainContainer.paddingTopInPixels = config.marginPixels;
  mainContainer.paddingLeftInPixels = config.marginPixels;
  mainContainer.paddingBottomInPixels = config.marginPixels;

  // Professional CAD styling
  mainContainer.background = 'rgba(55, 71, 79, 0.1)';  // Subtle background
  mainContainer.cornerRadius = 8;

  overlayTexture.addControl(mainContainer);

  // Create 3x3 grid for navigation cube faces (professional CAD layout)
  const cubeContainer = new GUI.Grid();
  cubeContainer.widthInPixels = config.cubeSize;
  cubeContainer.heightInPixels = config.cubeSize;

  // Define 3x3 grid for professional CAD cube layout
  for (let i = 0; i < 3; i++) {
    cubeContainer.addRowDefinition(1/3);
    cubeContainer.addColumnDefinition(1/3);
  }

  mainContainer.addControl(cubeContainer);

  const faceButtons: CADFaceButton[] = [];

  // Create face buttons using professional CAD layout
  Object.entries(CAD_FACE_DEFINITIONS).forEach(([faceName, faceData]) => {
    const { type, alpha, beta, label, color, gridRow, gridColumn } = faceData;

    // Create professional CAD face button
    const button = createCADFaceButton(
      `cad-${faceName}-button`,
      label,
      color,
      config.faceButtonSize
    );

    // Add to grid at specified position
    cubeContainer.addControl(button, gridRow, gridColumn);

    // Add professional CAD click handler
    button.onPointerUpObservable.add(() => {
      console.log('[DEBUG] CAD navigation cube face clicked:', faceName);

      // Calculate optimal radius using CAD algorithms
      const targetRadius = calculateCADOptimalRadius(camera, scene);

      // Animate to view with professional CAD timing
      animateCADCamera(camera, alpha, beta, targetRadius, config.animationDuration);
    });

    // Professional hover feedback
    button.onPointerEnterObservable.add(() => {
      console.log('[DEBUG] CAD face button hover:', faceName);
    });

    faceButtons.push({
      name: faceName,
      type,
      button,
      cameraView: { alpha, beta }
    });
  });

  console.log('[DEBUG] Created professional CAD navigation cube with', faceButtons.length, 'face buttons');
  return { overlayTexture, mainContainer, cubeContainer, faceButtons };
}

/**
 * Create professional CAD directional controls using 2D GUI
 * Positioned around the main navigation cube for fine camera control
 */
function createCADDirectionalControls(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  mainContainer: GUI.StackPanel,
  config: Required<CADNavigationCubeConfig>
): CADDirectionalControl[] {
  console.log('[DEBUG] Creating professional CAD directional controls');

  if (!config.showDirectionalControls) {
    return [];
  }

  const controls: CADDirectionalControl[] = [];

  // Create directional controls container positioned around the cube
  const controlsContainer = new GUI.StackPanel();
  controlsContainer.isVertical = false;
  controlsContainer.widthInPixels = config.cubeSize + 60; // Extra space for controls
  controlsContainer.heightInPixels = config.controlButtonSize;

  mainContainer.addControl(controlsContainer);

  // Professional CAD directional controls
  const directionalControls = [
    { name: 'rotate-left', label: '↺', action: () => { camera.alpha -= Math.PI / 6; } },
    { name: 'rotate-up', label: '↑', action: () => { camera.beta = Math.max(0.1, camera.beta - Math.PI / 6); } },
    { name: 'rotate-down', label: '↓', action: () => { camera.beta = Math.min(Math.PI - 0.1, camera.beta + Math.PI / 6); } },
    { name: 'rotate-right', label: '↻', action: () => { camera.alpha += Math.PI / 6; } },
    { name: 'reverse-view', label: '⟲', action: () => {
      const targetAlpha = camera.alpha + Math.PI;
      animateCADCamera(camera, targetAlpha, camera.beta, camera.radius, config.animationDuration);
    }}
  ];

  directionalControls.forEach(control => {
    const button = createCADControlButton(
      `cad-${control.name}`,
      control.label,
      config.controlButtonSize
    );

    // Add to controls container
    controlsContainer.addControl(button);

    // Add click action
    button.onPointerUpObservable.add(() => {
      console.log('[DEBUG] CAD directional control clicked:', control.name);
      control.action();
    });

    controls.push({
      name: control.name,
      type: control.name.includes('rotate') ? 'triangular' : 'reverse',
      button,
      action: control.action
    });
  });

  console.log('[DEBUG] Created', controls.length, 'CAD directional controls');
  return controls;
}

/**
 * Create professional CAD mini-cube menu using 2D GUI
 * Positioned below the main navigation cube for advanced features
 */
function createCADMiniCubeMenu(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  mainContainer: GUI.StackPanel,
  config: Required<CADNavigationCubeConfig>
): CADMiniCubeMenuItem[] {
  console.log('[DEBUG] Creating professional CAD mini-cube menu');

  if (!config.showMiniCubeMenu) {
    return [];
  }

  const menuItems: CADMiniCubeMenuItem[] = [];

  // Create menu container
  const menuContainer = new GUI.StackPanel();
  menuContainer.isVertical = true;
  menuContainer.widthInPixels = config.cubeSize;
  menuContainer.heightInPixels = 120; // Space for 4 menu items
  menuContainer.spacing = 2;

  mainContainer.addControl(menuContainer);

  // Professional CAD menu items (industry standard)
  const menuDefinitions = [
    {
      name: 'orthographic-toggle',
      label: 'O/P',
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] CAD Orthographic/Perspective toggle');
        // Toggle between orthographic and perspective projection
        // This would be implemented with proper camera mode switching
        console.log('[INFO] Camera projection toggle - feature placeholder');
      }
    },
    {
      name: 'isometric-view',
      label: 'ISO',
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] CAD Isometric view');
        const targetRadius = calculateCADOptimalRadius(cam, sc);
        animateCADCamera(cam, -Math.PI / 4, Math.PI / 3, targetRadius, config.animationDuration);
      }
    },
    {
      name: 'fit-all',
      label: 'FIT',
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] CAD Fit all objects');
        zoomToFitAllCADObjects(cam, sc, config.animationDuration);
      }
    },
    {
      name: 'fit-selection',
      label: 'SEL',
      action: (cam: BABYLON.ArcRotateCamera, sc: BABYLON.Scene) => {
        console.log('[DEBUG] CAD Fit selection');
        // This would fit selected objects in a full implementation
        console.log('[INFO] Fit selection - feature placeholder');
      }
    }
  ];

  menuDefinitions.forEach(menuDef => {
    const button = createCADMenuButton(
      `cad-menu-${menuDef.name}`,
      menuDef.label,
      config.cubeSize - 10, // Slightly smaller than cube
      25 // Standard menu button height
    );

    // Add to menu container
    menuContainer.addControl(button);

    // Add click action
    button.onPointerUpObservable.add(() => {
      console.log('[DEBUG] CAD menu item clicked:', menuDef.name);
      menuDef.action(camera, scene);
    });

    menuItems.push({
      name: menuDef.name,
      label: menuDef.label,
      button,
      action: menuDef.action
    });
  });

  console.log('[DEBUG] Created', menuItems.length, 'CAD mini-cube menu items');
  return menuItems;
}

/**
 * Professional CAD zoom-to-fit function for all visible objects
 * Uses industry-standard framing algorithms
 */
function zoomToFitAllCADObjects(
  camera: BABYLON.ArcRotateCamera,
  scene: BABYLON.Scene,
  duration: number
): void {
  const meshes = scene.meshes.filter(mesh =>
    mesh.isVisible &&
    !mesh.isDisposed &&
    !mesh.name.includes('cad-navigation') &&
    !mesh.name.includes('cad-grid') &&
    !mesh.name.includes('navigation-cube') &&
    !mesh.name.includes('gui-')
  );

  if (meshes.length === 0) {
    console.log('[DEBUG] No meshes to fit');
    return;
  }

  // Calculate scene bounds using professional CAD algorithms
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

  // Professional CAD framing - center on scene bounds
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  // CAD-standard framing with comfortable margin
  const targetRadius = Math.max(maxSize * 2.5, 10);
  const targetPosition = new BABYLON.Vector3(centerX, centerY, centerZ);

  // Professional CAD animation timing
  const frameRate = 60;
  const totalFrames = Math.round(duration * frameRate);
  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

  // Target animation
  BABYLON.Animation.CreateAndStartAnimation(
    'cadCameraTarget',
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
    'cadCameraRadius',
    camera,
    'radius',
    frameRate,
    totalFrames,
    camera.radius,
    targetRadius,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
    easing
  );

  console.log('[DEBUG] CAD zoom to fit animation started:', {
    meshCount: meshes.length,
    targetRadius,
    targetPosition: targetPosition.toString()
  });
}

// ============================================================================
// Main Professional CAD Navigation Cube Creation Function
// ============================================================================

/**
 * Create professional CAD navigation cube using 2D GUI overlay system
 *
 * This is the main entry point for creating a professional CAD-style navigation cube
 * using proper Babylon.js 2D GUI patterns including:
 * - AdvancedDynamicTexture.CreateFullscreenUI() for true 2D overlay positioning
 * - Fixed screen-space positioning (top-right corner) independent of camera
 * - Professional CAD navigation patterns matching industry standards
 * - Consistent pixel-based sizing and positioning
 * - Proper GUI layering above all 3D scene content
 *
 * @param scene - Babylon.js scene
 * @param camera - ArcRotateCamera for navigation
 * @param config - Optional configuration (uses defaults if not provided)
 * @returns Result with CAD navigation cube data or error
 */
export function createCADNavigationCube(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  config: Partial<CADNavigationCubeConfig> = {}
): CADNavigationCubeResult {
  try {
    console.log('[INIT] Creating professional CAD navigation cube system');

    // Validate inputs
    if (!scene || scene.isDisposed) {
      return { success: false, error: 'Invalid or disposed scene provided' };
    }

    if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) {
      return { success: false, error: 'Valid ArcRotateCamera required' };
    }

    // Merge with default configuration
    const finalConfig: Required<CADNavigationCubeConfig> = {
      ...DEFAULT_CAD_CONFIG,
      ...config
    };

    console.log('[DEBUG] CAD navigation cube config:', finalConfig);

    // Create main CAD navigation cube (2D GUI overlay)
    const { overlayTexture, mainContainer, cubeContainer, faceButtons } = createCADNavigationCubeInternal(
      scene,
      camera,
      finalConfig
    );

    // Create directional controls (2D GUI)
    const directionalControls = createCADDirectionalControls(
      scene,
      camera,
      mainContainer,
      finalConfig
    );

    // Create mini-cube menu (2D GUI)
    const miniCubeMenu = createCADMiniCubeMenu(
      scene,
      camera,
      mainContainer,
      finalConfig
    );

    // Create disposal function
    const dispose = () => {
      console.log('[DEBUG] Disposing CAD navigation cube');

      // Dispose 2D GUI elements
      faceButtons.forEach(faceButton => {
        if (faceButton.button && !faceButton.button.isDisposed) {
          faceButton.button.dispose();
        }
      });

      directionalControls.forEach(control => {
        if (control.button && !control.button.isDisposed) {
          control.button.dispose();
        }
      });

      miniCubeMenu.forEach(menuItem => {
        if (menuItem.button && !menuItem.button.isDisposed) {
          menuItem.button.dispose();
        }
      });

      if (cubeContainer && !cubeContainer.isDisposed) {
        cubeContainer.dispose();
      }

      if (mainContainer && !mainContainer.isDisposed) {
        mainContainer.dispose();
      }

      if (overlayTexture && !overlayTexture.isDisposed) {
        overlayTexture.dispose();
      }

      console.log('[DEBUG] CAD navigation cube disposed');
    };

    // Create result data
    const cadNavigationCubeData: CADNavigationCubeData = {
      overlayTexture,
      mainContainer,
      cubeContainer,
      faceButtons,
      directionalControls,
      miniCubeMenu,
      config: finalConfig,
      dispose
    };

    console.log('[DEBUG] CAD navigation cube created successfully:', {
      faceButtons: faceButtons.length,
      directionalControls: directionalControls.length,
      miniCubeMenu: miniCubeMenu.length,
      position: finalConfig.cornerPosition
    });

    return { success: true, data: cadNavigationCubeData };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating CAD navigation cube';
    console.error('[ERROR] Failed to create CAD navigation cube:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Enhanced CAD Navigation Cube (Fallback Compatible)
// ============================================================================

/**
 * Create enhanced CAD navigation cube with fallback to mesh-based version
 *
 * This function attempts to create the professional 2D GUI-based navigation cube,
 * but can fall back to mesh-based versions if GUI creation fails.
 *
 * @param scene - Babylon.js scene
 * @param camera - ArcRotateCamera for navigation
 * @param config - Optional configuration
 * @returns Result with navigation cube data or error
 */
export function createEnhancedCADNavigationCube(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  config: Partial<CADNavigationCubeConfig> = {}
): CADNavigationCubeResult {
  console.log('[INIT] Creating enhanced CAD navigation cube with fallback');

  // Try to create professional 2D GUI-based navigation cube
  const cadResult = createCADNavigationCube(scene, camera, config);

  if (cadResult.success) {
    console.log('[DEBUG] Professional CAD navigation cube created successfully');
    return cadResult;
  }

  // If GUI creation fails, log the error and provide fallback information
  console.warn('[WARN] CAD navigation cube creation failed, fallback needed:', cadResult.error);

  // In a full implementation, this would create a mesh-based fallback
  // For now, return the error to indicate proper GUI is required
  return {
    success: false,
    error: `Professional CAD navigation cube creation failed: ${cadResult.error}. Consider using mesh-based fallback implementation.`
  };
}

// ============================================================================
// Legacy Compatibility Functions
// ============================================================================

/**
 * Legacy function name for backward compatibility
 * @deprecated Use createEnhancedCADNavigationCube instead
 */
export function createEnhancedGUINavigationCube(
  scene: BABYLON.Scene,
  camera: BABYLON.ArcRotateCamera,
  config: Partial<CADNavigationCubeConfig> = {}
): CADNavigationCubeResult {
  console.warn('[WARN] createEnhancedGUINavigationCube is deprecated. Use createEnhancedCADNavigationCube instead.');
  return createEnhancedCADNavigationCube(scene, camera, config);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  CADNavigationCubeConfig,
  CADFaceButton,
  CADDirectionalControl,
  CADMiniCubeMenuItem,
  CADNavigationCubeData,
  CADNavigationCubeResult
};

export {
  DEFAULT_CAD_CONFIG as CAD_NAVIGATION_CUBE_DEFAULT_CONFIG,
  CAD_FACE_DEFINITIONS
};
