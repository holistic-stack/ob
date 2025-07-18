/**
 * @file index.ts
 * @description Centralized exports for the `generic-primitive-generator` service module.
 * This service implements Layer 2 of the Enhanced 4-Layer Architecture, generating
 * renderer-agnostic primitive geometry from OpenSCAD AST nodes. It serves as a bridge
 * between AST parsing and renderer-specific mesh generation.
 *
 * @architectural_decision
 * - **Barrel File Pattern**: This `index.ts` acts as a barrel file, simplifying imports for other modules.
 *   Instead of importing individual types and classes from their respective files,
 *   consumers can import everything from this single, convenient entry point.
 * - **API Encapsulation**: By controlling exports here, we manage the public API of the module,
 *   hiding internal implementation details and exposing only what's necessary for external consumption.
 * - **Renderer Agnostic Design**: All exported types and services are designed to be independent
 *   of any specific 3D rendering library, promoting modularity and future extensibility.
 *
 * @performance_characteristics
 * - **Generation Time**: Primitive generation typically takes 1-10ms per primitive
 * - **Memory Usage**: Minimal memory footprint with automatic cleanup
 * - **Geometry Quality**: Simplified geometry suitable for real-time rendering
 * - **Thread Safety**: All operations are stateless and thread-safe
 *
 * @supported_primitives
 * **3D Primitives**:
 * - `cube()` - Box geometry with configurable dimensions and centering
 * - `sphere()` - Spherical geometry (currently simplified as octahedron)
 * - `cylinder()` - Cylindrical geometry with configurable height and radii (supports cones)
 *
 * **Future Primitives** (planned):
 * - `polyhedron()` - Custom mesh from vertices and faces
 * - 2D primitives (`circle()`, `square()`, `polygon()`) with extrusion support
 * - Advanced primitives (`text()`, `surface()`)
 *
 * @example
 * ```typescript
 * // Comprehensive usage example - OpenSCAD primitive generation
 * import {
 *   GenericPrimitiveGeneratorService,
 *   type GenericGeometry,
 *   type PrimitiveGenerationResult
 * } from '@/features/ast-to-csg-converter/services/generic-primitive-generator';
 * import type { CubeNode, SphereNode } from '@/features/openscad-parser/ast/ast-types';
 *
 * async function generatePrimitiveGeometry() {
 *   const generator = new GenericPrimitiveGeneratorService();
 *
 *   // Generate a centered cube
 *   const cubeNode: CubeNode = {
 *     type: 'Cube',
 *     size: [10, 20, 30],
 *     center: true,
 *     location: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } }
 *   };
 *
 *   const cubeResult = generator.generateCube(cubeNode);
 *   if (cubeResult.success) {
 *     console.log(`Cube generated with ${cubeResult.data.metadata.vertexCount} vertices`);
 *     console.log(`Generation time: ${cubeResult.data.generationTime.toFixed(2)}ms`);
 *   }
 *
 *   // Generate a sphere
 *   const sphereNode: SphereNode = {
 *     type: 'Sphere',
 *     radius: 15,
 *     location: { start: { line: 2, column: 0 }, end: { line: 2, column: 12 } }
 *   };
 *
 *   const sphereResult = generator.generateSphere(sphereNode);
 *   if (sphereResult.success) {
 *     const geometry: GenericGeometry = sphereResult.data.geometry;
 *     console.log(`Sphere bounding box: ${JSON.stringify(geometry.boundingBox)}`);
 *   }
 *
 *   // Cleanup
 *   generator.dispose();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Error handling and optimization example
 * import { GenericPrimitiveGeneratorService } from './services/generic-primitive-generator';
 *
 * function handlePrimitiveGeneration(cubeNode: CubeNode) {
 *   const generator = new GenericPrimitiveGeneratorService();
 *
 *   const result = generator.generateCube(cubeNode);
 *
 *   if (result.success) {
 *     const { geometry, material, metadata, generationTime } = result.data;
 *
 *     // Check if generation meets performance targets
 *     if (generationTime > 50) {
 *       console.warn(`Slow primitive generation: ${generationTime}ms`);
 *     }
 *
 *     // Validate geometry complexity
 *     if (metadata.vertexCount > 10000) {
 *       console.warn(`High complexity primitive: ${metadata.vertexCount} vertices`);
 *     }
 *
 *     return geometry;
 *   } else {
 *     console.error(`Generation failed: ${result.error.message}`);
 *     console.error(`Error code: ${result.error.code}`);
 *     throw new Error(`Primitive generation failed: ${result.error.primitiveType}`);
 *   }
 * }
 * ```
 *
 * @integration_patterns
 * **With AST-to-Mesh Converter**:
 * ```typescript
 * // Integration with the main conversion service
 * class CustomASTConverter {
 *   private primitiveGenerator = new GenericPrimitiveGeneratorService();
 *
 *   async convertPrimitive(astNode: ASTNode): Promise<GenericMeshData> {
 *     switch (astNode.type) {
 *       case 'Cube':
 *         const result = this.primitiveGenerator.generateCube(astNode as CubeNode);
 *         if (result.success) {
 *           return this.wrapInGenericMeshData(result.data);
 *         }
 *         throw new Error(result.error.message);
 *       // ... other primitive types
 *     }
 *   }
 * }
 * ```
 *
 * @limitations
 * - **Simplified Geometry**: Current sphere implementation uses octahedron approximation
 * - **Fixed Tessellation**: Cylinder uses fixed 6-segment approximation
 * - **Limited 2D Support**: 2D primitives not yet implemented
 * - **No Custom Materials**: Uses default material configuration
 * - **Performance vs Quality**: Optimized for speed over geometric accuracy
 *
 * @future_enhancements
 * - **Higher Fidelity Geometry**: Configurable tessellation levels for smoother primitives
 * - **2D Primitive Support**: Complete circle, square, polygon implementations
 * - **Material System**: Advanced material configuration and inheritance
 * - **Optimization Pipeline**: Mesh simplification and LOD generation
 * - **Caching Layer**: Geometry caching for frequently used primitive configurations
 */

export type {
  GenericGeometry,
  GenericVertex,
  PrimitiveGenerationError,
  PrimitiveGenerationResult,
} from './generic-primitive-generator.service';
export { GenericPrimitiveGeneratorService } from './generic-primitive-generator.service';
