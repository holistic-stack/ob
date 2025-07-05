/**
 * Three.js Renderer Component
 *
 * React component for Three.js 3D rendering with React Three Fiber,
 * OpenSCAD AST rendering, CSG operations, and performance monitoring.
 */

import { Bounds, Grid, OrbitControls, Stats } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type React from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { CameraConfig } from '../../../shared/types/common.types.js';
import { tryCatch } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type {
  Mesh3D,
  RendererProps,
  RenderingError,
  RenderingMetrics,
  Scene3DConfig,
} from '../types/renderer.types.js';

const logger = createLogger('ThreeRenderer');

// Type-safe interfaces for AST node parameters using proper OpenSCAD parser types
interface _CubeNodeParams {
  type: 'cube';
  parameters?: { size?: number | number[] };
  size?: number | number[];
}

interface _SphereNodeParams {
  type: 'sphere';
  parameters?: { radius?: number; segments?: number };
  r?: number;
  fn?: number;
}

interface _CylinderNodeParams {
  type: 'cylinder';
  parameters?: { radius?: number; height?: number; segments?: number };
  radius?: number;
  height?: number;
  fn?: number;
}

import { renderASTNode } from '../services/primitive-renderer';

/**
 * Simple performance measurement utility
 * Inline implementation to avoid import issues with ad blockers
 */
const _measureTime = <T,>(fn: () => T): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
};

/**
 * Default scene configuration
 */
const DEFAULT_CONFIG: Scene3DConfig = {
  enableShadows: true,
  enableAntialiasing: true,
  enableWebGL2: true,
  enableHardwareAcceleration: true,
  backgroundColor: '#1a1a1a',
  ambientLightIntensity: 0.4,
  directionalLightIntensity: 0.8,
  maxMeshes: 1000,
  maxTriangles: 100000,
};

/**
 * Scene content component that renders inside Canvas
 */
