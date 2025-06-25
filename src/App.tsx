/**
 * @file Main Application Component - Refactored with 12-Column Grid Layout
 *
 * Root component implementing TDD-driven 12-column grid layout with:
 * - Monaco editor (5 columns) for OpenSCAD code editing
 * - Three.js viewer (7 columns) for 3D visualization
 * - Error boundaries and state management
 * - Follows React 19 patterns with TypeScript strict mode and SRP principles
 *
 * @author OpenSCAD-R3F Pipeline
 * @version 2.0.0 - Refactored for 12-column grid layout
 */

import React, { useEffect } from 'react';
import { GridLayout } from './features/ui-components/layout/grid-layout';
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

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Props for the App component
 */
export interface AppProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Modern App component with 12-Column Grid Layout
 *
 * Implements TDD-driven layout with Monaco editor (5 cols) and Three.js viewer (7 cols).
 * Features OpenSCAD editor with React Three Fiber 3D visualization following SRP principles.
 *
 * @returns JSX element containing the refactored 12-column grid application
 */
export function App(): React.JSX.Element {
  console.log('[INIT] Rendering refactored App with 12-column grid layout');

  // Zustand store hooks for OpenSCAD state management
  const { updateCode } = useOpenSCADActions();

  // Initialize Zustand store with default code on mount
  useEffect(() => {
    console.log('[DEBUG] Initializing OpenSCAD store with default code');
    updateCode(defaultCode);
  }, [updateCode]);

  return (
    <OpenSCADErrorBoundary
      enableRecovery={true}
      showTechnicalDetails={true}
      onError={(error, errorInfo) => {
        console.error('[ERROR] App error caught by boundary:', error, errorInfo);
      }}
      className="h-full w-full"
    >
      <GridLayout
        className="h-full w-full"
        data-testid="grid-layout-container"
        aria-label="12-Column Grid Layout"
      />
    </OpenSCADErrorBoundary>
  );
}

export default App;
