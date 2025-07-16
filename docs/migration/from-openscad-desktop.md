# Migration from OpenSCAD Desktop Application

## Overview

This guide helps you transition from the traditional OpenSCAD desktop application to the web-based OpenSCAD Babylon environment. While maintaining familiar OpenSCAD syntax, the web environment offers new capabilities and workflow improvements.

## Key Differences

### Environment Changes
| Feature | Desktop OpenSCAD | OpenSCAD Babylon |
|---------|------------------|------------------|
| **Platform** | Desktop application | Web browser |
| **Installation** | Download and install | Access via URL |
| **File Management** | Local file system | Browser storage + cloud |
| **Collaboration** | File sharing | Real-time sharing |
| **Updates** | Manual updates | Automatic updates |
| **Extensions** | Limited plugins | Rich web ecosystem |

### Feature Compatibility

#### ✅ Fully Supported Features
- **Primitives**: cube, sphere, cylinder, polyhedron
- **Transformations**: translate, rotate, scale, mirror
- **Boolean Operations**: union, difference, intersection
- **Control Flow**: for loops, if statements
- **Mathematical Functions**: sin, cos, tan, sqrt, etc.
- **Variables and Expressions**: Basic variable assignments

#### ⚠️ Partially Supported Features
- **Modules**: Parsed but not executed (planned for future)
- **Functions**: Parsed but not evaluated (planned for future)
- **Include/Import**: Not supported (use copy-paste for now)
- **Surface Operations**: Limited support

#### ❌ Not Supported Features
- **External Libraries**: MCAD, BOSL, etc. (use inline code)
- **File I/O**: No file system access
- **Command Line**: No CLI interface
- **Customizer**: Not implemented (planned for future)

## Workflow Migration

### Desktop Workflow
```
1. Open OpenSCAD application
2. Create/open .scad file
3. Edit code in built-in editor
4. Press F5 to preview
5. Press F6 to render
6. Export to STL/other formats
7. Save .scad file locally
```

### Web Workflow
```
1. Open OpenSCAD Babylon in browser
2. Start with template or paste code
3. Edit code with real-time preview
4. Automatic parsing and rendering
5. Interactive 3D manipulation
6. Export directly from browser
7. Save to browser storage or download
```

## Code Migration

### Basic Syntax (No Changes)
Your existing OpenSCAD code works without modification:

```openscad
// This code works identically in both environments
cube([10, 20, 30]);
translate([15, 0, 0]) sphere(r=5);

difference() {
    cube([20, 20, 20]);
    translate([10, 10, 10]) sphere(r=8);
}
```

### Module Definitions (Syntax Only)
Module definitions are parsed but not executed:

```openscad
// Desktop: Fully functional
module my_part(size=10) {
    cube([size, size, size]);
}
my_part(15);

// Web: Parsed but not executed
// Workaround: Inline the module code
size = 15;
cube([size, size, size]);
```

### Include/Import Statements (Not Supported)
```openscad
// Desktop: Works with local files
include <MCAD/boxes.scad>
use <library.scad>

// Web: Not supported
// Workaround: Copy library code directly into your file
// Or use web-compatible alternatives
```

### File Operations (Not Supported)
```openscad
// Desktop: Can read external files
surface(file="heightmap.png");
import("model.stl");

// Web: Not supported
// Workaround: Use built-in primitives or manual data entry
```

## Project Migration Steps

### 1. Prepare Your Code
```bash
# Create a backup of your .scad files
cp -r ~/openscad-projects ~/openscad-projects-backup

# Identify dependencies
grep -r "include\|use\|import" ~/openscad-projects/
```

### 2. Handle Dependencies
For each dependency:

```openscad
// Option 1: Inline the required functions
// Copy the needed functions directly into your file

// Option 2: Rewrite using built-in functions
// Replace library functions with equivalent built-in operations

// Option 3: Use web-compatible alternatives
// Find equivalent functionality in OpenSCAD Babylon
```

### 3. Test Your Code
1. Open OpenSCAD Babylon in your browser
2. Paste your code into the editor
3. Check for parsing errors (highlighted in red)
4. Verify the 3D output matches your expectations
5. Test all features and interactions

### 4. Optimize for Web
```openscad
// Optimize complex operations for better performance
// Before: Very complex nested operations
difference() {
    union() {
        for(i=[0:100]) {
            translate([i*2, 0, 0]) cube([1, 1, 1]);
        }
    }
    // ... complex subtraction
}

// After: Simplified for better web performance
difference() {
    cube([200, 1, 1]); // Equivalent but simpler
    // ... simplified subtraction
}
```

## File Management Migration

### Desktop File Organization
```
~/openscad-projects/
├── project1/
│   ├── main.scad
│   ├── parts/
│   │   ├── bracket.scad
│   │   └── housing.scad
│   └── libraries/
│       └── utils.scad
└── project2/
    └── model.scad
```

