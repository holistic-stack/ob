# OpenSCAD Code Optimization

## Overview

This guide covers optimization techniques for writing efficient OpenSCAD code that parses quickly and renders smoothly in OpenSCAD Babylon. Learn how to avoid common performance pitfalls and write code that scales well with complexity.

## Resolution Parameter Optimization

### Understanding $fn, $fa, and $fs

OpenSCAD uses three parameters to control the resolution of curved surfaces:

- **$fn**: Number of fragments (facets) for circles
- **$fa**: Minimum angle for fragments (degrees)
- **$fs**: Minimum size of fragments (units)

### Optimal $fn Values

```openscad
// Performance comparison for different $fn values

// Too low: Visible faceting (but very fast)
$fn = 8;
sphere(r=10);  // Octagonal appearance

// Good default: Balance of quality and performance
$fn = 32;
sphere(r=10);  // Smooth appearance, good performance

// Too high: Unnecessary detail (slow)
$fn = 128;
sphere(r=10);  // Marginal visual improvement, 4x slower

// Adaptive resolution based on size
module adaptive_sphere(radius) {
    $fn = max(12, min(64, radius * 4));
    sphere(r=radius);
}
```

**Performance Impact:**
- $fn=8: ~0.1ms parse time
- $fn=32: ~0.3ms parse time  
- $fn=128: ~1.2ms parse time

### Conditional Resolution

```openscad
// Use different resolution for preview vs final render
$fn = $preview ? 16 : 64;

// Or use global variables
preview_fn = 16;
render_fn = 64;
$fn = $preview ? preview_fn : render_fn;

// Apply to specific objects
module quality_sphere(radius, preview_quality=16, render_quality=64) {
    $fn = $preview ? preview_quality : render_quality;
    sphere(r=radius);
}
```

### Size-Appropriate Resolution

```openscad
// Adjust resolution based on object size
module smart_cylinder(height, radius) {
    // Larger objects need more facets for smooth appearance
    $fn = max(8, min(64, radius * 2));
    cylinder(h=height, r=radius);
}

// Usage examples
smart_cylinder(10, 1);   // Small: $fn=8
smart_cylinder(10, 5);   // Medium: $fn=10
smart_cylinder(10, 20);  // Large: $fn=40
smart_cylinder(10, 50);  // Very large: $fn=64 (capped)
```

## Boolean Operation Optimization

### Efficient Operation Grouping

```openscad
// Inefficient: Multiple separate operations
difference() {
    cube([20, 20, 20]);
    translate([5, 5, 0]) cylinder(h=25, r=2);
}
difference() {
    // Previous result (implicit)
    translate([15, 5, 0]) cylinder(h=25, r=2);
}
difference() {
    // Previous result (implicit)
    translate([5, 15, 0]) cylinder(h=25, r=2);
}

// Efficient: Single operation with multiple subtractions
difference() {
    cube([20, 20, 20]);
    translate([5, 5, 0]) cylinder(h=25, r=2);
    translate([15, 5, 0]) cylinder(h=25, r=2);
    translate([5, 15, 0]) cylinder(h=25, r=2);
    translate([15, 15, 0]) cylinder(h=25, r=2);
}
```

**Performance Improvement:** 3-4x faster parsing and rendering

### Minimize Boolean Complexity

```openscad
// Complex: Nested boolean operations
difference() {
    union() {
        difference() {
            cube([20, 20, 20]);
            translate([10, 10, 0]) cylinder(h=25, r=3);
        }
        translate([0, 0, 20]) cube([20, 20, 5]);
    }
    translate([5, 5, 15]) cube([10, 10, 15]);
}

// Simplified: Flattened operations
difference() {
    union() {
        cube([20, 20, 20]);
        translate([0, 0, 20]) cube([20, 20, 5]);
    }
    translate([10, 10, 0]) cylinder(h=25, r=3);
    translate([5, 5, 15]) cube([10, 10, 15]);
}
```

### Strategic Operation Ordering

```openscad
// Inefficient: Large object subtracted from small
difference() {
    cylinder(h=5, r=2);           // Small base object
    cube([100, 100, 100]);        // Large subtraction
}

// Efficient: Small object subtracted from large
difference() {
    cube([20, 20, 20]);           // Large base object
    cylinder(h=25, r=2);          // Small subtraction
}
```

