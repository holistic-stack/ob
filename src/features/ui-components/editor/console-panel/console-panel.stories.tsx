import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import { ConsolePanel } from './console-panel';
import type { ConsoleMessage, ConsoleMessageType } from './console-panel';

// Mock console messages
const mockMessages: ConsoleMessage[] = [
  {
    id: '1',
    type: 'info',
    message: 'Application initialized successfully',
    timestamp: new Date(Date.now() - 300000),
    source: 'system',
  },
  {
    id: '2',
    type: 'info',
    message: 'Loading configuration files...',
    timestamp: new Date(Date.now() - 280000),
    source: 'config',
  },
  {
    id: '3',
    type: 'success',
    message: 'Configuration loaded successfully',
    timestamp: new Date(Date.now() - 260000),
    source: 'config',
  },
  {
    id: '4',
    type: 'warning',
    message: 'Deprecated function "oldFunction" used in line 42',
    timestamp: new Date(Date.now() - 240000),
    source: 'parser',
  },
  {
    id: '5',
    type: 'info',
    message: 'Starting compilation process...',
    timestamp: new Date(Date.now() - 220000),
    source: 'compiler',
  },
  {
    id: '6',
    type: 'debug',
    message: 'Processing module: main.scad',
    timestamp: new Date(Date.now() - 200000),
    source: 'compiler',
  },
  {
    id: '7',
    type: 'debug',
    message: 'Resolving dependencies...',
    timestamp: new Date(Date.now() - 180000),
    source: 'compiler',
  },
  {
    id: '8',
    type: 'error',
    message: 'Syntax error: Missing semicolon at line 15',
    timestamp: new Date(Date.now() - 160000),
    source: 'parser',
  },
  {
    id: '9',
    type: 'info',
    message: 'Retrying compilation after error fix...',
    timestamp: new Date(Date.now() - 140000),
    source: 'compiler',
  },
  {
    id: '10',
    type: 'success',
    message: 'Compilation completed successfully',
    timestamp: new Date(Date.now() - 120000),
    source: 'compiler',
  },
  {
    id: '11',
    type: 'info',
    message: 'Generating 3D model...',
    timestamp: new Date(Date.now() - 100000),
    source: 'renderer',
  },
  {
    id: '12',
    type: 'success',
    message: 'Model generated: 1,247 triangles, 623 vertices',
    timestamp: new Date(Date.now() - 80000),
    source: 'renderer',
  },
  {
    id: '13',
    type: 'info',
    message: 'Export completed: model.stl (2.3 MB)',
    timestamp: new Date(Date.now() - 60000),
    source: 'exporter',
  },
];

const meta: Meta<typeof ConsolePanel> = {
  title: 'Editor/ConsolePanel',
  component: ConsolePanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Console output panel for displaying logs and messages with glass morphism effects, filtering, and auto-scroll.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    filter: {
      control: { type: 'select' },
      options: ['all', 'info', 'warning', 'error', 'success', 'debug'],
      description: 'Filter messages by type',
    },
    showTimestamps: {
      control: { type: 'boolean' },
      description: 'Whether to show message timestamps',
    },
    showControls: {
      control: { type: 'boolean' },
      description: 'Whether to show control buttons',
    },
    autoScroll: {
      control: { type: 'boolean' },
      description: 'Whether to auto-scroll to bottom',
    },
    height: {
      control: { type: 'number', min: 150, max: 400, step: 10 },
      description: 'Height of the console panel',
    },
    maxMessages: {
      control: { type: 'number', min: 10, max: 1000, step: 10 },
      description: 'Maximum number of messages to display',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the panel is over a light background',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    messages: mockMessages,
    showTimestamps: true,
    showControls: true,
    autoScroll: true,
    height: 200,
  },
};

export const WithoutTimestamps: Story = {
  args: {
    messages: mockMessages,
    showTimestamps: false,
    showControls: true,
    autoScroll: true,
    height: 200,
  },
};

