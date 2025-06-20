/**
 * Storybook stories for the Liquid Glass Card component
 * 
 * Demonstrates all variants, elevation levels, padding options,
 * and interactive features of the Card component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card } from './card';

// Simple mock function for Storybook actions
const fn = () => () => console.log('Action triggered');

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof Card> = {
  title: 'UI Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Liquid Glass Card

A card component implementing Apple's Liquid Glass design system with glass morphism effects, 
multiple variants, and accessibility features.

## Features

- **Glass Morphism Effects**: Backdrop blur, transparency, and elevation shadows
- **Multiple Variants**: Default, bordered, elevated, and interactive styles
- **Flexible Layout**: Configurable padding and HTML element types
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation
- **Interactive Support**: Click handlers with proper focus management
- **Semantic HTML**: Support for section, article, aside, and main elements

## Usage

\`\`\`tsx
import { Card } from '@/features/ui-components/card';

<Card variant="interactive" elevation="medium" onClick={() => console.log('clicked')}>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'bordered', 'elevated', 'interactive'],
      description: 'Visual style variant of the card',
    },
    elevation: {
      control: { type: 'select' },
      options: ['low', 'medium', 'high', 'floating'],
      description: 'Shadow elevation level',
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Internal padding level',
    },
    as: {
      control: { type: 'select' },
      options: ['div', 'section', 'article', 'aside', 'main'],
      description: 'HTML element to render as',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the card is over a light background',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler (only works with interactive variant)',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Default Story
// ============================================================================

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Default Card</h3>
        <p className="text-gray-600">This is a default card with glass morphism effects.</p>
      </div>
    ),
    variant: 'default',
    elevation: 'medium',
    padding: 'md',
  },
};

// ============================================================================
// Variant Stories
// ============================================================================

export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Default</h3>
        <p className="text-gray-600">Glass morphism with backdrop blur</p>
      </Card>
      
      <Card variant="bordered" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Bordered</h3>
        <p className="text-gray-600">Solid border with subtle background</p>
      </Card>
      
      <Card variant="elevated" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Elevated</h3>
        <p className="text-gray-600">Enhanced shadow with solid background</p>
      </Card>
      
      <Card variant="interactive" padding="lg" onClick={fn()}>
        <h3 className="text-lg font-semibold mb-2">Interactive</h3>
        <p className="text-gray-600">Clickable with hover effects</p>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'All available card variants with their distinct visual styles.',
      },
    },
  },
};

// ============================================================================
// Elevation Stories
// ============================================================================

export const Elevations: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
      <Card elevation="low" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Low Elevation</h3>
        <p className="text-gray-600">Subtle shadow for minimal depth</p>
      </Card>
      
      <Card elevation="medium" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Medium Elevation</h3>
        <p className="text-gray-600">Balanced shadow for standard depth</p>
      </Card>
      
      <Card elevation="high" padding="lg">
        <h3 className="text-lg font-semibold mb-2">High Elevation</h3>
        <p className="text-gray-600">Strong shadow for prominent depth</p>
      </Card>
      
      <Card elevation="floating" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Floating Elevation</h3>
        <p className="text-gray-600">Maximum shadow for floating effect</p>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Different elevation levels showing varying shadow depths.',
      },
    },
  },
};

// ============================================================================
// Padding Stories
// ============================================================================

export const Padding: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <Card padding="none" className="border border-dashed border-gray-300">
        <div className="bg-blue-100 p-2">No Padding</div>
      </Card>
      
      <Card padding="sm" className="border border-dashed border-gray-300">
        <div className="bg-blue-100 -m-3">Small Padding</div>
      </Card>
      
      <Card padding="md" className="border border-dashed border-gray-300">
        <div className="bg-blue-100 -m-4">Medium Padding</div>
      </Card>
      
      <Card padding="lg" className="border border-dashed border-gray-300">
        <div className="bg-blue-100 -m-6">Large Padding</div>
      </Card>
      
      <Card padding="xl" className="border border-dashed border-gray-300">
        <div className="bg-blue-100 -m-8">Extra Large Padding</div>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Different padding levels with visual indicators showing the internal spacing.',
      },
    },
  },
};

// ============================================================================
// Interactive Stories
// ============================================================================

export const Interactive: Story = {
  args: {
    variant: 'interactive',
    children: (
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
        <p className="text-gray-600 mb-4">Click me or use keyboard navigation!</p>
        <div className="text-sm text-blue-600">
          ✨ Hover for scale effect • ⌨️ Tab to focus • ↵ Enter to activate
        </div>
      </div>
    ),
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive card with click handlers and keyboard navigation. Check the Actions panel to see events.',
      },
    },
  },
};

// ============================================================================
// Theme Stories
// ============================================================================

export const LightTheme: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Light Theme Card</h3>
        <p className="text-gray-600">Optimized for light backgrounds</p>
      </div>
    ),
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
        story: 'Card optimized for light backgrounds with appropriate glass effects.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2 text-white">Dark Theme Card</h3>
        <p className="text-gray-300">Optimized for dark backgrounds</p>
      </div>
    ),
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
        story: 'Card optimized for dark backgrounds with appropriate glass effects.',
      },
    },
  },
};

// ============================================================================
// Semantic HTML Stories
// ============================================================================

export const SemanticElements: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <Card as="section" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Section Element</h3>
        <p className="text-gray-600">Rendered as &lt;section&gt; for content sections</p>
      </Card>
      
      <Card as="article" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Article Element</h3>
        <p className="text-gray-600">Rendered as &lt;article&gt; for standalone content</p>
      </Card>
      
      <Card as="aside" padding="lg">
        <h3 className="text-lg font-semibold mb-2">Aside Element</h3>
        <p className="text-gray-600">Rendered as &lt;aside&gt; for sidebar content</p>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story: 'Cards rendered as different semantic HTML elements for better accessibility.',
      },
    },
  },
};

// ============================================================================
// Complex Content Stories
// ============================================================================

export const ComplexContent: Story = {
  args: {
    variant: 'elevated',
    padding: 'lg',
    children: (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Product Card</h3>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
            In Stock
          </span>
        </div>
        
        <div className="mb-4">
          <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-3"></div>
          <p className="text-gray-600 text-sm">
            High-quality product with premium features and excellent customer reviews.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-blue-600">$99.99</span>
            <span className="text-sm text-gray-500 line-through ml-2">$129.99</span>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Add to Cart
          </button>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with complex content including images, pricing, and interactive elements.',
      },
    },
  },
};

// ============================================================================
// Showcase Story
// ============================================================================

export const Showcase: Story = {
  render: () => (
    <div className="space-y-8 p-8 w-full max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold mb-6">Card Variants</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default" padding="md">
            <h4 className="font-semibold mb-2">Default</h4>
            <p className="text-sm text-gray-600">Glass morphism</p>
          </Card>
          <Card variant="bordered" padding="md">
            <h4 className="font-semibold mb-2">Bordered</h4>
            <p className="text-sm text-gray-600">Solid border</p>
          </Card>
          <Card variant="elevated" padding="md">
            <h4 className="font-semibold mb-2">Elevated</h4>
            <p className="text-sm text-gray-600">Enhanced shadow</p>
          </Card>
          <Card variant="interactive" padding="md" onClick={fn()}>
            <h4 className="font-semibold mb-2">Interactive</h4>
            <p className="text-sm text-gray-600">Clickable</p>
          </Card>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Elevation Levels</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card elevation="low" padding="md">
            <h4 className="font-semibold">Low</h4>
          </Card>
          <Card elevation="medium" padding="md">
            <h4 className="font-semibold">Medium</h4>
          </Card>
          <Card elevation="high" padding="md">
            <h4 className="font-semibold">High</h4>
          </Card>
          <Card elevation="floating" padding="md">
            <h4 className="font-semibold">Floating</h4>
          </Card>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete showcase of all card variants and elevation levels.',
      },
    },
  },
};
