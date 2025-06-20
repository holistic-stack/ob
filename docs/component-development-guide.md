# Component Development Guide

This guide explains how to create new components in the Storybook + Tailwind CSS v4 setup.

## Creating a New Component

### 1. Component Structure

Create a new directory under `src/components/ui/` with the following structure:

```
src/components/ui/NewComponent/
├── NewComponent.tsx
├── NewComponent.stories.tsx
└── index.ts (optional)
```

### 2. Component Template

Use this template for new components:

```tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const newComponentVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: {
        default: 'default-variant-classes',
        secondary: 'secondary-variant-classes',
      },
      size: {
        default: 'default-size-classes',
        sm: 'small-size-classes',
        lg: 'large-size-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface NewComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof newComponentVariants> {
  // Add custom props here
}

const NewComponent = React.forwardRef<HTMLDivElement, NewComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(newComponentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
NewComponent.displayName = 'NewComponent';

export { NewComponent, newComponentVariants };
```

### 3. Story Template

Use this template for component stories:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from './NewComponent';

const meta: Meta<typeof NewComponent> = {
  title: 'UI/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Description of what this component does.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary'],
      description: 'The visual style variant',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
      description: 'The size of the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default component',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <NewComponent variant="default">Default</NewComponent>
      <NewComponent variant="secondary">Secondary</NewComponent>
    </div>
  ),
};
```

## Best Practices

### 1. Design Tokens

Use CSS custom properties for consistent theming:

```css
:root {
  --component-bg: hsl(var(--background));
  --component-text: hsl(var(--foreground));
  --component-border: hsl(var(--border));
}
```

### 2. Accessibility

- Always include proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers
- Use semantic HTML elements
- Provide proper focus indicators

```tsx
<button
  aria-label="Close dialog"
  aria-pressed={isPressed}
  onKeyDown={handleKeyDown}
  className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
>
  Close
</button>
```

### 3. TypeScript

- Use proper prop types with `VariantProps`
- Forward refs correctly
- Export both component and variant types
- Use generic types when appropriate

```tsx
export interface ComponentProps<T = HTMLDivElement>
  extends React.HTMLAttributes<T>,
    VariantProps<typeof componentVariants> {
  asChild?: boolean;
}
```

### 4. Responsive Design

Use Tailwind's responsive prefixes:

```tsx
className="text-sm md:text-base lg:text-lg"
```

### 5. Dark Mode

Ensure components work in both light and dark modes:

```tsx
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
```

## Testing Components

### 1. Visual Testing

Use Storybook's built-in tools:

- Test different variants and sizes
- Check responsive behavior
- Verify dark mode compatibility
- Test accessibility with a11y addon

### 2. Interactive Testing

Create interactive stories:

```tsx
export const Interactive: Story = {
  render: () => {
    const [count, setCount] = React.useState(0);
    return (
      <Button onClick={() => setCount(count + 1)}>
        Clicked {count} times
      </Button>
    );
  },
};
```

### 3. Documentation

- Write clear component descriptions
- Document all props and their purposes
- Provide usage examples
- Include do's and don'ts

## Updating the Component Index

After creating a new component, update `src/components/ui/index.ts`:

```tsx
// New Component
export { NewComponent, newComponentVariants } from './NewComponent/NewComponent';
export type { NewComponentProps } from './NewComponent/NewComponent';
```

## Common Patterns

### 1. Compound Components

For components with multiple parts:

```tsx
const Dialog = { Root, Trigger, Content, Header, Footer };
export { Dialog };
```

### 2. Polymorphic Components

For components that can render as different elements:

```tsx
interface ButtonProps {
  asChild?: boolean;
  as?: React.ElementType;
}
```

### 3. Controlled vs Uncontrolled

Support both patterns:

```tsx
interface ComponentProps {
  value?: string; // Controlled
  defaultValue?: string; // Uncontrolled
  onChange?: (value: string) => void;
}
```

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Storybook Documentation](https://storybook.js.org/docs)
- [Class Variance Authority](https://cva.style/docs)
- [React Aria](https://react-aria.adobe.com/) for accessibility patterns
- [Radix UI](https://www.radix-ui.com/) for unstyled component primitives
