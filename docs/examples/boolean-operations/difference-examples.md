# Difference Examples

## Overview

The `difference()` operation is fundamental to subtractive modeling in OpenSCAD. It subtracts one or more shapes from a base shape, creating holes, cutouts, and complex internal geometries. This guide covers practical applications and advanced techniques.

## Basic Difference Operations

### Simple Hole in Cube
```openscad
// Create a cube with a cylindrical hole through it
difference() {
    cube([20, 20, 20], center=true);
    cylinder(h=25, r=5, center=true);
}
```

**Explanation**: The `difference()` operation takes the first object (cube) and removes the second object (cylinder) from it. The cylinder is made slightly taller (25 vs 20) to ensure it completely penetrates the cube.

**Performance**: ⚡ Fast - simple boolean operation
**Use Cases**: Mounting holes, ventilation, weight reduction

### Multiple Holes
```openscad
// Cube with multiple holes
difference() {
    cube([30, 30, 10], center=true);
    
    // Corner holes
    for (x = [-10, 10]) {
        for (y = [-10, 10]) {
            translate([x, y, 0])
                cylinder(h=15, r=2, center=true);
        }
    }
    
    // Center hole
    cylinder(h=15, r=4, center=true);
}
```

**Explanation**: Multiple objects can be subtracted in a single `difference()` operation. All objects after the first are removed from the first object.

**Performance**: ⚡ Fast - efficient multiple subtraction
**Applications**: Mounting plates, perforated panels, lightweighting

### Slot Creation
```openscad
// Create a slot (elongated hole)
difference() {
    cube([40, 20, 5], center=true);
    
    // Slot using hull of two cylinders
    hull() {
        translate([-10, 0, 0])
            cylinder(h=10, r=3, center=true);
        translate([10, 0, 0])
            cylinder(h=10, r=3, center=true);
    }
}
```

**Explanation**: Uses `hull()` to create a slot by connecting two cylinders. The slot allows for adjustment and movement in mechanical assemblies.

**Performance**: ⚡ Fast - hull operation is efficient
**Applications**: Adjustment slots, sliding mechanisms, mounting systems

## Practical Applications

### Bracket with Mounting Holes
```openscad
// L-shaped bracket with mounting holes
module bracket() {
    difference() {
        // Main bracket shape
        union() {
            cube([50, 10, 30]);  // Vertical part
            cube([50, 30, 10]);  // Horizontal part
        }
        
        // Mounting holes in vertical part
        for (x = [10, 40]) {
            translate([x, 5, 20])
                rotate([90, 0, 0])
                    cylinder(h=15, r=2.5);
        }
        
        // Mounting holes in horizontal part
        for (x = [10, 40]) {
            translate([x, 20, 5])
                cylinder(h=15, r=2.5);
        }
    }
}

bracket();
```

**Explanation**: Creates a functional L-bracket with precisely positioned mounting holes. The holes are sized for M5 bolts (2.5mm radius for 5mm diameter).

**Performance**: ⚡ Fast - simple geometry with strategic holes
**Applications**: Structural mounting, mechanical assemblies, fixtures

### Container with Lid
```openscad
// Container with removable lid
module container() {
    wall_thickness = 2;
    
    difference() {
        // Outer shell
        cube([60, 40, 30]);
        
        // Inner cavity
        translate([wall_thickness, wall_thickness, wall_thickness])
            cube([
                60 - 2*wall_thickness,
                40 - 2*wall_thickness,
                30  // Open top
            ]);
        
        // Lid groove
        translate([wall_thickness/2, wall_thickness/2, 25])
            cube([
                60 - wall_thickness,
                40 - wall_thickness,
                5
            ]);
    }
}

container();
```

**Explanation**: Creates a container with walls and a groove for a lid. The groove is created by subtracting a shallow rectangular cavity near the top.

**Performance**: ⚡ Fast - efficient wall creation
**Applications**: Storage boxes, enclosures, protective cases

