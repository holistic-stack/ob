# Bracket Examples

## Overview

Brackets are fundamental mechanical components used for mounting, support, and connection. This guide demonstrates various bracket designs from simple L-brackets to complex multi-axis mounting systems, with practical considerations for 3D printing and manufacturing.

## Basic Bracket Designs

### Simple L-Bracket
```openscad
// Basic 90-degree L-bracket
module l_bracket(
    width = 40,
    height = 30,
    depth = 20,
    thickness = 5,
    hole_diameter = 5
) {
    difference() {
        // Main bracket shape
        union() {
            // Vertical plate
            cube([width, thickness, height]);
            
            // Horizontal plate
            cube([width, depth, thickness]);
        }
        
        // Mounting holes in vertical plate
        for (x = [10, width-10]) {
            translate([x, thickness/2, height-10])
                rotate([90, 0, 0])
                    cylinder(h=thickness*2, d=hole_diameter, center=true);
        }
        
        // Mounting holes in horizontal plate
        for (x = [10, width-10]) {
            translate([x, depth-10, thickness/2])
                cylinder(h=thickness*2, d=hole_diameter, center=true);
        }
    }
}

l_bracket();
```

**Explanation**: Creates a parametric L-bracket with mounting holes. The parameters allow easy customization for different applications.

**Performance**: ⚡ Fast - simple geometry with strategic holes
**Applications**: Wall mounting, shelf support, frame connections
**Print Considerations**: Can be printed without supports in the shown orientation

### Reinforced L-Bracket
```openscad
// L-bracket with reinforcement gusset
module reinforced_l_bracket(
    width = 50,
    height = 40,
    depth = 25,
    thickness = 6,
    gusset_size = 15
) {
    difference() {
        union() {
            // Main bracket
            cube([width, thickness, height]);
            cube([width, depth, thickness]);
            
            // Reinforcement gusset
            hull() {
                translate([width/2, thickness, 0])
                    cube([gusset_size, 0.1, thickness]);
                translate([width/2, 0, height-gusset_size])
                    cube([gusset_size, thickness, 0.1]);
            }
        }
        
        // Mounting holes
        for (x = [12, width-12]) {
            // Vertical holes
            translate([x, thickness/2, height-12])
                rotate([90, 0, 0])
                    cylinder(h=thickness*2, d=6, center=true);
            
            // Horizontal holes
            translate([x, depth-12, thickness/2])
                cylinder(h=thickness*2, d=6, center=true);
        }
    }
}

reinforced_l_bracket();
```

**Explanation**: Adds a triangular gusset for increased strength. The `hull()` operation creates a smooth transition between the plates.

**Performance**: ⚡ Fast - hull operation is efficient
**Applications**: Heavy-duty mounting, structural support, load-bearing connections
**Strength**: 3-5x stronger than basic L-bracket

### Adjustable Bracket
```openscad
// Bracket with slotted holes for adjustment
module adjustable_bracket(
    width = 60,
    height = 35,
    depth = 30,
    thickness = 8,
    slot_length = 20
) {
    difference() {
        union() {
            cube([width, thickness, height]);
            cube([width, depth, thickness]);
        }
        
        // Slotted holes for adjustment
        for (x = [15, width-15]) {
            // Vertical slots
            translate([x, thickness/2, height-15])
                rotate([90, 0, 0]) {
                    hull() {
                        cylinder(h=thickness*2, d=6, center=true);
                        translate([0, 0, slot_length/2])
                            cylinder(h=thickness*2, d=6, center=true);
                    }
                }
            
            // Horizontal slots
            translate([x, depth-15, thickness/2]) {
                hull() {
                    cylinder(h=thickness*2, d=6, center=true);
                    translate([slot_length/2, 0, 0])
                        cylinder(h=thickness*2, d=6, center=true);
                }
            }
        }
    }
}

adjustable_bracket();
```

**Explanation**: Uses `hull()` to create elongated slots instead of round holes, allowing for position adjustment during installation.

