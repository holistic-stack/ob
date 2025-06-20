# Storybook v9 + Tailwind CSS v4 Setup Guide

This document describes the configuration of Storybook v9.0.12 and Tailwind CSS v4.1.10 in this Vite 6 project.

## Installed Versions

- **Storybook**: v9.0.12
- **Tailwind CSS**: v4.1.10
- **@tailwindcss/vite**: v4.1.10
- **Vite**: v6.0.0
- **React**: v19.0.0

## Installation Commands

```bash
# Install Storybook v9
pnpm dlx storybook@latest init

# Install Tailwind CSS v4 with Vite plugin
pnpm add -D tailwindcss@latest @tailwindcss/vite@latest
```

## Configuration Files

### 1. Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ... rest of config
});
```

### 2. Storybook Main Configuration (`.storybook/main.ts`)

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  viteFinal: async (config) => {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());
    return config;
  }
};
export default config;
```

### 3. Storybook Preview Configuration (`.storybook/preview.ts`)

```typescript
import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;
```

### 4. CSS Import (`src/index.css`)

```css
@import "tailwindcss";

/* Your existing custom styles here */
```

## Package.json Scripts

The following scripts were automatically added:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Usage

### Running Storybook

```bash
pnpm run storybook
```

This will start Storybook at `http://localhost:6006`

### Running Main Development Server

```bash
pnpm run dev
```

This will start the main Vite dev server (usually at `http://localhost:5173` or `http://localhost:5174`)

## Example Component

A sample component demonstrating Tailwind CSS v4 integration is available at:
- `src/stories/TailwindExample.tsx`
- `src/stories/TailwindExample.stories.tsx`

## Key Features

1. **Tailwind CSS v4**: Latest version with improved performance and new features
2. **Storybook v9**: Latest version with enhanced developer experience
3. **Vite 6 Integration**: Seamless integration with Vite's build system
4. **React 19 Support**: Full compatibility with React 19
5. **TypeScript Support**: Full TypeScript support for both Storybook and Tailwind

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure to use dynamic imports for the Tailwind Vite plugin in Storybook configuration
2. **JSX in .ts Files**: Use `.tsx` extension for story files that contain JSX
3. **CSS Not Loading**: Ensure the CSS import is added to both main app and Storybook preview
4. **Addon Compatibility**: Storybook v9 has consolidated many addons into the core package. Avoid installing separate viewport, backgrounds, or controls addons as they're now built-in

### Verification

To verify the setup is working:

1. Start Storybook: `pnpm run storybook`
2. Navigate to the TailwindExample story
3. Check that Tailwind classes are being applied correctly
4. Verify responsive design and dark mode features work

## Component Library

### Available Components

The setup includes a comprehensive component library built with Tailwind CSS v4:

#### UI Components (`src/components/ui/`)

1. **Button** (`Button/Button.tsx`)
   - Variants: default, destructive, outline, secondary, ghost, link
   - Sizes: default, sm, lg, icon
   - Full TypeScript support with proper prop types

2. **Card** (`Card/Card.tsx`)
   - Composable card components: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Flexible layout system for content organization

3. **Badge** (`Badge/Badge.tsx`)
   - Variants: default, secondary, destructive, outline, success, warning, info
   - Sizes: default, sm, lg
   - Perfect for status indicators and labels

4. **TailwindExample** (`stories/TailwindExample.tsx`)
   - Demonstration component showing Tailwind CSS v4 integration
   - Multiple variants and responsive design examples

### Design System

The component library includes a comprehensive design system with:

- **CSS Custom Properties**: Defined in `src/index.css` for consistent theming
- **Color Palette**: Primary, secondary, destructive, muted, accent colors with dark mode support
- **Typography**: System font stack with proper sizing scale
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Border Radius**: Configurable border radius using CSS custom properties
- **Animations**: Custom animations for enhanced user experience

### Storybook Configuration

Enhanced Storybook setup includes:

- **Accessibility Testing**: `@storybook/addon-a11y` for WCAG compliance
- **Viewport Testing**: Built-in viewport controls (part of Storybook v9 core)
- **Background Testing**: Built-in background controls (part of Storybook v9 core)
- **Documentation**: Auto-generated docs with `@storybook/addon-docs`
- **Interactive Controls**: Built-in controls (part of Storybook v9 core)
- **Onboarding**: Interactive onboarding experience with `@storybook/addon-onboarding`
- **Dark Mode Support**: Theme switching capability

### Usage Examples

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

// Button usage
<Button variant="primary" size="lg">Click me</Button>

// Card usage
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>

// Badge usage
<Badge variant="success">Active</Badge>
```

## Advanced Features

### Class Variance Authority (CVA)

Components use `class-variance-authority` for type-safe variant management:

```tsx
const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'default-classes',
        primary: 'primary-classes',
      },
      size: {
        sm: 'small-classes',
        lg: 'large-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);
```

### Utility Functions

- **`cn()` function**: Combines class names using `clsx` for conditional styling
- **Type-safe props**: Full TypeScript support with proper prop inference
- **Forwarded refs**: All components properly forward refs for library compatibility

## Next Steps

- Add more Tailwind components to your story collection
- Configure Tailwind theme customization if needed
- Set up additional Storybook addons as required
- Integrate with your existing component library
- Implement form components (Input, Select, Checkbox, etc.)
- Add layout components (Container, Grid, Flex)
- Create complex components (Modal, Dropdown, Tooltip)
- Set up component testing with Storybook interactions
- Configure visual regression testing