### Gear Tooth Profile
```openscad
// Simplified gear using difference operation
module simple_gear(teeth=12, radius=20) {
    difference() {
        // Base cylinder
        cylinder(h=5, r=radius);
        
        // Tooth gaps
        for (i = [0 : teeth-1]) {
            rotate([0, 0, i * 360/teeth])
                translate([radius-2, 0, 0])
                    cylinder(h=10, r=1.5, center=true);
        }
    }
}

simple_gear(teeth=16, radius=25);
```

**Explanation**: Creates a simplified gear by removing small cylinders around the perimeter. While not a true involute gear, it demonstrates the concept.

**Performance**: ⚡ Moderate - depends on tooth count
**Applications**: Simple gears, decorative elements, mechanical prototypes

## Advanced Difference Techniques

### Chamfered Holes
```openscad
// Holes with chamfered edges
module chamfered_hole(diameter=10, depth=20, chamfer=2) {
    union() {
        // Main hole
        cylinder(h=depth, d=diameter);
        
        // Top chamfer
        translate([0, 0, depth-0.1])
            cylinder(h=chamfer, d1=diameter, d2=diameter+2*chamfer);
        
        // Bottom chamfer
        translate([0, 0, -chamfer+0.1])
            cylinder(h=chamfer, d1=diameter+2*chamfer, d2=diameter);
    }
}

// Usage in a part
difference() {
    cube([30, 30, 15], center=true);
    
    translate([0, 0, 0])
        chamfered_hole(diameter=8, depth=20, chamfer=1.5);
}
```

**Explanation**: Creates holes with chamfered (angled) edges for better appearance and easier assembly. The chamfers are created using tapered cylinders.

**Performance**: ⚠️ Moderate - additional geometry for chamfers
**Applications**: High-quality parts, visible holes, assembly aids

### Text Cutouts
```openscad
// Text engraved into surface
difference() {
    cube([50, 20, 5]);
    
    translate([25, 10, 4])
        linear_extrude(height=2)
            text("SAMPLE", size=6, halign="center", valign="center");
}
```

**Explanation**: Creates engraved text by subtracting extruded text from a solid. The text is positioned and sized appropriately.

**Performance**: ⚠️ Moderate - text geometry can be complex
**Applications**: Labels, branding, identification marks

### Ventilation Grille
```openscad
// Ventilation grille pattern
module ventilation_grille(width=40, height=30, slot_width=2, spacing=4) {
    difference() {
        cube([width, height, 3]);
        
        // Horizontal slots
        for (y = [spacing : spacing+slot_width : height-spacing]) {
            translate([2, y, 0])
                cube([width-4, slot_width, 5]);
        }
    }
}

ventilation_grille(width=60, height=40);
```

**Explanation**: Creates a ventilation grille by subtracting horizontal slots. The pattern is parametric and can be easily adjusted.

**Performance**: ⚡ Fast - simple repeated geometry
**Applications**: Ventilation, speaker grilles, decorative panels

## Complex Difference Operations

### Nested Differences
```openscad
// Complex part with multiple levels of subtraction
difference() {
    // Main body
    cube([40, 40, 20], center=true);
    
    // Large central cavity
    difference() {
        cube([30, 30, 25], center=true);
        
        // Internal ribs (what remains after subtraction)
        for (i = [0:3]) {
            rotate([0, 0, i*90])
                translate([0, 12, 0])
                    cube([4, 8, 25], center=true);
        }
    }
    
    // Corner holes
    for (x = [-15, 15]) {
        for (y = [-15, 15]) {
            translate([x, y, 0])
                cylinder(h=25, r=3, center=true);
        }
    }
}
```

**Explanation**: Demonstrates nested `difference()` operations to create complex internal geometries with ribs and supports.

**Performance**: ⚠️ Moderate - multiple boolean operations
**Applications**: Lightweight structures, complex housings, optimized parts

