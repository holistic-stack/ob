import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { FileExplorer } from './file-explorer';
import type { FileNode } from './file-explorer';

// Mock file tree data
const mockFiles: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        children: [
          { id: '3', name: 'Button.tsx', type: 'file', size: 2048 },
          { id: '4', name: 'Card.tsx', type: 'file', size: 1536 },
          { id: '5', name: 'Input.tsx', type: 'file', size: 1024 },
        ],
      },
      {
        id: '6',
        name: 'utils',
        type: 'folder',
        children: [
          { id: '7', name: 'helpers.ts', type: 'file', size: 512 },
          { id: '8', name: 'constants.ts', type: 'file', size: 256 },
        ],
      },
      { id: '9', name: 'main.tsx', type: 'file', size: 1024 },
      { id: '10', name: 'App.tsx', type: 'file', size: 2048 },
    ],
  },
  {
    id: '11',
    name: 'public',
    type: 'folder',
    children: [
      { id: '12', name: 'index.html', type: 'file', size: 1024 },
      { id: '13', name: 'favicon.ico', type: 'file', size: 128 },
    ],
  },
  { id: '14', name: 'package.json', type: 'file', size: 512 },
  { id: '15', name: 'README.md', type: 'file', size: 1024 },
  { id: '16', name: 'tsconfig.json', type: 'file', size: 256 },
];

const meta: Meta<typeof FileExplorer> = {
  title: 'Editor/FileExplorer',
  component: FileExplorer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'File tree navigation component with glass morphism effects, folder expansion, and file selection.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showIcons: {
      control: { type: 'boolean' },
      description: 'Whether to show file type icons',
    },
    width: {
      control: { type: 'number', min: 200, max: 400, step: 10 },
      description: 'Width of the file explorer panel',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the explorer is over a light background',
    },
  },
  decorators: [
    (Story) => (
      <div className="h-96 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    files: mockFiles,
    showIcons: true,
    width: 250,
  },
};

export const WithoutIcons: Story = {
  args: {
    files: mockFiles,
    showIcons: false,
    width: 250,
  },
};

export const Narrow: Story = {
  args: {
    files: mockFiles,
    showIcons: true,
    width: 200,
  },
};

export const Wide: Story = {
  args: {
    files: mockFiles,
    showIcons: true,
    width: 350,
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

    const handleFileSelect = (file: FileNode) => {
      setSelectedFile(file);
      console.log('Selected file:', file);
    };

    const handleFolderToggle = (folder: FileNode, expanded: boolean) => {
      if (expanded) {
        setExpandedFolders(prev => [...prev, folder.id]);
      } else {
        setExpandedFolders(prev => prev.filter(id => id !== folder.id));
      }
      console.log('Folder toggled:', folder.name, expanded);
    };

    return (
      <div className="space-y-4">
        <FileExplorer
          {...args}
          files={mockFiles}
          onFileSelect={handleFileSelect}
          onFolderToggle={handleFolderToggle}
        />
        {selectedFile && (
          <div className="bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg p-4 text-white">
            <h3 className="font-semibold mb-2">Selected File:</h3>
            <p><strong>Name:</strong> {selectedFile.name}</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
            {selectedFile.size && (
              <p><strong>Size:</strong> {Math.round(selectedFile.size / 1024)}KB</p>
            )}
          </div>
        )}
      </div>
    );
  },
  args: {
    showIcons: true,
    width: 280,
  },
};

export const LightBackground: Story = {
  args: {
    files: mockFiles,
    showIcons: true,
    width: 250,
    overLight: true,
  },
  decorators: [
    (Story) => (
      <div className="h-96 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
        <Story />
      </div>
    ),
  ],
};
