import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { GridLayout } from '../../../../ui-components';

// GridLayout Showcase Component
const GridLayoutShowcase: React.FC = () => {
  return (
    <GridLayout
      className="h-full w-full"
      aria-label="GridLayout Showcase"
    />
  );
};

const meta: Meta = {
  title: 'Layout/GridLayout',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# GridLayout Component

The primary layout component for the OpenSCAD-R3F application, implementing a professional 12-column grid system with integrated Monaco Editor and Three.js visualization.

## Features

- **12-Column Grid System**: Tailwind CSS \`grid-cols-12\` implementation
- **Monaco Editor Integration**: 5 columns (left side) with OpenSCAD syntax highlighting
- **Three.js Visualization**: 7 columns (right side) with React Three Fiber rendering
- **Responsive Design**: Full viewport dimensions (\`w-full h-full\`)
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels
- **Glass Morphism**: Integrated liquid glass design system

## Architecture

This component follows Single Responsibility Principle (SRP) by focusing solely on layout structure without business logic. It replaces the deprecated AppLayout system with a cleaner, more maintainable approach.

## Usage

\`\`\`tsx
import { GridLayout } from '@/features/ui-components/layout';

<GridLayout
  className="h-full w-full"
  aria-label="12-Column Grid Layout"
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default GridLayout with Monaco Editor (5 cols) and Three.js visualization (7 cols)
 * Demonstrates the standard 12-column grid implementation with glass morphism effects
 */
export const Default: Story = {
  render: () => (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <GridLayoutShowcase />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Standard GridLayout implementation showcasing the 12-column grid with Monaco Editor (5 columns) and Three.js visualization (7 columns). Features integrated glass morphism effects and responsive design.',
      },
    },
  },
};

/**
 * Dark theme variant optimized for professional development environments
 * Demonstrates GridLayout with darker background gradients for reduced eye strain
 */
export const DarkTheme: Story = {
  render: () => (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 p-4">
      <GridLayoutShowcase />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dark theme variant of GridLayout with professional gray gradients. Ideal for extended development sessions with reduced eye strain while maintaining the 12-column grid structure.',
      },
    },
  },
};

/**
 * Cyberpunk-inspired theme showcasing GridLayout with vibrant cyan-blue gradients
 * Demonstrates the flexibility of the grid system with different visual themes
 */
export const CyberpunkTheme: Story = {
  render: () => (
    <div className="h-screen bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 p-4">
      <GridLayoutShowcase />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cyberpunk-inspired theme with vibrant cyan-blue gradients. Demonstrates how GridLayout adapts to different visual themes while maintaining consistent 12-column structure and component integration.',
      },
    },
  },
};
