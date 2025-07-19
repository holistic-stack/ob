/**
 * @file transform-visitor.ts
 * @description This file implements the `TransformVisitor` class, which specializes in processing
 * OpenSCAD transformation operations and converting them to structured AST representations.
 * Transformations are fundamental operations that modify the position, orientation, and
 * scale of geometric objects in 3D space.
 *
 * @architectural_decision
 * The `TransformVisitor` is a key component of the composite visitor pattern, responsible for
 * handling all transformation nodes. It is designed to manage the hierarchical nature of
 * transformations in OpenSCAD, where a transform can have one or more child nodes (which
 * can themselves be primitives or other transformations). To handle this, the `TransformVisitor`
 * collaborates with the `CompositeVisitor` to process its children, ensuring that the entire
 * subtree is correctly parsed. This delegation is essential for building a complete and accurate AST.
 *
 * @example
 * ```typescript
 * import { TransformVisitor } from './transform-visitor';
 * import { CompositeVisitor } from './composite-visitor';
 * import { PrimitiveVisitor } from './primitive-visitor';
 * import { ErrorHandler } from '../../error-handling';
 * import { Parser, Language } from 'web-tree-sitter';
 *
 * async function main() {
 *   // 1. Setup parser and get CST
 *   await Parser.init();
 *   const parser = new Parser();
 *   const openscadLanguage = await Language.load('tree-sitter-openscad.wasm');
 *   parser.setLanguage(openscadLanguage);
 *   const sourceCode = 'translate([10, 0, 0]) cube(10);';
 *   const tree = parser.parse(sourceCode);
 *
 *   // 2. Create an error handler and visitors
 *   const errorHandler = new ErrorHandler();
 *   const primitiveVisitor = new PrimitiveVisitor(sourceCode, errorHandler);
 *   const transformVisitor = new TransformVisitor(sourceCode, undefined, errorHandler);
 *   const compositeVisitor = new CompositeVisitor([primitiveVisitor, transformVisitor], errorHandler);
 *   transformVisitor.setCompositeVisitor(compositeVisitor);
 *
 *   // 3. Visit the relevant CST node
 *   const moduleInstantiationNode = tree.rootNode.firstChild!;
 *   const astNode = transformVisitor.visitModuleInstantiation(moduleInstantiationNode);
 *
 *   // 4. Log the result
 *   console.log(JSON.stringify(astNode, null, 2));
 *   // Expected output:
 *   // {
 *   //   "type": "translate",
 *   //   "v": [10, 0, 0],
 *   //   "children": [
 *   //     { "type": "cube", "size": 10, "center": false, ... }
 *   //   ],
 *   //   ...
 *   // }
 *
 *   // 5. Clean up
 *   parser.delete();
 * }
 *
 * main();
 * ```
 *
 * @integration
 * The `TransformVisitor` is a crucial part of the `CompositeVisitor`'s collection of visitors.
 * It is responsible for identifying and processing all transformation nodes from the CST.
 * When it encounters a transformation, it creates the corresponding AST node (e.g., `TranslateNode`)
 * and then recursively calls the `CompositeVisitor` to process the children of the transformation.
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js'; // Added ErrorHandler import
import type * as ast from '../ast-types.js';
import { extractArguments } from '../extractors/argument-extractor.js';
import {
  extractNumberParameter,
  extractVectorParameter,
} from '../extractors/parameter-extractor.js';
import { getLocation } from '../utils/location-utils.js';
import { findDescendantOfType } from '../utils/node-utils.js';
import type { ASTVisitor } from './ast-visitor.js';
import { BaseASTVisitor } from './base-ast-visitor.js';

/**
 * @class TransformVisitor
 * @extends {BaseASTVisitor}
 * @description Visitor for transform operations (translate, rotate, scale, mirror).
 */
export class TransformVisitor extends BaseASTVisitor {
  /**
   * @constructor
   * @description Creates a new `TransformVisitor`.
   * @param {string} source - The source code being parsed.
   * @param {ASTVisitor | undefined} compositeVisitor - The composite visitor for delegating child processing.
   * @param {ErrorHandler} errorHandler - The error handler instance.
   * @param {Map<string, ast.ParameterValue>} [variableScope] - The current variable scope.
   */
  constructor(
    source: string,
    private compositeVisitor: ASTVisitor | undefined, // Made explicit undefined for clarity with optional errorHandler
    protected override errorHandler: ErrorHandler,
    variableScope?: Map<string, ast.ParameterValue>
  ) {
    super(source, errorHandler, variableScope ?? new Map());
  }

