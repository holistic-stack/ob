import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile badge component for displaying status, categories, or labels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
      description: 'The visual style variant of the badge',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
      description: 'The size of the badge',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Order Status:</span>
        <Badge variant="success">Completed</Badge>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Payment Status:</span>
        <Badge variant="warning">Pending</Badge>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Shipping Status:</span>
        <Badge variant="info">In Transit</Badge>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">Return Status:</span>
        <Badge variant="destructive">Rejected</Badge>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success" className="gap-1">
        <span className="w-2 h-2 bg-white rounded-full"></span>
        Online
      </Badge>
      <Badge variant="warning" className="gap-1">
        <span className="w-2 h-2 bg-black rounded-full"></span>
        Away
      </Badge>
      <Badge variant="destructive" className="gap-1">
        <span className="w-2 h-2 bg-white rounded-full"></span>
        Offline
      </Badge>
      <Badge variant="info" className="gap-1">
        ⭐ Featured
      </Badge>
      <Badge variant="secondary" className="gap-1">
        🔥 Hot
      </Badge>
    </div>
  ),
};
