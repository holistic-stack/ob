/**
 * @file Monaco Code Editor Storybook Stories
 * 
 * Comprehensive Storybook stories showcasing the Monaco Code Editor component
 * with OpenSCAD syntax highlighting, glass morphism effects, and IDE features.
 * Demonstrates all component variants, configurations, and use cases.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MonacoCodeEditor } from './monaco-code-editor';

const meta: Meta<typeof MonacoCodeEditor> = {
  title: 'UI Components/Editor/Monaco Code Editor',
  component: MonacoCodeEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Monaco Code Editor

A professional code editor component with Monaco Editor integration, featuring:

- **Complete OpenSCAD syntax highlighting** with Monarch tokenizer
- **Professional IDE features** including auto-completion and error detection
- **Glass morphism design** with three-layer effects and accessibility
- **Performance optimized** with < 16ms render times
- **WCAG 2.1 AA compliant** with proper keyboard navigation

## Features

### OpenSCAD Language Support
- **Keywords**: \`module\`, \`function\`, \`if\`, \`else\`, \`for\`, \`while\` - Bold blue
- **Built-in Modules**: \`cube\`, \`sphere\`, \`cylinder\`, \`translate\`, \`rotate\` - Cyan bold
- **Built-in Functions**: \`abs\`, \`cos\`, \`sin\`, \`sqrt\`, \`max\`, \`min\` - Yellow
- **Constants**: \`PI\`, \`$fa\`, \`$fs\`, \`$fn\`, \`true\`, \`false\` - Light blue
- **Numbers**: Integers, floats, hex values - Light green
- **Strings**: Double-quoted strings - Orange
- **Comments**: Single-line \`//\` and block \`/* */\` - Green italic

### Glass Morphism Design
- **Three-layer glass effect** with backdrop blur and border highlights
- **Complex shadow system** with inset highlights and depth shadows
- **Gradient pseudo-elements** for authentic refraction effects
- **Focus states** with blue accent rings and smooth transitions
        `
      }
    }
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Current code value in the editor'
    },
    language: {
      control: 'select',
      options: ['openscad', 'javascript', 'typescript', 'json'],
      description: 'Programming language for syntax highlighting'
    },
    theme: {
      control: 'select',
      options: ['dark', 'light'],
      description: 'Editor theme (dark recommended for OpenSCAD)'
    },
    height: {
      control: 'text',
      description: 'Editor height (CSS value)'
    },
    width: {
      control: 'text',
      description: 'Editor width (CSS value)'
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the editor is read-only'
    },
    enableASTParsing: {
      control: 'boolean',
      description: 'Enable AST parsing for OpenSCAD (future feature)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof MonacoCodeEditor>;

// Sample OpenSCAD code for demonstrations
const basicOpenSCADCode = `// OpenSCAD Primitives Showcase
// Demonstrates various 3D shapes positioned for optimal camera framing

// Basic cube at origin
cube([8, 8, 8]);

// Sphere positioned to the right
translate([15, 0, 0])
  sphere(4);

// Cylinder positioned above
translate([0, 12, 0])
  cylinder(h = 8, r = 3);

// Cone (using cylinder with different radii)
translate([15, 12, 0])
  cylinder(h = 10, r1 = 4, r2 = 1);

// Torus-like shape using difference
translate([-12, 0, 4])
  difference() {
    sphere(5);
    sphere(3);
  }

// Use "Fit to View" button to frame all objects perfectly!`;

const advancedOpenSCADCode = `// Advanced OpenSCAD Features Demo
$fa = 1;
$fs = 0.4;

// Mathematical constants and functions
PI = 3.14159;
golden_ratio = (1 + sqrt(5)) / 2;

// Parametric module with complex operations
module parametric_gear(
    teeth = 20,
    circular_pitch = 5,
    pressure_angle = 20,
    clearance = 0.2,
    gear_thickness = 5
) {
    // Calculate gear parameters
    pitch_radius = teeth * circular_pitch / (2 * PI);
    base_radius = pitch_radius * cos(pressure_angle);
    outer_radius = pitch_radius + circular_pitch / PI;
    
    difference() {
        // Main gear body
        cylinder(h = gear_thickness, r = outer_radius);
        
        // Center hole
        translate([0, 0, -0.1]) {
            cylinder(h = gear_thickness + 0.2, r = 2);
        }
        
        // Gear teeth (simplified)
        for (i = [0:teeth-1]) {
            rotate([0, 0, i * 360 / teeth]) {
                translate([pitch_radius, 0, -0.1]) {
                    cylinder(h = gear_thickness + 0.2, r = 0.8);
                }
            }
        }
    }
}

// Create multiple gears
for (x = [0:2]) {
    for (y = [0:1]) {
        translate([x * 25, y * 25, 0]) {
            color([x/2, y, 0.5]) {
                parametric_gear(
                    teeth = 15 + x * 5,
                    gear_thickness = 3 + y * 2
                );
            }
        }
    }
}

// Complex transformation example
translate([0, 50, 0]) {
    intersection() {
        sphere(r = 15);
        union() {
            cube([20, 20, 30], center = true);
            rotate([0, 0, 45]) {
                cube([20, 20, 30], center = true);
            }
        }
    }
}`;

const errorExampleCode = `// OpenSCAD with intentional errors for testing
module broken_example() {
    // Missing semicolon
    cube(10)
    
    // Undefined variable
    translate([undefined_var, 0, 0]) {
        sphere(5);
    }
    
    // Syntax error - unclosed bracket
    for (i = [0:5] {
        rotate([0, 0, i * 60]) {
            cylinder(h=2, r=1);
        }
    // Missing closing brace
`;

/**
 * Default Monaco Code Editor with OpenSCAD syntax highlighting
 */
export const Default: Story = {
  args: {
    value: basicOpenSCADCode,
    language: 'openscad',
    theme: 'dark',
    height: '400px',
    width: '100%'
  }
};

/**
 * Advanced OpenSCAD example showcasing complex syntax highlighting
 */
export const AdvancedOpenSCAD: Story = {
  args: {
    value: advancedOpenSCADCode,
    language: 'openscad',
    theme: 'dark',
    height: '600px',
    width: '100%'
  }
};

/**
 * Large editor for full-screen development experience
 */
export const FullScreen: Story = {
  args: {
    value: advancedOpenSCADCode,
    language: 'openscad',
    theme: 'dark',
    height: '80vh',
    width: '100%'
  }
};

/**
 * Compact editor for embedded use cases
 */
export const Compact: Story = {
  args: {
    value: `// Compact editor example
cube(10);
sphere(5);`,
    language: 'openscad',
    theme: 'dark',
    height: '200px',
    width: '100%'
  }
};

/**
 * Read-only editor for code display
 */
export const ReadOnly: Story = {
  args: {
    value: basicOpenSCADCode,
    language: 'openscad',
    theme: 'dark',
    height: '400px',
    width: '100%',
    readOnly: true
  }
};

/**
 * Light theme variant
 */
export const LightTheme: Story = {
  args: {
    value: basicOpenSCADCode,
    language: 'openscad',
    theme: 'light',
    height: '400px',
    width: '100%'
  }
};

/**
 * JavaScript language support
 */
export const JavaScript: Story = {
  args: {
    value: `// JavaScript example
function createMesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    return mesh;
}

// Create a cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = createMesh(geometry, material);

scene.add(cube);`,
    language: 'javascript',
    theme: 'dark',
    height: '400px',
    width: '100%'
  }
};

/**
 * TypeScript language support
 */
export const TypeScript: Story = {
  args: {
    value: `// TypeScript example
interface MeshConfig {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material;
  readonly position?: THREE.Vector3;
}

class MeshFactory {
  static createMesh(config: MeshConfig): THREE.Mesh {
    const mesh = new THREE.Mesh(config.geometry, config.material);
    
    if (config.position) {
      mesh.position.copy(config.position);
    }
    
    return mesh;
  }
}

// Usage
const cube = MeshFactory.createMesh({
  geometry: new THREE.BoxGeometry(1, 1, 1),
  material: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  position: new THREE.Vector3(0, 0, 0)
});`,
    language: 'typescript',
    theme: 'dark',
    height: '400px',
    width: '100%'
  }
};

/**
 * Error handling demonstration
 */
export const WithErrors: Story = {
  args: {
    value: errorExampleCode,
    language: 'openscad',
    theme: 'dark',
    height: '400px',
    width: '100%',
    enableASTParsing: true
  }
};

/**
 * Interactive example with change handler
 */
export const Interactive: Story = {
  args: {
    value: `// Interactive editor - try editing this code!
module interactive_demo(size = 10) {
    difference() {
        cube(size);
        translate([size/2, size/2, size/2]) {
            sphere(size/3);
        }
    }
}

interactive_demo(15);`,
    language: 'openscad',
    theme: 'dark',
    height: '400px',
    width: '100%',
    onChange: (value: string) => {
      console.log('Code changed:', value);
    }
  }
};

/**
 * Custom glass configuration
 */
export const CustomGlass: Story = {
  args: {
    value: basicOpenSCADCode,
    language: 'openscad',
    theme: 'dark',
    height: '400px',
    width: '100%',
    glassConfig: {
      blurIntensity: 'lg',
      opacity: 0.3,
      elevation: 'high',
      editorTheme: 'dark'
    }
  }
};
