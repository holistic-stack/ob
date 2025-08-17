# How to: Add a New Primitive

Purpose: add a primitive that renders like OpenSCAD.

Steps
1) Define parameters (strict types)
- src/features/openscad-geometry-builder/types/primitive-parameters.ts

2) Fragment rules if needed ($fn/$fs/$fa)
- services/fragment-calculator/fragment-calculator.ts

3) Implement generator
- services/primitive-generators/2d-primitives or 3d-primitives/<your-primitive>/<your-primitive>.ts
- Keep functions under 50 lines; compose small helpers

4) Expose via factory
- 2D: services/primitive-generators/2d-primitives/primitive-2d-factory.ts
- 3D: services/primitive-generators/3d-primitives/primitive-3d-factory.ts

5) Convert to meshes
- services/mesh-converter/geometry-to-mesh-converter.ts
- services/geometry-bridge/babylon-mesh-builder.ts

6) Tests
- Co-locate: <your-primitive>.test.ts (edge cases, parameter validation)
- Use existing assertions in: test-utilities/

Do
- Use readonly arrays; validate inputs
- Add JSDoc @file and @example

Don’t
- Don’t hardcode fragments; don’t bypass validators

