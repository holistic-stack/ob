/**
 * @file OpenSCAD Workflow Test Scene Component
 *
 * Visual testing component that follows the complete OpenSCAD rendering workflow:
 * 1. OpenSCAD Code Input → 2. AST Parsing → 3. Skip Zustand Store →
 * 4. Manifold Operations Layer → 5. BabylonJS Rendering → 6. Visual Regression
 *
 * This component uses real OpenSCAD code strings, actual parser, and the complete
 * rendering pipeline for authentic visual regression testing.
 *
 * @example
 * ```tsx
 * <OpenSCADWorkflowTestScene
 *   openscadCode="circle(r=10);"
 *   cameraAngle="isometric"
 *   showOrientationGizmo={true}
 * />
 * ```
 */

import {
  type AbstractMesh,
  type ArcRotateCamera,
  type Scene as BabylonSceneType,
  Color3,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import * as React from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import {
  BabylonScene,
  type BabylonSceneProps,
} from '../../../babylon-renderer/components/babylon-scene/babylon-scene';
import { OrientationGizmo } from '../../../babylon-renderer/components/orientation-gizmo/orientation-gizmo';
import { ASTBridgeConverter } from '../../../babylon-renderer/services/ast-bridge-converter';
import { OpenscadParser } from '../../../openscad-parser';
import { useAppStore } from '../../../store';
import type { CameraAngle } from '../../types/visual-testing.types';

const logger = createLogger('OpenSCADWorkflowTestScene');

/**
 * Props for OpenSCADWorkflowTestScene component
 */
export interface OpenSCADWorkflowTestSceneProps {
  /** OpenSCAD code string to parse and render */
  readonly openscadCode: string;
  /** Camera angle for the scene */
  readonly cameraAngle: CameraAngle;
  /** Show orientation gizmo (default: true) */
  readonly showOrientationGizmo?: boolean;
  /** Show 3D axis overlay (default: false for 2D primitive tests) */
  readonly show3DAxis?: boolean;
  /** Enable inspector (default: false) */
  readonly enableInspector?: boolean;
  /** Background color (default: white for 2D primitive tests) */
  readonly backgroundColor?: Color3;
  /** Auto-center camera on shape (default: true) */
  readonly autoCenterCamera?: boolean;
  /** Enable console and network logging (default: true) */
  readonly enableLogging?: boolean;
  /** Callback when scene is ready */
  readonly onSceneReady?: (scene: BabylonSceneType) => void;
  /** Additional CSS class name */
  readonly className?: string;
  /** Additional inline styles */
  readonly style?: React.CSSProperties;
}

/**
 * OpenSCAD Workflow Test Scene Component
 *
 * Implements the complete OpenSCAD rendering pipeline for visual regression testing.
 * Uses existing BabylonScene and OrientationGizmo components with configuration options.
 */
export const OpenSCADWorkflowTestScene: React.FC<OpenSCADWorkflowTestSceneProps> = ({
  openscadCode,
  cameraAngle,
  showOrientationGizmo = true,
  show3DAxis = false,
  enableInspector = false,
  backgroundColor = new Color3(1.0, 1.0, 1.0), // White background for 2D primitive tests
  autoCenterCamera = true,
  enableLogging = true,
  onSceneReady,
  className,
  style,
}) => {
  const parserRef = React.useRef<OpenscadParser | null>(null);
  const converterRef = React.useRef<ASTBridgeConverter | null>(null);
  const [scene, setScene] = React.useState<BabylonSceneType | null>(null);
  const [camera, setCamera] = React.useState<ArcRotateCamera | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [consoleMessages, setConsoleMessages] = React.useState<string[]>([]);
  const [networkRequests, setNetworkRequests] = React.useState<string[]>([]);

  // Zustand store actions for axis overlay control
  const setAxisOverlayVisibility = useAppStore((state) => state.setAxisOverlayVisibility);

  /**
   * Setup console and network logging if enabled
   */
  React.useEffect(() => {
    if (!enableLogging) return;

    // Capture console messages
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      const message = `[LOG] ${args.join(' ')}`;
      setConsoleMessages(prev => [...prev, message]);
      originalConsoleLog(...args);
    };

    console.warn = (...args) => {
      const message = `[WARN] ${args.join(' ')}`;
      setConsoleMessages(prev => [...prev, message]);
      originalConsoleWarn(...args);
    };

    console.error = (...args) => {
      const message = `[ERROR] ${args.join(' ')}`;
      setConsoleMessages(prev => [...prev, message]);
      originalConsoleError(...args);
    };

    // Log initial setup
    logger.info('[LOGGING] Console and network logging enabled for visual test');

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, [enableLogging]);

  /**
   * Get camera configuration based on angle with auto-centering support
   */
  const getCameraConfig = React.useCallback(() => {
    const baseConfig = {
      type: 'arcRotate' as const,
      target: new Vector3(0, 0, 0),
      fov: Math.PI / 3,
      minZ: 0.1,
      maxZ: 1000,
      enableAutoFrame: autoCenterCamera,
    };

    switch (cameraAngle) {
      case 'front':
        return { ...baseConfig, position: new Vector3(0, 0, 50), alpha: 0, beta: Math.PI / 2 };
      case 'top':
        return { ...baseConfig, position: new Vector3(0, 50, 0), alpha: 0, beta: 0 };
      case 'side':
        return {
          ...baseConfig,
          position: new Vector3(50, 0, 0),
          alpha: Math.PI / 2,
          beta: Math.PI / 2,
        };
      case 'back':
        return { ...baseConfig, position: new Vector3(0, 0, -50), alpha: Math.PI, beta: Math.PI / 2 };
      case 'isometric':
      default:
        return {
          ...baseConfig,
          position: new Vector3(35, 35, 35),
          alpha: Math.PI / 4,
          beta: Math.PI / 3,
        };
    }
  }, [cameraAngle, autoCenterCamera]);



  /**
   * Handle scene ready - parse OpenSCAD and render
   */
  const handleSceneReady = React.useCallback(
    async (babylonScene: BabylonSceneType) => {
      try {
        logger.init('[INIT][OpenSCADWorkflowTestScene] Scene ready, starting OpenSCAD workflow');

        setScene(babylonScene);

        // Get camera from scene
        const sceneCamera = babylonScene.activeCamera as ArcRotateCamera;
        setCamera(sceneCamera);

        // Configure 3D axis overlay visibility based on props
        setAxisOverlayVisibility(show3DAxis);

        // Set data-ready attribute on canvas for visual testing
        const renderCanvas = babylonScene.getEngine().getRenderingCanvas();
        if (renderCanvas) {
          renderCanvas.setAttribute('data-ready', 'false');
        }

        // Step 1: Initialize OpenSCAD Parser
        const parser = new OpenscadParser();
        await parser.init();
        parserRef.current = parser;

        // Step 2: Parse OpenSCAD Code
        const parseResult = parser.parseASTWithResult(openscadCode);
        if (!parseResult.success) {
          throw new Error(`Failed to parse OpenSCAD code: ${parseResult.error}`);
        }

        const ast = parseResult.data;
        logger.debug('[DEBUG][OpenSCADWorkflowTestScene] OpenSCAD code parsed successfully');

        // Step 3: Initialize AST Bridge Converter
        const converter = new ASTBridgeConverter();
        const initResult = await converter.initialize(babylonScene);
        if (!initResult.success) {
          const errorMsg = initResult.error?.message || String(initResult.error) || 'Unknown error';
          throw new Error(`Failed to initialize converter: ${errorMsg}`);
        }

        converterRef.current = converter;

        // Step 4: Convert AST to BabylonJS Meshes
        const conversionResult = await converter.convertAST(ast);
        if (!conversionResult.success) {
          const errorMsg = conversionResult.success === false
            ? (conversionResult.error?.message || String(conversionResult.error) || 'Unknown error')
            : 'Unknown error';
          throw new Error(`Failed to convert AST: ${errorMsg}`);
        }

        const babylonNodes = conversionResult.data;
        logger.debug(
          `[DEBUG][OpenSCADWorkflowTestScene] Created ${babylonNodes.length} nodes from AST`
        );

        // Generate meshes from nodes and apply blue material
        const generatedMeshes: AbstractMesh[] = [];
        for (let index = 0; index < babylonNodes.length; index++) {
          const babylonNode = babylonNodes[index];
          const meshResult = await babylonNode.generateMesh();
          if (meshResult.success) {
            const mesh = meshResult.data;

            // Apply blue material for better visibility against white background
            const material = new StandardMaterial(
              `openscad_primitive_material_${index}`,
              babylonScene
            );
            material.diffuseColor = new Color3(0.2, 0.6, 0.9); // Nice blue color
            material.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for matte finish
            material.roughness = 0.8; // Slightly rough surface
            mesh.material = material;

            generatedMeshes.push(mesh);

            logger.debug(
              `[DEBUG][OpenSCADWorkflowTestScene] Mesh ${index} generated with blue material`
            );
          } else {
            const errorMsg = meshResult.success === false
              ? (meshResult.error?.message || String(meshResult.error) || 'Unknown error')
              : 'Unknown error';
            logger.error(
              `[ERROR][OpenSCADWorkflowTestScene] Failed to generate mesh ${index}: ${errorMsg}`
            );
          }
        }

        // Auto-center camera on generated meshes if enabled
        if (autoCenterCamera && generatedMeshes.length > 0 && sceneCamera) {
          try {
            // Calculate bounding box of all meshes
            let minX = Number.POSITIVE_INFINITY;
            let maxX = Number.NEGATIVE_INFINITY;
            let minY = Number.POSITIVE_INFINITY;
            let maxY = Number.NEGATIVE_INFINITY;
            let minZ = Number.POSITIVE_INFINITY;
            let maxZ = Number.NEGATIVE_INFINITY;

            for (const mesh of generatedMeshes) {
              const boundingInfo = mesh.getBoundingInfo();
              const min = boundingInfo.minimum;
              const max = boundingInfo.maximum;

              minX = Math.min(minX, min.x);
              maxX = Math.max(maxX, max.x);
              minY = Math.min(minY, min.y);
              maxY = Math.max(maxY, max.y);
              minZ = Math.min(minZ, min.z);
              maxZ = Math.max(maxZ, max.z);
            }

            // Calculate center and size
            const center = new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
            const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);

            // Update camera target to center of meshes
            sceneCamera.setTarget(center);

            // Adjust camera distance based on size with conservative margin
            const distance = Math.max(size * 3, 30); // Conservative distance with 3x margin
            sceneCamera.radius = distance;

            logger.debug(
              `[DEBUG][OpenSCADWorkflowTestScene] Camera auto-centered on meshes: center=${center.toString()}, distance=${distance}`
            );
          } catch (error) {
            logger.warn(
              `[WARN][OpenSCADWorkflowTestScene] Failed to auto-center camera: ${error}`
            );
          }
        }

        // Mark as ready
        setIsReady(true);

        // Set data-ready attribute to true for visual testing
        const readyCanvas = babylonScene.getEngine().getRenderingCanvas();
        if (readyCanvas) {
          readyCanvas.setAttribute('data-ready', 'true');
        }

        onSceneReady?.(babylonScene);

        logger.debug('[DEBUG][OpenSCADWorkflowTestScene] Workflow completed successfully');
      } catch (error) {
        logger.error('[ERROR][OpenSCADWorkflowTestScene] Failed to initialize workflow:', error);
      }
    },
    [openscadCode, onSceneReady, autoCenterCamera, show3DAxis, setAxisOverlayVisibility, cameraAngle]
  );

  /**
   * Cleanup resources on unmount
   */
  React.useEffect(() => {
    return () => {
      logger.end('[END][OpenSCADWorkflowTestScene] Cleaning up workflow resources');

      // Cleanup converter
      if (converterRef.current) {
        converterRef.current.dispose();
        converterRef.current = null;
      }

      // Cleanup parser
      if (parserRef.current) {
        parserRef.current.dispose();
        parserRef.current = null;
      }
    };
  }, []);

  // Create BabylonScene props
  const babylonSceneProps: BabylonSceneProps = {
    config: {
      enableInspector,
      backgroundColor,
      antialias: true,
      adaptToDeviceRatio: true,
    },
    camera: getCameraConfig(),
    onSceneReady: handleSceneReady,
    style: { width: '800px', height: '600px', ...style },
    className: `openscad-workflow-test-scene ${className || ''}`,
  };

  return (
    <div
      style={{ position: 'relative', width: '800px', height: '600px' }}
      data-testid={`openscad-workflow-scene-${cameraAngle}`}
      data-ready={isReady}
    >
      <BabylonScene {...babylonSceneProps} />

      {showOrientationGizmo && camera && (
        <OrientationGizmo
          camera={camera}
          config={{ size: 100 }}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            zIndex: 1000,
          }}
        />
      )}
    </div>
  );
};

export default OpenSCADWorkflowTestScene;
