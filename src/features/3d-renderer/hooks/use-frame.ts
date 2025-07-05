/**
 * useFrame Hook - React Three.js Render Loop
 *
 * Provides a render loop similar to react-three-fiber's useFrame
 * for continuous updates without useEffect dependencies.
 */

import { useCallback, useEffect, useRef } from 'react';
import { createLogger } from '../../../shared/services/logger.service.js';

const logger = createLogger('useFrame');

interface FrameState {
  clock: {
    elapsedTime: number;
    getDelta: () => number;
  };
  gl: {
    render: (scene: any, camera: any) => void;
  };
}

type FrameCallback = (state: FrameState, delta: number) => void;

/**
 * Custom useFrame hook for render loop operations
 * Eliminates the need for useEffect with complex dependencies
 */
export const useFrame = (callback: FrameCallback, priority = 0) => {
  const callbackRef = useRef(callback);
  const frameIdRef = useRef<number>();
  const lastTimeRef = useRef(performance.now());
  const startTimeRef = useRef(performance.now());

  // Update callback ref without causing re-renders
  callbackRef.current = callback;

  const animate = useCallback(() => {
    const currentTime = performance.now();
    const delta = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
    const elapsedTime = (currentTime - startTimeRef.current) / 1000;

    lastTimeRef.current = currentTime;

    // Create frame state
    const state: FrameState = {
      clock: {
        elapsedTime,
        getDelta: () => delta,
      },
      gl: {
        render: (scene: any, camera: any) => {
          // This would be implemented by the renderer
        },
      },
    };

    // Call the user's callback
    try {
      callbackRef.current(state, delta);
    } catch (error) {
      logger.error('[ERROR] Frame callback error:', error);
    }

    // Schedule next frame
    frameIdRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Start the animation loop
    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      // Cleanup on unmount
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []); // Empty dependency array - only start/stop once

  // Return cleanup function
  return useCallback(() => {
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
    }
  }, []);
};

/**
 * Hook for Three.js render loop with automatic rendering
 */
export const useThreeFrame = (scene: any, camera: any, renderer: any, callback?: FrameCallback) => {
  const renderFrame = useCallback(
    (state: FrameState, delta: number) => {
      // Call user callback first
      if (callback) {
        callback(state, delta);
      }

      // Render the scene
      if (scene && camera && renderer) {
        renderer.render(scene, camera);
      }
    },
    [scene, camera, renderer, callback]
  );

  return useFrame(renderFrame);
};

export default useFrame;