**Performance**: ⚡ Fast - hull operations are efficient
**Applications**: Adjustable mounting, alignment systems, retrofit installations

## Specialized Bracket Types

### Corner Bracket (3-Way)
```openscad
// Three-way corner bracket for frame construction
module corner_bracket(
    size = 30,
    thickness = 6,
    hole_diameter = 5
) {
    difference() {
        union() {
            // X-axis plate
            cube([size, thickness, size]);
            
            // Y-axis plate
            cube([thickness, size, size]);
            
            // Z-axis plate (horizontal)
            cube([size, size, thickness]);
        }
        
        // Holes in each face
        hole_positions = [8, size-8];
        
        // X-face holes
        for (y = hole_positions) {
            for (z = hole_positions) {
                translate([size/2, thickness/2, z])
                    rotate([90, 0, 0])
                        cylinder(h=thickness*2, d=hole_diameter, center=true);
            }
        }
        
        // Y-face holes
        for (x = hole_positions) {
            for (z = hole_positions) {
                translate([x, size/2, z])
                    rotate([0, 90, 0])
                        cylinder(h=thickness*2, d=hole_diameter, center=true);
            }
        }
        
        // Z-face holes
        for (x = hole_positions) {
            for (y = hole_positions) {
                translate([x, y, thickness/2])
                    cylinder(h=thickness*2, d=hole_diameter, center=true);
            }
        }
    }
}

corner_bracket();
```

**Explanation**: Creates a three-way corner bracket for connecting frame members at right angles in all three dimensions.

**Performance**: ⚡ Fast - simple geometry with systematic holes
**Applications**: Frame construction, 3D printer frames, structural assemblies
**Print Considerations**: Requires supports for overhanging faces

### Swivel Bracket
```openscad
// Bracket with swivel joint
module swivel_bracket(
    base_width = 40,
    arm_length = 30,
    thickness = 8,
    pin_diameter = 6
) {
    // Base plate
    difference() {
        cube([base_width, base_width, thickness]);
        
        // Mounting holes
        for (x = [10, base_width-10]) {
            for (y = [10, base_width-10]) {
                translate([x, y, thickness/2])
                    cylinder(h=thickness*2, d=5, center=true);
            }
        }
        
        // Pin hole
        translate([base_width/2, base_width/2, thickness/2])
            cylinder(h=thickness*2, d=pin_diameter+0.2, center=true);
    }
    
    // Swivel arm (positioned for demonstration)
    translate([base_width/2, base_width/2, thickness]) {
        difference() {
            union() {
                // Arm
                translate([0, 0, thickness/2])
                    cube([arm_length, thickness, thickness], center=true);
                
                // Pivot hub
                cylinder(h=thickness, d=pin_diameter*2);
            }
            
            // Pin hole
            cylinder(h=thickness*2, d=pin_diameter+0.1, center=true);
            
            // Mounting hole at end of arm
            translate([arm_length/2-5, 0, thickness/2])
                cylinder(h=thickness*2, d=4, center=true);
        }
    }
}

swivel_bracket();
```

**Explanation**: Creates a bracket with a swiveling arm. The clearances are designed for 3D printing with a removable pin.

**Performance**: ⚡ Fast - simple geometry with clearances
**Applications**: Adjustable mounting, camera mounts, articulated connections
**Assembly**: Requires separate pin (bolt or printed pin)

## Heavy-Duty Brackets

### Truss-Style Bracket
```openscad
// High-strength truss-style bracket
module truss_bracket(
    width = 80,
    height = 60,
    depth = 40,
    thickness = 10,
    truss_thickness = 6
) {
    difference() {
        union() {
            // Main plates
            cube([width, thickness, height]);
            cube([width, depth, thickness]);
            
            // Truss members
            for (i = [0:2]) {
                x_pos = width/4 + i * width/4;
                
                // Diagonal truss
                hull() {
                    translate([x_pos, thickness, 0])
                        cube([truss_thickness, 0.1, truss_thickness]);
                    translate([x_pos, 0, height-truss_thickness])
                        cube([truss_thickness, thickness, truss_thickness]);
                }
                
                // Horizontal truss
                translate([x_pos, 0, height/2])
                    cube([truss_thickness, depth, truss_thickness]);
            }
        }
        
        // Mounting holes
        for (x = [15, width/2, width-15]) {
            // Vertical plate holes
            translate([x, thickness/2, height-15])
                rotate([90, 0, 0])
                    cylinder(h=thickness*2, d=8, center=true);
            
            // Horizontal plate holes
            translate([x, depth-15, thickness/2])
                cylinder(h=thickness*2, d=8, center=true);
        }
    }
}

truss_bracket();
```

