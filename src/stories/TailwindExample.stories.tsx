import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TailwindExample } from './TailwindExample';

const meta: Meta<typeof TailwindExample> = {
  title: 'Example/TailwindExample',
  component: TailwindExample,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A demonstration component showing Tailwind CSS v4 integration with Storybook v9.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'warning', 'danger'],
      description: 'The color variant of the component',
    },
    elevated: {
      control: { type: 'boolean' },
      description: 'Whether to show the component with elevated shadow',
    },
    title: {
      control: { type: 'text' },
      description: 'The title text to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    title: 'Primary Example',
    variant: 'primary',
    elevated: false,
  },
};

export const Secondary: Story = {
  args: {
    title: 'Secondary Example',
    variant: 'secondary',
    elevated: false,
  },
};

export const Success: Story = {
  args: {
    title: 'Success Example',
    variant: 'success',
    elevated: true,
  },
};

export const Warning: Story = {
  args: {
    title: 'Warning Example',
    variant: 'warning',
    elevated: true,
  },
};

export const Danger: Story = {
  args: {
    title: 'Danger Example',
    variant: 'danger',
    elevated: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <TailwindExample title="Primary" variant="primary" />
      <TailwindExample title="Secondary" variant="secondary" />
      <TailwindExample title="Success" variant="success" elevated />
      <TailwindExample title="Warning" variant="warning" elevated />
      <TailwindExample title="Danger" variant="danger" elevated />
    </div>
  ),
};
