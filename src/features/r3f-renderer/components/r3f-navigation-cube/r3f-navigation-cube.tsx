/**
 * @file R3F Navigation Cube
 * 
 * React Three Fiber navigation cube component providing equivalent functionality
 * to Babylon.js navigation cube. Offers 3D navigation with face labels, camera
 * positioning, and professional CAD-style interaction.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { R3FCameraPosition } from '../../services/camera-service/r3f-camera-service';

// ============================================================================
// Component Types
// ============================================================================

/**
 * Camera view definition for navigation cube faces
 */
export interface R3FCameraView {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly label: string;
  readonly color: string;
}

/**
 * Navigation cube configuration
 */
export interface R3FNavigationCubeConfig {
  readonly size?: number;
  readonly position?: readonly [number, number, number];
  readonly distance?: number;
  readonly showLabels?: boolean;
  readonly enableAnimation?: boolean;
  readonly animationDuration?: number;
  readonly faceColors?: {
    readonly front?: string;
    readonly back?: string;
    readonly left?: string;
    readonly right?: string;
    readonly top?: string;
    readonly bottom?: string;
  };
}

/**
 * Navigation cube props
 */
export interface R3FNavigationCubeProps extends R3FNavigationCubeConfig {
  readonly onCameraChange?: (position: R3FCameraPosition) => void;
  readonly onError?: (error: string) => void;
  readonly visible?: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<R3FNavigationCubeConfig> = {
  size: 1,
  position: [0, 0, 0],
  distance: 15,
  showLabels: true,
  enableAnimation: true,
  animationDuration: 1000,
  faceColors: {
    front: '#4CAF50',   // Green
    back: '#2196F3',    // Blue
    left: '#FF9800',    // Orange
    right: '#9C27B0',   // Purple
    top: '#F44336',     // Red
    bottom: '#607D8B'   // Blue Grey
  }
};

// ============================================================================
// Camera Views Definition
// ============================================================================

const CAMERA_VIEWS: Record<string, R3FCameraView> = {
  front: {
    position: [0, 0, 15],
    target: [0, 0, 0],
    label: 'Front',
    color: DEFAULT_CONFIG.faceColors.front ?? '#4CAF50'
  },
  back: {
    position: [0, 0, -15],
    target: [0, 0, 0],
    label: 'Back',
    color: DEFAULT_CONFIG.faceColors.back ?? '#2196F3'
  },
  left: {
    position: [-15, 0, 0],
    target: [0, 0, 0],
    label: 'Left',
    color: DEFAULT_CONFIG.faceColors.left ?? '#FF9800'
  },
  right: {
    position: [15, 0, 0],
    target: [0, 0, 0],
    label: 'Right',
    color: DEFAULT_CONFIG.faceColors.right ?? '#9C27B0'
  },
  top: {
    position: [0, 15, 0],
    target: [0, 0, 0],
    label: 'Top',
    color: DEFAULT_CONFIG.faceColors.top ?? '#F44336'
  },
  bottom: {
    position: [0, -15, 0],
    target: [0, 0, 0],
    label: 'Bottom',
    color: DEFAULT_CONFIG.faceColors.bottom ?? '#607D8B'
  }
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * R3F Navigation Cube Component
 * 
 * Provides 3D navigation cube with clickable faces for camera positioning.
 * Equivalent to Babylon.js navigation cube with enhanced R3F integration.
 * 
 * @param props - Navigation cube configuration and callbacks
 * @returns JSX element containing the navigation cube
 * 
 * @example
 * ```tsx
 * function Scene() {
 *   const handleCameraChange = (position) => {
 *     console.log('Camera moved to:', position);
 *   };
 * 
 *   return (
 *     <Canvas>
 *       <R3FNavigationCube
 *         size={1.5}
 *         showLabels={true}
 *         enableAnimation={true}
 *         onCameraChange={handleCameraChange}
 *       />
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function R3FNavigationCube({
  size = DEFAULT_CONFIG.size,
  position = DEFAULT_CONFIG.position,
  distance = DEFAULT_CONFIG.distance,
  showLabels = DEFAULT_CONFIG.showLabels,
  enableAnimation = DEFAULT_CONFIG.enableAnimation,
  animationDuration = DEFAULT_CONFIG.animationDuration,
  faceColors = DEFAULT_CONFIG.faceColors,
  onCameraChange,
  onError,
  visible = true
}: R3FNavigationCubeProps): React.JSX.Element | null {
  const { camera } = useThree();
  const cubeRef = useRef<THREE.Group>(null);
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Merge face colors with defaults
  const finalFaceColors = { ...DEFAULT_CONFIG.faceColors, ...faceColors };

  // ========================================================================
  // Camera Animation
  // ========================================================================

  const animateCamera = useCallback((targetView: R3FCameraView) => {
    if (!camera || isAnimating) return;

    try {
      setIsAnimating(true);

      const startPosition = camera.position.clone();
      const startTarget = new THREE.Vector3(0, 0, 0); // Assume looking at origin
      
      const endPosition = new THREE.Vector3(...targetView.position);
      const endTarget = new THREE.Vector3(...targetView.target);

      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Interpolate position
        const currentPosition = startPosition.clone().lerp(endPosition, eased);
        camera.position.copy(currentPosition);
        
        // Update camera target
        camera.lookAt(endTarget);
        camera.updateProjectionMatrix();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          
          // Notify camera change
          if (onCameraChange) {
            const cameraPosition: R3FCameraPosition = {
              position: targetView.position,
              target: targetView.target,
              distance: new THREE.Vector3(...targetView.position).distanceTo(new THREE.Vector3(...targetView.target)),
              spherical: {
                radius: distance,
                phi: Math.acos(targetView.position[1] / distance),
                theta: Math.atan2(targetView.position[2], targetView.position[0])
              }
            };
            onCameraChange(cameraPosition);
          }
        }
      };

      if (enableAnimation) {
        animate();
      } else {
        // Immediate positioning
        camera.position.set(...targetView.position);
        camera.lookAt(...targetView.target);
        camera.updateProjectionMatrix();
        setIsAnimating(false);
        
        if (onCameraChange) {
          const cameraPosition: R3FCameraPosition = {
            position: targetView.position,
            target: targetView.target,
            distance,
            spherical: {
              radius: distance,
              phi: Math.acos(targetView.position[1] / distance),
              theta: Math.atan2(targetView.position[2], targetView.position[0])
            }
          };
          onCameraChange(cameraPosition);
        }
      }
    } catch (error) {
      setIsAnimating(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera animation error';
      onError?.(errorMessage);
      console.error('[R3F Navigation Cube] Camera animation failed:', errorMessage);
    }
  }, [camera, distance, animationDuration, enableAnimation, isAnimating, onCameraChange, onError]);

  // ========================================================================
  // Face Click Handlers
  // ========================================================================

  const handleFaceClick = useCallback((faceName: string) => {
    const view = CAMERA_VIEWS[faceName];
    if (view) {
      animateCamera(view);
    }
  }, [animateCamera]);

  // ========================================================================
  // Cube Rotation (Follow Camera)
  // ========================================================================

  useFrame(() => {
    if (cubeRef.current && camera) {
      // Make cube always face the camera
      cubeRef.current.lookAt(camera.position);
    }
  });

  // ========================================================================
  // Face Materials
  // ========================================================================

  const faceMaterials = useMemo(() => {
    const materials: THREE.MeshBasicMaterial[] = [];
    
    Object.entries(finalFaceColors).forEach(([, color]) => {
      materials.push(new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 0.8
      }));
    });
    
    return materials;
  }, [finalFaceColors]);

  // ========================================================================
  // Render
  // ========================================================================

  if (!visible) return null;

  return (
    <group ref={cubeRef} position={position}>
      {/* Navigation Cube */}
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial 
          color={hoveredFace ? '#ffffff' : '#cccccc'} 
          transparent 
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Cube Faces */}
      {Object.entries(CAMERA_VIEWS).map(([faceName, view], index) => (
        <group key={faceName}>
          {/* Face Plane */}
          <mesh
            position={[
              faceName === 'right' ? size/2 : faceName === 'left' ? -size/2 : 0,
              faceName === 'top' ? size/2 : faceName === 'bottom' ? -size/2 : 0,
              faceName === 'front' ? size/2 : faceName === 'back' ? -size/2 : 0
            ]}
            rotation={[
              faceName === 'top' ? -Math.PI/2 : faceName === 'bottom' ? Math.PI/2 : 0,
              faceName === 'left' ? Math.PI/2 : faceName === 'right' ? -Math.PI/2 : 0,
              faceName === 'back' ? Math.PI : 0
            ]}
            onClick={() => handleFaceClick(faceName)}
            onPointerEnter={() => setHoveredFace(faceName)}
            onPointerLeave={() => setHoveredFace(null)}
          >
            <planeGeometry args={[size * 0.8, size * 0.8]} />
            <meshBasicMaterial 
              color={view.color}
              transparent
              opacity={hoveredFace === faceName ? 0.9 : 0.6}
            />
          </mesh>

          {/* Face Label */}
          {showLabels && (
            <Text
              position={[
                faceName === 'right' ? size/2 + 0.1 : faceName === 'left' ? -size/2 - 0.1 : 0,
                faceName === 'top' ? size/2 + 0.1 : faceName === 'bottom' ? -size/2 - 0.1 : 0,
                faceName === 'front' ? size/2 + 0.1 : faceName === 'back' ? -size/2 - 0.1 : 0
              ]}
              fontSize={size * 0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="black"
            >
              {view.label}
            </Text>
          )}
        </group>
      ))}

      {/* Center Indicator */}
      <mesh>
        <sphereGeometry args={[size * 0.05]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// ============================================================================
// Default Export
// ============================================================================

export default R3FNavigationCube;
