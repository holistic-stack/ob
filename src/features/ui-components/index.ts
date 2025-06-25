/**
 * Liquid Glass UI Component Library
 * 
 * A comprehensive UI component library implementing Apple's Liquid Glass design system
 * with glass morphism effects, accessibility features, and TypeScript support.
 * 
 * @example
 * ```tsx
 * import { Button, Card, Input, Slider } from '@/features/ui-components';
 * 
 * function App() {
 *   return (
 *     <Card variant="elevated" padding="lg">
 *       <Input label="Email" type="email" placeholder="Enter email" />
 *       <Slider value={50} min={0} max={100} label="Volume" showValueLabel />
 *       <Button variant="primary" onClick={() => console.log('clicked')}>
 *         Submit
 *       </Button>
 *     </Card>
 *   );
 * }
 * ```
 */

// ============================================================================
// Component Exports
// ============================================================================

// Button Component
export { Button } from './button';
export type { ButtonProps } from './button';

// Card Component
export { Card } from './card';
export type { 
  CardProps, 
  CardVariant, 
  CardPadding, 
  CardElement 
} from './card';

// Input Component
export { Input } from './input';
export type { 
  InputProps, 
  InputType 
} from './input';

// Slider Component
export { Slider } from './slider';
export type {
  SliderProps,
  SliderOrientation,
  SliderValue
} from './slider';

// Showcase Component
export { LiquidGlassShowcase } from './showcase';

// Layout Components
export {
  GridLayout,
} from './layout';
export type {
  GridLayoutProps,
  FileName,
  LayoutConfig,
} from './layout';

// Editor Components
export {
  FileExplorer,
  CodeEditor,
  VisualizationPanel,
  ConsolePanel,
} from './editor';
export type {
  FileExplorerProps,
  FileNode,
  FileType,
  CodeEditorProps,
  EditorLanguage,
  EditorTheme,
  VisualizationPanelProps,
  VisualizationMode,
  ModelData,
  // ViewAction removed - camera controls now handled by Babylon.js GUI navigation cube
  ConsolePanelProps,
  ConsoleMessage,
  ConsoleMessageType,
} from './editor';

// ============================================================================
// Shared Utilities and Types
// ============================================================================

// Core Types
export type {
  ComponentSize,
  ComponentVariant,
  ElevationLevel,
  BlurIntensity,
  Result,
  Option,
  ComponentState,
  ValidationState,
  GlassConfig,
  GlassTheme,
  BaseComponentProps,
  GlassComponentProps,
  InteractiveComponentProps,
  AnimationConfig,
  TransitionState,
  AriaProps,
  FocusConfig,
  DeepReadonly,
  ComponentProps,
  PartialBy,
  RequiredBy,
} from './shared';

// Type Factory Functions
export {
  Ok,
  Err,
  Some,
  None,
  isOk,
  isErr,
  isSome,
  isNone,
} from './shared';

// Glass Utilities
export {
  generateGlassClasses,
  getOpacityLevel,
  generateSizeClasses,
  generateVariantClasses,
  supportsBackdropFilter,
  supportsSVGFilters,
  getFallbackStyles,
  prefersReducedMotion,
  prefersHighContrast,
  generateAccessibleStyles,
  validateGlassConfig,
  DEFAULT_GLASS_CONFIG,
  GLASS_THEMES,
  BLUR_INTENSITY_MAP,
  ELEVATION_MAP,
} from './shared';

// Utility Re-exports
export { clsx } from './shared';

// ============================================================================
// Library Information
// ============================================================================

/**
 * Library version and metadata
 */
export const LIBRARY_INFO = {
  name: 'Liquid Glass UI',
  version: '1.0.0',
  description: 'Apple Liquid Glass design system components for React',
  components: ['Button', 'Card', 'Input', 'Slider', 'LiquidGlassShowcase', 'GridLayout', 'FileExplorer', 'CodeEditor', 'VisualizationPanel', 'ConsolePanel'],
  features: [
    'Glass morphism effects',
    'Accessibility compliance (WCAG 2.1 AA)',
    'TypeScript support',
    'Responsive design',
    'Dark/light theme support',
    'Functional programming patterns',
    'Interactive showcase with real-world examples',
  ],
} as const;

/**
 * Component registry for dynamic imports and documentation
 */