### Conditional Differences
```openscad
// Part with optional features
include_holes = true;
include_slots = false;

difference() {
    cube([50, 30, 10], center=true);
    
    // Conditional holes
    if (include_holes) {
        for (x = [-15, 0, 15]) {
            translate([x, 0, 0])
                cylinder(h=15, r=2, center=true);
        }
    }
    
    // Conditional slots
    if (include_slots) {
        for (y = [-10, 10]) {
            translate([0, y, 0])
                cube([40, 2, 15], center=true);
        }
    }
}
```

**Explanation**: Uses conditional statements to create different versions of a part. This is useful for creating families of related parts.

**Performance**: ⚡ Fast - conditions evaluated at parse time
**Applications**: Part families, configuration options, design variants

## Performance Optimization

### Efficient Hole Patterns
```openscad
// Efficient: Single difference with multiple subtractions
difference() {
    cube([50, 50, 10]);
    
    for (x = [5:10:45]) {
        for (y = [5:10:45]) {
            translate([x, y, 0])
                cylinder(h=15, r=2);
        }
    }
}

// Less efficient: Multiple difference operations
// Don't do this for many holes:
/*
cube([50, 50, 10]);
for (x = [5:10:45]) {
    for (y = [5:10:45]) {
        difference() {
            // This creates many separate operations
        }
    }
}
*/
```

**Explanation**: Group all subtractions into a single `difference()` operation for better performance. Avoid nested difference operations in loops.

### Optimization Tips

1. **Group Subtractions**: Put all objects to subtract in one `difference()` operation
2. **Avoid Tiny Features**: Very small holes or details may not be visible but still cost performance
3. **Use Appropriate Resolution**: Don't use high `$fn` values for simple holes
4. **Minimize Overlap**: Ensure subtracted objects fully penetrate the base object

## Common Mistakes and Solutions

### Mistake: Insufficient Penetration
```openscad
// Problem: Hole doesn't go all the way through
difference() {
    cube([10, 10, 10]);
    cylinder(h=10, r=2);  // Exactly same height - may not work
}

// Solution: Make hole slightly longer
difference() {
    cube([10, 10, 10]);
    cylinder(h=12, r=2);  // Longer than cube
}
```

### Mistake: Z-Fighting
```openscad
// Problem: Surfaces exactly coincident
difference() {
    cube([10, 10, 10]);
    translate([0, 0, 5])
        cube([12, 12, 5]);  // Top surface exactly at z=10
}

// Solution: Small overlap
difference() {
    cube([10, 10, 10]);
    translate([0, 0, 4.9])
        cube([12, 12, 5.2]);  // Slight overlap
}
```

### Mistake: Wrong Object Order
```openscad
// Problem: Objects in wrong order
difference() {
    cylinder(h=5, r=2);     // Small object first
    cube([10, 10, 10]);     // Large object second - wrong!
}

// Solution: Base object first
difference() {
    cube([10, 10, 10]);     // Base object first
    cylinder(h=12, r=2);    // Subtracted object second
}
```

## Related Examples

- **[Union Examples](./union-examples.md)** - Combining shapes
- **[Intersection Examples](./intersection-examples.md)** - Shape intersections
- **[Complex Boolean Operations](./complex-examples.md)** - Advanced combinations
- **[Mechanical Parts](../mechanical-parts/)** - Real-world applications

## Interactive Examples

Try these in OpenSCAD Babylon:

1. **Basic Hole**: Start with the simple cube and cylinder example
2. **Multiple Holes**: Experiment with different hole patterns
3. **Functional Part**: Create a bracket or container with your own dimensions
4. **Text Engraving**: Add your own text to a surface

## Next Steps

- Learn about [Union Operations](./union-examples.md) for additive modeling
- Explore [Complex Boolean Operations](./complex-examples.md) for advanced techniques
- Apply difference operations in [Mechanical Parts](../mechanical-parts/) examples
- Create your own [Functional Objects](../functional/) using subtractive modeling
