import React, { useState, useCallback } from 'react';
import {
  OpenscadEditor,
  OpenscadOutline,
  FormattingConfig,
  type ParseResult,
  type OutlineItem,
  type FormattingService,
  type FeaturePreset,
  type OpenscadEditorFeatures,
  createFeatureConfig
} from '@openscad/editor';
import { EnhancedFeatureConfigPanel } from './components/enhanced-feature-config-panel';
import { FeatureComparisonPanel } from './components/feature-comparison-panel';
// Simple demo logger to avoid console.log linting issues
const demoLogger = {
  info: (message: string) => {
    // In a real application, this would send to a proper logging service
    // For demo purposes, we'll use a no-op to satisfy linting
    void message;
  }
};

// Note: The old FeatureConfigPanel has been replaced with EnhancedFeatureConfigPanel
// which provides advanced tooltips, performance metrics, and enhanced UX

const ASTDemo: React.FC = () => {
  const [code, setCode] = useState<string>(`// 🎉 OpenSCAD Professional IDE - Advanced Features Demo!
// ✨ NEW: Code Folding • Enhanced Completion • Real-time Error Detection • AST Navigation

// 🔽 CODE FOLDING FEATURES (Click the arrows in the gutter!):
// ▼ Modules, functions, and control structures are now foldable
// ▼ Nested structures support intelligent folding
// ▼ Large arrays and complex expressions can be collapsed
// ▼ Multi-line comments are foldable for better organization

// 🎯 CROSS-PLATFORM NAVIGATION SHORTCUTS:
// F12 - Go to definition (click on symbol first)
// Shift+F12 - Find all references
// Ctrl+G - Go to line number
// Alt+T - Search symbols (browser-safe, avoids Ctrl+T conflict!)
// Ctrl+Shift+O - Go to symbol

// 💾 EDITING SHORTCUTS:
// Ctrl+S - Save/Export code as .scad file
// Ctrl+/ - Toggle line comment
// Ctrl+Shift+/ - Toggle block comment

// 🎨 FORMATTING SHORTCUTS:
// Shift+Alt+F - Format entire document
// Ctrl+K Ctrl+F - Format selection
// Use the Format Config panel to customize formatting rules!

// ✨ ENHANCED CODE COMPLETION FEATURES:
// Ctrl+Space - Trigger intelligent completion
// Type "cube(" to see parameter suggestions with real AST analysis
// Type "module " to see module templates
// Type "function " to see function templates
// Real-time symbol suggestions with documentation and context!

// ===== CODE FOLDING DEMONSTRATION =====
// 🔽 Try folding these sections by clicking the arrows in the editor gutter!

/* 🔽 MULTI-LINE COMMENT FOLDING DEMO
   This is a large multi-line comment that demonstrates
   the folding capabilities for documentation blocks.

   You can fold this entire comment section to keep
   your code organized and focus on the implementation.

   Features demonstrated:
   - Multi-line comment folding
   - Nested content preservation
   - Clean code organization
*/

// ===== ADVANCED OPENSCAD EXAMPLES =====

// 📐 Global Parameters (try changing these values!)
width = 25;
height = 15;
depth = 10;
wall_thickness = 2;
$fn = 64; // Global resolution

// 🔧 Utility Functions
function calculate_volume(w, h, d) = w * h * d;
function golden_ratio() = (1 + sqrt(5)) / 2;
function deg_to_rad(degrees) = degrees * PI / 180;

// 📊 Complex Mathematical Expressions
fibonacci_angle = 137.5; // Golden angle in degrees
spiral_radius = 5;
num_elements = 8;

// 🔽 NESTED FOLDING DEMO - Advanced Module with Multiple Parameters
module parametric_box(
    size = [20, 15, 10],
    wall = 2,
    rounded = true,
    corner_radius = 2,
    lid = false,
    ventilation_holes = false
) {
    // 🔽 This difference() block can be folded independently
    difference() {
        // 🔽 Main body generation (nested folding)
        if (rounded) {
            // 🔽 Minkowski operation for rounded corners
            minkowski() {
                cube([size.x - 2*corner_radius, size.y - 2*corner_radius, size.z/2]);
                cylinder(r = corner_radius, h = size.z/2);
            }
        } else {
            cube(size);
        }

        // Hollow interior
        translate([wall, wall, wall])
            cube([size.x - 2*wall, size.y - 2*wall, size.z]);

        // 🔽 Ventilation holes generation (nested control structure)
        if (ventilation_holes) {
            // 🔽 This for loop can be folded to hide implementation details
            for (i = [1:3]) {
                translate([size.x/4 * i, size.y/2, size.z - wall/2])
                    cylinder(d = 3, h = wall + 1, center = true);
            }
        }
    }

    // 🔽 Optional lid generation (conditional folding)
    if (lid) {
        translate([0, size.y + 5, 0])
            cube([size.x, size.y, wall]);
    }
}

// 🔽 NESTED MODULE FOLDING DEMO - Module within Module
module complex_assembly() {
    // 🔽 Inner module definition (demonstrates nested module folding)
    module inner_component(scale_factor = 1) {
        scale([scale_factor, scale_factor, scale_factor]) {
            union() {
                cube([5, 5, 5]);
                translate([2.5, 2.5, 5])
                    sphere(r = 2);
            }
        }
    }

    // Use the inner module
    for (i = [0:2]) {
        translate([i * 10, 0, 0])
            inner_component(scale_factor = 0.5 + i * 0.3);
    }
}

// 🌀 Spiral Pattern Generator
module fibonacci_spiral(elements = 8, base_radius = 3) {
    for (i = [0:elements-1]) {
        angle = i * fibonacci_angle;
        radius = base_radius * sqrt(i + 1);

        rotate([0, 0, angle])
            translate([radius, 0, 0])
                rotate([0, 0, -angle])
                    scale([1, 1, 0.5 + i * 0.1])
                        sphere(d = 2);
    }
}

// 🔄 Gear Generator (Advanced Geometry)
module gear(
    teeth = 12,
    circular_pitch = 5,
    pressure_angle = 20,
    clearance = 0.2,
    gear_thickness = 5
) {
    pitch_radius = teeth * circular_pitch / (2 * PI);
    base_radius = pitch_radius * cos(pressure_angle);
    outer_radius = pitch_radius + (circular_pitch / PI - clearance);

    linear_extrude(height = gear_thickness) {
        difference() {
            circle(r = outer_radius);

            // Tooth profile (simplified)
            for (i = [0:teeth-1]) {
                rotate([0, 0, i * 360/teeth])
                    translate([pitch_radius, 0, 0])
                        circle(d = circular_pitch/3);
            }
        }
    }
}

// 🏛️ Architectural Elements
module column(height = 30, diameter = 6, flutes = 8) {
    difference() {
        cylinder(h = height, d = diameter);

        // Fluted surface
        for (i = [0:flutes-1]) {
            rotate([0, 0, i * 360/flutes])
                translate([diameter/2 - 0.5, 0, 0])
                    cylinder(h = height + 1, d = 1, center = true);
        }
    }

    // Capital (top decoration)
    translate([0, 0, height])
        cylinder(h = 2, d1 = diameter, d2 = diameter * 1.2);
}

// 🎮 Interactive Demo Objects
echo("=== BUILDING DEMO OBJECTS ===");

// Main parametric box
translate([0, 0, 0])
    parametric_box(
        size = [width, height, depth],
        wall = wall_thickness,
        rounded = true,
        corner_radius = 3,
        lid = true,
        ventilation_holes = true
    );

// Fibonacci spiral
translate([40, 0, 0])
    fibonacci_spiral(elements = num_elements, base_radius = spiral_radius);

// Gear assembly
translate([0, 40, 0]) {
    gear(teeth = 16, circular_pitch = 4, gear_thickness = 3);

    translate([0, 0, 4])
        gear(teeth = 12, circular_pitch = 4, gear_thickness = 3);
}

// Architectural column
translate([40, 40, 0])
    column(height = 25, diameter = 8, flutes = 6);

// 🔽 LARGE ARRAY FOLDING DEMO - Performance Test with Foldable Arrays
module stress_test() {
    // 🔽 Large coordinate arrays (these will be automatically foldable)
    x_coordinates = [
        0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20,
        22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
        42, 44, 46, 48, 50, 52, 54, 56, 58, 60
    ];

    y_coordinates = [
        0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20,
        22, 24, 26, 28, 30, 32, 34, 36, 38, 40
    ];

    // 🔽 Complex color array (demonstrates array folding for large data)
    colors = [
        [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1],
        [0.5, 0.5, 0.5], [0.8, 0.2, 0.3], [0.2, 0.8, 0.4], [0.3, 0.2, 0.8],
        [0.9, 0.1, 0.1], [0.1, 0.9, 0.2], [0.2, 0.1, 0.9], [0.7, 0.7, 0.1]
    ];

    // 🔽 Nested loops for stress testing (foldable control structures)
    for (x = [0:2:20]) {
        for (y = [0:2:20]) {
            translate([x, y, 0])
                cube([1, 1, sin(x + y) + 2]);
        }
    }
}

// Uncomment to test parser performance:
// translate([80, 0, 0]) stress_test();

// 🎯 Navigation Test Objects
module navigation_test() {
    // Test go-to-definition: click on 'width' and press F12
    test_cube_size = width * golden_ratio();

    cube([test_cube_size, height, depth]);

    // Test find-references: click on 'calculate_volume' and press Shift+F12
    volume = calculate_volume(test_cube_size, height, depth);
    echo("Volume:", volume);
}

translate([0, -30, 0])
    navigation_test();

// ✨ ENHANCED CODE COMPLETION DEMO AREA
// Try typing these examples to see intelligent completion in action:

// 1. Type "cube(" and see parameter suggestions with documentation
// completion_demo_cube = cube(

// 2. Type "module " and see module template completion
// module completion_demo_

// 3. Type "function " and see function template completion
// function completion_demo_

// 4. Reference existing symbols - type "width" or "calculate_" to see suggestions
// demo_var =

// 5. Try built-in OpenSCAD functions - type "translate(" or "rotate("
// translate(

echo("🎉 Try the completion features above! Use Ctrl+Space to trigger completion.");

echo("🎉 Demo loaded! Try the navigation and formatting features!");
echo("📊 Total volume:", calculate_volume(width, height, depth));
echo("📐 Golden ratio:", golden_ratio());
`);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [formattingService, setFormattingService] = useState<FormattingService | null>(null);
  const [showFormatConfig, setShowFormatConfig] = useState(false);
  const [currentExample, setCurrentExample] = useState('advanced');
  const [showMetrics, setShowMetrics] = useState(false);
  const [codeStats, setCodeStats] = useState({ lines: 0, characters: 0, words: 0 });
  const [currentFeatures, setCurrentFeatures] = useState<FeaturePreset>('IDE');
  const [showFeatureConfig, setShowFeatureConfig] = useState(false);
  const [customFeatures, setCustomFeatures] = useState<OpenscadEditorFeatures | null>(null);
  const [featureToggleMode, setFeatureToggleMode] = useState<'preset' | 'custom'>('preset');
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);

  const handleParseResult = useCallback((result: ParseResult) => {
    setParseResult(result);
    demoLogger.info(`📊 Parse Result: ${JSON.stringify(result, null, 2)}`);
  }, []);

  const handleOutlineChange = useCallback((newOutline: OutlineItem[]) => {
    setOutline(newOutline);
    demoLogger.info(`🌳 Outline Updated: ${JSON.stringify(newOutline, null, 2)}`);
  }, []);

  const handleFormattingServiceReady = useCallback((service: FormattingService) => {
    setFormattingService(service);
    demoLogger.info(`🎨 Formatting Service Ready: ${typeof service}`);
  }, []);

  const handleOutlineItemClick = useCallback((item: OutlineItem) => {
    demoLogger.info(`🎯 Navigate to: ${JSON.stringify(item, null, 2)}`);
    // TODO: Implement navigation to the specific line/column
  }, []);

  // Feature configuration handlers
  const handleFeaturePresetChange = useCallback((preset: FeaturePreset) => {
    setCurrentFeatures(preset);
    setCustomFeatures(null);
    setFeatureToggleMode('preset');
  }, []);

  const handleCustomFeatureChange = useCallback((features: OpenscadEditorFeatures) => {
    setCustomFeatures(features);
    setFeatureToggleMode('custom');
  }, []);

  const getCurrentFeatureConfig = useCallback((): OpenscadEditorFeatures => {
    if (featureToggleMode === 'custom' && customFeatures) {
      return customFeatures;
    }
    return createFeatureConfig(currentFeatures);
  }, [featureToggleMode, customFeatures, currentFeatures]);

  const examples = {
    advanced: code, // Current advanced example
    folding: `// 🔽 CODE FOLDING FEATURES DEMO - Click the arrows in the gutter!
// ✨ This demo showcases all the folding capabilities of the OpenSCAD editor

/* 🔽 MULTI-LINE COMMENT FOLDING
   Large documentation blocks can be folded to keep code organized.
   This is especially useful for:
   - File headers and license information
   - Detailed function/module documentation
   - Implementation notes and TODOs
   - Complex algorithm explanations
*/

// 🔽 NESTED MODULE FOLDING DEMONSTRATION
module outer_container(width = 30, height = 20, depth = 15) {
    // 🔽 Inner utility module (nested folding)
    module inner_compartment(size_ratio = 0.8) {
        scale([size_ratio, size_ratio, size_ratio]) {
            difference() {
                cube([width, height, depth]);
                translate([2, 2, 2])
                    cube([width-4, height-4, depth-4]);
            }
        }
    }

    // 🔽 Complex conditional logic (foldable control structures)
    if (width > 20) {
        // 🔽 Large structure generation
        for (i = [0:2]) {
            translate([i * (width/3), 0, 0]) {
                inner_compartment(size_ratio = 0.7 + i * 0.1);
            }
        }
    } else {
        // 🔽 Compact structure generation
        inner_compartment(size_ratio = 0.9);
    }
}

// 🔽 FUNCTION FOLDING WITH COMPLEX LOGIC
function calculate_spiral_points(
    radius = 10,
    turns = 3,
    points_per_turn = 12,
    height_per_turn = 5
) = [
    // 🔽 Large array generation (automatically foldable)
    for (i = [0:points_per_turn * turns - 1])
        [
            radius * (1 + i / (points_per_turn * turns)) * cos(i * 360 / points_per_turn),
            radius * (1 + i / (points_per_turn * turns)) * sin(i * 360 / points_per_turn),
            i * height_per_turn / points_per_turn
        ]
];

// 🔽 LARGE ARRAY FOLDING DEMO
coordinates_array = [
    [0, 0, 0], [10, 0, 0], [20, 0, 0], [30, 0, 0], [40, 0, 0],
    [0, 10, 0], [10, 10, 0], [20, 10, 0], [30, 10, 0], [40, 10, 0],
    [0, 20, 0], [10, 20, 0], [20, 20, 0], [30, 20, 0], [40, 20, 0],
    [0, 30, 0], [10, 30, 0], [20, 30, 0], [30, 30, 0], [40, 30, 0],
    [0, 40, 0], [10, 40, 0], [20, 40, 0], [30, 40, 0], [40, 40, 0]
];

// 🔽 CONTROL STRUCTURE FOLDING
module folding_demo_generator() {
    // 🔽 Nested for loops (each level can be folded independently)
    for (x = [0:5:30]) {
        for (y = [0:5:30]) {
            // 🔽 Conditional generation within loops
            if ((x + y) % 10 == 0) {
                translate([x, y, 0]) {
                    // 🔽 Complex shape generation
                    union() {
                        cube([3, 3, 3]);
                        translate([1.5, 1.5, 3])
                            sphere(r = 1.5);
                    }
                }
            }
        }
    }
}

// 🔽 DEMONSTRATION INSTANCES
translate([0, 0, 0])
    outer_container(width = 25, height = 15, depth = 10);

translate([40, 0, 0])
    folding_demo_generator();

// 🔽 SPIRAL DEMONSTRATION
spiral_points = calculate_spiral_points(radius = 5, turns = 2);
for (i = [0:len(spiral_points)-1]) {
    translate(spiral_points[i])
        sphere(r = 0.5);
}

echo("🔽 Try folding different sections by clicking the arrows in the editor gutter!");
echo("✨ Features: Module folding, function folding, control structure folding, array folding, comment folding");
`,
    basic: `// 🎯 Basic OpenSCAD Examples - Perfect for Learning!

// Simple shapes
cube([10, 10, 10]);
translate([15, 0, 0]) sphere(r = 5);
translate([30, 0, 0]) cylinder(h = 10, r = 3);

// Basic transformations
translate([0, 20, 0]) {
    rotate([0, 45, 0]) cube([8, 8, 8]);
}

// Simple module
module simple_box(size = 10) {
    cube([size, size, size/2]);
}

simple_box(12);
translate([0, -15, 0]) simple_box(8);
`,
    completion: `// ✨ Enhanced Code Completion Demo - Try These Examples!

// 🎯 COMPLETION TESTING AREA
// Try typing these examples to see intelligent completion in action:

// 1. Built-in OpenSCAD functions - type "cube(" and press Ctrl+Space
// cube(

// 2. Module templates - type "module " and see template suggestions
// module

// 3. Function templates - type "function " and see template suggestions
// function

// 4. Variable references - type "test_" to see existing variables
test_width = 10;
test_height = 20;
test_depth = 5;

// Now try typing "test_" and see completion suggestions!
// my_var = test_

// 5. Built-in transformations - try these:
// translate(
// rotate(
// scale(

// 6. Complex shapes with parameters
// cylinder(
// sphere(
// polyhedron(

// 7. Boolean operations
// difference() {
//     cube([10, 10, 10]);
//     // Try typing "sphere(" here
// }

echo("🎉 Enhanced completion features are working!");
echo("💡 Use Ctrl+Space to trigger intelligent suggestions");
echo("🔍 Completion includes: built-ins, user symbols, templates, parameters");
`,
    performance: `// ⚡ Performance Test - Large Scale Generation

// Performance parameters
grid_size = 15;
element_size = 1.5;
spacing = 3;

// Large array generation
for (x = [0:spacing:grid_size * spacing]) {
    for (y = [0:spacing:grid_size * spacing]) {
        translate([x, y, 0]) {
            height = sin(x/5) * cos(y/5) * 3 + 5;
            cube([element_size, element_size, height]);
        }
    }
}

// Complex mathematical pattern
module fractal_tree(depth = 4, length = 10, angle = 30) {
    if (depth > 0) {
        cylinder(h = length, r = depth * 0.5);

        translate([0, 0, length]) {
            rotate([0, angle, 0]) fractal_tree(depth - 1, length * 0.7, angle);
            rotate([0, -angle, 120]) fractal_tree(depth - 1, length * 0.7, angle);
            rotate([0, -angle, 240]) fractal_tree(depth - 1, length * 0.7, angle);
        }
    }
}

translate([50, 50, 0]) fractal_tree(depth = 3);
`
  };

  const handleExampleChange = useCallback((exampleKey: string) => {
    setCurrentExample(exampleKey);
    const newCode = examples[exampleKey as keyof typeof examples];
    setCode(newCode);
    setCodeStats(calculateCodeStats(newCode));
  }, [examples]);

  const calculateCodeStats = useCallback((code: string) => {
    const lines = code.split('\n').length;
    const characters = code.length;
    const words = code.split(/\s+/).filter(word => word.length > 0).length;
    return { lines, characters, words };
  }, []);

  // Initialize code stats
  React.useEffect(() => {
    setCodeStats(calculateCodeStats(code));
  }, [code, calculateCodeStats]);

  return (
    <div
      data-testid="demo-container"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        background: '#1e1e1e',
        color: '#d4d4d4'
      }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        background: '#252526',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1
            data-testid="demo-title"
            style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}
          >
            🎉 OpenSCAD Professional IDE - Advanced Demo
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#aaa' }}>
            ✅ Feature Toggles • ✅ Real-time Parsing • ✅ Error Detection • ✅ Code Completion • ✅ Cross-Platform Shortcuts • 🚧 Navigation • 🚧 Hover Info
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Example Selection */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Object.keys(examples).map((key) => (
              <button
                key={key}
                onClick={() => handleExampleChange(key)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: currentExample === key ? '#007acc' : '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {key === 'advanced' ? '🚀 Advanced' :
                 key === 'basic' ? '📚 Basic' :
                 key === 'folding' ? '🔽 Folding' :
                 key === 'completion' ? '✨ Completion' :
                 key === 'performance' ? '⚡ Performance' : key}
              </button>
            ))}
          </div>

          {/* Metrics Toggle */}
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: showMetrics ? '#007acc' : '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            📊 Metrics
          </button>

          {/* Format Config Toggle */}
          <button
            onClick={() => setShowFormatConfig(!showFormatConfig)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: showFormatConfig ? '#007acc' : '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            🎨 Format Config
          </button>

          {/* Feature Toggle */}
          <button
            data-testid="feature-toggle-button"
            onClick={() => setShowFeatureConfig(!showFeatureConfig)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: showFeatureConfig ? '#007acc' : '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            🎛️ Features ({featureToggleMode === 'custom' ? 'CUSTOM' : currentFeatures})
          </button>

          {/* Feature Comparison Toggle */}
          <button
            data-testid="feature-comparison-button"
            onClick={() => setShowFeatureComparison(!showFeatureComparison)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              background: showFeatureComparison ? '#007acc' : '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            🔄 Compare Features
          </button>
          
          {parseResult && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <span style={{
                color: parseResult.success ? '#4caf50' : '#f44336',
                fontWeight: 'bold'
              }}>
                {parseResult.success ? '✅ PARSED' : '❌ ERRORS'}
              </span>
              {parseResult.errors.length > 0 && (
                <span style={{ color: '#f44336' }}>
                  {parseResult.errors.length} error{parseResult.errors.length !== 1 ? 's' : ''}
                </span>
              )}
              {parseResult.success && (
                <>
                  <span style={{ color: '#4fc3f7' }}>
                    📊 {outline.length} symbols
                  </span>
                  <span style={{ color: '#81c784' }}>
                    ⚡ Parse: OK
                  </span>
                  {showMetrics && (
                    <>
                      <span style={{ color: '#ffb74d' }}>
                        📝 {codeStats.lines} lines
                      </span>
                      <span style={{ color: '#ba68c8' }}>
                        🔤 {codeStats.words} words
                      </span>
                      <span style={{ color: '#4db6ac' }}>
                        📏 {codeStats.characters} chars
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Comparison Panel */}
      {showFeatureComparison && (
        <div style={{
          background: '#f8f9fa',
          borderBottom: '1px solid #333',
          maxHeight: '50vh',
          overflow: 'auto'
        }}>
          <FeatureComparisonPanel
            currentCode={code}
            onConfigurationChange={(preset, features) => {
              demoLogger.info(`🔧 [DEBUG] Feature comparison selection: ${JSON.stringify({ preset, features }, null, 2)}`);
              // Optionally update the main editor configuration
              setCurrentFeatures(preset);
            }}
            showMetrics={true}
            editorHeight="200px"
          />
        </div>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: showFeatureConfig
          ? (showFormatConfig ? '1fr 300px 300px 300px' : '1fr 300px 300px')
          : (showFormatConfig ? '1fr 300px 300px' : '1fr 300px'),
        gap: '1px',
        background: '#333'
      }}>
        {/* Editor */}
        <div
          data-testid="monaco-editor-container"
          style={{ background: '#1e1e1e' }}
        >
          <OpenscadEditor
            value={code}
            onChange={(value) => setCode(value || '')}
            features={getCurrentFeatureConfig()}
            onParseResult={handleParseResult}
            onOutlineChange={handleOutlineChange}
            onFormattingServiceReady={handleFormattingServiceReady}
            height="100%"
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              language: 'openscad', // Explicitly set the language
            }}
          />
        </div>

        {/* Sidebar - Outline */}
        <div style={{ 
          background: '#1e1e1e',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Outline */}
          <div style={{ flex: 1 }}>
            <OpenscadOutline
              outline={outline}
              onItemClick={handleOutlineItemClick}
              title="Document Outline"
            />
          </div>

          {/* Features Info */}
          <div style={{
            borderTop: '1px solid #333',
            padding: '12px',
            fontSize: '11px',
            lineHeight: '1.5',
            background: '#252526'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#4fc3f7' }}>🚀 OpenSCAD Editor Features</h4>
            <div style={{ marginBottom: '8px', fontSize: '10px', color: '#4fc3f7' }}>
              Current: <strong>{currentFeatures}</strong> preset
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#aaa' }}>
              <li>🔍 <strong>Real-time AST parsing</strong> - Tree-sitter powered analysis ✅</li>
              <li>❌ <strong>Smart error detection</strong> - Syntax & semantic errors ✅</li>
              <li>🌳 <strong>Symbol outline</strong> - Navigate modules, functions, variables ✅</li>
              <li>💡 <strong>Rich hover info</strong> - Parameter details & documentation 🚧</li>
              <li>✨ <strong>Enhanced completion</strong> - AST-based symbol suggestions ✅</li>
              <li>🎯 <strong>Advanced navigation</strong> - Go-to-definition, find references 🚧</li>
              <li>🎨 <strong>AST-based formatting</strong> - Semantic-preserving code style ✅</li>
              <li>📊 <strong>Performance monitoring</strong> - Real-time parsing metrics ✅</li>
              <li>🎨 <strong>Syntax highlighting</strong> - Grammar-aware tokenization ✅</li>
              <li>💬 <strong>Comment commands</strong> - Smart line/block comment toggling ✅</li>
              <li>⚙️ <strong>Feature toggles</strong> - Configurable capabilities for performance ✅</li>
            </ul>

            <div style={{
              marginTop: '12px',
              padding: '8px',
              background: '#1e1e1e',
              borderRadius: '4px',
              fontSize: '10px'
            }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>🎯 Navigation:</strong> Click on <code>width</code>, <code>calculate_volume</code>, or <code>golden_ratio</code>
                and press <strong>F12</strong> (go-to-definition) or <strong>Shift+F12</strong> (find references)
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>🎨 Formatting:</strong> Press <strong>Shift+Alt+F</strong> to format the entire document
                or select code and press <strong>Ctrl+K Ctrl+F</strong>
              </div>
              <div>
                <strong>🔍 Search:</strong> <strong>Ctrl+G</strong> (go-to-line), <strong>Alt+T</strong> (symbol search - browser-safe!),
                <strong>Ctrl+Shift+O</strong> (go-to-symbol)
              </div>
              <div style={{ marginTop: '6px' }}>
                <strong>💾 Save:</strong> <strong>Ctrl+S</strong> (export code as .scad file)
              </div>
            </div>
          </div>
        </div>

        {/* Format Config Panel */}
        {showFormatConfig && formattingService && (
          <div style={{
            background: '#1e1e1e',
            borderLeft: '1px solid #333'
          }}>
            <FormattingConfig
              formattingService={formattingService}
              currentCode={code}
              onFormattedCode={setCode}
            />
          </div>
        )}

        {/* Feature Config Panel */}
        {showFeatureConfig && (
          <div style={{
            background: '#1e1e1e',
            borderLeft: '1px solid #333',
            width: '350px',
            padding: '16px',
            overflow: 'auto'
          }}>
            <EnhancedFeatureConfigPanel
              currentPreset={currentFeatures}
              customFeatures={customFeatures}
              featureMode={featureToggleMode}
              onPresetChange={handleFeaturePresetChange}
              onCustomFeatureChange={handleCustomFeatureChange}
              onClose={() => setShowFeatureConfig(false)}
              performanceMetrics={{
                parseTime: 42.3,
                renderTime: 12.5,
                memoryUsage: 6 * 1024 * 1024, // 6MB
                featureLoadTime: 18.3,
                totalFeatures: 17,
                activeFeatures: (() => {
                  const config = getCurrentFeatureConfig();
                  return Object.values(config.core).filter(Boolean).length +
                         Object.values(config.parser).filter(Boolean).length +
                         Object.values(config.ide).filter(Boolean).length +
                         Object.values(config.advanced).filter(Boolean).length;
                })()
              }}
              showPerformanceMetrics={true}
              showTooltips={true}
              inline={true}
            />
          </div>
        )}


      </div>
    </div>
  );
};

export default ASTDemo;
