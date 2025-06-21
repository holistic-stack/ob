import React, { useState } from 'react';
import { ErrorBoundary as _ErrorBoundary } from 'react-error-boundary';
import {
  CodeEditor,
  VisualizationPanel,
} from './features/ui-components/editor';
import type {
  VisualizationMode
} from './features/ui-components/editor';

// Default OpenSCAD code example
const defaultCode = `// Arduino Case Design
// A parametric case for Arduino Uno with mounting posts and cutouts

// Parameters
case_width = 60;
case_length = 40;
case_height = 15;
wall_thickness = 2;
corner_radius = 3;

// Main case module
module arduino_case() {
  difference() {
    // Main case body with rounded corners
    hull() {
      for(x = [corner_radius, case_width - corner_radius]) {
        for(y = [corner_radius, case_length - corner_radius]) {
          translate([x, y, 0])
            cylinder(h = case_height, r = corner_radius);
        }
      }
    }

    // Internal cavity
    translate([wall_thickness, wall_thickness, wall_thickness])
      hull() {
        for(x = [corner_radius, case_width - 2*wall_thickness - corner_radius]) {
          for(y = [corner_radius, case_length - 2*wall_thickness - corner_radius]) {
            translate([x, y, 0])
              cylinder(h = case_height, r = corner_radius);
          }
        }
      }

    // USB port cutout
    translate([case_width - wall_thickness - 1, case_length/2 - 6, wall_thickness + 2])
      cube([wall_thickness + 2, 12, 8]);

    // Power jack cutout
    translate([-1, case_length/2 + 8, wall_thickness + 3])
      cube([wall_thickness + 2, 8, 6]);

    // Reset button access
    translate([case_width/2 - 1, -1, case_height - 2])
      cube([2, wall_thickness + 2, 3]);
  }

  // Mounting posts for Arduino
  post_positions = [
    [14, 2.5], [14, 35.5], [66, 7.5], [66, 35.5]
  ];

  for(pos = post_positions) {
    translate([pos[0], pos[1], wall_thickness])
      cylinder(h = 8, r = 1.5);
  }
}

// Generate the case
arduino_case();`;

/**
 * Modern App component with OpenSCAD Editor
 */
export function App(): React.JSX.Element {
  const [code, setCode] = useState(defaultCode);
  const [visualizationMode] = useState<VisualizationMode>('solid');
  const [ast, setAst] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<any[]>([]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleSave = () => {
    console.log('Code saved:', code);
  };

  const handleFormat = () => {
    console.log('Code formatted');
  };

  const handleASTChange = (newAst: any[]) => {
    setAst(newAst);
    console.log('AST updated:', newAst);
  };

  const handleParseErrors = (errors: any[]) => {
    setParseErrors(errors);
    console.log('Parse errors:', errors);
  };

  const handleViewChange = (action: string) => {
    console.log('3D view action:', action);
  };

  const handleModelClick = (point: { x: number; y: number; z: number }) => {
    console.log('Model clicked at:', point);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <_ErrorBoundary
        fallback={
          <div className="flex items-center justify-center h-screen bg-red-900 text-white">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
              <p>Please refresh the page to try again.</p>
            </div>
          </div>
        }
      >
        <div className="h-full flex p-4 gap-4">
          {/* Code Editor */}
          <div className="flex-1">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language="openscad"
              showLineNumbers
              onSave={handleSave}
              onFormat={handleFormat}
              onASTChange={handleASTChange}
              onParseErrors={handleParseErrors}
              enableASTParsing
              showSyntaxErrors
              enableCodeCompletion
              placeholder="Enter your OpenSCAD code here..."
              aria-label="OpenSCAD Code Editor"
            />
          </div>

          {/* 3D Visualization Panel */}
          <div className="w-96">
            <VisualizationPanel
              mode={visualizationMode}
              width={384}
              height={600}
              showControls
              onViewChange={handleViewChange}
              onModelClick={handleModelClick}
              aria-label="3D Model Visualization"
            />
          </div>
        </div>
      </_ErrorBoundary>
    </div>
  );
}

export default App;