export const WithoutControls: Story = {
  args: {
    messages: mockMessages,
    showTimestamps: true,
    showControls: false,
    autoScroll: true,
    height: 200,
  },
};

export const ErrorsOnly: Story = {
  args: {
    messages: mockMessages,
    filter: 'error',
    showTimestamps: true,
    showControls: true,
    autoScroll: true,
    height: 200,
  },
};

export const WarningsOnly: Story = {
  args: {
    messages: mockMessages,
    filter: 'warning',
    showTimestamps: true,
    showControls: true,
    autoScroll: true,
    height: 200,
  },
};

export const SuccessOnly: Story = {
  args: {
    messages: mockMessages,
    filter: 'success',
    showTimestamps: true,
    showControls: true,
    autoScroll: true,
    height: 200,
  },
};

export const Compact: Story = {
  args: {
    messages: mockMessages.slice(0, 5),
    showTimestamps: false,
    showControls: false,
    autoScroll: true,
    height: 120,
  },
};

export const Tall: Story = {
  args: {
    messages: mockMessages,
    showTimestamps: true,
    showControls: true,
    autoScroll: true,
    height: 350,
  },
};

export const Empty: Story = {
  args: {
    messages: [],
    showTimestamps: true,
    showControls: true,
    autoScroll: true,
    height: 200,
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [messages, setMessages] = useState(mockMessages.slice(0, 5));
    const [filter, setFilter] = useState<ConsoleMessageType | 'all'>('all');
    const [isStreaming, setIsStreaming] = useState(false);

    const messageTypes: ConsoleMessageType[] = ['info', 'warning', 'error', 'success', 'debug'];
    
    const addRandomMessage = () => {
      const type = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      const messages_examples = {
        info: ['Processing file...', 'Loading module...', 'Starting operation...'],
        warning: ['Deprecated function used', 'Performance warning', 'Memory usage high'],
        error: ['Syntax error detected', 'File not found', 'Compilation failed'],
        success: ['Operation completed', 'File saved successfully', 'Build successful'],
        debug: ['Variable value: 42', 'Function called', 'Memory allocated'],
      };
      
      const newMessage: ConsoleMessage = {
        id: Date.now().toString(),
        type,
        message: messages_examples[type][Math.floor(Math.random() * messages_examples[type].length)],
        timestamp: new Date(),
        source: 'simulator',
      };
      
      setMessages(prev => [...prev, newMessage]);
    };

    const clearMessages = () => {
      setMessages([]);
    };

    const startStreaming = () => {
      setIsStreaming(true);
    };

    const stopStreaming = () => {
      setIsStreaming(false);
    };

    useEffect(() => {
      if (isStreaming) {
        const interval = setInterval(addRandomMessage, 1000);
        return () => clearInterval(interval);
      }
    }, [isStreaming]);

    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={addRandomMessage}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm transition-colors"
          >
            Add Message
          </button>
          <button
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={`px-3 py-1 rounded text-white text-sm transition-colors ${
              isStreaming 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </button>
          <button
            onClick={clearMessages}
            className="px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded text-white text-sm transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <ConsolePanel
          {...args}
          messages={messages}
          filter={filter}
          onFilterChange={setFilter}
          onClear={clearMessages}
          showControls
          showTimestamps
          autoScroll
        />
        
        <div className="bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg p-3 text-white text-sm">
          <p><strong>Total messages:</strong> {messages.length}</p>
          <p><strong>Current filter:</strong> {filter}</p>
          <p><strong>Streaming:</strong> {isStreaming ? 'Active' : 'Inactive'}</p>
        </div>
      </div>
    );
  },
  args: {
    height: 250,
  },
};

export const LightBackground: Story = {
  args: {
    messages: mockMessages,
    showTimestamps: true,
    showControls: true,
    autoScroll: true,
    height: 200,
    overLight: true,
  },
  decorators: [
    (Story) => (
      <div className="w-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
        <Story />
      </div>
    ),
  ],
};
