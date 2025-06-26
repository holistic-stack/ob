/**
 * Three.js Renderer Component
 *
 * React component for Three.js 3D rendering with React Three Fiber,
 * OpenSCAD AST rendering, CSG operations, and performance monitoring.
 */

import React, { Suspense, useRef, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats, Grid, Bounds } from '@react-three/drei';
import * as THREE from 'three';

import type {
  RendererProps,
  Scene3DConfig,
  CameraConfig,
  Mesh3D,
  RenderingMetrics,
  RenderingError
} from '../types/renderer.types';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import { success, error, tryCatch } from '../../../shared/utils/functional/result';

/**
 * Simple performance measurement utility
 * Inline implementation to avoid import issues with ad blockers
 */
const measureTime = <T,>(fn: () => T): { result: T; duration: number } => {
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
  maxTriangles: 100000
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
  onPerformanceUpdate?: (metrics: RenderingMetrics) => void;
}> = ({ ast, camera, config, onRenderComplete, onRenderError, onPerformanceUpdate }) => {
  const { scene, gl, size } = useThree();
  const [meshes, setMeshes] = useState<ReadonlyArray<Mesh3D>>([]);
  const [isRendering, setIsRendering] = useState(false);
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());

  /**
   * Render OpenSCAD primitive from AST node
   */
  const renderPrimitive = useCallback((node: ASTNode, index: number): Mesh3D | null => {
    const result = tryCatch(() => {
      let geometry: THREE.BufferGeometry;

      switch (node.type) {
        case 'cube': {
          const size = node.parameters?.size || [1, 1, 1];
          const [x, y, z] = Array.isArray(size) ? size : [size, size, size];
          geometry = new THREE.BoxGeometry(x, y, z);
          break;
        }
        case 'sphere': {
          const radius = node.parameters?.radius || 1;
          const segments = node.parameters?.segments || 32;
          geometry = new THREE.SphereGeometry(radius, segments, segments);
          break;
        }
        case 'cylinder': {
          const radius = node.parameters?.radius || 1;
          const height = node.parameters?.height || 1;
          const segments = node.parameters?.segments || 32;
          geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
          break;
        }
        default:
          // Default to a small cube for unknown types
          geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      }

      const material = new THREE.MeshStandardMaterial({
        color: node.parameters?.color || '#ffffff',
        metalness: 0.1,
        roughness: 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Apply transformations if present
      if (node.parameters?.translate) {
        const [x, y, z] = node.parameters.translate as [number, number, number];
        mesh.position.set(x, y, z);
      }

      if (node.parameters?.rotate) {
        const [x, y, z] = node.parameters.rotate as [number, number, number];
        mesh.rotation.set(
          THREE.MathUtils.degToRad(x),
          THREE.MathUtils.degToRad(y),
          THREE.MathUtils.degToRad(z)
        );
      }

      if (node.parameters?.scale) {
        const scale = node.parameters.scale;
        const [x, y, z] = Array.isArray(scale) ? scale : [scale, scale, scale];
        mesh.scale.set(x, y, z);
      }

      // Calculate bounding box
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox || new THREE.Box3();

      const metadata = {
        id: `mesh-${index}`,
        nodeType: node.type || 'unknown',
        nodeIndex: index,
        triangleCount: geometry.attributes.position.count / 3,
        vertexCount: geometry.attributes.position.count,
        boundingBox,
        material: 'standard',
        color: node.parameters?.color || '#ffffff',
        opacity: 1,
        visible: true
      };

      return {
        mesh,
        metadata,
        dispose: () => {
          geometry.dispose();
          material.dispose();
        }
      };
    }, (err) => {
      const renderError: RenderingError = {
        type: 'geometry',
        message: `Failed to render ${node.type}: ${err instanceof Error ? err.message : String(err)}`,
        nodeType: node.type
      };
      onRenderError?.(renderError);
      return null;
    });

    return result.success ? result.data : null;
  }, [onRenderError]);

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

    const { result: newMeshes, duration } = await measureTime(async () => {
      // Clear existing meshes
      meshes.forEach(meshWrapper => {
        scene.remove(meshWrapper.mesh);
        meshWrapper.dispose();
      });

      // Render new meshes
      const renderedMeshes: Mesh3D[] = [];

      for (let i = 0; i < ast.length; i++) {
        const node = ast[i];
        const meshWrapper = renderPrimitive(node, i);

        if (meshWrapper) {
          scene.add(meshWrapper.mesh);
          renderedMeshes.push(meshWrapper);
        }
      }

      return renderedMeshes;
    });

    setMeshes(newMeshes);
    setIsRendering(false);
    onRenderComplete?.(newMeshes);

    // Update performance metrics
    const metrics: RenderingMetrics = {
      renderTime: duration,
      parseTime: 0, // Will be set by parser
      memoryUsage: 0, // Will be calculated separately
      frameRate: 60, // Will be calculated in frame loop
      meshCount: newMeshes.length,
      triangleCount: newMeshes.reduce((sum, m) => sum + m.metadata.triangleCount, 0),
      vertexCount: newMeshes.reduce((sum, m) => sum + m.metadata.vertexCount, 0),
      drawCalls: newMeshes.length,
      textureMemory: 0,
      bufferMemory: newMeshes.length * 1024 // Rough estimate
    };

    onPerformanceUpdate?.(metrics);
  }, [ast, meshes, scene, renderPrimitive, onRenderComplete, onPerformanceUpdate]);

  /**
   * Frame loop for performance monitoring
   */
  useFrame(() => {
    frameCount.current++;
    const now = performance.now();

    // Calculate frame rate every second
    if (now - lastFrameTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
      frameCount.current = 0;
      lastFrameTime.current = now;

      // Update frame rate in metrics
      if (onPerformanceUpdate && meshes.length > 0) {
        const metrics: RenderingMetrics = {
          renderTime: 0,
          parseTime: 0,
          memoryUsage: 0,
          frameRate: fps,
          meshCount: meshes.length,
          triangleCount: meshes.reduce((sum, m) => sum + m.metadata.triangleCount, 0),
          vertexCount: meshes.reduce((sum, m) => sum + m.metadata.vertexCount, 0),
          drawCalls: meshes.length,
          textureMemory: 0,
          bufferMemory: meshes.length * 1024
        };
        onPerformanceUpdate(metrics);
      }
    }
  });

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
      meshes.forEach(meshWrapper => {
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
        <group>
          {/* Meshes are added directly to scene in renderAST */}
        </group>
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
      fontFamily: 'monospace'
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
  onCameraChange,
  onPerformanceUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Handle canvas creation
   */
  const handleCreated = useCallback(({ gl, scene, camera: threeCamera }) => {
    // Configure renderer
    gl.setClearColor(config.backgroundColor);
    gl.shadowMap.enabled = config.enableShadows;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputEncoding = THREE.sRGBEncoding;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;

    // Configure camera
    if (threeCamera instanceof THREE.PerspectiveCamera) {
      threeCamera.position.set(...camera.position);
      threeCamera.lookAt(...camera.target);
      threeCamera.fov = camera.fov;
      threeCamera.near = camera.near;
      threeCamera.far = camera.far;
      threeCamera.updateProjectionMatrix();
    }

    console.log('[INIT][ThreeRenderer] Three.js renderer initialized');
  }, [config, camera]);

  return (
    <div
      data-testid={testId || 'three-renderer'}
      className={className}
      style={{ width: '100%', height: '400px', position: 'relative' }}
    >
      <Canvas
        ref={canvasRef}
        camera={{
          position: camera.position,
          fov: camera.fov,
          near: camera.near,
          far: camera.far
        }}
        gl={{
          antialias: config.enableAntialiasing,
          alpha: true,
          powerPreference: config.enableHardwareAcceleration ? 'high-performance' : 'default'
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
            onRenderComplete={onRenderComplete}
            onRenderError={onRenderError}
            onPerformanceUpdate={onPerformanceUpdate}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeRenderer;
