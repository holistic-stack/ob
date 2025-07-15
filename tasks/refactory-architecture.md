# OpenSCAD-to-Babylon.js Refactoring Guide

## 1. Introduction for Junior Developers

### What Are We Doing?

Our goal is to take text-based OpenSCAD code (like `cube(10);`) and render it as a 3D model in the browser using the Babylon.js library.

### The Challenge

We already have a powerful `openscad-parser` that reads the code and turns it into a structured format called an **AST (Abstract Syntax Tree)**. However, this AST is generic and doesn't know anything about Babylon.js.

### Our Solution: The "Bridge Pattern"

Instead of rewriting the existing parser (which is complex and works well), we will build a **"Bridge"**. This bridge will be a translator that converts the parser's generic AST into a new, specialized **Babylon.js-ready AST**.

Think of it like this:
*   **Parser AST**: A universal blueprint of the 3D model.
*   **Bridge (Converter)**: A contractor who reads the blueprint and translates it into specific instructions for the construction crew.
*   **Babylon.js AST**: The step-by-step instructions the construction crew (Babylon.js) can understand and use to build the 3D model.

This approach is safe, fast, and keeps our code clean by separating the "what" (the model's structure) from the "how" (the rendering details).

---

## 2. The 4-Layer Architecture (As Implemented)

Our application is divided into four distinct layers. This separation makes the code easier to manage, test, and upgrade.

```mermaid
graph TD
    subgraph "Layer 1: Parsing"
        A[OpenSCAD Code (.scad)] --> B{openscad-parser};
        B --> C[Generic OpenscadAST];
    end

    subgraph "Layer 2: The Bridge (AST Conversion)"
        C --> D{AST-to-CSG Converter};
        D --> E[Babylon.js-Extended AST];
    end

    subgraph "Layer 3: Mesh Generation"
        E --> F{Babylon.js Mesh Engine};
        F --> G[Renderable Meshes];
    end

    subgraph "Layer 4: Scene & UI"
        G --> H{Babylon.js Scene};
        H --> I[React UI Components];
    end
```

| Layer | Component | Responsibility | Location |
| :--- | :--- | :--- | :--- |
| **1. Parsing** | `openscad-parser` | Converts raw OpenSCAD code into a generic `OpenscadAST`. | `src/features/openscad-parser/` |
| **2. The Bridge** | `ast-to-csg-converter` | Translates the `OpenscadAST` into the `Babylon.js-Extended AST`. | `src/features/ast-to-csg-converter/` |
| **3. Mesh Generation**| `babylon-renderer` | Traverses the `Babylon.js-Extended AST` and uses Babylon.js to create visible 3D meshes. | `src/features/babylon-renderer/` |
| **4. Scene & UI** | `babylon-canvas` | Manages the Babylon.js scene, camera, lights, and displays it in a React component. | `src/features/babylon-renderer/babylon-canvas/` |

---

## 3. Step-by-Step Implementation Plan

This plan is broken down into manageable tasks. Each step builds upon the last.

### Phase 1: Define the Babylon.js-Extended AST

**Goal:** Create the new set of AST node types that are tailored for Babylon.js.

**Location:** `src/features/babylon-renderer/types/`

**Key Tasks:**

1.  **Create the Base Class (`OpenSCADNode`):**
    *   This is the foundation for all other nodes in our new AST.
    *   It **must** extend `BABYLON.AbstractMesh`. This is the magic that lets Babylon.js understand our nodes directly.
    *   **File:** `src/features/babylon-renderer/types/openscad-node.types.ts`
    *   **Code:**
        ```typescript
        import { AbstractMesh, Scene } from '@babylonjs/core';
        import { Result } from 'neverthrow';

        // An enum to identify each type of node
        export enum OpenSCADNodeType {
          Cube = 'cube',
          Sphere = 'sphere',
          // ... all other OpenSCAD types
        }

        // The base class for all our nodes
        export abstract class OpenSCADNode extends AbstractMesh {
          public readonly nodeType: OpenSCADNodeType;

          constructor(name: string, scene: Scene | null, nodeType: OpenSCADNodeType) {
            super(name, scene);
            this.nodeType = nodeType;
          }

          // Every node must know how to generate its own mesh
          abstract generateMesh(): Promise<Result<Mesh, Error>>;
        }
        ```

2.  **Implement Concrete Node Classes:**
    *   Create a class for each OpenSCAD operation (e.g., `CubeNode`, `SphereNode`, `TranslateNode`, `UnionNode`).
    *   Each class will extend `OpenSCADNode`.
    *   The `generateMesh` method will contain the specific Babylon.js code to create that shape or perform that operation.
    *   **Example (`CubeNode`):**
        ```typescript
        import { MeshBuilder, Vector3 } from '@babylonjs/core';
        import { OpenSCADNode, OpenSCADNodeType } from './openscad-node.types';

        export class CubeNode extends OpenSCADNode {
          constructor(
            name: string,
            scene: Scene | null,
            private parameters: { size: Vector3, center: boolean }
          ) {
            super(name, scene, OpenSCADNodeType.Cube);
          }

          async generateMesh(): Promise<Result<Mesh, Error>> {
            try {
              const mesh = MeshBuilder.CreateBox(this.name, {
                width: this.parameters.size.x,
                height: this.parameters.size.y,
                depth: this.parameters.size.z
              }, this.getScene());

              // OpenSCAD's `center=false` behavior is different from Babylon's default
              if (!this.parameters.center) {
                mesh.position.addInPlace(this.parameters.size.scale(0.5));
              }
              return ok(mesh);
            } catch (e) {
              return err(new Error('Failed to create cube mesh'));
            }
          }
        }
        ```

### Phase 2: Build the Bridge (AST Converter)

**Goal:** Create the service that translates from the `OpenscadAST` to our new `Babylon.js-Extended AST`.

**Location:** `src/features/ast-to-csg-converter/services/`

**Key Tasks:**

1.  **Create the `AstToCsgConverterService`:**
    *   This service will have one main method, `convert(node: GenericAstNode)`.
    *   It will use a `switch` statement on the `node.type` to determine which kind of generic node it is.
    *   For each case, it will call a dedicated private method (e.g., `convertCube`, `convertTranslate`) to handle the specific translation.

2.  **Implement Conversion Logic:**
    *   Each private method will extract the parameters from the generic AST node.
    *   It will then instantiate the corresponding `Babylon.js-Extended AST` node class with those parameters.
    *   For nodes with children (like `union` or `translate`), it will recursively call `convert` on its children.
    *   **Example:**
        ```typescript
        // In AstToCsgConverterService.ts

        import { CubeNode as GenericCubeNode } from 'src/features/openscad-parser/ast/ast-types';
        import { CubeNode as BabylonCubeNode } from 'src/features/babylon-renderer/types/cube-node.types';

        export class AstToCsgConverterService {
          public convert(node: GenericAstNode): BabylonNode {
            switch (node.type) {
              case 'cube':
                return this.convertCube(node as GenericCubeNode);
              // ... other cases
            }
          }

          private convertCube(genericNode: GenericCubeNode): BabylonCubeNode {
            // 1. Extract and validate parameters
            const size = new Vector3(
              genericNode.size[0],
              genericNode.size[1],
              genericNode.size[2]
            );
            const center = genericNode.center || false;

            // 2. Create the new Babylon.js-ready node
            return new BabylonCubeNode('cube', this.scene, { size, center });
          }
        }
        ```

### Phase 3: The Rendering Pipeline

**Goal:** Tie everything together to render the final 3D model.

**Location:** `src/features/babylon-renderer/services/`

**Key Tasks:**

1.  **Create a `MeshGenerationService`:**
    *   This service orchestrates the entire process.
    *   It takes the raw OpenSCAD code as input.
    *   **Step 1:** It calls the `openscad-parser` to get the generic `OpenscadAST`.
    *   **Step 2:** It passes the generic AST to our `AstToCsgConverterService` to get the `Babylon.js-Extended AST`.
    *   **Step 3:** It calls the `generateMesh()` method on the root node of the `Babylon.js-Extended AST`. This triggers the entire mesh generation process down the tree.
    *   The final result is a `BABYLON.Mesh` that can be added to the scene.

---

## 4. Quality and Testing

To ensure our implementation is robust:

*   **Unit Tests are Required:** Every new class or service must have a corresponding `.test.ts` file.
*   **Test Coverage:** Aim for over 95% test coverage for all new code.
*   **Error Handling:** Use the `neverthrow` library for `Result<T, E>` style error handling to avoid runtime exceptions.
*   **Strict TypeScript:** All code must comply with the strict TypeScript settings defined in `tsconfig.json`.

By following this updated guide, any developer should be able to understand the architecture and contribute effectively to the project.