export const COMPONENT_REGISTRY = {
  Button: {
    displayName: 'Button',
    description: 'Interactive button with glass morphism effects',
    variants: ['primary', 'secondary', 'ghost', 'danger'],
    sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
    features: ['Loading states', 'Accessibility', 'Glass effects'],
  },
  Card: {
    displayName: 'Card',
    description: 'Container component with elevation and glass effects',
    variants: ['default', 'bordered', 'elevated', 'interactive'],
    elevations: ['low', 'medium', 'high', 'floating'],
    features: ['Multiple HTML elements', 'Interactive support', 'Glass effects'],
  },
  Input: {
    displayName: 'Input',
    description: 'Form input with validation and glass effects',
    types: ['text', 'email', 'password', 'search', 'number'],
    validationStates: ['default', 'error', 'success', 'warning'],
    features: ['Icon support', 'Validation messages', 'Glass effects'],
  },
  Slider: {
    displayName: 'Slider',
    description: 'Range slider with single and range value support',
    orientations: ['horizontal', 'vertical'],
    valueTypes: ['single', 'range'],
    features: ['Value labels', 'Tick marks', 'Keyboard navigation'],
  },
  LiquidGlassShowcase: {
    displayName: 'Liquid Glass Showcase',
    description: 'Interactive showcase demonstrating authentic Apple Liquid Glass design patterns',
    demos: ['Single Button', 'Button Group', 'Horizontal Dock', 'Grid Dock', 'Control Panel', 'Notification'],
    features: ['Real-world use cases', 'Beautiful backgrounds', 'Interactive demos', 'Technical documentation'],
  },
  AppLayout: {
    displayName: 'App Layout',
    description: 'CAD-style application layout with comprehensive interface structure and glass morphism effects',
    sections: ['Header Bar', 'Toolbar', 'Main Body (Split Layout)', 'Footer Bar'],
    features: ['Glass morphism', '8px grid system', 'Split layout', 'Accessibility (WCAG 2.1 AA)', 'Monaco Editor integration', 'Babylon.js visualization'],
  },

  FileExplorer: {
    displayName: 'File Explorer',
    description: 'File tree navigation component with folder expansion and file selection',
    features: ['Tree view', 'File icons', 'Keyboard navigation', 'Glass morphism'],
  },
  CodeEditor: {
    displayName: 'Code Editor',
    description: 'Code editor with syntax highlighting and line numbers',
    languages: ['javascript', 'typescript', 'python', 'openscad', 'html', 'css'],
    features: ['Syntax highlighting', 'Line numbers', 'Keyboard shortcuts', 'Glass morphism'],
  },
  VisualizationPanel: {
    displayName: 'Visualization Panel',
    description: '3D visualization panel for displaying 3D models',
    modes: ['solid', 'wireframe', 'points', 'transparent'],
    features: ['3D rendering', 'View controls', 'Model interaction', 'Glass morphism'],
  },
  ConsolePanel: {
    displayName: 'Console Panel',
    description: 'Console output panel for displaying logs and messages',
    messageTypes: ['info', 'warning', 'error', 'success', 'debug'],
    features: ['Message filtering', 'Timestamps', 'Auto-scroll', 'Glass morphism'],
  },
} as const;

// ============================================================================
// Default Export
// ============================================================================

import { Button } from './button';
import { Card } from './card';
import { Input } from './input';
import { Slider } from './slider';
import { LiquidGlassShowcase } from './showcase';
import { GridLayout } from './layout';
import {
  FileExplorer,
  CodeEditor,
  VisualizationPanel,
  ConsolePanel
} from './editor';
import { 
  generateGlassClasses,
  validateGlassConfig,
  supportsBackdropFilter,
  DEFAULT_GLASS_CONFIG,
  GLASS_THEMES
} from './shared';

/**
 * Default export containing all components and utilities
 */
export default {
  // Components
  Button,
  Card,
  Input,
  Slider,
  LiquidGlassShowcase,
  GridLayout,
  FileExplorer,
  CodeEditor,
  VisualizationPanel,
  ConsolePanel,

  // Utilities
  generateGlassClasses,
  validateGlassConfig,
  supportsBackdropFilter,

  // Constants
  DEFAULT_GLASS_CONFIG,
  GLASS_THEMES,
  LIBRARY_INFO,
  COMPONENT_REGISTRY,
} as const;