## Loop and Iteration Optimization

### Avoid Excessive Iterations

```openscad
// Inefficient: Too many iterations
for (i = [0:0.1:10]) {           // 100 iterations!
    translate([i, 0, 0])
        cube([0.1, 1, 1]);
}

// Efficient: Appropriate iteration count
for (i = [0:1:10]) {             // 10 iterations
    translate([i, 0, 0])
        cube([1, 1, 1]);
}

// Even better: Single object when possible
cube([10, 1, 1]);                // Single object, same result
```

### Optimize Nested Loops

```openscad
// Inefficient: Deep nesting creates many objects
for (x = [0:2:20]) {
    for (y = [0:2:20]) {
        for (z = [0:2:20]) {
            translate([x, y, z])
                cube([1, 1, 1]);
        }
    }
}  // 1331 cubes!

// Better: Reduce iterations or combine objects
for (x = [0:5:20]) {
    for (y = [0:5:20]) {
        translate([x, y, 0])
            cube([4, 4, 20]);    // Larger cubes, fewer objects
    }
}  // 25 cubes

// Best: Use hull or other operations when appropriate
hull() {
    cube([1, 1, 1]);
    translate([20, 20, 20])
        cube([1, 1, 1]);
}  // Single object spanning the space
```

### Conditional Optimization

```openscad
// Use conditionals to avoid unnecessary calculations
module conditional_feature(include_feature=true, size=10) {
    cube([size, size, size]);
    
    if (include_feature) {
        translate([size/2, size/2, size])
            cylinder(h=5, r=size/4);
    }
}

// Avoid calculations when not needed
module smart_array(count=10, spacing=5) {
    if (count > 0) {  // Avoid loop when count is 0
        for (i = [0:count-1]) {
            translate([i*spacing, 0, 0])
                cube([spacing*0.8, spacing*0.8, spacing*0.8]);
        }
    }
}
```

## Memory-Efficient Modeling

### Avoid Redundant Geometry

```openscad
// Inefficient: Overlapping geometry
union() {
    cube([10, 10, 10]);
    translate([5, 0, 0]) cube([10, 10, 10]);  // 50% overlap
    translate([10, 0, 0]) cube([10, 10, 10]); // More overlap
}

// Efficient: Non-overlapping geometry
union() {
    cube([10, 10, 10]);
    translate([10, 0, 0]) cube([10, 10, 10]);
    translate([20, 0, 0]) cube([10, 10, 10]);
}

// Even better: Single object when possible
cube([30, 10, 10]);
```

### Use Appropriate Primitives

```openscad
// Inefficient: Complex construction for simple shape
hull() {
    for (i = [0:1:10]) {
        translate([i, 0, 0])
            sphere(r=1);
    }
}

// Efficient: Use appropriate primitive
cylinder(h=1, r=1);
translate([0, 0, 0.5])
    rotate([0, 90, 0])
        cylinder(h=10, r=1);

// Or even simpler
scale([10, 2, 2])
    sphere(r=1);
```

### Minimize Transformation Chains

```openscad
// Inefficient: Multiple transformations
translate([10, 0, 0])
    rotate([0, 0, 45])
        translate([5, 5, 0])
            rotate([45, 0, 0])
                scale([2, 1, 1])
                    cube([1, 1, 1]);

// Better: Combine transformations when possible
translate([10, 0, 0])
    rotate([0, 0, 45])
        translate([5, 5, 0]) {
            rotate([45, 0, 0])
                scale([2, 1, 1])
                    cube([1, 1, 1]);
        }

// Best: Calculate final transformation
multmatrix([
    [1.414, -1.414, 0, 17.07],
    [1.414,  1.414, 0,  7.07],
    [0,      0,     2,     0],
    [0,      0,     0,     1]
])
    cube([1, 1, 1]);
```

## Advanced Optimization Techniques

### Parametric Optimization

```openscad
// Optimize parameters based on use case
module optimized_gear(
    teeth = 20,
    module_size = 2,
    quality = "medium"  // "low", "medium", "high"
) {
    // Adjust resolution based on quality setting
    fn_map = quality == "low" ? 16 :
             quality == "medium" ? 32 : 64;
    
    $fn = fn_map;
    
    // Optimize tooth count for performance
    effective_teeth = quality == "low" ? max(8, teeth/2) : teeth;
    
    // Generate gear with optimized parameters
    gear_primitive(effective_teeth, module_size);
}
```

