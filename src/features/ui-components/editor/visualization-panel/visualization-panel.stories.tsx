import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { VisualizationPanel } from './visualization-panel';
import type { ModelData, VisualizationMode } from './visualization-panel';

// Mock 3D model data
const mockModelData: ModelData = {
  vertices: [
    // Cube vertices (simplified)
    -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1, // Bottom face
    -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1, // Top face
  ],
  indices: [
    // Cube faces (simplified)
    0, 1, 2, 0, 2, 3, // Bottom
    4, 7, 6, 4, 6, 5, // Top
    0, 4, 5, 0, 5, 1, // Front
    2, 6, 7, 2, 7, 3, // Back
    0, 3, 7, 0, 7, 4, // Left
    1, 5, 6, 1, 6, 2, // Right
  ],
  normals: [
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Bottom normals
    0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, // Top normals
  ],
};

const meta: Meta<typeof VisualizationPanel> = {
  title: 'Editor/VisualizationPanel',
  component: VisualizationPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '3D visualization panel for displaying 3D models with glass morphism effects and interactive controls.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['solid', 'wireframe', 'points', 'transparent'],
      description: 'Visualization rendering mode',
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
  },
};

export const Wireframe: Story = {
  args: {
    modelData: mockModelData,
    mode: 'wireframe',
  },
};

export const Points: Story = {
  args: {
    modelData: mockModelData,
    mode: 'wireframe',
  },
};

export const Transparent: Story = {
  args: {
    modelData: mockModelData,
    mode: 'transparent',
  },
};

export const Loading: Story = {
  args: {
    mode: 'preview',
  },
};

export const Error: Story = {
  args: {
    mode: 'preview',
  },
};

export const NoModel: Story = {
  args: {
    mode: 'preview',
  },
};

export const WithoutControls: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
  },
};

export const Compact: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
  },
};

export const Large: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [mode, setMode] = useState<VisualizationMode>('solid');
    const [clickEvents, setClickEvents] = useState<Array<{ x: number; y: number; z: number }>>([]);

    const handleModelClick = (point: { x: number; y: number; z: number }) => {
      setClickEvents(prev => [...prev, point]);
      console.log('Model clicked at:', point);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['solid', 'wireframe', 'points', 'transparent'] as VisualizationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-sm transition-colors capitalize ${
                mode === m
                  ? 'bg-blue-500 text-white'
                  : 'bg-black/20 text-white/80 hover:bg-black/40'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        
        <VisualizationPanel
          {...args}
          modelData={mockModelData}
          mode={mode}
        />

        {clickEvents.length > 0 && (
          <div className="bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg p-4 text-white">
            <h3 className="font-semibold mb-2">Click Events:</h3>
            <div className="space-y-1 text-sm">
              {clickEvents.slice(-5).map((event, index) => (
                <div key={index} className="text-white/80">
                  x: {event.x.toFixed(2)}, y: {event.y.toFixed(2)}, z: {event.z.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {},
};

export const LightBackground: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
  },
  decorators: [
    (Story) => (
      <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
        <Story />
      </div>
    ),
  ],
};
