# OpenSCAD Language Guide for Developers

This guide provides a comprehensive overview of the OpenSCAD language, including its syntax, features, and recent changes. It's designed to get developers up to speed quickly.

## 1. Core Concepts

OpenSCAD is a **functional, script-based CAD program**. You create 3D models by writing code, not by drawing them. This makes it a powerful tool for creating parametric designs.

- **Primitives:** Complex shapes are built from simple 2D and 3D shapes called primitives (e.g., `cube()`, `sphere()`, `circle()`).
- **Transformations:** Primitives are manipulated (moved, rotated, scaled) using transformation functions (e.g., `translate()`, `rotate()`, `scale()`).
- **Boolean Operations:** Complex shapes are created by combining primitives using boolean operations (`union()`, `difference()`, `intersection()`).

## 2. Syntax Cheat Sheet

### Variables

Variables are assigned with `=`. They are bound to expressions and are immutable (their value cannot be changed once set).

```openscad
my_variable = 10;
width = 5 * 2;
```

### 2D Primitives

- `circle(radius | d=diameter)`: Creates a circle.
- `square(size, center)`: Creates a square.
- `polygon([points])`: Creates a polygon from a list of points.
- `text(t, size, font)`: Creates text as a 2D object.

### 3D Primitives

- `sphere(radius | d=diameter)`: Creates a sphere.
- `cube(size, center)`: Creates a cube.
- `cylinder(h, r|d, center)`: Creates a cylinder.
- `polyhedron(points, faces)`: Creates a polyhedron from a set of points and faces.

### Transformations

- `translate([x, y, z]) { ... }`: Moves the child objects.
- `rotate([x, y, z]) { ... }`: Rotates the child objects.
- `scale([x, y, z]) { ... }`: Scales the child objects.
- `mirror([x, y, z]) { ... }`: Mirrors the child objects across a plane.
- `resize([x, y, z]) { ... }`: Resizes the child objects to new dimensions.

### Boolean Operations

- `union() { ... }`: Combines all child objects into a single object.
- `difference() { ... }`: Subtracts the second and subsequent child objects from the first.
- `intersection() { ... }`: Creates an object that is the intersection of all child objects.

### Extrusions

- `linear_extrude(height, center, convexity, twist, slices) { ... }`: Extrudes a 2D shape along a line.
- `rotate_extrude(angle, convexity) { ... }`: Rotates a 2D shape around the Z-axis.

### Flow Control

- `for (i = [start:step:end]) { ... }`: A loop for creating multiple objects.
- `if (condition) { ... } else { ... }`: Executes code conditionally.
- `intersection_for (i = [start:end]) { ... }`: Creates the intersection of all objects generated in the loop.

### Special Variables

These variables control the level of detail in curved objects:

- `$fa`: Minimum angle for a fragment.
- `$fs`: Minimum size of a fragment.
- `$fn`: Number of fragments in a circle.
- `$t`: Animation step.

### Modifier Characters

These characters are placed before an object to change how it's rendered:

- `*` (disable): Disables an object, making it invisible.
- `!` (show only): Shows only this object, hiding all others.
- `#` (debug): Highlights the object in transparent red.
- `%` (transparent): Renders the object transparent.

## 3. Recent Language Changes & New Features

OpenSCAD has evolved, especially around the 2021.01 release. Here are the key changes:

### New Features

- **Function Literals:** Functions can now be treated as values, assigned to variables, and passed to other functions.
- **`let()` Statement:** The preferred way to create local variables within a specific scope.
- **`assert()` Module:** For testing and validation within your scripts.
- **Exponent Operator (`^`):** For power calculations (e.g., `2^3`).
- **`offset()` Module:** For creating 2D offsets of shapes.
- **`text()` Module:** A dedicated module for creating 2D text.
- **`$preview` Variable:** A special variable that is `true` when in preview mode, allowing for conditional logic.

### Deprecated Features (Avoid Using These)

- **`assign()`:** Replaced by the `let()` statement for local variables.
- **`dxf_linear_extrude()` and `dxf_rotate_extrude()`:** Use `linear_extrude()` and `rotate_extrude()` with `import()` instead.
- **`import_dxf()`, `import_stl()`, `import_off()`:** Use the universal `import()` function.
- **`child()`:** Replaced by `children()`.
- **`polyhedron(triangles=[...])`:** The `triangles` argument is now `faces`.
- **Old include syntax (`<filename.scad>`):** Use `include <filename.scad>` or `use <filename.scad>`.

## 4. Syntax Variations, Pitfalls & Best Practices

### Transformation Scopes: `{}` vs. single statements

A common point of confusion is how transformations apply to other objects.

- **Using `{}` (curly braces):** The transformation applies to **all** objects inside the braces. This is the most common and recommended way to group objects.

  ```openscad
  // The translation applies to both the sphere and the cube.
  translate([10, 0, 0]) {
      sphere(5);
      cube(10);
  }
  ```

- **Without `{}`:** The transformation applies **only to the very next object**.

  ```openscad
  // The translation ONLY applies to the sphere. The cube is not affected.
  translate([10, 0, 0]) sphere(5);
  cube(10);
  ```

  **Best Practice:** Always use curly braces `{}` for transformations, even if you are only transforming a single object. This makes your code clearer and less prone to errors.

### Common Pitfalls

- **Z-Fighting:** When two surfaces occupy the exact same space, the renderer can't decide which to show, causing a flickering effect.
  - **Solution:** Create a tiny overlap (e.g., `0.01`) between objects that should be flush. For `difference()`, make the subtracting object slightly larger.

- **Variable Re-assignment:** You can't re-assign a variable in the traditional sense. OpenSCAD's variables are more like constants within their scope.
  - **Solution:** Use modules and functions with parameters to manage changing values.

- **Floating Point Inaccuracy:** Like all computer graphics, OpenSCAD can have issues with floating-point math.
  - **Solution:** When comparing values, check if they are within a small epsilon (e.g., `abs(a - b) < 0.0001`) instead of using `==`.

### Advanced Techniques

- **`children()` Special Module:** Create your own transformative modules that act like `translate()` or `rotate()`. This is powerful for creating patterns.

  ```openscad
  module circular_array(num_children, radius) {
      for (i = [0 : num_children - 1]) {
          rotate([0, 0, i * (360 / num_children)])
          translate([radius, 0, 0])
          children(i);
      }
  }

  circular_array(6, 20) {
      sphere(5);
  }
  ```

- **List Comprehensions:** A concise way to generate lists, often used for creating complex geometries.

  ```openscad
  // Create a series of translated cubes
  for (i = [0:2:10]) {
      translate([i * 5, 0, 0]) cube(2);
  }

  // Generate points for a polygon
  points = [for (a = [0:10:350]) [cos(a) * 20, sin(a) * 20]];
  polygon(points);
  ```

- **`hull()` and `minkowski()`:**
  - `hull()`: Creates the convex hull around a group of objects, great for blending shapes.
  - `minkowski()`: Adds one shape to the surface of another, useful for rounding edges.

### Code Organization Best Practices

- **Use Modules:** Break down your design into smaller, reusable components using `module`.
- **Separate Files:** For larger projects, split your code into multiple files.
  - `include <filename.scad>`: Acts like a copy-paste. Useful for sharing variables.
  - `use <filename.scad>`: Imports only modules and functions. Generally safer for libraries.
- **Data-Driven Design:** Separate your design's parameters (the "what") from its logic (the "how"). Store dimensions and configurations in variables at the top of your file or in a separate file.

This guide covers the essentials of the OpenSCAD language. For more in-depth information, always refer to the [official OpenSCAD documentation](https://openscad.org/documentation.html).
