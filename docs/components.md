# Liquid Glass UI Components

A comprehensive documentation of all implemented components in the Liquid Glass UI component library, featuring authentic Apple's Liquid Glass design system with advanced glass morphism effects, accessibility, and TypeScript support.

## Overview

The Liquid Glass UI component library provides four core components plus an interactive showcase that implement authentic glass morphism effects while maintaining excellent accessibility and performance. All components are built with React 19, TypeScript 5.8, and follow functional programming principles.

## 🎨 **NEW: Authentic Liquid Glass Showcase**

The library now includes a comprehensive **LiquidGlassShowcase** component that demonstrates authentic Apple Liquid Glass design patterns with real-world use cases:

### Key Features
- **Complex Gradient Layers**: Multiple `before:` and `after:` pseudo-elements for realistic glass effects
- **Advanced Shadow Combinations**: `shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]`
- **Beautiful Background Images**: Stunning photography to showcase transparency and blur effects
- **Interactive Demos**: Six different use cases with live switching
- **Technical Documentation**: Implementation details and performance insights

### Demo Variations
1. **Single Button**: Basic glass morphism with hover effects
2. **Button Group**: Connected buttons with shared glass borders
3. **Horizontal Dock**: App launcher with icon grid
4. **Grid Dock**: Multi-row app grid with rounded icons
5. **Control Panel**: Settings interface with toggle buttons
6. **Notification**: Message card with action buttons

### Usage
```tsx
import { LiquidGlassShowcase } from '@/features/ui-components';

function App() {
  return <LiquidGlassShowcase />;
}
```

## Component Architecture

### Design Principles
- **Glass Morphism First**: Authentic Apple Liquid Glass aesthetic with backdrop blur effects
- **Accessibility Compliant**: WCAG 2.1 AA standards with comprehensive ARIA support
- **Type Safe**: 100% TypeScript coverage with branded types and strict mode
- **Performance Optimized**: Hardware-accelerated animations targeting 60fps
- **Functional Programming**: Pure functions, immutable data, and Result types

## 🔬 **Authentic Glass Morphism Implementation**

The showcase demonstrates the **authentic Apple Liquid Glass aesthetic** that was missing from the original components. Here's the technical breakdown:

### Advanced CSS Implementation
```css
/* Authentic Liquid Glass Button */
.liquid-glass-button {
  /* Base glass effect */
  background: rgba(255, 255, 255, 0.025); /* bg-white/2.5 - very subtle */
  border: 1px solid rgba(255, 255, 255, 0.5); /* border-white/50 */
  backdrop-filter: blur(8px); /* backdrop-blur-sm */

  /* Complex shadow combination */
  box-shadow:
    inset 0 1px 0px rgba(255, 255, 255, 0.75), /* Inner highlight */
    0 0 9px rgba(0, 0, 0, 0.2),                /* Outer glow */
    0 3px 8px rgba(0, 0, 0, 0.15);            /* Drop shadow */

  /* Smooth transitions */
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Multiple gradient layers using pseudo-elements */
.liquid-glass-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(to bottom right,
    rgba(255, 255, 255, 0.6),
    transparent,
    transparent);
  opacity: 0.7;
  pointer-events: none;
}

.liquid-glass-button::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(to top left,
    rgba(255, 255, 255, 0.3),
    transparent,
    transparent);
  opacity: 0.5;
  pointer-events: none;
}

/* Hover state enhancement */
.liquid-glass-button:hover {
  background: rgba(255, 255, 255, 0.3); /* bg-white/30 */
}
```

### Key Differences from Original Components
- **Subtle Transparency**: Uses `bg-white/2.5` (2.5% opacity) instead of higher opacity
- **Complex Shadows**: Three-layer shadow system with inset highlights
- **Gradient Layers**: Multiple pseudo-elements for realistic glass refraction
- **Beautiful Backgrounds**: Stunning images to showcase the transparency effects
- **Proper Blur**: Authentic backdrop-filter implementation

### Common Props
All components extend from base interfaces that provide consistent functionality:

```tsx
interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  disabled?: boolean;
  'data-testid'?: string;
}

interface GlassComponentProps extends BaseComponentProps {
  variant?: ComponentVariant;
  size?: ComponentSize;
  glassConfig?: Partial<GlassConfig>;
  overLight?: boolean;
}
```

