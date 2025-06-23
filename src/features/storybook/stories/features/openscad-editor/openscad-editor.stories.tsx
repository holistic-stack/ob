import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { EditorLayout } from './editor-layout';
import { FileExplorer } from './file-explorer';
import { CodeEditor } from './code-editor';
import { VisualizationPanel } from './visualization-panel';
import { ConsolePanel } from './console-panel';
import type { FileNode, ConsoleMessage, VisualizationMode } from './index';

// Mock file tree data
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
        ],
      },
      {
        id: '5',
        name: 'gear-system',
        type: 'folder',
        children: [
          { id: '6', name: 'gear.scad', type: 'file', size: 3072 },
          { id: '7', name: 'assembly.scad', type: 'file', size: 1536 },
        ],
      },
    ],
  },
  {
    id: '8',
    name: 'examples',
    type: 'folder',
    children: [
      { id: '9', name: 'cube.scad', type: 'file', size: 512 },
      { id: '10', name: 'sphere.scad', type: 'file', size: 256 },
    ],
  },
  { id: '11', name: 'README.md', type: 'file', size: 1024 },
];

// Code examples for different files
const codeExamples: Record<string, string> = {
  'case.scad': `// Arduino Case Design
module arduino_case() {
  difference() {
    // Main case body
    cube([60, 40, 15], center=true);
    
    // Internal cavity
    translate([0, 0, 2])
      cube([56, 36, 12], center=true);
    
    // USB port cutout
    translate([28, 0, -2])
      cube([8, 12, 10], center=true);
    
    // Power jack cutout
    translate([-28, 10, -2])
      cylinder(h=10, r=4, center=true);
  }
  
  // Mounting posts
  for(x = [-25, 25]) {
    for(y = [-15, 15]) {
      translate([x, y, -5])
        cylinder(h=8, r=1.5);
    }
  }
}

arduino_case();`,
  
  'gear.scad': `// Parametric Gear Generator
module gear(teeth=20, pitch=5, thickness=3) {
  pitch_radius = teeth * pitch / (2 * PI);
  
  linear_extrude(height=thickness) {
    difference() {
      circle(r=pitch_radius + 2);
      circle(r=2); // Center hole
    }
    
    // Gear teeth
    for(i = [0:teeth-1]) {
      rotate([0, 0, i * 360/teeth])
        translate([pitch_radius, 0, 0])
          circle(r=1);
    }
  }
}

// Generate gear system
translate([-15, 0, 0]) gear(teeth=16, pitch=3);
translate([15, 0, 0]) gear(teeth=24, pitch=3);`,
  
  'cube.scad': `// Simple Cube Example
cube([10, 10, 10], center=true);`,
};

// Mock console messages
const mockConsoleMessages: ConsoleMessage[] = [
  {
    id: '1',
    type: 'info',
    message: 'OpenSCAD Editor initialized',
    timestamp: new Date(Date.now() - 60000),
    source: 'system',
  },
  {
    id: '2',
    type: 'info',
    message: 'Loading file: case.scad',
    timestamp: new Date(Date.now() - 45000),
    source: 'editor',
  },
  {
    id: '3',
    type: 'success',
    message: 'Syntax check passed',
    timestamp: new Date(Date.now() - 30000),
    source: 'parser',
  },
  {
    id: '4',
    type: 'info',
    message: 'Starting 3D rendering...',
    timestamp: new Date(Date.now() - 15000),
    source: 'renderer',
  },
  {
    id: '5',
    type: 'success',
    message: 'Model rendered successfully (1,247 triangles)',
    timestamp: new Date(Date.now() - 5000),
    source: 'renderer',
  },
];

// Interactive Editor Component
const InteractiveEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [code, setCode] = useState(codeExamples['case.scad']);
  const [messages, setMessages] = useState(mockConsoleMessages);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('solid');
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success' | 'debug'>('all');

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      const newCode = codeExamples[file.name] || `// ${file.name}\n// Add your code here...`;
      setCode(newCode);
      
      // Add console message
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

  const handleClearConsole = () => {
    setMessages([]);
  };

  const handleViewChange = (action: string) => {
    const newMessage: ConsoleMessage = {
      id: Date.now().toString(),
      type: 'info',
      message: `View changed: ${action}`,
      timestamp: new Date(),
      source: 'viewer',
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <EditorLayout variant="default" responsive>
      <FileExplorer 
        files={mockFileTree}
        onFileSelect={handleFileSelect}
        showIcons
        width={280}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          <CodeEditor 
            value={code}
            onChange={handleCodeChange}
            language="openscad"
            showLineNumbers
            onSave={handleSave}
            placeholder="Select a file to start editing..."
          />
          
          <VisualizationPanel 
            mode={visualizationMode}
            width={380}
            showControls
            onViewChange={handleViewChange}
          />
        </div>
        
        <ConsolePanel 
          messages={messages}
          filter={consoleFilter}
          onFilterChange={setConsoleFilter}
          height={180}
          showControls
          showTimestamps
          autoScroll
          onClear={handleClearConsole}
        />
      </div>
    </EditorLayout>
  );
};

const meta: Meta = {
  title: 'Editor/Complete Editor Showcase',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete interactive code editor interface showcasing all editor components working together with glass morphism effects.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteEditor: Story = {
  render: () => (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <InteractiveEditor />
    </div>
  ),
};

export const DarkTheme: Story = {
  render: () => (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 p-4">
      <InteractiveEditor />
    </div>
  ),
};

export const CyberpunkTheme: Story = {
  render: () => (
    <div className="h-screen bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 p-4">
      <InteractiveEditor />
    </div>
  ),
};
