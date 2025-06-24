/**
 * App Layout Storybook Stories
 * 
 * Demonstrates CAD-style Liquid Glass Layout with comprehensive interface structure
 * Showcases glass morphism effects, 8px grid system, and accessibility features
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { AppLayout } from './app-layout';

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# App Layout Component

A comprehensive CAD-style interface layout with Liquid Glass design system integration.

## Features

- **Glass Morphism Effects**: Authentic Apple Liquid Glass styling with complex shadow systems
- **8px Grid System**: Consistent spacing following design system standards
- **Split Layout**: Functional Monaco Editor + Babylon.js visualization
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Responsive Design**: Maintains layout structure across screen sizes

## Layout Structure

1. **Header Bar**: Logo, file name display, user avatar (placeholders)
2. **Toolbar**: Tab navigation and action buttons (placeholders)
3. **Main Body**: Split layout with Monaco Editor (left) and 3D visualization (right)
4. **Footer Bar**: Console viewer placeholder

## Glass Morphism Implementation

- Base: \`bg-black/20 backdrop-blur-sm border-white/50\`
- Complex shadows: Three-layer shadow system with inset highlights
- Gradient layers: \`before:\` and \`after:\` pseudo-elements for refraction effects
        `,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 50%, #1a1a2e 100%)',
        },
        {
          name: 'light',
          value: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 50%, #d0d0d0 100%)',
        },
      ],
    },
  },
  argTypes: {
    fileName: {
      control: 'text',
      description: 'Current file name displayed in header',
    },
    onFileNameChange: {
      action: 'fileNameChanged',
      description: 'Callback when file name is clicked/edited',
    },
    onRender: {
      action: 'renderClicked',
      description: 'Callback when render button is clicked',
    },
    onMoreOptions: {
      action: 'moreOptionsClicked',
      description: 'Callback when more options button is clicked',
    },
  },
  args: {
    onFileNameChange: fn(),
    onRender: fn(),
    onMoreOptions: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default layout with standard file name
 */
export const Default: Story = {
  args: {
    fileName: 'untitled.scad' as any,
  },
};

/**
 * Layout with a project file name
 */
export const ProjectFile: Story = {
  args: {
    fileName: 'mechanical-part.scad' as any,
  },
};

/**
 * Layout with a complex file name
 */
export const ComplexFileName: Story = {
  args: {
    fileName: 'advanced-parametric-gear-assembly.scad' as any,
  },
};

/**
 * Interactive demo showing all layout features
 */
export const InteractiveDemo: Story = {
  args: {
    fileName: 'demo-project.scad' as any,
  },
  parameters: {
    docs: {
      description: {
        story: `
This interactive demo showcases all layout features:

- Click the file name in the header to trigger edit mode
- Click the "Render" button to trigger rendering
- Click "More Options" to open additional settings
- The Monaco Editor (left) and 3D visualization (right) are fully functional
- All glass morphism effects are visible with proper transparency and blur

**Glass Morphism Details:**
- Header and toolbar use \`bg-black/20 backdrop-blur-sm\`
- Complex shadow system: \`shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]\`
- 8px grid spacing throughout: \`h-16\` (64px), \`h-12\` (48px), \`px-6\` (24px)
        `,
      },
    },
  },
};

/**
 * Layout focused on glass morphism effects
 */
export const GlassMorphismShowcase: Story = {
  args: {
    fileName: 'glass-demo.scad' as any,
  },
  parameters: {
    backgrounds: {
      default: 'gradient',
      values: [
        {
          name: 'gradient',
          value: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)
          `,
        },
      ],
    },
    docs: {
      description: {
        story: `
This story demonstrates the glass morphism effects against a colorful gradient background.
The transparent glass panels with backdrop blur create an authentic liquid glass appearance.

**Key Visual Features:**
- Backdrop blur effects on all glass panels
- Complex multi-layer shadows for depth
- Subtle transparency allowing background to show through
- Gradient pseudo-elements for refraction simulation
        `,
      },
    },
  },
};

/**
 * Accessibility-focused demonstration
 */
export const AccessibilityDemo: Story = {
  args: {
    fileName: 'accessible-design.scad' as any,
  },
  parameters: {
    docs: {
      description: {
        story: `
This story highlights the accessibility features of the layout:

**WCAG 2.1 AA Compliance:**
- Proper ARIA roles: \`main\`, \`banner\`, \`toolbar\`, \`contentinfo\`
- Keyboard navigation support with \`tabIndex\` attributes
- High contrast text on glass backgrounds
- Descriptive \`aria-label\` attributes for interactive elements

**Keyboard Navigation:**
- Tab through interactive elements in logical order
- File name button is keyboard accessible
- Action buttons support keyboard activation
- Focus indicators are visible and high contrast

**Screen Reader Support:**
- Semantic HTML structure
- Descriptive labels for all interactive elements
- Proper heading hierarchy (when implemented)
        `,
      },
    },
  },
};
