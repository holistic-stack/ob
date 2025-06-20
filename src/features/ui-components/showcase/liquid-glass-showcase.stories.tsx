/**
 * @file Liquid Glass Showcase Storybook Stories
 * 
 * Interactive Storybook stories demonstrating authentic Apple Liquid Glass design patterns
 * with real-world use cases and comprehensive examples.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { LiquidGlassShowcase } from './liquid-glass-showcase';

// Simple mock function for Storybook actions
const fn = () => () => console.log('Action triggered');

const meta: Meta<typeof LiquidGlassShowcase> = {
  title: 'Liquid Glass/Showcase',
  component: LiquidGlassShowcase,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Liquid Glass Showcase

A comprehensive showcase demonstrating authentic Apple Liquid Glass design patterns with real-world use cases.

## Features

- **Authentic Glass Effects**: Complex gradient layers with before/after pseudo-elements
- **Beautiful Backgrounds**: Stunning images to showcase transparency and blur effects  
- **Multiple Use Cases**: Buttons, docks, control panels, notifications, and more
- **Interactive Demos**: Switch between different component variations
- **Technical Details**: Implementation insights and performance features

## Design Patterns

### Glass Morphism Effects
- \`backdrop-filter: blur()\` for authentic glass blur
- \`bg-white/2.5\` for subtle transparency (2.5% opacity)
- \`border-white/50\` for glass edge definition (50% opacity)
- Complex shadow combinations: \`shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]\`
- Multiple gradient layers using \`before:\` and \`after:\` pseudo-elements

### Performance Optimizations
- Hardware-accelerated animations using transform and opacity
- GPU-optimized CSS with minimal repaints
- Progressive enhancement with fallbacks for unsupported browsers
- Efficient rendering with proper z-index management

## Use Cases Demonstrated

1. **Single Button**: Basic glass morphism button with hover effects
2. **Button Group**: Connected buttons with shared borders
3. **Horizontal Dock**: App launcher with icon grid
4. **Grid Dock**: Multi-row app grid with rounded icons
5. **Control Panel**: Settings interface with toggle buttons
6. **Notification**: Message card with action buttons

Each demo uses beautiful background images to showcase the transparency and blur effects that make Liquid Glass so compelling.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete Liquid Glass showcase with all demo variations.
 * 
 * This story demonstrates the full range of Liquid Glass components and patterns,
 * including buttons, docks, control panels, and notifications. Each demo uses
 * beautiful background images to showcase the authentic glass morphism effects.
 */
export const Complete: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
The complete showcase includes six different demo variations:

- **Single Button**: Demonstrates basic glass morphism with hover effects
- **Button Group**: Shows connected buttons with shared glass borders  
- **Horizontal Dock**: App launcher with horizontal icon layout
- **Grid Dock**: Multi-row app grid with rounded glass icons
- **Control Panel**: Settings interface with glass toggle buttons
- **Notification**: Message card with glass action buttons

Each demo uses a different beautiful background image to showcase how the glass effects interact with various content underneath.
        `,
      },
    },
  },
};

/**
 * Single button demonstration with authentic glass morphism effects.
 * 
 * Shows the core glass button component with:
 * - Backdrop blur effects
 * - Multiple gradient layers
 * - Complex shadow combinations
 * - Hover state transitions
 */
export const SingleButton: Story = {
  render: () => (
    <div className="p-8">
      <div 
        className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=90')" 
        }}
      >
        <button className="relative inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none transition antialiased">
          Beautiful Button
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
A single glass morphism button demonstrating the core visual effects:

**CSS Implementation:**
\`\`\`css
.glass-button {
  background: rgba(255, 255, 255, 0.025); /* bg-white/2.5 */
  border: 1px solid rgba(255, 255, 255, 0.5); /* border-white/50 */
  backdrop-filter: blur(8px); /* backdrop-blur-sm */
  box-shadow: 
    inset 0 1px 0px rgba(255, 255, 255, 0.75), /* Inner highlight */
    0 0 9px rgba(0, 0, 0, 0.2), /* Outer glow */
    0 3px 8px rgba(0, 0, 0, 0.15); /* Drop shadow */
}

.glass-button::before {
  background: linear-gradient(to bottom right, 
    rgba(255, 255, 255, 0.6), 
    transparent, 
    transparent);
  opacity: 0.7;
}

.glass-button::after {
  background: linear-gradient(to top left, 
    rgba(255, 255, 255, 0.3), 
    transparent, 
    transparent);
  opacity: 0.5;
}
\`\`\`
        `,
      },
    },
  },
};

/**
 * Button group with connected glass morphism effects.
 * 
 * Demonstrates how glass buttons can be grouped together with:
 * - Shared glass container
 * - Connected borders
 * - Consistent visual hierarchy
 */
export const ButtonGroup: Story = {
  render: () => (
    <div className="p-8">
      <div 
        className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1683802175911-464278f124aa?w=800&auto=format&fit=crop&q=90')" 
        }}
      >
        <div className="flex rounded-lg overflow-hidden border border-white/50 backdrop-blur-sm">
          <button className="relative inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium bg-white/2.5 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none border-r border-white/50">
            First
          </button>
          <button className="relative inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium bg-white/2.5 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none border-r border-white/50">
            Second
          </button>
          <button className="relative inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium bg-white/2.5 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
            Third
          </button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Connected button group with shared glass container. The buttons share borders and maintain consistent glass effects while providing individual hover states.

**Key Features:**
- Shared glass container with \`backdrop-blur-sm\`
- Connected borders using \`border-r border-white/50\`
- Individual button hover states
- Consistent visual hierarchy
        `,
      },
    },
  },
};

/**
 * App dock with horizontal icon layout.
 * 
 * Demonstrates a macOS-style dock with:
 * - Glass container background
 * - Icon buttons with labels
 * - Consistent spacing and alignment
 */
export const HorizontalDock: Story = {
  render: () => (
    <div className="p-8">
      <div 
        className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1694637449947-cfe5552518c2?w=800&auto=format&fit=crop&q=90')" 
        }}
      >
        <div className="flex gap-2 max-w-md bg-black/20 backdrop-blur-sm border border-white/50 rounded-xl shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] p-3 text-white relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
          <div className="flex flex-col items-center gap-1 relative z-10">
            <button className="h-12 w-12 inline-flex items-center justify-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
              </svg>
            </button>
            <span className="text-xs">Mail</span>
          </div>
          <div className="flex flex-col items-center gap-1 relative z-10">
            <button className="h-12 w-12 inline-flex items-center justify-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122Z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs">Music</span>
          </div>
          <div className="flex flex-col items-center gap-1 relative z-10">
            <button className="h-12 w-12 inline-flex items-center justify-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 before:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs">Apps</span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Horizontal app dock with glass morphism container and icon buttons. Each icon has a label and consistent glass effects.

**Features:**
- Glass container with \`bg-black/20\` and \`backdrop-blur-sm\`
- Individual glass icon buttons
- Proper z-index management with \`relative z-10\`
- Icon and label pairing
        `,
      },
    },
  },
};
