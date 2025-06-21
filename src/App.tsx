
import React, { useState } from 'react';
import { ErrorBoundary as _ErrorBoundary } from 'react-error-boundary';
import {
  EditorLayout,
  FileExplorer,
  CodeEditor,
  VisualizationPanel,
  ConsolePanel,
} from './features/ui-components/editor';
import type {
  FileNode,
  ConsoleMessage,
  VisualizationMode
} from './features/ui-components/editor';

// Mock file tree data for the editor
const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: 'projects',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'arduino-case',
        type: 'folder',
        children: [
          { id: '3', name: 'case.scad', type: 'file', size: 2048 },
          { id: '4', name: 'lid.scad', type: 'file', size: 1024 },
          { id: '5', name: 'assembly.scad', type: 'file', size: 1536 },
        ],
      },
      {
        id: '6',
        name: 'mechanical-parts',
        type: 'folder',
        children: [
          { id: '7', name: 'gear.scad', type: 'file', size: 3072 },
          { id: '8', name: 'bearing.scad', type: 'file', size: 1280 },
          { id: '9', name: 'shaft.scad', type: 'file', size: 896 },
        ],
      },
      {
        id: '10',
        name: 'examples',
        type: 'folder',
        children: [
          { id: '11', name: 'cube.scad', type: 'file', size: 512 },
          { id: '12', name: 'sphere.scad', type: 'file', size: 384 },
          { id: '13', name: 'cylinder.scad', type: 'file', size: 448 },
        ],
      },
    ],
  },
  {
    id: '14',
    name: 'libraries',
    type: 'folder',
    children: [
      { id: '15', name: 'utils.scad', type: 'file', size: 2560 },
      { id: '16', name: 'constants.scad', type: 'file', size: 768 },
    ],
  },
  { id: '17', name: 'README.md', type: 'file', size: 1024 },
  { id: '18', name: 'LICENSE', type: 'file', size: 1152 },
];

// Code examples for different files
const codeExamples: Record<string, string> = {
  'case.scad': `// Arduino Case Design
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
arduino_case();`,

  'gear.scad': `// Parametric Gear Generator
// Creates involute gears with customizable parameters

// Gear parameters
module gear(
  teeth = 20,           // Number of teeth
  circular_pitch = 5,   // Distance between teeth
  pressure_angle = 20,  // Pressure angle in degrees
  clearance = 0.2,      // Clearance between gears
  gear_thickness = 3,   // Thickness of gear
  rim_thickness = 3,    // Thickness of rim
  hub_thickness = 6,    // Thickness of hub
  hub_diameter = 8,     // Diameter of hub
  bore_diameter = 3     // Diameter of center hole
) {
  // Calculate gear dimensions
  pitch_radius = teeth * circular_pitch / (2 * PI);
  base_radius = pitch_radius * cos(pressure_angle);
  outer_radius = pitch_radius + circular_pitch / PI;
  root_radius = pitch_radius - circular_pitch / PI - clearance;

  linear_extrude(height = gear_thickness) {
    difference() {
      union() {
        // Gear teeth (simplified as circle for demo)
        circle(r = outer_radius);

        // Hub
        if(hub_thickness > gear_thickness) {
          circle(r = hub_diameter/2);
        }
      }

      // Center bore
      circle(r = bore_diameter/2);

      // Root circle
      difference() {
        circle(r = pitch_radius + 1);
        circle(r = root_radius);
      }
    }
  }

  // Extended hub if needed
  if(hub_thickness > gear_thickness) {
    translate([0, 0, gear_thickness])
      linear_extrude(height = hub_thickness - gear_thickness)
        difference() {
          circle(r = hub_diameter/2);
          circle(r = bore_diameter/2);
        }
  }
}

// Example gear system
translate([-15, 0, 0])
  gear(teeth = 16, circular_pitch = 3);

translate([15, 0, 0])
  gear(teeth = 24, circular_pitch = 3);`,

  'cube.scad': `// Simple Cube Example
// Basic OpenSCAD cube with center positioning

cube_size = 10;

// Create a centered cube
cube([cube_size, cube_size, cube_size], center = true);`,

  'sphere.scad': `// Sphere Example
// Basic sphere with custom resolution

sphere_radius = 5;
sphere_resolution = 32;

// Create a sphere with custom facet resolution
sphere(r = sphere_radius, $fn = sphere_resolution);`,

  'utils.scad': `// Utility Functions Library
// Common functions and modules for OpenSCAD projects

// Rounded cube module
module rounded_cube(size, radius = 1) {
  hull() {
    for(x = [radius, size[0] - radius]) {
      for(y = [radius, size[1] - radius]) {
        for(z = [radius, size[2] - radius]) {
          translate([x, y, z])
            sphere(r = radius);
        }
      }
    }
  }
}

// Chamfered cube module
module chamfered_cube(size, chamfer = 1) {
  hull() {
    translate([chamfer, chamfer, 0])
      cube([size[0] - 2*chamfer, size[1] - 2*chamfer, size[2]]);
    translate([0, chamfer, chamfer])
      cube([size[0], size[1] - 2*chamfer, size[2] - 2*chamfer]);
    translate([chamfer, 0, chamfer])
      cube([size[0] - 2*chamfer, size[1], size[2] - 2*chamfer]);
  }
}

// Hexagon module
module hexagon(radius, height) {
  linear_extrude(height = height)
    circle(r = radius, $fn = 6);
}`,
};

