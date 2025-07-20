/**
 * @file Enhanced Scene Demo Component
 *
 * Demonstrates the enhanced BabylonScene component with grid and orientation gizmo features.
 * Shows how to configure and use the new spatial reference aids.
 *
 * @example
 * ```tsx
 * <EnhancedSceneDemo />
 * ```
 */

import { Color3, Vector3 } from '@babylonjs/core';
import type React from 'react';
import { useState } from 'react';
import { BabylonScene } from '../babylon-scene/babylon-scene';

/**
 * Enhanced Scene Demo Component
 *
 * Interactive demo showing grid and orientation gizmo features.
 */
export const EnhancedSceneDemo: React.FC = () => {
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showGizmo, setShowGizmo] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [gizmoPosition, setGizmoPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls Panel */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>Enhanced Scene Demo</h3>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          Show Grid
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={showAxes}
            onChange={(e) => setShowAxes(e.target.checked)}
          />
          Show Axes
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={showGizmo}
            onChange={(e) => setShowGizmo(e.target.checked)}
          />
          Show Orientation Gizmo
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Grid Size:
          <input
            type="range"
            min="10"
            max="50"
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            style={{ width: '100px' }}
          />
          <span>{gridSize}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Gizmo Position:
          <select
            value={gizmoPosition}
            onChange={(e) => setGizmoPosition(e.target.value as any)}
          >
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </label>
      </div>

      {/* 3D Scene */}
      <div style={{ flex: 1, position: 'relative' }}>
        <BabylonScene
          config={{
            backgroundColor: new Color3(0.1, 0.1, 0.15),
            enableInspector: false,
          }}
          camera={{
            position: new Vector3(15, 15, 15), // OpenSCAD Z-up standard positioning
            target: new Vector3(0, 0, 0),
            radius: 25.98, // sqrt(15^2 + 15^2 + 15^2) for consistent distance
            alpha: Math.PI / 4, // 45 degrees around Z-axis
            beta: Math.PI / 3, // 60 degrees from Z-axis
          }}
          lighting={{
            ambient: {
              enabled: true,
              color: new Color3(0.3, 0.3, 0.4),
              intensity: 0.6,
            },
            directional: {
              enabled: true,
              color: new Color3(1, 1, 0.9),
              intensity: 1.2,
              direction: new Vector3(-1, -1, -1),
            },
          }}
          grid={{
            showGrid,
            showAxes,
            gridSize,
            gridSpacing: 1,
            gridSubdivisions: 10,
            axisLength: 8,
            axisThickness: 0.15,
            gridColor: new Color3(0.4, 0.4, 0.4),
            gridOpacity: 0.6,
            xAxisColor: new Color3(1, 0.3, 0.3),
            yAxisColor: new Color3(0.3, 1, 0.3),
            zAxisColor: new Color3(0.3, 0.3, 1),
          }}
          orientationGizmo={{
            enabled: showGizmo,
            position: gizmoPosition,
            size: 100,
            enableTransitions: true,
            transitionDuration: 400,
            colors: {
              x: ['#ff4444', '#cc2222'],
              y: ['#44ff44', '#22cc22'],
              z: ['#4444ff', '#2222cc'],
            },
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Info Panel */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#f9f9f9', 
        borderTop: '1px solid #ddd',
        fontSize: '14px',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Features:</strong> Interactive grid system with customizable spacing and size, 
          3D coordinate axes with color coding (X=Red, Y=Green, Z=Blue), 
          and orientation gizmo for intuitive camera navigation.
        </p>
      </div>
    </div>
  );
};