## Components

### 1. Button Component

Interactive button with glass morphism effects, loading states, and comprehensive accessibility.

#### Features
- **Glass Effects**: Customizable backdrop blur, transparency, and specular highlights
- **Variants**: Primary, secondary, ghost, danger with distinct visual styles
- **Sizes**: xs, sm, md, lg, xl with proportional scaling
- **States**: Loading, disabled, hover, focus, active with smooth transitions
- **Accessibility**: Full keyboard navigation, ARIA attributes, screen reader support

#### Usage
```tsx
import { Button } from '@/features/ui-components';

// Basic usage
<Button onClick={handleClick}>Click me</Button>

// With variant and size
<Button variant="primary" size="lg">Primary Action</Button>

// With loading state
<Button loading onClick={handleAsync}>Save Changes</Button>

// Custom glass configuration
<Button 
  glassConfig={{ blurIntensity: 'xl', opacity: 0.3 }}
  overLight={false}
>
  Custom Glass Effect
</Button>
```

#### Props Interface
```tsx
interface ButtonProps extends InteractiveComponentProps, AriaProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  glassConfig?: Partial<GlassConfig>;
  overLight?: boolean;
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  // ... ARIA and accessibility props
}
```

#### Test Coverage
- **26 comprehensive tests** covering all variants, sizes, states, and interactions
- Accessibility testing with keyboard navigation and ARIA attributes
- Glass morphism effect testing with browser compatibility
- Edge cases and error handling scenarios

### 2. Card Component

Container component with elevation levels, glass effects, and interactive support.

#### Features
- **Glass Effects**: Backdrop blur with customizable intensity and transparency
- **Variants**: Default (glass), bordered, elevated, interactive with distinct behaviors
- **Elevation**: Low, medium, high, floating with realistic shadow depths
- **Padding**: None, sm, md, lg, xl for flexible content spacing
- **Semantic HTML**: Support for div, section, article, aside, main elements
- **Interactivity**: Click handlers with keyboard navigation for interactive variant

#### Usage
```tsx
import { Card } from '@/features/ui-components';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// Elevated card with large padding
<Card variant="elevated" elevation="high" padding="lg">
  <h3>Important Content</h3>
  <p>This card has high elevation and large padding</p>
</Card>

// Interactive card with click handler
<Card variant="interactive" onClick={handleCardClick}>
  <h3>Clickable Card</h3>
  <p>Click anywhere on this card</p>
</Card>

// Semantic HTML as article
<Card as="article" variant="bordered">
  <article>
    <h2>Article Title</h2>
    <p>Article content...</p>
  </article>
</Card>
```

#### Props Interface
```tsx
interface CardProps extends GlassComponentProps, AriaProps {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  elevation?: 'low' | 'medium' | 'high' | 'floating';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: 'div' | 'section' | 'article' | 'aside' | 'main';
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  // ... additional props
}
```

#### Test Coverage
- **28 comprehensive tests** covering all variants, elevations, and interactions
- Semantic HTML testing with different element types
- Interactive behavior testing with keyboard navigation
- Glass morphism and accessibility compliance testing

### 3. Input Component

Form input with validation states, icon support, and glass morphism effects.

#### Features
- **Glass Effects**: Backdrop blur container with transparent input field
- **Input Types**: Text, email, password, search, number with appropriate behaviors
- **Validation**: Default, error, success, warning states with visual feedback
- **Icons**: Left and right icon support with automatic padding adjustment
- **Sizes**: xs, sm, md, lg, xl with consistent proportions
- **Accessibility**: Label association, error announcements, ARIA attributes

#### Usage
```tsx
import { Input } from '@/features/ui-components';

// Basic input with label
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  onChange={(e) => setEmail(e.target.value)}
/>

// Input with validation state
<Input
  label="Password"
  type="password"
  validationState="error"
  error="Password must be at least 8 characters"
  required
/>

// Input with icons
<Input
  label="Search"
  type="search"
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
  placeholder="Search products..."
/>

// Input with helper text
<Input
  label="Username"
  helperText="Must be 3-20 characters, letters and numbers only"
  validationState="success"
/>
```

