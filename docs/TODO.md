# TODO: Next Steps for OpenSCAD Babylon Project

This document outlines the planned tasks and future enhancements for the project.

## Immediate Tasks
- [ ] **Implement `scale` transformation:** Add a `visitScale` method to the `OpenScadAstVisitor` to handle scaling operations.
- [ ] **Implement `rotate` transformation:** Add a `visitRotate` method to handle rotations.
- [ ] **Enhance Cylinder/Sphere Resolution:** Implement logic to handle OpenSCAD's special variables (`$fa`, `$fs`, `$fn`) to control the resolution (tessellation/segments) of spheres and cylinders.

## Future Enhancements
- [ ] **Support for 2D Shapes:** Add visitors for 2D shapes like `square`, `circle`, and `polygon`.
- [ ] **Implement `linear_extrude` and `rotate_extrude`:** Add support for extruding 2D shapes into 3D objects.
- [ ] **Module System:** Implement support for OpenSCAD's `use` and `include` statements to handle multi-file projects.
- [ ] **Variable and Function Support:** Add a symbol table and evaluation logic to handle OpenSCAD variables and functions.
- [ ] **Error Handling and Reporting:** Improve error reporting with more detailed messages and source location tracking for invalid operations or parameters.
- [ ] **Performance Optimization:** Investigate performance bottlenecks and optimize mesh generation and CSG operations for complex models.
