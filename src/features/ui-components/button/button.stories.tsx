/**
 * Storybook stories for the Liquid Glass Button component
 * 
 * Demonstrates all variants, sizes, states, and configurations
 * of the Button component with interactive controls.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from './button';

// Simple mock function for Storybook actions
const fn = () => () => console.log('Action triggered');

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof Button> = {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Liquid Glass Button

A button component implementing Apple's Liquid Glass design system with glass morphism effects, 
accessibility features, and multiple variants.

## Features

- **Glass Morphism Effects**: Backdrop blur, transparency, and specular highlights
- **Multiple Variants**: Primary, secondary, ghost, and danger styles
- **Responsive Sizes**: From xs to xl with consistent spacing
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation
- **Loading States**: Built-in loading indicator with proper ARIA attributes
- **Browser Compatibility**: Progressive enhancement with fallbacks

## Usage

\`\`\`tsx
import { Button } from '@/features/ui-components/button';

<Button variant="primary" size="md" onClick={() => console.log('clicked')}>
  Click me
</Button>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the button is in loading state',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the button is over a light background',
    },
    children: {
      control: { type: 'text' },
      description: 'Button content',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler function',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Default Story
// ============================================================================

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

// ============================================================================
// Variant Stories
// ============================================================================

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'md',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
    size: 'md',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
    size: 'md',
  },
};

// ============================================================================
// Size Stories
// ============================================================================

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button sizes from xs to xl.',
      },
    },
  },
};

// ============================================================================
// State Stories
// ============================================================================

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different button states including default, disabled, and loading.',
      },
    },
  },
};

// ============================================================================
// Theme Stories
// ============================================================================

export const LightTheme: Story = {
  args: {
    children: 'Light Theme',
    overLight: true,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="p-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Button optimized for light backgrounds with appropriate glass effects.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    children: 'Dark Theme',
    overLight: false,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Button optimized for dark backgrounds with appropriate glass effects.',
      },
    },
  },
};

// ============================================================================
// Glass Configuration Stories
// ============================================================================

export const CustomGlassEffect: Story = {
  args: {
    children: 'Custom Glass',
    glassConfig: {
      blurIntensity: 'xl',
      opacity: 0.3,
      elevation: 'high',
      enableDistortion: true,
      enableSpecularHighlights: true,
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="p-8 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-lg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Button with custom glass morphism configuration including enhanced blur and distortion effects.',
      },
    },
  },
};

// ============================================================================
// Interactive Stories
// ============================================================================

export const Interactive: Story = {
  args: {
    children: 'Interactive Button',
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive button with click handlers. Check the Actions panel to see events.',
      },
    },
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

export const WithAriaLabels: Story = {
  args: {
    children: '🔍',
    'aria-label': 'Search for items',
    'aria-describedby': 'search-description',
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div>
        <Story />
        <p id="search-description" className="mt-2 text-sm text-gray-600">
          Click to open the search dialog
        </p>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Button with proper ARIA labels for accessibility. Uses icon content with descriptive labels.',
      },
    },
  },
};

// ============================================================================
// Complex Content Stories
// ============================================================================

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Item
      </>
    ),
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with icon and text content. Icons are automatically spaced using flexbox.',
      },
    },
  },
};

// ============================================================================
// Showcase Story
// ============================================================================

export const Showcase: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Variants</h3>
        <div className="flex gap-4 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Sizes</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <Button size="xs">XS</Button>
          <Button size="sm">SM</Button>
          <Button size="md">MD</Button>
          <Button size="lg">LG</Button>
          <Button size="xl">XL</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">States</h3>
        <div className="flex gap-4 flex-wrap">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete showcase of all button variants, sizes, and states.',
      },
    },
  },
};