#### Props Interface
```tsx
interface InputProps extends Omit<GlassComponentProps, 'children'>, AriaProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'number';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: ComponentSize;
  validationState?: 'default' | 'error' | 'success' | 'warning';
  error?: string;
  helperText?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // ... additional props
}
```

#### Test Coverage
- **33 comprehensive tests** covering all input types, validation states, and features
- Icon integration testing with padding adjustments
- Accessibility testing with label association and error announcements
- Edge cases including special characters and long error messages

### 4. Slider Component

Range slider with single and range value support, orientations, and visual enhancements.

#### Features
- **Glass Effects**: Glass morphism container with customizable blur and transparency
- **Value Types**: Single number values and range [min, max] arrays
- **Orientations**: Horizontal and vertical with appropriate sizing
- **Visual Enhancements**: Value labels, tick marks, min/max labels
- **Formatting**: Custom value formatters for currency, percentages, etc.
- **Sizes**: xs, sm, md, lg, xl with proportional track and thumb sizing
- **Accessibility**: Full keyboard navigation, ARIA attributes, screen reader support

#### Usage
```tsx
import { Slider } from '@/features/ui-components';

// Basic single value slider
<Slider
  value={50}
  min={0}
  max={100}
  label="Volume"
  showValueLabel
  onChange={setValue}
/>

// Range slider with custom formatting
<Slider
  value={[25, 75]}
  min={0}
  max={100}
  isRange
  label="Price Range"
  showValueLabel
  formatValue={(val) => `$${val}`}
  onChange={setRange}
/>

// Vertical slider with ticks
<Slider
  value={75}
  min={0}
  max={100}
  orientation="vertical"
  showTicks
  step={25}
  showMinMaxLabels
  label="Temperature"
/>

// Percentage slider with custom step
<Slider
  value={85}
  min={0}
  max={100}
  step={5}
  showValueLabel
  showTicks
  formatValue={(val) => `${val}%`}
  label="Completion"
/>
```

#### Props Interface
```tsx
interface SliderProps extends Omit<GlassComponentProps, 'children'>, AriaProps {
  value: number | [number, number];
  min: number;
  max: number;
  step?: number;
  isRange?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: ComponentSize;
  label?: string;
  showValueLabel?: boolean;
  showMinMaxLabels?: boolean;
  showTicks?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  onChange?: (value: number | [number, number]) => void;
  // ... additional props
}
```

#### Test Coverage
- **35 comprehensive tests** covering single/range values, orientations, and features
- Keyboard navigation testing with arrow keys and home/end
- Value clamping and validation testing
- Visual enhancement testing (labels, ticks, formatting)

## Shared Utilities

### Glass Morphism Utilities

#### generateGlassClasses
Generates CSS classes for glass morphism effects based on configuration.

```tsx
import { generateGlassClasses } from '@/features/ui-components';

const glassClasses = generateGlassClasses({
  blurIntensity: 'lg',    // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  opacity: 0.2,          // 0.0 to 1.0
  elevation: 'medium',   // 'low' | 'medium' | 'high' | 'floating'
  enableDistortion: false,
  enableSpecularHighlights: true
}, true); // overLight = true for light backgrounds
```

#### validateGlassConfig
Validates and normalizes glass configuration with proper error handling.

```tsx
import { validateGlassConfig } from '@/features/ui-components';

const result = validateGlassConfig({
  blurIntensity: 'xl',
  opacity: 1.5  // Will be clamped to 1.0
});

if (result.success) {
  console.log(result.data); // Validated and normalized config
} else {
  console.error(result.error); // Validation error
}
```

### Type Utilities

#### Result Types
Functional error handling without exceptions.

```tsx
import { Result, Ok, Err, isOk, isErr } from '@/features/ui-components';

function parseNumber(input: string): Result<number, string> {
  const num = parseFloat(input);
  return isNaN(num) ? Err('Invalid number') : Ok(num);
}

const result = parseNumber('42');
if (isOk(result)) {
  console.log(result.data); // 42
} else {
  console.error(result.error); // Error message
}
```

#### Option Types
Safe handling of nullable values.

```tsx
import { Option, Some, None, isSome } from '@/features/ui-components';

function findUser(id: string): Option<User> {
  const user = users.find(u => u.id === id);
  return user ? Some(user) : None();
}

const userOption = findUser('123');
if (isSome(userOption)) {
  console.log(userOption.value); // User object
}
```

