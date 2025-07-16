# Cube Examples

## Overview

The cube is the most fundamental 3D primitive in OpenSCAD. This guide covers all cube parameters, positioning options, and common use cases with practical examples.

## Basic Cube

### Simple Cube
```openscad
// Creates a 10x10x10 unit cube at the origin
cube(10);
```

**Explanation**: The simplest cube takes a single number for all dimensions. The cube is positioned with one corner at the origin (0,0,0) and extends in the positive X, Y, and Z directions.

**Performance**: ⚡ Very fast - minimal geometry generation
**Use Cases**: Basic building blocks, placeholders, simple structures

### Cube with Different Dimensions
```openscad
// Creates a rectangular box: 20 wide, 10 deep, 5 tall
cube([20, 10, 5]);
```

**Explanation**: Using a vector `[x, y, z]` allows different dimensions for each axis. This creates rectangular boxes rather than perfect cubes.

**Performance**: ⚡ Very fast - still minimal geometry
**Use Cases**: Plates, beams, rectangular containers

## Positioning and Centering

### Default Positioning (Corner at Origin)
```openscad
// Default: one corner at origin, extends in positive directions
cube([15, 15, 15]);

// Visualize the origin with a small sphere
%translate([0, 0, 0]) sphere(r=1);
```

**Explanation**: By default, cubes are positioned with one corner at the origin. The `%` operator makes the sphere translucent for reference.

### Centered Cube
```openscad
// Centers the cube at the origin
cube([15, 15, 15], center=true);

// Visualize the origin
%sphere(r=1);
```

**Explanation**: The `center=true` parameter centers the cube at the origin, extending equally in positive and negative directions on all axes.

**Use Cases**: Symmetric operations, balanced designs, easier mathematical calculations

### Manual Positioning with Translate
```openscad
// Position cube at specific coordinates
translate([25, 0, 0])
    cube([10, 10, 10]);

// Multiple positioned cubes
translate([0, 25, 0])
    cube([10, 10, 10]);

translate([25, 25, 0])
    cube([10, 10, 10]);
```

**Explanation**: Use `translate()` to position cubes at specific coordinates. This is more flexible than the `center` parameter for complex positioning.

## Practical Examples

### Building a Simple Wall
```openscad
// Wall parameters
wall_length = 100;
wall_height = 30;
wall_thickness = 5;

// Create the wall
cube([wall_length, wall_thickness, wall_height]);

// Add support pillars every 20 units
for (i = [0 : 20 : wall_length-10]) {
    translate([i+5, 0, 0])
        cube([10, wall_thickness*2, wall_height]);
}
```

**Explanation**: This example demonstrates using cubes for architectural elements. The main wall is a long, thin cube, with thicker pillar cubes added for support.

**Performance**: ⚡ Fast - simple geometry with loop
**Applications**: Architecture, structural modeling, game environments

### Creating a Step Pattern
```openscad
// Step parameters
step_width = 20;
step_depth = 15;
step_height = 5;
num_steps = 6;

// Create ascending steps
for (i = [0 : num_steps-1]) {
    translate([i * step_depth, 0, i * step_height])
        cube([step_depth, step_width, step_height]);
}
```

**Explanation**: Uses a loop to create multiple cubes at calculated positions, forming a staircase pattern.

**Performance**: ⚡ Fast - simple repeated geometry
**Applications**: Stairs, terraced designs, level transitions

### Box with Walls
```openscad
// Box parameters
box_width = 50;
box_depth = 30;
box_height = 20;
wall_thickness = 3;

// Create the box using difference operation
difference() {
    // Outer box
    cube([box_width, box_depth, box_height]);
    
    // Inner cavity (slightly smaller, positioned to leave walls)
    translate([wall_thickness, wall_thickness, wall_thickness])
        cube([
            box_width - 2*wall_thickness,
            box_depth - 2*wall_thickness,
            box_height - wall_thickness  // No top wall
        ]);
}
```

**Explanation**: Creates a hollow box by subtracting a smaller cube from a larger one. This demonstrates how cubes work with boolean operations.

**Performance**: ⚡ Fast - simple boolean operation
**Applications**: Containers, housings, enclosures

## Advanced Cube Techniques

### Parametric Cube Function
```openscad
// Parametric cube with rounded corners (simulated)
module rounded_cube(size, corner_radius=1) {
    // Main cube
    cube(size);
    
    // Add corner "rounding" with small spheres
    for (x = [0, size[0]]) {
        for (y = [0, size[1]]) {
            for (z = [0, size[2]]) {
                translate([x, y, z])
                    sphere(r=corner_radius);
            }
        }
    }
}

// Usage
rounded_cube([20, 15, 10], corner_radius=2);
```

**Explanation**: This creates a module (function) that generates cubes with simulated rounded corners by adding spheres at the corners.