### Lazy Evaluation Patterns

```openscad
// Use modules to defer expensive calculations
module expensive_calculation(enable=false) {
    if (enable) {
        // Only calculate when needed
        intersection() {
            for (i = [0:360:10]) {
                rotate([0, 0, i])
                    translate([10, 0, 0])
                        sphere(r=2);
            }
            cube([20, 20, 20], center=true);
        }
    }
}

// Usage
expensive_calculation(enable=true);   // Calculate
expensive_calculation(enable=false);  // Skip calculation
```

### Caching Patterns

```openscad
// Cache expensive calculations using variables
expensive_result = intersection() {
    sphere(r=10);
    cube([15, 15, 15], center=true);
};

// Reuse the cached result
translate([20, 0, 0]) expensive_result;
translate([40, 0, 0]) expensive_result;
translate([60, 0, 0]) expensive_result;
```

## Performance Measurement

### Timing Your Code

```openscad
// Use echo statements to measure performance
start_time = $t;  // Not available in OpenSCAD, but concept applies

// Your code here
for (i = [0:100]) {
    translate([i, 0, 0])
        cube([0.8, 0.8, 0.8]);
}

// In practice, use browser performance tools
// or OpenSCAD Babylon's built-in profiling
```

### Benchmarking Different Approaches

```openscad
// Approach A: Many small objects
module approach_a() {
    for (i = [0:50]) {
        translate([i*2, 0, 0])
            cube([1, 1, 1]);
    }
}

// Approach B: Fewer larger objects
module approach_b() {
    for (i = [0:10]) {
        translate([i*10, 0, 0])
            cube([8, 1, 1]);
    }
}

// Approach C: Single object
module approach_c() {
    cube([100, 1, 1]);
}

// Test each approach and measure performance
approach_c();  // Usually fastest for simple cases
```

## Common Performance Pitfalls

### 1. Excessive Resolution
```openscad
// Don't do this
$fn = 200;  // Overkill for most applications
sphere(r=1);

// Do this instead
$fn = 32;   // Good balance
sphere(r=1);
```

### 2. Unnecessary Precision
```openscad
// Don't do this
translate([1.23456789, 2.34567891, 3.45678912])
    cube([0.123456789, 0.234567891, 0.345678912]);

// Do this instead
translate([1.235, 2.346, 3.457])
    cube([0.123, 0.235, 0.346]);
```

### 3. Inefficient Boolean Operations
```openscad
// Don't chain operations unnecessarily
difference() {
    difference() {
        difference() {
            cube([10, 10, 10]);
            cylinder(h=12, r=1);
        }
        translate([5, 5, 0]) cylinder(h=12, r=1);
    }
    translate([2, 2, 0]) cylinder(h=12, r=0.5);
}

// Group all subtractions
difference() {
    cube([10, 10, 10]);
    cylinder(h=12, r=1);
    translate([5, 5, 0]) cylinder(h=12, r=1);
    translate([2, 2, 0]) cylinder(h=12, r=0.5);
}
```

## Optimization Checklist

### Code Review Checklist
- [ ] Are $fn values appropriate for object sizes?
- [ ] Are boolean operations grouped efficiently?
- [ ] Are loops and iterations minimized?
- [ ] Is redundant geometry avoided?
- [ ] Are transformations combined when possible?
- [ ] Are expensive calculations cached or deferred?

### Performance Testing
- [ ] Test with different $fn values
- [ ] Measure parse times for complex models
- [ ] Profile memory usage during rendering
- [ ] Test on target hardware/browsers
- [ ] Compare alternative implementations

## Tools and Resources

- **OpenSCAD Babylon Profiler**: Built-in performance monitoring
- **Browser DevTools**: Memory and CPU profiling
- **OpenSCAD Manual**: Official documentation on parameters
- **Community Examples**: Performance-optimized model library

## Next Steps

- Apply these techniques to your existing models
- Measure performance improvements
- Share optimized patterns with the community
- Contribute to the performance example library