  /**
   * @method setCompositeVisitor
   * @description Sets the composite visitor for delegating child node processing.
   * This is needed to resolve circular dependency issues during visitor creation.
   * @param {ASTVisitor} compositeVisitor - The composite visitor instance.
   */
  setCompositeVisitor(compositeVisitor: ASTVisitor): void {
    this.compositeVisitor = compositeVisitor;
  }

  /**
   * @method visitStatement
   * @description Overrides the base `visitStatement` to only handle transform-related statements.
   * @param {TSNode} node - The statement node to visit.
   * @returns {ast.ASTNode | null} The transform AST node, or null if this is not a transform statement.
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that contain transform operations (translate, rotate, scale, mirror, color, multmatrix, offset)
    // Check for module_instantiation with transform function names
    const moduleInstantiation = findDescendantOfType(node, 'module_instantiation');
    if (moduleInstantiation) {
      // Extract function name to check if it's a transform operation
      const functionName = this.extractFunctionName(moduleInstantiation);
      if (this.isSupportedTransformFunction(functionName)) {
        return this.visitModuleInstantiation(moduleInstantiation);
      }
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * @method isSupportedTransformFunction
   * @description Checks if a function name is a supported transform operation.
   * @param {string} functionName - The function name to check.
   * @returns {boolean} True if the function is a transform operation.
   * @private
   */
  private isSupportedTransformFunction(functionName: string): boolean {
    return [
      'translate',
      'rotate',
      'scale',
      'mirror',
      'color',
      'multmatrix',
      'offset',
      'linear_extrude',
      'rotate_extrude',
      'import',
      'surface',
      'projection',
    ].includes(functionName);
  }

  /**
   * @method extractFunctionName
   * @description Extracts the function name from a module instantiation node.
   * @param {TSNode} node - The module instantiation node.
   * @returns {string} The function name, or an empty string if not found.
   * @private
   */
  private extractFunctionName(node: TSNode): string {
    const nameNode = node.childForFieldName('name');
    const functionName = nameNode?.text || '';

    return functionName;
  }

