/**
 * Storybook stories for the Liquid Glass Slider component
 * 
 * Demonstrates all slider types, orientations, sizes,
 * and interactive features of the Slider component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Slider } from './slider';
import type { SliderProps, SliderValue } from './slider';

// Simple mock function for Storybook actions
const fn = () => () => console.log('Action triggered');

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof Slider> = {
  title: 'UI Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Liquid Glass Slider

A slider component implementing Apple's Liquid Glass design system with glass morphism effects, 
range support, and accessibility features.

## Features

- **Glass Morphism Effects**: Backdrop blur, transparency, and elevation shadows
- **Single and Range Values**: Support for both single values and range selections
- **Multiple Orientations**: Horizontal and vertical orientations
- **Visual Enhancements**: Value labels, tick marks, and min/max labels
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation
- **Responsive Sizes**: From xs to xl with consistent proportions
- **Custom Formatting**: Support for custom value formatters

## Usage

\`\`\`tsx
import { Slider } from '@/features/ui-components/slider';

<Slider
  value={50}
  min={0}
  max={100}
  label="Volume"
  showValueLabel
  onChange={(value) => setValue(value)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'number' },
      description: 'Current slider value',
    },
    min: {
      control: { type: 'number' },
      description: 'Minimum value',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value',
    },
    step: {
      control: { type: 'number' },
      description: 'Step increment',
    },
    isRange: {
      control: { type: 'boolean' },
      description: 'Whether this is a range slider',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Slider orientation',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the slider',
    },
    showValueLabel: {
      control: { type: 'boolean' },
      description: 'Whether to show value labels',
    },
    showMinMaxLabels: {
      control: { type: 'boolean' },
      description: 'Whether to show min/max labels',
    },
    showTicks: {
      control: { type: 'boolean' },
      description: 'Whether to show tick marks',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the slider is disabled',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the slider is over a light background',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler function',
    },
  },
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Interactive Wrapper Component
// ============================================================================

const InteractiveSlider = (props: Partial<SliderProps>) => {
  const [value, setValue] = useState<SliderValue>(props.value || 50);
  
  return (
    <Slider
      {...props}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        props.onChange?.(newValue);
      }}
    />
  );
};

// ============================================================================
// Default Story
// ============================================================================

export const Default: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 50,
    min: 0,
    max: 100,
    label: 'Volume',
  },
};

// ============================================================================
// Basic Variations
// ============================================================================

export const WithValueLabel: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 75,
    min: 0,
    max: 100,
    label: 'Brightness',
    showValueLabel: true,
  },
};

export const WithMinMaxLabels: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 30,
    min: 0,
    max: 100,
    label: 'Temperature',
    showMinMaxLabels: true,
  },
};

export const WithTicks: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 50,
    min: 0,
    max: 100,
    step: 25,
    label: 'Quality',
    showTicks: true,
    showValueLabel: true,
  },
};

// ============================================================================
// Range Slider Stories
// ============================================================================

export const RangeSlider: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: [25, 75],
    min: 0,
    max: 100,
    isRange: true,
    label: 'Price Range',
    showValueLabel: true,
  },
};

export const RangeWithFormatting: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: [200, 800],
    min: 0,
    max: 1000,
    isRange: true,
    label: 'Budget Range',
    showValueLabel: true,
    showMinMaxLabels: true,
    formatValue: (value: number) => `$${value}`,
  },
};

// ============================================================================
// Sizes Stories
// ============================================================================

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-md">
      <InteractiveSlider value={20} min={0} max={100} size="xs" label="Extra Small" />
      <InteractiveSlider value={40} min={0} max={100} size="sm" label="Small" />
      <InteractiveSlider value={60} min={0} max={100} size="md" label="Medium" />
      <InteractiveSlider value={80} min={0} max={100} size="lg" label="Large" />
      <InteractiveSlider value={100} min={0} max={100} size="xl" label="Extra Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available slider sizes from xs to xl.',
      },
    },
  },
};

// ============================================================================
// Orientation Stories
// ============================================================================

export const Vertical: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 60,
    min: 0,
    max: 100,
    orientation: 'vertical',
    label: 'Vertical Slider',
    showValueLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with vertical orientation.',
      },
    },
  },
};

export const VerticalRange: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: [30, 70],
    min: 0,
    max: 100,
    orientation: 'vertical',
    isRange: true,
    label: 'Vertical Range',
    showValueLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Range slider with vertical orientation.',
      },
    },
  },
};

// ============================================================================
// States Stories
// ============================================================================

export const States: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <InteractiveSlider value={50} min={0} max={100} label="Normal State" />
      <Slider value={50} min={0} max={100} label="Disabled State" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different slider states including normal and disabled.',
      },
    },
  },
};

// ============================================================================
// Theme Stories
// ============================================================================

export const LightTheme: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 65,
    min: 0,
    max: 100,
    label: 'Light Theme Slider',
    showValueLabel: true,
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
        story: 'Slider optimized for light backgrounds with appropriate glass effects.',
      },
    },
  },
};

export const DarkTheme: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 35,
    min: 0,
    max: 100,
    label: 'Dark Theme Slider',
    showValueLabel: true,
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
        story: 'Slider optimized for dark backgrounds with appropriate glass effects.',
      },
    },
  },
};

// ============================================================================
// Advanced Examples
// ============================================================================

export const PercentageSlider: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 85,
    min: 0,
    max: 100,
    step: 5,
    label: 'Completion Percentage',
    showValueLabel: true,
    showTicks: true,
    formatValue: (value: number) => `${value}%`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Slider with percentage formatting and tick marks.',
      },
    },
  },
};

export const TemperatureRange: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: [18, 24],
    min: 10,
    max: 30,
    step: 0.5,
    isRange: true,
    label: 'Temperature Range',
    showValueLabel: true,
    showMinMaxLabels: true,
    formatValue: (value: number) => `${value}°C`,
  },
  parameters: {
    docs: {
      description: {
        story: 'Range slider for temperature control with custom formatting.',
      },
    },
  },
};

export const VolumeControl: Story = {
  render: (args) => <InteractiveSlider {...args} />,
  args: {
    value: 7,
    min: 0,
    max: 10,
    step: 1,
    label: 'Volume Level',
    showValueLabel: true,
    showTicks: true,
    showMinMaxLabels: true,
    formatValue: (value: number) => value === 0 ? 'Mute' : value.toString(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Volume control slider with custom mute formatting.',
      },
    },
  },
};

// ============================================================================
// Showcase Story
// ============================================================================

export const Showcase: Story = {
  render: () => (
    <div className="space-y-8 p-8 w-full max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-6">Single Value Sliders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InteractiveSlider value={30} min={0} max={100} label="Basic" />
          <InteractiveSlider value={70} min={0} max={100} label="With Value" showValueLabel />
          <InteractiveSlider value={50} min={0} max={100} label="With Ticks" showTicks step={25} />
          <InteractiveSlider value={80} min={0} max={100} label="Complete" showValueLabel showMinMaxLabels showTicks step={20} />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Range Sliders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InteractiveSlider value={[20, 80]} min={0} max={100} isRange label="Basic Range" />
          <InteractiveSlider value={[30, 70]} min={0} max={100} isRange label="With Labels" showValueLabel />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Sizes</h2>
        <div className="space-y-4">
          <InteractiveSlider value={25} min={0} max={100} size="xs" label="XS" />
          <InteractiveSlider value={50} min={0} max={100} size="md" label="MD" />
          <InteractiveSlider value={75} min={0} max={100} size="xl" label="XL" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete showcase of all slider types, sizes, and features.',
      },
    },
  },
};