// Initial console messages
const initialConsoleMessages: ConsoleMessage[] = [
  {
    id: '1',
    type: 'info',
    message: 'OpenSCAD Editor initialized successfully',
    timestamp: new Date(Date.now() - 120000),
    source: 'system',
  },
  {
    id: '2',
    type: 'info',
    message: 'Loading workspace...',
    timestamp: new Date(Date.now() - 100000),
    source: 'workspace',
  },
  {
    id: '3',
    type: 'success',
    message: 'Workspace loaded: 18 files found',
    timestamp: new Date(Date.now() - 80000),
    source: 'workspace',
  },
  {
    id: '4',
    type: 'info',
    message: 'Ready for editing',
    timestamp: new Date(Date.now() - 60000),
    source: 'editor',
  },
];

/**
 * Modern App component with OpenSCAD Editor
 */
export function App(): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [code, setCode] = useState(codeExamples['case.scad']);
  const [messages, setMessages] = useState<ConsoleMessage[]>(initialConsoleMessages);
  const [visualizationMode] = useState<VisualizationMode>('solid');

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      const newCode = codeExamples[file.name] || `// ${file.name}\n// Add your OpenSCAD code here...\n\n`;
      setCode(newCode);

      // Add console message for file selection
      const newMessage: ConsoleMessage = {
        id: Date.now().toString(),
        type: 'info',
        message: `Opened file: ${file.name}`,
        timestamp: new Date(),
        source: 'editor',
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleSave = () => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type: 'success',
      message: `Saved file: ${selectedFile?.name || 'untitled.scad'}`,
      timestamp: new Date(),
      source: 'editor',
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFormat = () => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type: 'info',
      message: 'Code formatted successfully',
      timestamp: new Date(),
      source: 'formatter',
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleClearConsole = () => {
    setMessages([]);
  };

  const handleViewChange = (action: string) => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type: 'info',
      message: `3D view: ${action}`,
      timestamp: new Date(),
      source: 'viewer',
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleModelClick = (point: { x: number; y: number; z: number }) => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type: 'debug',
      message: `Model clicked at coordinates: (${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)})`,
      timestamp: new Date(),
      source: 'viewer',
    };
    setMessages(prev => [...prev, newMessage]);
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
        <EditorLayout variant="default" responsive>
          {/* File Explorer Panel */}
          <FileExplorer
            files={mockFileTree}
            onFileSelect={handleFileSelect}
            showIcons
            width={280}
            aria-label="Project File Explorer"
          />

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Top Section: Code Editor + 3D Visualization */}
            <div className="flex-1 flex">
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                language="openscad"
                showLineNumbers
                onSave={handleSave}
                onFormat={handleFormat}
                placeholder={selectedFile ? `Editing ${selectedFile.name}...` : "Select a file to start editing..."}
                aria-label="OpenSCAD Code Editor"
              />

              <VisualizationPanel
                mode={visualizationMode}
                width={380}
                showControls
                onViewChange={handleViewChange}
                onModelClick={handleModelClick}
                aria-label="3D Model Visualization"
              />
            </div>

            {/* Bottom Section: Console Panel */}
            <ConsolePanel
              messages={messages}
              height={180}
              showControls
              showTimestamps
              autoScroll
              onClear={handleClearConsole}
              aria-label="Console Output"
            />
          </div>
        </EditorLayout>
      </_ErrorBoundary>
    </div>
  );
}

export default App;