  /**
   * @method visitAccessorExpression
   * @description Visits an accessor expression node (function calls like translate([10, 0, 0])).
   * @param {TSNode} node - The accessor expression node to visit.
   * @returns {ast.ASTNode | null} The AST node, or null if the node cannot be processed.
   * @override
   */
  override visitAccessorExpression(node: TSNode): ast.ASTNode | null {
    this.errorHandler.logInfo(
      `[TransformVisitor.visitAccessorExpression] Processing accessor expression: ${node.text.substring(
        0,
        50
      )}`,
      'TransformVisitor.visitAccessorExpression',
      node
    );

    // Find function name and arguments using a more robust approach
    let functionName: string | null = null;
    let argsNode: TSNode | null = null;

    // Check if this accessor_expression has an argument_list (indicating it's a function call)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'argument_list') {
        argsNode = child;
        // The function name should be in the first child (before the argument_list)
        const functionChild = node.child(0);
        if (functionChild) {
          // Use the text of the function child directly, which should be the identifier
          functionName = functionChild.text;
        }
        break;
      }
    }

    // If we didn't find the function name through the argument_list approach,
    // try to extract it directly from the first child
    if (!functionName && node.childCount > 0) {
      const firstChild = node.child(0);
      if (firstChild) {
        functionName = firstChild.text;
      }
    }

    if (!argsNode || !functionName) {
      return super.visitAccessorExpression(node);
    }

    // Check if this is a transform function
    if (
      !['translate', 'rotate', 'scale', 'mirror', 'color', 'multmatrix', 'offset'].includes(
        functionName
      )
    ) {
      return super.visitAccessorExpression(node);
    }

    // Extract arguments using the working argument extraction system
    let args: ast.Parameter[] = [];
    const argumentsNode = argsNode.namedChildren.find(
      (child) => child && child.type === 'arguments'
    );
    if (argumentsNode) {
      args = extractArguments(argumentsNode);
    } else {
      args = extractArguments(argsNode);
    }
    // Create the transform node
    return this.createTransformNode(node, functionName, args);
  }

  /**
   * @method visitModuleInstantiation
   * @description Visits a module instantiation node (transform with children like translate([10, 0, 0]) cube()).
   * @param {TSNode} node - The module instantiation node to visit.
   * @returns {ast.ASTNode | null} The AST node, or null if the node cannot be processed.
   * @public
   * @override
   */
  public override visitModuleInstantiation(node: TSNode): ast.ASTNode | null {
    // Get function name using the truncation workaround
    const functionName = this.extractFunctionName(node);
    if (!functionName) {
      return null;
    }

    // Check if this is a transform function
    if (!this.isSupportedTransformFunction(functionName)) {
      return null;
    }

    // Extract arguments
    const argsNode = node.childForFieldName('arguments');
    const args = argsNode ? extractArguments(argsNode, undefined, this.source) : [];
    // Process children - handle both body field and direct child statements
    const children: ast.ASTNode[] = [];

    // First, try to find a body field (for block syntax)
    const bodyNode = node.childForFieldName('body');

    if (bodyNode) {
      if (bodyNode.type === 'block') {
        // Handle block with multiple statements: translate([10, 0, 0]) { cube(); sphere(); }
        for (let i = 0; i < bodyNode.namedChildCount; i++) {
          const child = bodyNode.namedChild(i);
          if (child) {
            const visitedChild = this.compositeVisitor
              ? this.compositeVisitor.visitNode(child)
              : this.visitNode(child);
            if (visitedChild) {
              children.push(visitedChild);
            }
          }
        }
      } else if (bodyNode.type === 'statement') {
        // Handle single statement: translate([10, 0, 0]) cube();
        // Extract module_instantiation from within the statement
        const moduleInstantiation = this.findModuleInstantiationInStatement(bodyNode);
        if (moduleInstantiation) {
          const visitedChild = this.compositeVisitor
            ? this.compositeVisitor.visitNode(moduleInstantiation)
            : this.visitNode(moduleInstantiation);
          if (visitedChild) {
            children.push(visitedChild);
          }
        }
      }
    } else {
      // No body field found - look for direct child statements, blocks, or module_instantiations
      // This handles the grammar pattern: name arguments statement
      // Also handles direct module_instantiation children (for recursive extraction)
      for (let i = 0; i < node.namedChildCount; i++) {
        const child = node.namedChild(i);
        if (child) {
          if (child.type === 'block') {
            // Handle block with multiple statements
            for (let j = 0; j < child.namedChildCount; j++) {
              const blockChild = child.namedChild(j);
              if (blockChild) {
                const visitedChild = this.compositeVisitor
                  ? this.compositeVisitor.visitNode(blockChild)
                  : this.visitNode(blockChild);
                if (visitedChild) {
                  children.push(visitedChild);
                }
              }
            }
          } else if (child.type === 'statement') {
            // Handle single statement - extract module_instantiation from within
            const moduleInstantiation = this.findModuleInstantiationInStatement(child);
            if (moduleInstantiation) {
              const visitedChild = this.compositeVisitor
                ? this.compositeVisitor.visitNode(moduleInstantiation)
                : this.visitNode(moduleInstantiation);
              if (visitedChild) {
                children.push(visitedChild);
              }
            }
          } else if (child.type === 'module_instantiation') {
            // Handle direct module_instantiation children (this is the key fix for recursive extraction)
            // This handles cases like: translate([1,2,3]) cube(10) where cube is a direct child
            const visitedChild = this.compositeVisitor
              ? this.compositeVisitor.visitNode(child)
              : this.visitNode(child);
            if (visitedChild) {
              children.push(visitedChild);
            }
          }
        }
      }
    }

    // Create the transform node with children
    const transformNode = this.createTransformNode(node, functionName, args);
    if (transformNode && 'children' in transformNode) {
      (transformNode as ast.ASTNode & { children: ast.ASTNode[] }).children = children;
    }

    return transformNode;
  }

  /**
   * @method createTransformNode
   * @description Creates a transform node based on function name and arguments.
   * @param {TSNode} node - The CST node.
   * @param {string} functionName - The transform function name.
   * @param {ast.Parameter[]} args - The extracted arguments.
   * @returns {ast.ASTNode | null} The transform AST node.
   * @private
   */
  private createTransformNode(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
  ): ast.ASTNode | null {
    this.errorHandler.logInfo(
      `[TransformVisitor.createTransformNode] Creating ${functionName} node with ${args.length} arguments`,
      'TransformVisitor.createTransformNode',
      node
    );

    // Return the node with the specific transform type to match test expectations
    // This ensures that the node type matches the transform operation name
    switch (functionName) {
      case 'translate': {
        const translateNode = this.createTranslateNode(node, args);
        translateNode.type = 'translate'; // Override type to match test expectations
        return translateNode;
      }
      case 'rotate': {
        const rotateNode = this.createRotateNode(node, args);
        rotateNode.type = 'rotate'; // Override type to match test expectations
        return rotateNode;
      }
      case 'scale': {
        const scaleNode = this.createScaleNode(node, args);
        scaleNode.type = 'scale'; // Override type to match test expectations
        return scaleNode;
      }
      case 'mirror': {
        const mirrorNode = this.createMirrorNode(node, args);
        mirrorNode.type = 'mirror'; // Override type to match test expectations
        return mirrorNode;
      }
      case 'color': {
        // Handle color transform
        let colorValue: string | ast.Vector4D = 'black'; // Default color

        if (args.length > 0 && args[0]?.value !== null) {
          const argValue = args[0]?.value;

          // Handle expression objects that wrap the actual value
          let actualValue:
            | string
            | number
            | boolean
            | ast.Vector2D
            | ast.Vector3D
            | ast.ExpressionNode
            | ast.ErrorNode
            | undefined = argValue;
          if (typeof argValue === 'object' && argValue !== null && 'value' in argValue) {
            actualValue = (
              argValue as {
                value:
                  | string
                  | number
                  | boolean
                  | ast.Vector2D
                  | ast.Vector3D
                  | ast.ExpressionNode
                  | ast.ErrorNode
                  | undefined;
              }
            ).value;
          }

          if (typeof actualValue === 'string') {
            // If it's a string, use it directly
            colorValue = actualValue;
          } else if (typeof argValue === 'string') {
            // Direct string value
            colorValue = argValue;
          } else if (Array.isArray(argValue)) {
            // If it's an array, try to convert it to a Vector4D
            // First, ensure we're working with a safe array that has at least one element
            if (argValue.length > 0) {
              // Create a safe color array with default values
              const colorArray: [number, number, number, number] = [0, 0, 0, 1];

              // Fill in values from the input array, if they exist and are numbers
              for (let i = 0; i < Math.min(argValue.length, 4); i++) {
                if (typeof argValue[i] === 'number') {
                  colorArray[i] = argValue[i] as number;
                }
              }

              colorValue = colorArray;

              this.errorHandler.logInfo(
                `[TransformVisitor.createTransformNode] Created color vector: [${colorArray.join(', ')}]`,
                'TransformVisitor.createTransformNode',
                node
              );
            }
          } else if (typeof argValue === 'number') {
            // If it's a number, convert it to a grayscale color
            const value = Math.min(1, Math.max(0, argValue));
            colorValue = [value, value, value, 1];
          }
        }

        return {
          type: 'color',
          c: colorValue,
          children: [],
          location: getLocation(node),
        };
      }
      case 'multmatrix': {
        // Handle multmatrix transform
        // Default identity matrix
        const identityMatrix: number[][] = [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];

        // Create a safe matrix conversion function
        const createMatrixFromValue = (value: unknown): number[][] => {
          if (!value) return identityMatrix;

          // If it's already a 2D array with the right structure, use it
          if (
            Array.isArray(value) &&
            value.length === 4 &&
            value.every((row) => Array.isArray(row) && row.length === 4)
          ) {
            return value as number[][];
          }

          // If it's a 1D array of numbers, try to convert it to a 4x4 matrix
          if (
            Array.isArray(value) &&
            value.length === 16 &&
            value.every((item) => typeof item === 'number')
          ) {
            const numArray = value as number[];
            return [
              [numArray[0] ?? 0, numArray[1] ?? 0, numArray[2] ?? 0, numArray[3] ?? 0],
              [numArray[4] ?? 0, numArray[5] ?? 0, numArray[6] ?? 0, numArray[7] ?? 0],
              [numArray[8] ?? 0, numArray[9] ?? 0, numArray[10] ?? 0, numArray[11] ?? 0],
              [numArray[12] ?? 0, numArray[13] ?? 0, numArray[14] ?? 0, numArray[15] ?? 0],
            ];
          }

          // Log warning and return identity matrix for all other cases
          this.errorHandler.logWarning(
            `[TransformVisitor.createTransformNode] Invalid matrix format, using identity matrix instead: ${JSON.stringify(value)}`,
            'TransformVisitor.createTransformNode',
            node
          );
          return identityMatrix;
        };

        // Get the matrix value from arguments
        const matrixValue =
          args.length > 0 ? createMatrixFromValue(args[0]?.value) : identityMatrix;

        return {
          type: 'multmatrix',
          m: matrixValue, // Use 'm' instead of 'matrix' to match the interface definition
          children: [],
          location: getLocation(node),
        };
      }
      case 'offset': {
        // Handle offset transform
        let chamferValue = false; // Default to false for chamfer
        if (args.length > 2 && args[2]?.value !== null) {
          // Convert to boolean if it's not already
          chamferValue =
            args[2]?.value === true || args[2]?.value === 1 || args[2]?.value === 'true';
        }

        return {
          type: 'offset',
          r: args.length > 0 ? (typeof args[0]?.value === 'number' ? args[0]?.value : 0) : 0,
          delta: args.length > 1 ? (typeof args[1]?.value === 'number' ? args[1]?.value : 0) : 0,
          chamfer: chamferValue,
          children: [],
          location: getLocation(node),
        };
      }
      case 'hull':
        // Handle hull transform
        return {
          type: 'hull',
          children: [],
          location: getLocation(node),
        };
      case 'minkowski':
        // Handle minkowski transform
        return {
          type: 'minkowski',
          children: [],
          location: getLocation(node),
        };
      case 'linear_extrude': {
        // Handle linear_extrude transform
        let height = 1;
        let center = false;
        let convexity: number | undefined;
        let twist: number | undefined;
        let slices: number | undefined;
        let scale: number | ast.Vector2D | undefined;
        let $fn: number | undefined;

        // Extract height parameter
        const heightParam = args.find((arg) => arg.name === undefined || arg.name === 'height');
        if (heightParam?.value && typeof heightParam.value === 'number') {
          height = heightParam.value;
        }

        // Extract center parameter
        const centerParam = args.find((arg) => arg.name === 'center');
        if (centerParam?.value && typeof centerParam.value === 'boolean') {
          center = centerParam.value;
        }

        // Extract other parameters
        const convexityParam = args.find((arg) => arg.name === 'convexity');
        if (convexityParam?.value && typeof convexityParam.value === 'number') {
          convexity = convexityParam.value;
        }

        const twistParam = args.find((arg) => arg.name === 'twist');
        if (twistParam?.value && typeof twistParam.value === 'number') {
          twist = twistParam.value;
        }

        const slicesParam = args.find((arg) => arg.name === 'slices');
        if (slicesParam?.value && typeof slicesParam.value === 'number') {
          slices = slicesParam.value;
        }

        const scaleParam = args.find((arg) => arg.name === 'scale');
        if (scaleParam?.value) {
          if (typeof scaleParam.value === 'number') {
            scale = scaleParam.value;
          } else if (Array.isArray(scaleParam.value) && scaleParam.value.length >= 2) {
            scale = [scaleParam.value[0], scaleParam.value[1]];
          }
        }

        const fnParam = args.find((arg) => arg.name === '$fn');
        if (fnParam?.value && typeof fnParam.value === 'number') {
          $fn = fnParam.value;
        }

        return {
          type: 'linear_extrude',
          height,
          center,
          ...(convexity !== undefined && { convexity }),
          ...(twist !== undefined && { twist }),
          ...(slices !== undefined && { slices }),
          ...(scale !== undefined && { scale }),
          ...($fn !== undefined && { $fn }),
          children: [],
          location: getLocation(node),
        };
      }
      case 'rotate_extrude': {
        // Handle rotate_extrude transform
        let angle = 360; // Default to full revolution
        let convexity: number | undefined;
        let $fn: number | undefined;
        let $fa: number | undefined;
        let $fs: number | undefined;

        // Extract angle parameter
        const angleParam = args.find((arg) => arg.name === undefined || arg.name === 'angle');
        if (angleParam?.value && typeof angleParam.value === 'number') {
          angle = angleParam.value;
        }

        // Extract convexity parameter
        const convexityParam = args.find((arg) => arg.name === 'convexity');
        if (convexityParam?.value && typeof convexityParam.value === 'number') {
          convexity = convexityParam.value;
        }

        // Extract resolution parameters
        const fnParam = args.find((arg) => arg.name === '$fn');
        if (fnParam?.value && typeof fnParam.value === 'number') {
          $fn = fnParam.value;
        }

        const faParam = args.find((arg) => arg.name === '$fa');
        if (faParam?.value && typeof faParam.value === 'number') {
          $fa = faParam.value;
        }

        const fsParam = args.find((arg) => arg.name === '$fs');
        if (fsParam?.value && typeof fsParam.value === 'number') {
          $fs = fsParam.value;
        }

        return {
          type: 'rotate_extrude',
          ...(angle !== 360 && { angle }),
          ...(convexity !== undefined && { convexity }),
          ...($fn !== undefined && { $fn }),
          ...($fa !== undefined && { $fa }),
          ...($fs !== undefined && { $fs }),
          children: [],
          location: getLocation(node),
        };
      }
      case 'import': {
        // Handle import operation
        let _file = '';
        let _convexity: number | undefined;

        // Extract file parameter (first positional parameter)
        const fileParam = args.find((arg) => arg.name === undefined || arg.name === 'file');
        if (fileParam?.value && typeof fileParam.value === 'string') {
          _file = fileParam.value;
        }

        // Extract convexity parameter
        const convexityParam = args.find((arg) => arg.name === 'convexity');
        if (convexityParam?.value && typeof convexityParam.value === 'number') {
          _convexity = convexityParam.value;
        }

        return {
          type: 'module_instantiation',
          name: {
            type: 'expression',
            expressionType: 'identifier',
            name: 'import',
            location: getLocation(node),
          },
          args,
          children: [],
          location: getLocation(node),
        };
      }
      case 'surface': {
        // Handle surface operation
        let _file = '';
        let _center = false;
        let _convexity: number | undefined;
        let _invert = false;

        // Extract file parameter (first positional parameter)
        const fileParam = args.find((arg) => arg.name === undefined || arg.name === 'file');
        if (fileParam?.value && typeof fileParam.value === 'string') {
          _file = fileParam.value;
        }

        // Extract center parameter
        const centerParam = args.find((arg) => arg.name === 'center');
        if (centerParam?.value && typeof centerParam.value === 'boolean') {
          _center = centerParam.value;
        }

        // Extract convexity parameter
        const convexityParam = args.find((arg) => arg.name === 'convexity');
        if (convexityParam?.value && typeof convexityParam.value === 'number') {
          _convexity = convexityParam.value;
        }

        // Extract invert parameter
        const invertParam = args.find((arg) => arg.name === 'invert');
        if (invertParam?.value && typeof invertParam.value === 'boolean') {
          _invert = invertParam.value;
        }

        return {
          type: 'module_instantiation',
          name: {
            type: 'expression',
            expressionType: 'identifier',
            name: 'surface',
            location: getLocation(node),
          },
          args,
          children: [],
          location: getLocation(node),
        };
      }
      case 'projection': {
        // Handle projection operation
        let _cut = false;

        // Extract cut parameter
        const cutParam = args.find((arg) => arg.name === 'cut');
        if (cutParam?.value && typeof cutParam.value === 'boolean') {
          _cut = cutParam.value;
        }

        return {
          type: 'module_instantiation',
          name: {
            type: 'expression',
            expressionType: 'identifier',
            name: 'projection',
            location: getLocation(node),
          },
          args,
          children: [],
          location: getLocation(node),
        };
      }
      default:
        this.errorHandler.logWarning(
          `[TransformVisitor.createTransformNode] Unsupported transform: ${functionName}`,
          'TransformVisitor.createTransformNode',
          node
        );
        return null;
    }
  }

  /**
   * @method createTranslateNode
   * @description Creates a translate node.
   * @param {TSNode} node - The CST node.
   * @param {ast.Parameter[]} args - The extracted arguments.
   * @returns {ast.TranslateNode} The translate AST node.
   * @private
   */
  private createTranslateNode(node: TSNode, args: ast.Parameter[]): ast.TranslateNode {
    // Default vector (3D)
    let v: ast.Vector2D | ast.Vector3D = [0, 0, 0];

    // Extract vector parameter (first positional or named 'v')
    for (const arg of args) {
      if ((!arg.name && args.indexOf(arg) === 0) || arg.name === 'v') {
        // Try to extract as vector first
        const vector = extractVectorParameter(arg);
        if (vector) {
          if (vector.length === 2) {
            // Preserve 2D vector as-is (don't convert to 3D)
            v = [vector[0], vector[1]] as ast.Vector2D;
          } else if (vector.length >= 3) {
            v = [vector[0], vector[1], vector[2]] as ast.Vector3D;
          }

          // Tree-sitter workaround: Verify vector against source text
          const sourceText = node.text;
          if (sourceText) {
            // Try to match both positional and named parameter patterns
            // Pattern 1: translate([1,2,3]) - positional parameter
            let vectorMatch = sourceText.match(/translate\s*\(\s*\[([^\]]+)\]/);
            // Pattern 2: translate(v=[1,2,3]) - named parameter
            if (!vectorMatch) {
              vectorMatch = sourceText.match(/translate\s*\(\s*v\s*=\s*\[([^\]]+)\]/);
            }

            if (vectorMatch?.[1]) {
              const vectorContent = vectorMatch[1];
              const expectedNumbers = vectorContent
                .split(',')
                .map((s: string) => parseFloat(s.trim()));

              if (
                expectedNumbers.length >= 2 &&
                expectedNumbers.every((n: number) => !Number.isNaN(n))
              ) {
                const expectedVector = [
                  expectedNumbers[0] ?? 0,
                  expectedNumbers[1] ?? 0,
                  expectedNumbers[2] ?? 0,
                ];

                // Check if Tree-sitter parsed vector matches expected vector
                const tolerance = 0.001;
                const currentVector =
                  vector.length === 2
                    ? [vector[0], vector[1], 0]
                    : [vector[0], vector[1], vector[2]];
                const vectorsMatch =
                  Math.abs((currentVector[0] ?? 0) - (expectedVector[0] ?? 0)) < tolerance &&
                  Math.abs((currentVector[1] ?? 0) - (expectedVector[1] ?? 0)) < tolerance &&
                  Math.abs((currentVector[2] ?? 0) - (expectedVector[2] ?? 0)) < tolerance;

                if (!vectorsMatch) {
                  // Use the source-parsed vector instead
                  if (expectedNumbers.length === 2) {
                    v = [expectedVector[0], expectedVector[1]] as ast.Vector2D;
                  } else {
                    v = [expectedVector[0], expectedVector[1], expectedVector[2]] as ast.Vector3D;
                  }

                  this.errorHandler.logInfo(
                    `[TransformVisitor.createTranslateNode] Applied Tree-sitter workaround for vector parsing. Expected: [${expectedVector.join(', ')}], Tree-sitter parsed: [${currentVector.join(', ')}]`,
                    'TransformVisitor.createTranslateNode',
                    node
                  );
                }
              }
            }
          }

          break;
        }

        // If not a vector, try to extract as a single number
        const number = extractNumberParameter(arg);
        if (number !== null) {
          // Convert single number to X-axis translation: translate(5) -> [5, 0, 0]
          v = [number, 0, 0] as ast.Vector3D;
          break;
        }
      }
    }

    return {
      type: 'translate',
      v,
      children: [],
      location: getLocation(node),
    };
  }

  /**
   * @method createRotateNode
   * @description Creates a rotate node.
   * @param {TSNode} node - The CST node.
   * @param {ast.Parameter[]} args - The extracted arguments.
   * @returns {ast.RotateNode} The rotate AST node.
   * @private
   */
  private createRotateNode(node: TSNode, args: ast.Parameter[]): ast.RotateNode {
    // Default values
    let a: number | undefined;
    let v: ast.Vector3D = [0, 0, 1]; // Default Z-axis rotation

    // Extract rotation parameter (first positional or named 'a')
    for (const arg of args) {
      if ((!arg.name && args.indexOf(arg) === 0) || arg.name === 'a') {
        // Try vector first (for angle vector like [90, 0, 0])
        const vector = extractVectorParameter(arg);
        if (vector && vector.length >= 3) {
          // For vector rotation, assign to 'v' property
          v = [vector[0] ?? 0, vector[1] ?? 0, vector[2] ?? 0];
          break;
        }

        // Try number (for single angle like 45)
        const angle = extractNumberParameter(arg);
        if (angle !== null) {
          a = angle;
          v = [0, 0, 1]; // Default Z-axis rotation for single angle
          break;
        }
      }
    }

    // Extract vector parameter (named 'v')
    for (const arg of args) {
      if (arg.name === 'v') {
        const vector = extractVectorParameter(arg);
        if (vector && vector.length >= 3) {
          v = [vector[0] ?? 0, vector[1] ?? 0, vector[2] ?? 0];
          break;
        }
      }
    }

    const result: ast.RotateNode = {
      type: 'rotate',
      v, // Use the extracted or default vector
      children: [],
      location: getLocation(node),
    };

    // Add 'a' property only if it's a number
    if (typeof a === 'number') {
      result.a = a;
    }

    return result;
  }

  /**
   * @method createScaleNode
   * @description Creates a scale node.
   * @param {TSNode} node - The CST node.
   * @param {ast.Parameter[]} args - The extracted arguments.
   * @returns {ast.ScaleNode} The scale AST node.
   * @private
   */
  private createScaleNode(node: TSNode, args: ast.Parameter[]): ast.ScaleNode {
    // Default scale
    let v: ast.Vector3D = [1, 1, 1];

    // Extract scale parameter (first positional or named 'v')
    for (const arg of args) {
      if ((!arg.name && args.indexOf(arg) === 0) || arg.name === 'v') {
        // Try vector first (for non-uniform scale like [2, 1, 0.5])
        const vector = extractVectorParameter(arg);
        if (vector) {
          if (vector.length === 2) {
            v = [vector[0] ?? 0, vector[1] ?? 0, 1]; // Convert 2D to 3D
          } else if (vector.length >= 3) {
            v = [vector[0] ?? 0, vector[1] ?? 0, vector[2] ?? 0];
          }
          break;
        }

        // Try number (for uniform scale like 2)
        const scale = extractNumberParameter(arg);
        if (scale !== null) {
          v = [scale, scale, scale]; // Convert uniform scale to vector
          break;
        }
      }
    }

    return {
      type: 'scale',
      v,
      children: [],
      location: getLocation(node),
    };
  }

  /**
   * @method createMirrorNode
   * @description Creates a mirror node.
   * @param {TSNode} node - The CST node.
   * @param {ast.Parameter[]} args - The extracted arguments.
   * @returns {ast.MirrorNode} The mirror AST node.
   * @private
   */
  private createMirrorNode(node: TSNode, args: ast.Parameter[]): ast.MirrorNode {
    // Default mirror plane
    let v: ast.Vector3D = [1, 0, 0];

    // Extract vector parameter (first positional or named 'v')
    for (const arg of args) {
      if ((!arg.name && args.indexOf(arg) === 0) || arg.name === 'v') {
        const vector = extractVectorParameter(arg);
        if (vector) {
          if (vector.length === 2) {
            v = [vector[0] ?? 0, vector[1] ?? 0, 0]; // Convert 2D to 3D
          } else if (vector.length >= 3) {
            v = [vector[0] ?? 0, vector[1] ?? 0, vector[2] ?? 0];
          }
          break;
        }
      }
    }

    return {
      type: 'mirror',
      v,
      children: [],
      location: getLocation(node),
    };
  }

  /**
   * @method createASTNodeForFunction
   * @description Creates an AST node for a function (required by `BaseASTVisitor`).
   * @param {TSNode} node - The CST node.
   * @param {string} functionName - The function name.
   * @param {ast.Parameter[]} args - The extracted arguments.
   * @returns {ast.ASTNode | null} The AST node, or null if not supported.
   * @protected
   */
  protected createASTNodeForFunction(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Only handle transform functions
    if (
      ['translate', 'rotate', 'scale', 'mirror', 'color', 'multmatrix', 'offset'].includes(
        functionName
      )
    ) {
      return this.createTransformNode(node, functionName, args);
    }

    // Return null for non-transform functions (will be handled by other visitors)
    return null;
  }

  /**
   * @method findModuleInstantiationInStatement
   * @description Finds a `module_instantiation` node within a statement.
   * @param {TSNode} statementNode - The statement node to search.
   * @returns {TSNode | null} The `module_instantiation` node, or null if not found.
   * @private
   */
  private findModuleInstantiationInStatement(statementNode: TSNode): TSNode | null {
    for (let i = 0; i < statementNode.childCount; i++) {
      const child = statementNode.child(i);
      if (child && child.type === 'module_instantiation') {
        return child;
      }
    }
    return null;
  }
}