### Web File Organization
```
Browser Storage:
├── Project 1 (saved project)
│   └── Combined code with inlined parts
├── Project 2 (saved project)
│   └── Standalone model code
└── Templates/
    ├── Basic Template
    ├── Mechanical Parts Template
    └── Architectural Template
```

### Migration Strategy
1. **Combine Files**: Merge multi-file projects into single files
2. **Inline Dependencies**: Copy library code directly into main files
3. **Use Browser Storage**: Save projects in browser local storage
4. **Export Regularly**: Download .scad files as backups

## Export and Integration

### Desktop Export Options
- STL (binary/ASCII)
- OFF format
- AMF format
- 3MF format
- DXF (2D)
- SVG (2D)
- PNG images

### Web Export Options
- STL (binary/ASCII) ✅
- 3MF format ✅
- GLTF/GLB ✅ (new!)
- PNG screenshots ✅
- Project files (.json) ✅ (new!)

### Enhanced Web Features
```typescript
// New capabilities not available in desktop
// Real-time collaboration
shareProject("https://openscad-babylon.com/project/abc123");

// Interactive selection and export
selectObjects([cube1, sphere1]);
exportSelected("my-parts.stl");

// Performance monitoring
showPerformanceMetrics(true);
```

## Performance Considerations

### Desktop vs Web Performance
| Aspect | Desktop | Web |
|--------|---------|-----|
| **Parsing** | Native C++ | WebAssembly (95% speed) |
| **Rendering** | OpenGL | WebGL (90% speed) |
| **Memory** | System RAM | Browser limits |
| **File Size** | No limits | Practical limits (~50MB) |

### Optimization Tips
```openscad
// Use $fn sparingly for better performance
sphere(r=10, $fn=100); // Heavy
sphere(r=10, $fn=32);  // Better for web

// Avoid excessive nesting
// Instead of deep nesting, use intermediate variables
intermediate = union() { cube([1,1,1]); sphere(r=0.5); }
final_result = difference() { intermediate; cylinder(h=2, r=0.3); }
```

## Troubleshooting Common Issues

### Issue: Code doesn't parse
**Symptoms**: Red highlighting, error messages
**Solutions**:
1. Check for unsupported features (modules, includes)
2. Verify syntax correctness
3. Remove or replace library dependencies

### Issue: Different rendering results
**Symptoms**: Model looks different from desktop
**Solutions**:
1. Check $fn values (may need adjustment)
2. Verify floating-point precision differences
3. Test with simplified geometry first

### Issue: Performance problems
**Symptoms**: Slow rendering, browser freezing
**Solutions**:
1. Reduce $fn values for curves
2. Simplify complex boolean operations
3. Break large models into smaller parts

### Issue: Export problems
**Symptoms**: Export fails or produces incorrect files
**Solutions**:
1. Try different export formats
2. Simplify geometry before export
3. Check browser console for error messages

## Best Practices for Web Development

### 1. Code Organization
```openscad
// Use clear variable names and comments
part_width = 20;
part_height = 10;
part_depth = 5;

// Main part
cube([part_width, part_height, part_depth]);

// Add features
translate([part_width/2, part_height/2, part_depth])
    cylinder(h=2, r=2); // Mounting hole
```

### 2. Performance Optimization
```openscad
// Use appropriate $fn values
$fn = 32; // Good default for most cases

// Avoid excessive detail in preview
if ($preview) {
    $fn = 16; // Lower detail for faster preview
} else {
    $fn = 64; // Higher detail for final render
}
```

### 3. Browser Compatibility
- Use modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Enable WebGL 2.0 for best performance
- Ensure sufficient RAM (4GB+ recommended)

## Migration Checklist

### Pre-Migration
- [ ] Inventory all .scad files and dependencies
- [ ] Identify unsupported features in your code
- [ ] Plan file organization strategy
- [ ] Set up browser bookmarks and workspace

### During Migration
- [ ] Test each file individually in web environment
- [ ] Inline or replace library dependencies
- [ ] Optimize performance-critical sections
- [ ] Verify export functionality

### Post-Migration
- [ ] Set up regular backup routine
- [ ] Train team on new web workflow
- [ ] Update documentation and procedures
- [ ] Monitor performance and user feedback

## Next Steps

1. **Start Small**: Begin with simple, standalone .scad files
2. **Test Thoroughly**: Verify all functionality works as expected
3. **Optimize Gradually**: Improve performance over time
4. **Explore New Features**: Take advantage of web-specific capabilities
5. **Provide Feedback**: Help improve OpenSCAD Babylon with your experience

## Support Resources

- [OpenSCAD Language Reference](https://openscad.org/documentation.html)
- [OpenSCAD Babylon API Documentation](../api/README.md)
- [Performance Optimization Guide](./performance-optimization.md)
- [Community Forum](https://github.com/openscad-babylon/discussions)
- [Bug Reports](https://github.com/openscad-babylon/issues)