const SceneContent: React.FC<{
  ast: ReadonlyArray<ASTNode>;
  camera: CameraConfig;
  config: Scene3DConfig;
  onRenderComplete?: (meshes: ReadonlyArray<Mesh3D>) => void;
  onRenderError?: (error: RenderingError) => void;
}> = ({ ast, camera, config, onRenderComplete, onRenderError }) => {
  const { scene, gl: _gl, size: _size } = useThree();
  const [meshes, setMeshes] = useState<ReadonlyArray<Mesh3D>>([]);
  const [_isRendering, setIsRendering] = useState(false);

  /**
   * Render OpenSCAD primitive from AST node
   */
  const _renderPrimitive = useCallback(
    (node: ASTNode, index: number): Mesh3D | null => {
      const result = tryCatch(
        () => {
          let geometry: THREE.BufferGeometry;

          switch (node.type) {
            case 'cube': {
              const cubeNode = node;
              const size = cubeNode.size;
              // Handle ParameterValue type - extract numeric values
              const sizeValue = typeof size === 'number' ? size : 1;
              const [x, y, z] = Array.isArray(size)
                ? (size as number[]).map((v) => (typeof v === 'number' ? v : 1))
                : [sizeValue, sizeValue, sizeValue];
              geometry = new THREE.BoxGeometry(x, y, z);
              break;
            }
            case 'sphere': {
              const sphereNode = node;
              const radius =
                typeof sphereNode.radius === 'number'
                  ? sphereNode.radius
                  : typeof sphereNode.diameter === 'number'
                    ? sphereNode.diameter / 2
                    : 1;
              const segments = typeof sphereNode.fn === 'number' ? sphereNode.fn : 32;
              geometry = new THREE.SphereGeometry(radius, segments, segments);
              break;
            }
            case 'cylinder': {
              const cylinderNode = node;
              const radius = typeof cylinderNode.r === 'number' ? cylinderNode.r : 1;
              const height = typeof cylinderNode.h === 'number' ? cylinderNode.h : 1;
              const segments = typeof cylinderNode.$fn === 'number' ? cylinderNode.$fn : 32;
              geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
              break;
            }
            default:
              // Default to a small cube for unknown types
              geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
          }

          const material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            metalness: 0.1,
            roughness: 0.8,
          });

          const mesh = new THREE.Mesh(geometry, material);

          // Apply transformations if present
          if ('translate' in node && node.translate) {
            const [x, y, z] = node.translate as [number, number, number];
            mesh.position.set(x, y, z);
          }

          if ('rotate' in node && node.rotate) {
            const [x, y, z] = node.rotate as [number, number, number];
            mesh.rotation.set(
              THREE.MathUtils.degToRad(x),
              THREE.MathUtils.degToRad(y),
              THREE.MathUtils.degToRad(z)
            );
          }

          if ('scale' in node && node.scale) {
            const scale = node.scale;
            const [x = 1, y = 1, z = 1] = Array.isArray(scale) ? scale : [scale, scale, scale];
            mesh.scale.set(x, y, z);
          }

          // Calculate bounding box
          geometry.computeBoundingBox();
          const boundingBox = geometry.boundingBox ?? new THREE.Box3();

          const metadata = {
            id: `mesh-${index}`,
            nodeType: node.type || 'unknown',
            nodeIndex: index,
            triangleCount: geometry.attributes.position
              ? geometry.attributes.position.count / 3
              : 0,
            vertexCount: geometry.attributes.position ? geometry.attributes.position.count : 0,
            boundingBox,
            material: 'standard',
            color: '#ffffff',
            opacity: 1,
            visible: true,
          };

          return {
            mesh,
            metadata,
            dispose: () => {
              geometry.dispose();
              material.dispose();
            },
          };
        },
        (err) => {
          const renderError: RenderingError = {
            type: 'geometry',
            message: `Failed to render ${node.type}: ${err instanceof Error ? err.message : String(err)}`,
            nodeType: node.type,
          };
          onRenderError?.(renderError);
          return null;
        }
      );

      return result.success ? result.data : null;
    },
    [onRenderError]
  );

  /**
   * Render all AST nodes
   */
  const renderAST = useCallback(async () => {
    if (ast.length === 0) {
      setMeshes([]);
      onRenderComplete?.([]);
      return;
    }

    setIsRendering(true);

    const start = performance.now();

    // Clear existing meshes
    meshes.forEach((meshWrapper) => {
      scene.remove(meshWrapper.mesh);
      meshWrapper.dispose();
    });

    // Render new meshes
    const newMeshes: Mesh3D[] = [];

    for (let i = 0; i < ast.length; i++) {
      const node = ast[i];
      if (!node) {
        logger.warn(`Skipping undefined node at index ${i}`);
        continue;
      }

      try {
        const result = await renderASTNode(node, i);

        if (result.success) {
          scene.add(result.data.mesh);
          newMeshes.push(result.data);
        } else {
          logger.error(`Failed to render node ${i} (${node.type}):`, result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to create mesh for node ${i} (${node.type}):`, errorMessage);
      }
    }

    const duration = performance.now() - start;

    setMeshes(newMeshes);
    setIsRendering(false);
    onRenderComplete?.(newMeshes);
  }, [ast, meshes, scene, onRenderComplete]);

  /**
   * Render AST when it changes
   */
  useEffect(() => {
    renderAST();
  }, [renderAST]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      meshes.forEach((meshWrapper) => {
        scene.remove(meshWrapper.mesh);
        meshWrapper.dispose();
      });
    };
  }, [meshes, scene]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={config.ambientLightIntensity} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={config.directionalLightIntensity}
        castShadow={config.enableShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Camera controls */}
      {camera.enableControls && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={camera.enableAutoRotate}
          autoRotateSpeed={camera.autoRotateSpeed}
        />
      )}

      {/* Grid helper */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Bounds for auto-fitting camera */}
      <Bounds fit clip observe margin={1.2}>
        <group>{/* Meshes are added directly to scene in renderAST */}</group>
      </Bounds>

      {/* Performance stats in development */}
      {process.env.NODE_ENV === 'development' && <Stats />}
    </>
  );
};

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: 'monospace',
    }}
  >
    Initializing 3D Renderer...
  </div>
);

/**
 * Main Three.js Renderer Component
 */
export const ThreeRenderer: React.FC<RendererProps> = ({
  ast,
  camera,
  config = DEFAULT_CONFIG,
  className,
  'data-testid': testId,
  onRenderComplete,
  onRenderError,
  onCameraChange: _onCameraChange,
  onPerformanceUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Handle canvas creation
   */
  const handleCreated = useCallback(
    ({
      gl,
      scene: _scene,
      camera: threeCamera,
    }: {
      gl: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.Camera;
    }) => {
      // Configure renderer
      gl.setClearColor(config.backgroundColor);
      gl.shadowMap.enabled = config.enableShadows;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1;

      // Configure camera
      if (threeCamera instanceof THREE.PerspectiveCamera) {
        threeCamera.position.set(camera.position[0], camera.position[1], camera.position[2]);
        threeCamera.lookAt(camera.target[0], camera.target[1], camera.target[2]);
        threeCamera.fov = camera.fov;
        threeCamera.near = camera.near;
        threeCamera.far = camera.far;
        threeCamera.updateProjectionMatrix();
      }

      logger.init('Three.js renderer initialized');
    },
    [config, camera]
  );

  return (
    <div
      data-testid={testId ?? 'three-renderer'}
      className={className}
      style={{ width: '100%', height: '400px', position: 'relative' }}
    >
      <Canvas
        ref={canvasRef}
        camera={{
          position: camera.position,
          fov: camera.fov,
          near: camera.near,
          far: camera.far,
        }}
        gl={{
          antialias: config.enableAntialiasing,
          alpha: true,
          powerPreference: config.enableHardwareAcceleration ? 'high-performance' : 'default',
        }}
        shadows={config.enableShadows}
        onCreated={handleCreated}
        style={{ background: config.backgroundColor }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent
            ast={ast}
            camera={camera}
            config={config}
            {...(onRenderComplete && { onRenderComplete })}
            {...(onRenderError && { onRenderError })}
            {...(onPerformanceUpdate && { onPerformanceUpdate })}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeRenderer;
