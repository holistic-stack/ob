import type { Meta, StoryObj } from '@storybook/react';
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
  faces: [
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
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the panel is in loading state',
    },
    showControls: {
      control: { type: 'boolean' },
      description: 'Whether to show view control buttons',
    },
    width: {
      control: { type: 'number', min: 250, max: 500, step: 10 },
      description: 'Width of the visualization panel',
    },
    height: {
      control: { type: 'number', min: 200, max: 600, step: 10 },
      description: 'Height of the visualization panel',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the panel is over a light background',
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
    width: 350,
    height: 400,
  },
};

export const Wireframe: Story = {
  args: {
    modelData: mockModelData,
    mode: 'wireframe',
    width: 350,
    height: 400,
  },
};

export const Points: Story = {
  args: {
    modelData: mockModelData,
    mode: 'points',
    width: 350,
    height: 400,
  },
};

export const Transparent: Story = {
  args: {
    modelData: mockModelData,
    mode: 'transparent',
    width: 350,
    height: 400,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    showControls: true,
    width: 350,
    height: 400,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load 3D model. Please check the file format.',
    showControls: true,
    width: 350,
    height: 400,
  },
};

export const NoModel: Story = {
  args: {
    showControls: true,
    width: 350,
    height: 400,
  },
};

export const WithoutControls: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
    showControls: false,
    width: 350,
    height: 400,
  },
};

export const Compact: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
    showControls: true,
    width: 250,
    height: 200,
  },
};

export const Large: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
    showControls: true,
    width: 500,
    height: 600,
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
          onModelClick={handleModelClick}
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
  args: {
    width: 380,
    height: 400,
  },
};

export const LightBackground: Story = {
  args: {
    modelData: mockModelData,
    mode: 'solid',
    width: 350,
    height: 400,
    overLight: true,
  },
  decorators: [
    (Story) => (
      <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
        <Story />
      </div>
    ),
  ],
};