**Explanation**: Uses truss-like reinforcement for maximum strength with minimal material. The diagonal members distribute loads effectively.

**Performance**: ⚠️ Moderate - more complex geometry
**Applications**: Heavy machinery mounting, structural connections, high-load applications
**Strength**: 5-10x stronger than basic brackets

### Shock-Mount Bracket
```openscad
// Bracket with integrated shock absorption
module shock_mount_bracket(
    width = 50,
    height = 40,
    depth = 30,
    thickness = 8,
    flex_thickness = 2
) {
    difference() {
        union() {
            // Rigid mounting base
            cube([width, depth, thickness]);
            
            // Flexible mounting arms
            for (x = [10, width-10]) {
                translate([x-flex_thickness/2, depth, 0]) {
                    // Vertical flexible section
                    cube([flex_thickness, thickness, height-10]);
                    
                    // Top mounting point
                    translate([0, 0, height-10])
                        cube([thickness*2, thickness, thickness]);
                }
            }
        }
        
        // Base mounting holes
        for (x = [12, width-12]) {
            translate([x, depth/2, thickness/2])
                cylinder(h=thickness*2, d=6, center=true);
        }
        
        // Top mounting holes
        for (x = [10, width-10]) {
            translate([x, depth+thickness/2, height-5])
                rotate([90, 0, 0])
                    cylinder(h=thickness*2, d=5, center=true);
        }
    }
}

shock_mount_bracket();
```

**Explanation**: Features thin flexible sections that act as springs to absorb vibration and shock. The geometry provides controlled flexibility.

**Performance**: ⚡ Fast - simple geometry with thin sections
**Applications**: Vibration isolation, shock absorption, sensitive equipment mounting
**Material**: Works best with flexible materials like PETG or TPU

## Manufacturing Considerations

### 3D Printing Optimized Bracket
```openscad
// Bracket optimized for 3D printing
module printable_bracket(
    width = 45,
    height = 35,
    depth = 25,
    thickness = 5,
    chamfer = 2
) {
    difference() {
        union() {
            // Main bracket with chamfered edges
            hull() {
                translate([chamfer, chamfer, chamfer])
                    cube([width-2*chamfer, thickness-2*chamfer, height-2*chamfer]);
                cube([width, thickness, chamfer]);
                cube([width, chamfer, height]);
            }
            
            hull() {
                translate([chamfer, chamfer, chamfer])
                    cube([width-2*chamfer, depth-2*chamfer, thickness-2*chamfer]);
                cube([width, depth, chamfer]);
                cube([width, chamfer, thickness]);
            }
        }
        
        // Holes with chamfered entries
        for (x = [12, width-12]) {
            // Vertical holes
            translate([x, thickness/2, height-12]) {
                rotate([90, 0, 0]) {
                    cylinder(h=thickness*2, d=5, center=true);
                    // Entry chamfer
                    translate([0, 0, thickness/2])
                        cylinder(h=2, d1=5, d2=7);
                }
            }
            
            // Horizontal holes
            translate([x, depth-12, thickness/2]) {
                cylinder(h=thickness*2, d=5, center=true);
                // Entry chamfer
                translate([0, 0, thickness/2])
                    cylinder(h=2, d1=5, d2=7);
            }
        }
    }
}

printable_bracket();
```

**Explanation**: Optimized for 3D printing with chamfered edges, proper hole chamfers, and geometry that doesn't require supports.

