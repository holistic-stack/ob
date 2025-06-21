/**
 * @file OpenSCAD test data for E2E testing
 * Provides comprehensive OpenSCAD code examples for testing various scenarios
 * 
 * Following project standards:
 * - Real OpenSCAD code examples
 * - Comprehensive syntax coverage
 * - Performance testing scenarios
 * - Error testing scenarios
 */

/**
 * Basic OpenSCAD code examples for fundamental testing
 */
export const basicOpenSCADExamples = {
  simple: `// Simple OpenSCAD shapes
cube([10, 10, 10]);
sphere(r = 5);
cylinder(h = 20, r = 3);`,

  withComments: `// OpenSCAD with various comment styles
/* Multi-line comment
   with detailed description */
cube([10, 10, 10]); // End of line comment
sphere(r = 5);`,

  withStrings: `// OpenSCAD with string literals
echo("Hello, OpenSCAD!");
echo('Single quoted string');
echo("String with numbers: 123");`,

  withNumbers: `// OpenSCAD with various number formats
x = 10;
y = 3.14159;
z = -5.5;
result = x + y * z;`,

  withOperators: `// OpenSCAD with operators
a = 10 + 5;
b = 20 - 3;
c = 4 * 6;
d = 15 / 3;
e = 17 % 5;
comparison = (a > b) && (c < d);`
};

/**
 * Advanced OpenSCAD code examples for complex testing
 */
export const advancedOpenSCADExamples = {
  modules: `// OpenSCAD modules
module box(width, height, depth) {
    cube([width, height, depth]);
}

module rounded_box(width, height, depth, radius) {
    hull() {
        translate([radius, radius, 0])
            cylinder(h = depth, r = radius);
        translate([width - radius, radius, 0])
            cylinder(h = depth, r = radius);
        translate([radius, height - radius, 0])
            cylinder(h = depth, r = radius);
        translate([width - radius, height - radius, 0])
            cylinder(h = depth, r = radius);
    }
}

box(20, 15, 10);
translate([30, 0, 0])
    rounded_box(20, 15, 10, 2);`,

  functions: `// OpenSCAD functions
function fibonacci(n) = 
    n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);

function distance(p1, p2) = 
    sqrt(pow(p1[0] - p2[0], 2) + pow(p1[1] - p2[1], 2));

function degrees_to_radians(degrees) = degrees * PI / 180;

// Usage examples
echo("Fibonacci 10:", fibonacci(10));
echo("Distance:", distance([0, 0], [3, 4]));
echo("90 degrees in radians:", degrees_to_radians(90));`,

  controlFlow: `// OpenSCAD control flow
module spiral_tower(levels = 10, radius = 20) {
    for (i = [0:levels-1]) {
        rotate([0, 0, i * 36])
            translate([radius, 0, i * 5])
                if (i % 2 == 0) {
                    cube([5, 5, 5]);
                } else {
                    sphere(r = 2.5);
                }
    }
}

spiral_tower(15, 25);`,

  complexGeometry: `// Complex OpenSCAD geometry
module gear(teeth = 20, pitch_radius = 30, tooth_height = 5) {
    difference() {
        circle(r = pitch_radius + tooth_height);
        for (i = [0:teeth-1]) {
            rotate([0, 0, i * 360/teeth])
                translate([pitch_radius, 0, 0])
                    circle(r = tooth_height/2);
        }
    }
}

linear_extrude(height = 10)
    gear(24, 40, 3);`
};

/**
 * Performance testing scenarios
 */
export const performanceTestData = {
  largeArray: `// Large array for performance testing
points = [
${Array.from({ length: 100 }, (_, i) => `    [${i}, ${i * 2}, ${i * 3}]`).join(',\n')}
];

for (i = [0:len(points)-1]) {
    translate(points[i])
        cube([1, 1, 1]);
}`,

  nestedLoops: `// Nested loops for performance testing
module grid_pattern(size = 10, spacing = 5) {
    for (x = [0:size-1]) {
        for (y = [0:size-1]) {
            for (z = [0:2]) {
                translate([x * spacing, y * spacing, z * spacing])
                    cube([2, 2, 2]);
            }
        }
    }
}

grid_pattern(8, 6);`,

  complexCalculations: `// Complex calculations for performance testing
function mandelbrot_iteration(c_real, c_imag, max_iter = 50) = 
    let(z_real = 0, z_imag = 0)
    mandelbrot_recursive(z_real, z_imag, c_real, c_imag, 0, max_iter);

function mandelbrot_recursive(z_real, z_imag, c_real, c_imag, iter, max_iter) =
    iter >= max_iter ? iter :
    (z_real * z_real + z_imag * z_imag) > 4 ? iter :
    mandelbrot_recursive(
        z_real * z_real - z_imag * z_imag + c_real,
        2 * z_real * z_imag + c_imag,
        c_real, c_imag, iter + 1, max_iter
    );

// Generate fractal pattern
for (x = [-20:20]) {
    for (y = [-20:20]) {
        iterations = mandelbrot_iteration(x/10, y/10, 20);
        if (iterations < 20) {
            translate([x, y, 0])
                cube([0.8, 0.8, iterations/5]);
        }
    }
}`
};