## Testing Strategy

### Test Coverage Summary
- **Total Tests**: 179 tests with 100% pass rate
- **Button Component**: 26 tests
- **Card Component**: 28 tests
- **Input Component**: 33 tests
- **Slider Component**: 35 tests
- **Shared Utilities**: 57 tests

### Testing Patterns

#### Component Testing
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('should handle user interactions', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

#### Accessibility Testing
```tsx
test('should have proper ARIA attributes', () => {
  render(<Input label="Email" aria-describedby="email-help" />);
  
  const input = screen.getByRole('textbox');
  expect(input).toHaveAttribute('aria-describedby', 'email-help');
});
```

#### Glass Morphism Testing
```tsx
test('should apply glass effects', () => {
  render(<Card glassConfig={{ blurIntensity: 'xl' }} />);
  
  const card = screen.getByTestId('card');
  expect(card).toHaveClass('glass-blur-xl');
});
```

## Performance Considerations

### Optimization Strategies
- **Hardware Acceleration**: All animations use GPU-accelerated properties (transform, opacity)
- **Progressive Enhancement**: Graceful fallbacks for browsers without backdrop-filter support
- **Efficient Rendering**: Minimal reflows and repaints through careful CSS property selection
- **Bundle Optimization**: Tree-shakable exports and minimal dependencies

### Browser Compatibility
- **Chrome 90+**: Full support including SVG filters
- **Firefox 88+**: Partial support (no SVG filters)
- **Safari 14+**: Partial support (no SVG filters)
- **Edge 90+**: Full support including SVG filters

### Fallback Strategies
```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-effect {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}
```

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for text, 3:1 for interactive elements
- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Reader Support**: Proper ARIA attributes and semantic HTML
- **Reduced Motion**: Respects user preferences for reduced motion
- **High Contrast**: Alternative styling for high contrast mode

### Implementation Examples
```tsx
// Proper label association
<Input label="Email" required />

// ARIA attributes for complex interactions
<Slider 
  label="Volume" 
  aria-valuetext="Medium volume"
  aria-describedby="volume-help"
/>

// Keyboard navigation support
<Card variant="interactive" onClick={handleClick} />
```

## Integration Guide

### Installation
Components are part of the OpenSCAD Babylon project:

```tsx
import { Button, Card, Input, Slider } from '@/features/ui-components';
```

### Basic Usage Pattern
```tsx
function SettingsPanel() {
  const [email, setEmail] = useState('');
  const [volume, setVolume] = useState(50);

  return (
    <Card variant="elevated" padding="lg">
      <h2>Settings</h2>
      
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        validationState="success"
      />
      
      <Slider
        label="Volume"
        value={volume}
        min={0}
        max={100}
        showValueLabel
        onChange={setVolume}
      />
      
      <Button variant="primary" onClick={handleSave}>
        Save Settings
      </Button>
    </Card>
  );
}
```

### Theming
```tsx
// Light theme (default)
<Button overLight={true}>Light Theme</Button>

// Dark theme
<Button overLight={false}>Dark Theme</Button>

// Custom glass configuration
<Card glassConfig={{
  blurIntensity: 'xl',
  opacity: 0.3,
  elevation: 'high'
}}>
  Custom Glass Effect
</Card>
```

## Storybook Documentation

All components include comprehensive Storybook stories with:
- **Interactive Examples**: Live component demonstrations
- **Props Documentation**: Complete API documentation
- **Usage Patterns**: Common implementation examples
- **Accessibility Examples**: ARIA attributes and keyboard navigation
- **Theme Variations**: Light and dark theme examples

Access Storybook at: `http://localhost:6006/`

## Future Enhancements

### Planned Features
- **Additional Components**: Modal, Tooltip, DataTable, Navigation
- **Advanced Glass Effects**: SVG distortion filters and dynamic lighting
- **Theme System**: Multiple color schemes and brand variations
- **Animation Library**: Micro-interactions and transition presets
- **Form Components**: Checkbox, Radio, Select, TextArea

### Experimental Features
- **CSS Houdini**: Custom paint worklets for advanced glass effects
- **WebGL Integration**: Hardware-accelerated glass distortions
- **Motion Sensors**: Device orientation-based lighting effects
- **AI-Powered Theming**: Automatic color scheme generation
