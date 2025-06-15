# UI Components Library Documentation

## Overview

The UI Components Library is a comprehensive collection of reusable React components built with TypeScript, following atomic design principles and modern React patterns. This library provides the foundation for building consistent, accessible, and maintainable user interfaces.

## Architecture

### Design Principles

- **Atomic Design**: Components are organized as atoms (Button, Icon), molecules (Modal, Tooltip), and organisms (DataTable, Form)
- **Accessibility First**: WCAG 2.1 compliance with proper ARIA attributes and keyboard navigation
- **TypeScript Integration**: Full type safety with generic components and proper prop interfaces
- **Functional Programming**: Pure components with immutable props and predictable behavior
- **Performance**: Optimized CSS animations, reduced motion support, and efficient rendering

### Technology Stack

- **React 19**: Latest React features with modern hooks and patterns
- **TypeScript 5.8**: Advanced type system with branded types and discriminated unions
- **CSS Custom Properties**: Theming system with dark mode and high contrast support
- **Vitest**: Test-driven development with comprehensive test coverage
- **Playwright**: Component testing with visual regression

## Components

### Core UI Atoms (Phase 7.1 - Completed)

#### Button Component

A flexible, accessible button component with multiple variants and states.

**Features:**
- Multiple variants: primary, secondary, danger, ghost, link
- Size options: small (28px), medium (36px), large (44px)
- Interactive states: loading, disabled, hover, focus, active
- Icon support: left/right icons with proper spacing
- Full accessibility: ARIA attributes, keyboard navigation

**Usage:**
```tsx
import { Button } from '@/shared/components/ui';

// Basic usage
<Button onClick={handleClick}>Click me</Button>

// With variants and sizes
<Button variant="primary" size="large">Primary Action</Button>
<Button variant="danger" size="small">Delete</Button>

// With icons
<Button leftIcon="plus" onClick={handleAdd}>Add Item</Button>
<Button rightIcon="arrow-right" onClick={handleNext}>Continue</Button>

// With states
<Button loading onClick={handleAsync}>Save Changes</Button>
<Button disabled>Unavailable</Button>
```

**Props:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  children: React.ReactNode;
  // ... standard button props
}
```

#### Icon Component

A comprehensive SVG icon system with 50+ icons and type safety.

**Features:**
- 50+ SVG icons including navigation, actions, UI, and 3D/Babylon specific icons
- Size variants: xs (12px), sm (16px), md (20px), lg (24px), xl (32px), 2xl (40px)
- Color variants: current, primary, secondary, success, warning, error, muted
- Interactive support: click handlers, keyboard navigation
- Registry system: centralized icon definitions with type-safe validation

**Usage:**
```tsx
import { Icon } from '@/shared/components/ui';

// Basic usage
<Icon name="cube" />

// With size and color
<Icon name="check" size="lg" color="success" />
<Icon name="warning" size="md" color="warning" />

// Interactive icon
<Icon 
  name="settings" 
  size="lg" 
  onClick={handleSettings}
  aria-label="Open settings"
/>
```

**Available Icons:**
- **Navigation**: arrow-left, arrow-right, chevron-up, chevron-down
- **Actions**: plus, minus, edit, delete, save, copy, download, upload
- **UI**: menu, close, settings, info, warning, error, success, help
- **3D/Babylon**: cube, sphere, cylinder, wireframe, camera, light, rotate
- **Status**: check, warning, error, info, star, heart, bookmark

#### LoadingSpinner Component

Multiple animation variants for loading states with accessibility support.

**Features:**
- Four variants: dots (bouncing), bars (scaling), circle (rotating), pulse (expanding)
- Size options: small, medium, large with proper scaling
- Customization: custom colors, ARIA labels, CSS custom properties
- Animations: CSS keyframes with reduced motion support
- Accessibility: role="status", aria-live="polite", screen reader text

**Usage:**
```tsx
import { LoadingSpinner } from '@/shared/components/ui';

// Basic usage
<LoadingSpinner />

// With variants and sizes
<LoadingSpinner variant="dots" size="large" />
<LoadingSpinner variant="circle" size="small" />

// With custom color and label
<LoadingSpinner 
  variant="pulse" 
  color="#3b82f6" 
  aria-label="Loading data"
/>
```

### Component Composition

#### ButtonGroup

Groups related buttons together with proper styling.

**Usage:**
```tsx
import { Button, ButtonGroup } from '@/shared/components/ui';

