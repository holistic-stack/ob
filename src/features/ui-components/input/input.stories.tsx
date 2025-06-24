/**
 * Storybook stories for the Liquid Glass Input component
 * 
 * Demonstrates all input types, validation states, sizes,
 * and interactive features of the Input component.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Input } from './input';

// Simple mock function for Storybook actions
const fn = () => () => console.log('Action triggered');

// ============================================================================
// Story Configuration
// ============================================================================

const meta: Meta<typeof Input> = {
  title: 'UI Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Liquid Glass Input

An input component implementing Apple's Liquid Glass design system with glass morphism effects, 
validation states, and accessibility features.

## Features

- **Glass Morphism Effects**: Backdrop blur, transparency, and elevation shadows
- **Multiple Input Types**: Text, email, password, search, and number inputs
- **Validation States**: Error, success, warning, and default states with messages
- **Icon Support**: Left and right icons with automatic padding adjustment
- **Accessibility**: Full WCAG 2.1 AA compliance with proper ARIA attributes
- **Responsive Sizes**: From xs to xl with consistent spacing
- **Label and Helper Text**: Built-in label and helper text support

## Usage

\`\`\`tsx
import { Input } from '@/features/ui-components/input';

<Input
  type="email"
  label="Email Address"
  placeholder="Enter your email"
  validationState="error"
  error="Please enter a valid email"
  onChange={(e) => setValue(e.target.value)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'search', 'number'],
      description: 'Input type',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Size of the input',
    },
    validationState: {
      control: { type: 'select' },
      options: ['default', 'error', 'success', 'warning'],
      description: 'Validation state',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the input is required',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the input is over a light background',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    label: {
      control: { type: 'text' },
      description: 'Label text',
    },
    helperText: {
      control: { type: 'text' },
      description: 'Helper text',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler function',
    },
  },
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Default Story
// ============================================================================

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    size: 'md',
  },
};

// ============================================================================
// Input Types Stories
// ============================================================================

export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input type="text" label="Text Input" placeholder="Enter text" />
      <Input type="email" label="Email Input" placeholder="Enter email" />
      <Input type="password" label="Password Input" placeholder="Enter password" />
      <Input type="search" label="Search Input" placeholder="Search..." />
      <Input type="number" label="Number Input" placeholder="Enter number" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available input types with their specific behaviors and validation.',
      },
    },
  },
};

// ============================================================================
// Sizes Stories
// ============================================================================

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input size="xs" label="Extra Small" placeholder="XS input" />
      <Input size="sm" label="Small" placeholder="SM input" />
      <Input size="md" label="Medium" placeholder="MD input" />
      <Input size="lg" label="Large" placeholder="LG input" />
      <Input size="xl" label="Extra Large" placeholder="XL input" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available input sizes from xs to xl.',
      },
    },
  },
};

// ============================================================================
// Validation States Stories
// ============================================================================

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input
        label="Default State"
        placeholder="Enter text"
        helperText="This is helper text"
      />
      <Input
        label="Success State"
        placeholder="Enter text"
        validationState="success"
        helperText="Input is valid"
      />
      <Input
        label="Warning State"
        placeholder="Enter text"
        validationState="warning"
        helperText="Please double-check this value"
      />
      <Input
        label="Error State"
        placeholder="Enter text"
        validationState="error"
        error="This field is required"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different validation states with appropriate styling and messages.',
      },
    },
  },
};

// ============================================================================
// With Icons Stories
// ============================================================================

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input
        label="Search with Left Icon"
        placeholder="Search..."
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
      <Input
        label="Email with Right Icon"
        type="email"
        placeholder="Enter email"
        validationState="success"
        rightIcon={
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        }
      />
      <Input
        label="Password with Both Icons"
        type="password"
        placeholder="Enter password"
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        }
        rightIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        }
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs with left icons, right icons, and both icons. Padding adjusts automatically.',
      },
    },
  },
};

// ============================================================================
// States Stories
// ============================================================================

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Input label="Normal State" placeholder="Enter text" />
      <Input label="Disabled State" placeholder="Enter text" disabled />
      <Input label="Required Field" placeholder="Enter text" required />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different input states including normal, disabled, and required.',
      },
    },
  },
};

// ============================================================================
// Theme Stories
// ============================================================================

export const LightTheme: Story = {
  args: {
    label: 'Light Theme Input',
    placeholder: 'Enter text...',
    overLight: true,
    helperText: 'Optimized for light backgrounds',
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
        story: 'Input optimized for light backgrounds with appropriate glass effects.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    label: 'Dark Theme Input',
    placeholder: 'Enter text...',
    overLight: false,
    helperText: 'Optimized for dark backgrounds',
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
        story: 'Input optimized for dark backgrounds with appropriate glass effects.',
      },
    },
  },
};

// ============================================================================
// Interactive Stories
// ============================================================================

export const Interactive: Story = {
  args: {
    label: 'Interactive Input',
    placeholder: 'Type something...',
    helperText: 'Watch the Actions panel for events',
    onChange: fn(),
    onFocus: fn(),
    onBlur: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive input with event handlers. Check the Actions panel to see events.',
      },
    },
  },
};

// ============================================================================
// Form Example Stories
// ============================================================================

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <h3 className="text-lg font-semibold">Contact Form</h3>
      
      <Input
        type="text"
        label="Full Name"
        placeholder="Enter your full name"
        required
      />
      
      <Input
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        required
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        }
      />
      
      <Input
        type="text"
        label="Company"
        placeholder="Enter your company"
        helperText="Optional field"
      />
      
      <Input
        type="search"
        label="How did you hear about us?"
        placeholder="Search options..."
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of inputs used in a contact form with various types and configurations.',
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
        <h2 className="text-2xl font-bold mb-6">Input Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="text" label="Text" placeholder="Enter text" />
          <Input type="email" label="Email" placeholder="Enter email" />
          <Input type="password" label="Password" placeholder="Enter password" />
          <Input type="search" label="Search" placeholder="Search..." />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Validation States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Default" placeholder="Enter text" helperText="Helper text" />
          <Input label="Success" placeholder="Enter text" validationState="success" />
          <Input label="Warning" placeholder="Enter text" validationState="warning" />
          <Input label="Error" placeholder="Enter text" validationState="error" error="Error message" />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Sizes</h2>
        <div className="space-y-3">
          <Input size="xs" placeholder="Extra Small" />
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium" />
          <Input size="lg" placeholder="Large" />
          <Input size="xl" placeholder="Extra Large" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Complete showcase of all input types, validation states, and sizes.',
      },
    },
  },
};