**Performance**: ⚠️ Moderate - multiple spheres add complexity
**Applications**: Aesthetic improvements, realistic modeling

### Cube Array Pattern
```openscad
// Create a 3D grid of cubes
cube_size = 5;
spacing = 8;
grid_size = 5;

for (x = [0 : grid_size-1]) {
    for (y = [0 : grid_size-1]) {
        for (z = [0 : grid_size-1]) {
            translate([x*spacing, y*spacing, z*spacing])
                cube(cube_size);
        }
    }
}
```

**Explanation**: Creates a 3D grid pattern using nested loops. Demonstrates how to create complex patterns with simple cubes.

**Performance**: ⚠️ Moderate to Slow - many objects (125 cubes)
**Applications**: Lattice structures, voxel art, structural patterns

### Cube with Chamfered Edges
```openscad
// Cube with chamfered (angled) edges
module chamfered_cube(size, chamfer=2) {
    intersection() {
        cube(size);
        
        // Create chamfer by intersecting with rotated cubes
        rotate([45, 0, 0])
            cube([size[0], size[1]*1.5, size[2]*1.5], center=true);
        
        rotate([0, 45, 0])
            cube([size[0]*1.5, size[1], size[2]*1.5], center=true);
        
        rotate([0, 0, 45])
            cube([size[0]*1.5, size[1]*1.5, size[2]], center=true);
    }
}

// Usage
chamfered_cube([20, 20, 20], chamfer=3);
```

**Explanation**: Creates chamfered edges by intersecting the cube with rotated cubes. This is an advanced technique for edge treatment.

**Performance**: ⚠️ Moderate - multiple boolean operations
**Applications**: Mechanical parts, aesthetic improvements

## Performance Considerations

### Optimization Tips

1. **Use Simple Dimensions**: Round numbers are processed faster than complex decimals
2. **Minimize Boolean Operations**: Each operation adds computational cost
3. **Avoid Excessive Detail**: Very small features may not be visible but still cost performance
4. **Use Appropriate $fn**: Don't set high resolution for cubes (they don't need it)

### Performance Comparison
```openscad
// Fast: Simple cube
cube([10, 10, 10]);  // ~0.1ms parse time

// Moderate: Positioned cube
translate([5, 5, 5])
    cube([10, 10, 10]);  // ~0.2ms parse time

// Slow: Complex boolean operation
difference() {
    cube([20, 20, 20]);
    for (i = [0:5:15]) {
        translate([i, i, i])
            cube([5, 5, 25]);
    }
}  // ~2-5ms parse time
```

## Common Mistakes and Solutions

### Mistake: Forgetting Center Parameter
```openscad
// Problem: Cube not where expected
rotate([45, 0, 0])
    cube([10, 10, 10]);  // Rotates around corner, not center

// Solution: Center the cube first
rotate([45, 0, 0])
    cube([10, 10, 10], center=true);  // Rotates around center
```

### Mistake: Incorrect Dimensions
```openscad
// Problem: Confusing dimension order
cube([height, width, depth]);  // Wrong order

// Solution: Use clear variable names
width = 20;
depth = 10;
height = 5;
cube([width, depth, height]);  // Correct: [X, Y, Z]
```

### Mistake: Overlapping Geometry
```openscad
// Problem: Z-fighting (overlapping faces)
cube([10, 10, 10]);
translate([10, 0, 0])
    cube([10, 10, 10]);  // Faces overlap at x=10

// Solution: Small gap or overlap
cube([10, 10, 10]);
translate([10.1, 0, 0])  // Small gap
    cube([10, 10, 10]);

// Or for boolean operations:
translate([9.9, 0, 0])   // Small overlap
    cube([10, 10, 10]);
```

## Related Examples

- **[Sphere Examples](./sphere-examples.md)** - Curved primitives
- **[Cylinder Examples](./cylinder-examples.md)** - Cylindrical shapes
- **[Translation Examples](../transformations/translation-examples.md)** - Positioning techniques
- **[Boolean Operations](../boolean-operations/)** - Combining cubes with other shapes

## Interactive Examples

Try these examples in OpenSCAD Babylon:

1. **Basic Cube**: Start with `cube(10);` and experiment with different sizes
2. **Centered vs Corner**: Compare `cube([10,10,10])` with `cube([10,10,10], center=true)`
3. **Building Blocks**: Create a simple structure using multiple positioned cubes
4. **Container**: Use the box with walls example to create your own container design

## Next Steps

- Explore [Sphere Examples](./sphere-examples.md) for curved shapes
- Learn about [Transformations](../transformations/) to position and orient cubes
- Try [Boolean Operations](../boolean-operations/) to combine cubes with other shapes
- Create your first [Functional Object](../functional/containers-examples.md) using cubes