<ButtonGroup>
  <Button variant="secondary">Left</Button>
  <Button variant="secondary">Center</Button>
  <Button variant="secondary">Right</Button>
</ButtonGroup>
```

## File Structure

```
src/shared/components/ui/
├── button/
│   ├── button.tsx              # Button component implementation
│   ├── button.css              # Button styles with CSS custom properties
│   └── button.test.tsx         # Comprehensive test suite
├── icon/
│   ├── icon.tsx                # Icon component implementation
│   ├── icon.css                # Icon styles and animations
│   ├── icon-types.ts           # TypeScript type definitions
│   └── icon-registry.ts        # SVG icon definitions
├── loading-spinner/
│   ├── loading-spinner.tsx     # LoadingSpinner component
│   ├── loading-spinner.css     # Animation styles
│   └── loading-spinner.test.tsx # Test suite
├── demo/
│   ├── ui-components-demo.tsx  # Comprehensive demo page
│   └── ui-components-demo.css  # Demo page styles
├── index.ts                    # Central export point
├── test-components.tsx         # Integration test component
├── test-import.ts              # Import validation test
└── ui-components.vspec.tsx     # Playwright component tests
```

## Testing

### Test Coverage

- **Unit Tests**: Comprehensive Vitest test suites for each component
- **Integration Tests**: Component interaction and composition testing
- **Visual Tests**: Playwright component tests with screenshot regression
- **Accessibility Tests**: ARIA attributes, keyboard navigation, screen reader support

### Running Tests

```bash
# Run unit tests
npm run test

# Run Playwright component tests
npm run test:ct

# Run with coverage
npm run test:coverage
```

## Theming

### CSS Custom Properties

The library uses CSS custom properties for consistent theming:

```css
:root {
  /* Button colors */
  --button-primary-bg: #3b82f6;
  --button-primary-text: #ffffff;
  
  /* Icon colors */
  --icon-color-primary: #3b82f6;
  --icon-color-success: #10b981;
  
  /* Spinner colors */
  --spinner-color: #3b82f6;
  
  /* Sizes */
  --button-border-radius: 6px;
  --icon-size-md: 20px;
}
```

### Dark Mode Support

All components support dark mode through CSS media queries:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --button-primary-bg: #60a5fa;
    --icon-color-primary: #60a5fa;
  }
}
```

## Accessibility

### WCAG 2.1 Compliance

- **Keyboard Navigation**: All interactive components support Tab, Enter, and Space keys
- **Screen Readers**: Proper ARIA labels, roles, and live regions
- **High Contrast**: Support for high contrast mode with enhanced borders
- **Reduced Motion**: Respects user's motion preferences

### Best Practices

- Use semantic HTML elements
- Provide descriptive ARIA labels
- Ensure sufficient color contrast
- Support keyboard-only navigation
- Test with screen readers

## Performance

### Optimizations

- **CSS Animations**: Hardware-accelerated transforms and opacity changes
- **Will-Change**: Optimized for smooth animations
- **Tree Shaking**: Only import components you use
- **Lazy Loading**: Components can be loaded on demand

### Bundle Size

- **Button**: ~2KB gzipped
- **Icon**: ~3KB gzipped (including registry)
- **LoadingSpinner**: ~1KB gzipped
- **Total**: ~6KB gzipped for all core components

## Future Roadmap

### Phase 7.2: Complex UI Molecules (Planned)

- **Modal Component**: Compound component with header, body, footer
- **Tooltip Component**: Positioning system with render props
- **Alert/Notification**: Success, warning, error, info variants

### Phase 7.3: Advanced UI Organisms (Planned)

- **DataTable Component**: Sorting, filtering, pagination, virtualization
- **Form Components**: Form wrapper with validation and error handling
- **Layout Components**: Grid, Flex, Container, Sidebar layouts

## Contributing

### Development Workflow

1. **TDD Approach**: Write tests first, implement components following SRP principles
2. **Functional Programming**: Pure components with immutable props
3. **Accessibility**: Test with screen readers and keyboard navigation
4. **Documentation**: Update this documentation with new components

### Code Standards

- Follow TypeScript strict mode
- Use functional programming patterns
- Implement comprehensive test coverage
- Follow accessibility best practices
- Use semantic versioning for releases