**Performance**: ⚡ Fast - hull operations are efficient
**Print Quality**: Excellent surface finish, no supports needed
**Post-Processing**: Minimal cleanup required

## Performance and Design Guidelines

### Load Calculations
```openscad
// Bracket with calculated dimensions for specific loads
module load_rated_bracket(
    load_kg = 10,          // Design load in kg
    safety_factor = 3,     // Safety factor
    material_strength = 30 // Material strength in MPa
) {
    // Calculate required thickness based on load
    required_thickness = max(5, load_kg * safety_factor / 10);
    bracket_width = max(40, load_kg * 4);
    
    echo(str("Design load: ", load_kg, " kg"));
    echo(str("Required thickness: ", required_thickness, " mm"));
    echo(str("Bracket width: ", bracket_width, " mm"));
    
    difference() {
        union() {
            cube([bracket_width, required_thickness, bracket_width*0.8]);
            cube([bracket_width, bracket_width*0.6, required_thickness]);
        }
        
        // Holes sized for load
        hole_diameter = max(5, load_kg/2);
        for (x = [bracket_width*0.2, bracket_width*0.8]) {
            translate([x, required_thickness/2, bracket_width*0.6])
                rotate([90, 0, 0])
                    cylinder(h=required_thickness*2, d=hole_diameter, center=true);
            
            translate([x, bracket_width*0.4, required_thickness/2])
                cylinder(h=required_thickness*2, d=hole_diameter, center=true);
        }
    }
}

// Example: 15kg load bracket
load_rated_bracket(load_kg=15);
```

**Explanation**: Demonstrates how to calculate bracket dimensions based on expected loads and material properties.

### Optimization Tips

1. **Material Distribution**: Place material where stress is highest
2. **Hole Placement**: Keep holes away from high-stress areas
3. **Fillet Radii**: Add fillets at stress concentrations
4. **Wall Thickness**: Maintain consistent thickness for even cooling (3D printing)
5. **Support Structures**: Design to minimize or eliminate support material

## Common Applications

### Electronics Mounting
```openscad
// Bracket for mounting circuit boards
module pcb_bracket(
    pcb_width = 60,
    pcb_length = 40,
    standoff_height = 10,
    hole_spacing = 2.54  // Standard PCB hole spacing
) {
    // Base plate
    difference() {
        cube([pcb_width+20, pcb_length+20, 3]);
        
        // Mounting holes in base
        for (x = [10, pcb_width+10]) {
            for (y = [10, pcb_length+10]) {
                translate([x, y, 1.5])
                    cylinder(h=5, d=4, center=true);
            }
        }
    }
    
    // PCB standoffs
    for (x = [0, pcb_width]) {
        for (y = [0, pcb_length]) {
            translate([x+10, y+10, 3]) {
                difference() {
                    cylinder(h=standoff_height, d=6);
                    cylinder(h=standoff_height*2, d=2.2, center=true);
                }
            }
        }
    }
}

pcb_bracket();
```

**Applications**: Arduino mounting, sensor brackets, control panel mounting

## Related Examples

- **[Gears and Wheels](./gears-examples.md)** - Rotating mechanical components
- **[Housings and Enclosures](./housings-examples.md)** - Protective cases
- **[Fasteners and Hardware](./fasteners-examples.md)** - Connection hardware
- **[Boolean Operations](../boolean-operations/)** - Techniques used in bracket design

## Interactive Examples

Try these in OpenSCAD Babylon:

1. **Basic L-Bracket**: Start with the simple L-bracket and adjust dimensions
2. **Custom Bracket**: Design a bracket for a specific mounting application
3. **Load Testing**: Use the load-rated bracket calculator for your requirements
4. **Print Optimization**: Experiment with the printable bracket design

## Next Steps

- Explore [Housings and Enclosures](./housings-examples.md) for protective structures
- Learn about [Fasteners](./fasteners-examples.md) for connecting brackets
- Apply bracket concepts in [Functional Objects](../functional/) examples
- Study [Performance Examples](../performance/) for optimization techniques
