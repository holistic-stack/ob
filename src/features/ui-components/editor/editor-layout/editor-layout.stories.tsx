import type { Meta, StoryObj } from '@storybook/react';
import { EditorLayout } from './editor-layout';
import { FileExplorer } from '../file-explorer';
import { CodeEditor } from '../code-editor';
import { VisualizationPanel } from '../visualization-panel';
import { ConsolePanel } from '../console-panel';

// Mock data for the stories
const mockFiles = [
  {
    id: '1',
    name: 'src',
    type: 'folder' as const,
    children: [
      { id: '2', name: 'main.scad', type: 'file' as const, size: 1024 },
      { id: '3', name: 'utils.scad', type: 'file' as const, size: 512 },
    ],
  },
  { id: '4', name: 'README.md', type: 'file' as const, size: 256 },
];

const mockCode = `// OpenSCAD Example
module cube_with_hole() {
  difference() {
    cube([10, 10, 10], center=true);
    cylinder(h=12, r=3, center=true);
  }
}

cube_with_hole();`;

const mockMessages = [
  {
    id: '1',
    type: 'info' as const,
    message: 'Compilation started...',
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'success' as const,
    message: 'Model compiled successfully',
    timestamp: new Date(),
  },
];

const meta: Meta<typeof EditorLayout> = {
  title: 'Editor/EditorLayout',
  component: EditorLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main layout component for the code editor interface with glass morphism effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'compact', 'expanded'],
      description: 'Layout variant affecting spacing and sizing',
    },
    responsive: {
      control: { type: 'boolean' },
      description: 'Whether to use responsive layout',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the layout is over a light background',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    responsive: true,
  },
  render: (args) => (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <EditorLayout {...args}>
        <FileExplorer files={mockFiles} width={250} />
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <CodeEditor 
              value={mockCode}
              language="openscad"
              showLineNumbers
            />
            <VisualizationPanel 
              width={350}
              showControls
            />
          </div>
          <ConsolePanel 
            messages={mockMessages}
            height={150}
            showControls
            showTimestamps
          />
        </div>
      </EditorLayout>
    </div>
  ),
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    responsive: true,
  },
  render: (args) => (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <EditorLayout {...args}>
        <FileExplorer files={mockFiles} width={200} />
        <div className="flex-1 flex flex-col">
          <CodeEditor 
            value={mockCode}
            language="openscad"
            showLineNumbers
          />
          <ConsolePanel 
            messages={mockMessages}
            height={120}
            showControls={false}
          />
        </div>
      </EditorLayout>
    </div>
  ),
};

export const Expanded: Story = {
  args: {
    variant: 'expanded',
    responsive: true,
  },
  render: (args) => (
    <div className="h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
      <EditorLayout {...args}>
        <FileExplorer files={mockFiles} width={300} />
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <CodeEditor 
              value={mockCode}
              language="openscad"
              showLineNumbers
            />
            <VisualizationPanel 
              width={400}
              height={500}
              showControls
            />
          </div>
          <ConsolePanel 
            messages={mockMessages}
            height={200}
            showControls
            showTimestamps
          />
        </div>
      </EditorLayout>
    </div>
  ),
};

export const MobileLayout: Story = {
  args: {
    variant: 'default',
    responsive: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => (
    <div className="h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900">
      <EditorLayout {...args}>
        <div className="flex flex-col h-full">
          <CodeEditor 
            value={mockCode}
            language="openscad"
            showLineNumbers
          />
          <ConsolePanel 
            messages={mockMessages}
            height={100}
            showControls={false}
          />
        </div>
      </EditorLayout>
    </div>
  ),
};