/**
 * Error testing scenarios - intentionally invalid OpenSCAD code
 */
export const errorTestData = {
  syntaxErrors: `// Syntax errors for testing error handling
cube([10, 10, 10]  // Missing closing bracket
translate([15, 0, 0] {  // Missing closing bracket
    sphere(r = 5);
}
cylinder(h = 20, r = 3  // Missing closing bracket`,

  undefinedVariables: `// Undefined variables
cube([undefined_var, 10, 10]);
translate([x_pos, y_pos, z_pos])
    sphere(r = radius_var);`,

  typeErrors: `// Type errors
cube("not a vector");
sphere(r = "not a number");
translate(123)
    cylinder(h = [1, 2, 3], r = true);`,

  logicErrors: `// Logic errors that parse but don't make sense
cube([10, 10, -5]);  // Negative dimension
sphere(r = 0);       // Zero radius
cylinder(h = 0, r = -3);  // Zero height, negative radius`
};

/**
 * Code folding test scenarios
 */
export const foldingTestData = {
  nestedModules: `// Nested modules for folding tests
module outer_module() {
    module inner_module_1() {
        cube([5, 5, 5]);
        translate([10, 0, 0]) {
            sphere(r = 2);
        }
    }
    
    module inner_module_2() {
        difference() {
            cylinder(h = 10, r = 5);
            translate([0, 0, -1]) {
                cylinder(h = 12, r = 3);
            }
        }
    }
    
    inner_module_1();
    translate([20, 0, 0])
        inner_module_2();
}

outer_module();`,

  longArrays: `// Long arrays for folding tests
vertices = [
    [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
    [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10],
    [5, 5, 15], [15, 5, 5], [5, 15, 5], [-5, 5, 5],
    [5, -5, 5], [5, 5, -5], [20, 20, 20], [-10, -10, -10]
];

faces = [
    [0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1],
    [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0],
    [8, 9, 10], [8, 10, 11], [8, 11, 12], [8, 12, 9]
];

polyhedron(points = vertices, faces = faces);`,

  multilineComments: `/* This is a very long multi-line comment
   that spans many lines and contains detailed
   explanations about the OpenSCAD code below.
   
   It includes:
   - Design rationale
   - Parameter explanations
   - Usage examples
   - Performance considerations
   - Maintenance notes
   
   This comment block should be foldable
   to improve code readability.
*/

module documented_module() {
    /* Another multi-line comment
       inside the module */
    cube([10, 10, 10]);
}`
};

/**
 * Accessibility testing scenarios
 */
export const accessibilityTestData = {
  screenReaderFriendly: `// Screen reader friendly OpenSCAD code
// Main container for the design
module main_assembly() {
    // Base platform
    cube([50, 50, 5]);
    
    // Vertical support posts
    translate([10, 10, 5])
        cylinder(h = 20, r = 2);
    translate([40, 10, 5])
        cylinder(h = 20, r = 2);
    translate([10, 40, 5])
        cylinder(h = 20, r = 2);
    translate([40, 40, 5])
        cylinder(h = 20, r = 2);
    
    // Top platform
    translate([0, 0, 25])
        cube([50, 50, 5]);
}

main_assembly();`,

  keyboardNavigationTest: `// Code designed for keyboard navigation testing
line_1_simple_cube = cube([10, 10, 10]);
line_2_simple_sphere = sphere(r = 5);
line_3_simple_cylinder = cylinder(h = 15, r = 3);

// Line 5: Complex expression
line_5_complex = translate([20, 0, 0]) rotate([0, 0, 45]) cube([8, 8, 8]);

// Line 7: Function call
line_7_function = echo("Navigation test complete");`
};

/**
 * Get test data by category
 */
export function getTestData(category: keyof typeof basicOpenSCADExamples | keyof typeof advancedOpenSCADExamples | keyof typeof performanceTestData | keyof typeof errorTestData | keyof typeof foldingTestData | keyof typeof accessibilityTestData): string {
  if (category in basicOpenSCADExamples) {
    return basicOpenSCADExamples[category as keyof typeof basicOpenSCADExamples];
  }
  if (category in advancedOpenSCADExamples) {
    return advancedOpenSCADExamples[category as keyof typeof advancedOpenSCADExamples];
  }
  if (category in performanceTestData) {
    return performanceTestData[category as keyof typeof performanceTestData];
  }
  if (category in errorTestData) {
    return errorTestData[category as keyof typeof errorTestData];
  }
  if (category in foldingTestData) {
    return foldingTestData[category as keyof typeof foldingTestData];
  }
  if (category in accessibilityTestData) {
    return accessibilityTestData[category as keyof typeof accessibilityTestData];
  }
  throw new Error(`Unknown test data category: ${category}`);
}
