import React, { useState, useCallback, useEffect } from 'react';
import { AppLayout, type FileName } from './features/ui-components/layout';
import { OpenSCADErrorBoundary } from './features/ui-components/shared/error-boundary/openscad-error-boundary';
import {
  useOpenSCADActions
} from './features/ui-components/editor/stores';



// Default OpenSCAD code example - showcasing multiple primitives in a well-framed scene
const defaultCode = `// OpenSCAD Primitives Showcase
// Demonstrates various 3D shapes positioned for optimal camera framing

// Basic cube at origin
cube([8, 8, 8]);

// Sphere positioned to the right
translate([15, 0, 0])
  sphere(4);

// Cylinder positioned above
translate([0, 12, 0])
  cylinder(h = 8, r = 3);

// Cone (using cylinder with different radii)
translate([15, 12, 0])
  cylinder(h = 10, r1 = 4, r2 = 1);

// Torus-like shape using difference
translate([-12, 0, 4])
  difference() {
    sphere(5);
    sphere(3);
  }

// Rounded cube using hull and spheres
translate([-12, 12, 0])
  hull() {
    translate([0, 0, 0]) sphere(2);
    translate([6, 0, 0]) sphere(2);
    translate([6, 6, 0]) sphere(2);
    translate([0, 6, 0]) sphere(2);
    translate([0, 0, 6]) sphere(2);
    translate([6, 0, 6]) sphere(2);
    translate([6, 6, 6]) sphere(2);
    translate([0, 6, 6]) sphere(2);
  }

// Use "Fit to View" button to frame all objects perfectly!`;

/**
 * Modern App component with CAD-style Liquid Glass Layout
 * Maintains backward compatibility with existing OpenSCAD editor and Babylon.js visualization
 */
export function App(): React.JSX.Element {
  const [fileName, setFileName] = useState('untitled.scad');

  // Zustand store hooks for backward compatibility
  const { updateCode } = useOpenSCADActions();

  // Layout event handlers
  const handleFileNameChange = useCallback((newName: string) => {
    setFileName(newName);
    console.log('[App] File name changed to:', newName);
  }, []);

  const handleRender = useCallback(() => {
    console.log('[App] Render button clicked');
    // Trigger re-render of current AST data
    // This could trigger a fresh CSG2 conversion or other render operations
  }, []);

  const handleMoreOptions = useCallback(() => {
    console.log('[App] More options button clicked');
    // Open options menu or settings panel
  }, []);

  // Initialize Zustand store with default code on mount
  useEffect(() => {
    updateCode(defaultCode);
  }, [updateCode]);

  return (
    <OpenSCADErrorBoundary
      enableRecovery={true}
      showTechnicalDetails={true}
      onError={(error, errorInfo) => {
        console.error('[App] Error caught by boundary:', error, errorInfo);
      }}
      className="h-full w-full"
    >
      <AppLayout
        fileName={fileName as FileName} // Type assertion for branded type
        onFileNameChange={handleFileNameChange}
        onRender={handleRender}
        onMoreOptions={handleMoreOptions}
      />
    </OpenSCADErrorBoundary>
  );
}

export default App;
