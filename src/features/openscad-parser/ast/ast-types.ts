/**
 * @file AST node type definitions for OpenSCAD parser
 *
 * This module defines all Abstract Syntax Tree (AST) node types used by the OpenSCAD parser.
 * These types provide a structured representation of OpenSCAD code that is easier to work with
 * than the raw Concrete Syntax Tree (CST) from Tree-sitter.
 *
 * The AST types are organized into several categories:
 * - Base types and interfaces (BaseNode, SourceLocation, Position)
 * - Primitive shapes (CubeNode, SphereNode, CylinderNode, etc.)
 * - Transformations (TranslateNode, RotateNode, ScaleNode, etc.)
 * - CSG operations (UnionNode, DifferenceNode, IntersectionNode, etc.)
 * - Control structures (IfNode, ForLoopNode, LetNode, etc.)
 * - Expressions (BinaryExpressionNode, UnaryExpressionNode, etc.)
 * - Module system (ModuleDefinitionNode, ModuleInstantiationNode, etc.)
 *
 * All AST nodes extend the BaseNode interface and include optional source location information
 * for precise error reporting and editor integration.
 *
 * @module ast-types
 * @since 0.1.0
 */

/**
 * Base interface for all AST nodes in the OpenSCAD parser.
 *
 * This interface provides the foundation for all AST node types, ensuring
 * consistent structure and enabling polymorphic operations across different
 * node types. Every AST node must have a type identifier and may optionally
 * include source location information.
 *
 * @example Basic node structure
 * ```typescript
 * const cubeNode: CubeNode = {
 *   type: 'cube',
 *   size: 10,
 *   center: false,
 *   location: {
 *     start: { line: 1, column: 0, offset: 0 },
 *     end: { line: 1, column: 8, offset: 8 },
 *     text: 'cube(10)'
 *   }
 * };
 * ```
 *
 * @since 0.1.0
 * @category Core
 */
export interface BaseNode {
  /**
   * The type of the node
   */
  type: string;

  /**
   * The source location of the node
   */
  location?: SourceLocation;
}

/**
 * Represents a source code location range with start and end positions.
 *
 * This interface provides precise location information for AST nodes, enabling
 * features like error reporting, syntax highlighting, and editor integration.
 * The location includes both start and end positions, and optionally the
 * original source text for the node.
 *
 * @example Creating a source location
 * ```typescript
 * const location: SourceLocation = {
 *   start: { line: 1, column: 0, offset: 0 },
 *   end: { line: 1, column: 8, offset: 8 },
 *   text: 'cube(10)'
 * };
 * ```
 *
 * @example Multi-line location
 * ```typescript
 * const multiLineLocation: SourceLocation = {
 *   start: { line: 1, column: 0, offset: 0 },
 *   end: { line: 3, column: 1, offset: 25 },
 *   text: 'difference() {\n  cube(10);\n}'
 * };
 * ```
 *
 * @since 0.1.0
 * @category Core
 */
export interface SourceLocation {
  /**
   * The starting position of the node in the source code.
   * Includes line number (0-based), column number (0-based), and byte offset.
   */
  start: Position;

  /**
   * The ending position of the node in the source code.
   * Includes line number (0-based), column number (0-based), and byte offset.
   * The end position is exclusive (points to the character after the last character of the node).
   */
  end: Position;

  /**
   * The original source code text that this location represents.
   * This is optional but useful for debugging and error reporting.
   *
   * @example
   * ```typescript
   * // For a cube(10) node, text would be "cube(10)"
   * const location: SourceLocation = {
   *   start: { line: 0, column: 0, offset: 0 },
   *   end: { line: 0, column: 8, offset: 8 },
   *   text: "cube(10)"
   * };
   * ```
   */
  text?: string;
}

/**
 * Represents a specific position in the source code.
 *
 * This interface defines a point location within source code using three
 * coordinate systems: line/column (for human readability) and byte offset
 * (for efficient string operations). All coordinates are zero-based.
 *
 * @example Creating a position
 * ```typescript
 * const position: Position = {
 *   line: 0,     // First line (0-based)
 *   column: 5,   // Sixth character on the line (0-based)
 *   offset: 5    // Sixth character in the entire file (0-based)
 * };
 * ```
 *
 * @example Position at start of file
 * ```typescript
 * const startPosition: Position = {
 *   line: 0,
 *   column: 0,
 *   offset: 0
 * };
 * ```
 *
 * @since 0.1.0
 * @category Core
 */
export interface Position {
  /**
   * The zero-based line number in the source code.
   *
   * Line numbers start at 0 for the first line of the file.
   * This follows the Tree-sitter convention and is commonly used
   * in programming tools and editors.
   *
   * @example
   * ```typescript
   * // For code on the first line: line = 0
   * // For code on the second line: line = 1
   * // etc.
   * ```
   */
  line: number;

  /**
   * The zero-based column number within the line.
   *
   * Column numbers start at 0 for the first character of each line.
   * This represents the horizontal position within the line.
   *
   * @example
   * ```typescript
   * // For the first character on a line: column = 0
   * // For the second character on a line: column = 1
   * // etc.
   * ```
   */
  column: number;

  /**
   * The zero-based byte offset from the start of the source code.
   *
   * This represents the absolute position in the source code as a
   * character count from the beginning of the file. Useful for
   * efficient string operations and text manipulation.
   *
   * @example
   * ```typescript
   * // For the first character in the file: offset = 0
   * // For the second character in the file: offset = 1
   * // etc.
   * const sourceCode = "cube(10);";
   * const position: Position = {
   *   line: 0,
   *   column: 4,
   *   offset: 4  // Points to the '(' character
   * };
   * ```
   */
  offset: number;
}

/**
 * Represents a 3D vector [x, y, z]
 */
export type Vector3D = [number, number, number];

/**
 * Represents a 2D vector [x, y]
 */
export type Vector2D = [number, number];

/**
 * Represents a 4D vector [x, y, z, w]
 */
export type Vector4D = [number, number, number, number];

/**
 * Represents a value type used in argument extraction
 */
export interface Value {
  type: 'number' | 'boolean' | 'string' | 'identifier' | 'vector' | 'range';
  value: string | number | boolean | Value[];
  start?: string;
  end?: string;
  step?: string;
}

/**
 * Represents a vector value
 */
export interface VectorValue extends Value {
  type: 'vector';
  value: Value[];
}

/**
 * Represents a range value
 */
export interface RangeValue extends Value {
  type: 'range';
  start?: string;
  end?: string;
  step?: string;
}

/**
 * Represents a parameter value which can be a literal or an expression
 */
export type ParameterValue =
  | number
  | boolean
  | string
  | Vector2D
  | Vector3D
  | ExpressionNode
  | ErrorNode
  | null
  | undefined;

/**
 * Represents a parameter with an optional name
 */
export interface Parameter {
  name: string | undefined;
  value: ParameterValue;
}

/**
 * Base interface for expression nodes
 */
export interface ExpressionNode extends BaseNode {
  type: 'expression';
  expressionType:
    | 'variable'
    | 'variable_reference' // Added to match test expectations
    | 'binary'
    | 'unary'
    | 'conditional'
    | 'array'
    | 'literal'
    | 'each'
    | 'function_call'
    | 'identifier'
    | 'vector_expression'
    | 'index_expression'
    | 'range_expression'
    | 'let_expression'
    | string;

  // Optional properties used in various expression types
  value?: number | string | boolean;
  name?: string;
  operator?: BinaryOperator | UnaryOperator | string;
  left?: ExpressionNode;
  right?: ExpressionNode;
  condition?: ExpressionNode;
  thenBranch?: ExpressionNode;
  elseBranch?: ExpressionNode;
  items?: ExpressionNode[];
  operand?: ExpressionNode;
  args?: Parameter[];
}

/**
 * Represents an identifier expression, e.g., a variable name.
 */
export interface IdentifierExpressionNode extends ExpressionNode {
  expressionType: 'identifier';
  text: string;
}

/**
 * Represents a literal value (number, string, boolean)
 */
export interface LiteralNode extends ExpressionNode {
  expressionType: 'literal';
  value: number | string | boolean;
}

/**
 * Represents a variable reference
 */
export interface VariableNode extends ExpressionNode {
  expressionType: 'variable';
  name: string;
}

/**
 * Represents a function call
 */
export interface FunctionCallNode extends BaseNode {
  type: 'expression'; // Changed from 'function_call'
  expressionType: 'function_call'; // Added
  functionName: string;
  args: Parameter[];
  // Ensure it includes all necessary fields from ExpressionNode if they are relevant for function calls
  // For now, assuming 'name' could be 'functionName' and 'args' is already present.
  // Other ExpressionNode fields like 'value', 'operator', 'left', 'right', etc., are not typically part of a direct function call node.
}

/**
 * Represents a translate node
 */
export interface TranslateNode extends BaseNode {
  type: 'translate';
  v: Vector2D | Vector3D;
  children: ASTNode[];
}

/**
 * Represents a rotate node
 */
export interface RotateNode extends BaseNode {
  type: 'rotate';
  a: number | Vector3D;
  v?: Vector3D;
  children: ASTNode[];
}

/**
 * Represents a scale node
 */
export interface ScaleNode extends BaseNode {
  type: 'scale';
  v: Vector3D;
  children: ASTNode[];
}

/**
 * Represents a mirror node
 */
export interface MirrorNode extends BaseNode {
  type: 'mirror';
  v: Vector3D;
  children: ASTNode[];
}

/**
 * Represents a multmatrix node
 */
export interface MultmatrixNode extends BaseNode {
  type: 'multmatrix';
  m: number[][];
  children: ASTNode[];
}

/**
 * Represents a color node
 */
export interface ColorNode extends BaseNode {
  type: 'color';
  c: string | Vector4D;
  children: ASTNode[];
}

/**
 * Represents a union node
 */
export interface UnionNode extends BaseNode {
  type: 'union';
  children: ASTNode[];
}

/**
 * Represents a difference node
 */
export interface DifferenceNode extends BaseNode {
  type: 'difference';
  children: ASTNode[];
}

/**
 * Represents an intersection node
 */
export interface IntersectionNode extends BaseNode {
  type: 'intersection';
  children: ASTNode[];
}

/**
 * Represents a hull node
 */
export interface HullNode extends BaseNode {
  type: 'hull';
  children: ASTNode[];
}

/**
 * Represents a minkowski node
 */
export interface MinkowskiNode extends BaseNode {
  type: 'minkowski';
  children: ASTNode[];
}

/**
 * Represents a cube primitive
 */
export interface CubeNode extends BaseNode {
  type: 'cube';
  size: ParameterValue;
  center?: boolean;
}

/**
 * Represents a sphere primitive
 */
export interface SphereNode extends BaseNode {
  type: 'sphere';
  radius?: number;
  diameter?: number;
  fa?: number;
  fs?: number;
  fn?: number;
}

/**
 * Represents a cylinder primitive
 */
export interface CylinderNode extends BaseNode {
  type: 'cylinder';
  h: number;
  r1?: number;
  r2?: number;
  r?: number;
  d1?: number;
  d2?: number;
  d?: number;
  center?: boolean;
  $fn?: number;
  $fa?: number;
  $fs?: number;
}

/**
 * Represents a polyhedron primitive
 */
export interface PolyhedronNode extends BaseNode {
  type: 'polyhedron';
  points: Vector3D[];
  faces: number[][];
  convexity?: number;
}

/**
 * Represents a 2D polygon
 */
export interface PolygonNode extends BaseNode {
  type: 'polygon';
  points: Vector2D[];
  paths?: number[][];
  convexity?: number;
}

/**
 * Represents a 2D circle
 */
export interface CircleNode extends BaseNode {
  type: 'circle';
  r?: number;
  d?: number;
  $fn?: number;
  $fa?: number;
  $fs?: number;
}

/**
 * Represents a 2D square
 */
export interface SquareNode extends BaseNode {
  type: 'square';
  size: number | Vector2D;
  center?: boolean;
}

/**
 * Represents a text node
 */
export interface TextNode extends BaseNode {
  type: 'text';
  text: string;
  size?: number;
  font?: string;
  halign?: 'left' | 'center' | 'right';
  valign?: 'baseline' | 'bottom' | 'center' | 'top';
  spacing?: number;
  direction?: 'ltr' | 'rtl' | 'ttb' | 'btt';
  language?: string;
  script?: string;
  $fn?: number;
}

/**
 * Represents a linear_extrude node
 */
export interface LinearExtrudeNode extends BaseNode {
  type: 'linear_extrude';
  height: number;
  center?: boolean;
  convexity?: number;
  twist?: number;
  slices?: number;
  scale?: number | Vector2D;
  $fn?: number;
  children: ASTNode[];
}

/**
 * Represents a rotate_extrude node
 */
export interface RotateExtrudeNode extends BaseNode {
  type: 'rotate_extrude';
  angle?: number;
  convexity?: number;
  $fn?: number;
  $fa?: number;
  $fs?: number;
  children: ASTNode[];
}

/**
 * Represents an offset node
 */
export interface OffsetNode extends BaseNode {
  type: 'offset';
  r: number;
  delta: number;
  chamfer: boolean;
  children: ASTNode[];
}

/**
 * Represents a resize node
 */
export interface ResizeNode extends BaseNode {
  type: 'resize';
  newsize: [number, number, number];
  auto: [boolean, boolean, boolean];
  children: ASTNode[];
}

/**
 * Represents an if statement
 */
export interface IfNode extends BaseNode {
  type: 'if';
  condition: ExpressionNode;
  thenBranch: ASTNode[];
  elseBranch?: ASTNode[];
}

/**
 * Represents a for loop variable with its range
 */
export interface ForLoopVariable {
  variable: string;
  range: ExpressionNode | ErrorNode;
  step?: ExpressionNode | ErrorNode | undefined;
}

/**
 * Represents a for loop
 */
export interface ForLoopNode extends BaseNode {
  type: 'for_loop';
  variables: ForLoopVariable[];
  body: ASTNode[];
}

/**
 * Represents a let expression
 */
export interface LetNode extends BaseNode {
  type: 'let';
  assignments: { [key: string]: ParameterValue };
  body: ASTNode[];
}

/**
 * Represents an each statement
 */
export interface EachNode extends BaseNode {
  type: 'each';
  expression: ExpressionNode;
}

/**
 * Represents an assert statement in OpenSCAD
 *
 * Assert statements validate conditions during compilation and halt execution
 * if the condition is false. They are essential for input validation and
 * ensuring code correctness.
 *
 * @example Basic assertion
 * ```openscad
 * assert(true);
 * ```
 *
 * @example Assertion with condition
 * ```openscad
 * assert(x > 0);
 * ```
 *
 * @example Assertion with custom message
 * ```openscad
 * assert(x > 0, "x must be positive");
 * ```
 *
 * @example Complex assertion
 * ```openscad
 * assert(len(points) >= 3, "Need at least 3 points for polygon");
 * ```
 *
 * @since 0.1.0
 */
export interface AssertStatementNode extends BaseNode {
  type: 'assert';
  /** The condition expression to evaluate */
  condition: ExpressionNode;
  /** Optional error message to display if assertion fails */
  message?: ExpressionNode;
}

/**
 * Represents an echo statement for debugging and output
 *
 * Echo statements provide a way to output values and messages to the console
 * during OpenSCAD execution. They are commonly used for debugging and
 * displaying intermediate values during script execution.
 *
 * @example Basic echo statement
 * ```openscad
 * echo("Hello World");
 * ```
 *
 * @example Multiple arguments
 * ```openscad
 * echo("Value:", x, "Result:", x + y);
 * ```
 *
 * @example Variable output
 * ```openscad
 * echo(value);
 * ```
 *
 * @since 0.1.0
 * @category Statements
 */
export interface EchoStatementNode extends BaseNode {
  type: 'echo';
  /** The arguments/expressions to output */
  arguments: ExpressionNode[];
}

/**
 * Represents an assign statement for variable scoping (deprecated in OpenSCAD).
 *
 * Assign statements in OpenSCAD are deprecated but still supported for legacy code.
 * They provide a way to assign variables within a specific scope and follow the
 * pattern: `assign(var1 = value1, var2 = value2, ...) { statements }`
 *
 * @example Basic assign statement
 * ```openscad
 * assign(x = 5) cube(x);
 * ```
 *
 * @example Multiple assignments
 * ```openscad
 * assign(x = 5, y = 10) cube([x, y, 1]);
 * ```
 *
 * @example Assign with block
 * ```openscad
 * assign(r = 10) { sphere(r); translate([r*2, 0, 0]) sphere(r); }
 * ```
 *
 * @since 1.0.0
 * @deprecated Assign statements are deprecated in OpenSCAD. Use regular variable assignments instead.
 */
export interface AssignStatementNode extends BaseNode {
  type: 'assign';
  /** The variable assignments within the assign statement */
  assignments: AssignmentNode[];
  /** The body statement or block to execute with the assigned variables */
  body: ASTNode;
}



/**
 * Represents an array expression
 */
export interface ArrayExpressionNode extends ExpressionNode {
  expressionType: 'array' | 'vector2d' | 'vector3d'; // Added 'vector2d' and 'vector3d' to match test expectations
  items: ExpressionNode[];
}

/**
 * Represents an each expression
 */
export interface EachExpressionNode extends ExpressionNode {
  expressionType: 'each';
  expression: ExpressionNode;
}

/**
 * Represents a literal expression (number, string, boolean)
 */
export interface LiteralExpressionNode extends ExpressionNode {
  expressionType: 'literal';
  value: number | string | boolean;
}

/**
 * Special variables in OpenSCAD
 */
export type SpecialVariable =
  | '$fn' // Number of fragments
  | '$fa' // Minimum angle
  | '$fs' // Minimum size of fragment
  | '$t' // Animation time
  | '$vpr' // Viewport rotation
  | '$vpt' // Viewport translation
  | '$vpd' // Viewport distance
  | '$children' // Number of children in module
  | '$preview'; // True if in preview mode

/**
 * Represents a special variable assignment
 */
export interface SpecialVariableAssignment extends BaseNode {
  type: 'specialVariableAssignment';
  variable: SpecialVariable;
  value: number | boolean | Vector3D;
}

/**
 * Binary operators in OpenSCAD
 */
export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | '&&'
  | '||';

/**
 * Unary operators in OpenSCAD
 */
export type UnaryOperator = '-' | '!';

/**
 * Represents a module definition
 */
export interface ModuleDefinitionNode extends BaseNode {
  type: 'module_definition';
  name: IdentifierNode; // Changed from string to IdentifierNode
  parameters: ModuleParameter[];
  body: ASTNode[];
}

/**
 * Represents a module parameter
 */
export interface ModuleParameter {
  name: string;
  defaultValue?: ParameterValue;
}

/**
 * Represents a module instantiation
 */
export interface ModuleInstantiationNode extends BaseNode {
  type: 'module_instantiation';
  name: string;
  args: Parameter[];
  children: ASTNode[];
}

/**
 * Represents a function definition
 */
export interface FunctionDefinitionNode extends BaseNode {
  type: 'function_definition';
  name: IdentifierNode; // Changed from string to IdentifierNode
  parameters: ModuleParameter[];
  expression: ExpressionNode;
}

/**
 * Represents a variable assignment
 */
export interface AssignmentNode extends BaseNode {
  type: 'assignment';
  variable: IdentifierNode; // Changed from string to IdentifierNode
  value: ExpressionNode | ParameterValue;
}

/**
 * Represents a children() call in a module
 */
export interface ChildrenNode extends BaseNode {
  type: 'children';
  index?: number;
}

/**
 * Represents an identifier (variable reference)
 */
export interface IdentifierNode extends ExpressionNode {
  expressionType: 'identifier';
  name: string;
}

/**
 * Represents a vector expression [x, y, z]
 */
export interface VectorExpressionNode extends ExpressionNode {
  expressionType: 'vector_expression' | 'vector' | 'vector2d' | 'vector3d'; // Added 'vector', 'vector2d', and 'vector3d' to match test expectations
  elements?: ExpressionNode[]; // Original property
  items?: ExpressionNode[]; // Alternative property used in some implementations
}

/**
 * Represents an index expression (e.g., array[index])
 */
export interface IndexExpressionNode extends ExpressionNode {
  expressionType: 'index_expression';
  object: ExpressionNode;
  index: ExpressionNode;
}

/**
 * Represents an accessor expression (e.g., object.property)
 */
export interface AccessorExpressionNode extends ExpressionNode {
  expressionType: 'accessor';
  object: ExpressionNode;
  property: string;
}

/**
 * Represents a range expression [start:end] or [start:step:end]
 */
export interface RangeExpressionNode extends ExpressionNode {
  expressionType: 'range_expression';
  start: ExpressionNode;
  end: ExpressionNode;
  step?: ExpressionNode;
}

/**
 * Represents a let expression let(assignments) expression
 */
export interface LetExpressionNode extends ExpressionNode {
  expressionType: 'let_expression';
  assignments: AssignmentNode[];
  expression: ExpressionNode | ErrorNode;
}

/**
 * Represents a list comprehension expression [for (var = range) expression]
 */
export interface ListComprehensionExpressionNode extends ExpressionNode {
  expressionType: 'list_comprehension_expression';
  variable: string;
  range: ExpressionNode;
  expression: ExpressionNode;
  condition?: ExpressionNode;
}

/**
 * Represents a binary expression (e.g., a + b)
 */
export interface BinaryExpressionNode extends ExpressionNode {
  expressionType: 'binary' | 'binary_expression'; // Added 'binary_expression' to match test expectations
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
}

/**
 * Represents a unary expression (e.g., -a, !b)
 */
export interface UnaryExpressionNode extends ExpressionNode {
  expressionType: 'unary' | 'unary_expression'; // Added 'unary_expression' to match test expectations
  operator: UnaryOperator;
  operand: ExpressionNode;
  prefix: boolean; // Indicates if the operator is a prefix operator (always true for OpenSCAD unary ops)
}

/**
 * Represents a conditional expression (ternary operator: condition ? then : else)
 */
export interface ConditionalExpressionNode extends ExpressionNode {
  expressionType: 'conditional' | 'conditional_expression'; // Added 'conditional_expression' to match test expectations
  condition: ExpressionNode;
  thenBranch: ExpressionNode;
  elseBranch: ExpressionNode;
}

/**
 * Represents a parsing error encountered during AST construction.
 * This node is used when a visitor cannot successfully convert a CST node
 * into a valid AST node due to structural issues, missing parts, or
 * unparsable sub-expressions.
 *
 * @since 0.2.0
 * @category Core
 */
export interface ErrorNode extends BaseNode {
  type: 'error';
  errorCode: string; // e.g., 'MISSING_CHILD_NODE', 'UNPARSABLE_EXPRESSION'
  message: string; // Human-readable error message
  originalNodeType?: string; // The type of the CST node that failed to parse (e.g., 'range_expression')
  cstNodeText?: string; // The text content of the problematic CST node
  cause?: ErrorNode; // Optional underlying error that caused this error
  // Location is inherited from BaseNode and should point to the problematic CST node
}

/**
 * Union type of all possible AST nodes
 */
/**
 * Union type of all possible AST nodes that can function as a statement in a block.
 * This includes control flow statements, assignments, module instantiations,
 * definitions, and geometry-producing operations.
 */
export type StatementNode =
  | IfNode
  | ForLoopNode
  | LetNode
  | EachNode
  | AssertStatementNode
  | EchoStatementNode
  | AssignStatementNode
  | ModuleInstantiationNode
  | ModuleDefinitionNode
  | FunctionDefinitionNode
  | TranslateNode
  | RotateNode
  | ScaleNode
  | MirrorNode
  | MultmatrixNode
  | ColorNode
  | UnionNode
  | DifferenceNode
  | IntersectionNode
  | HullNode
  | MinkowskiNode
  | CubeNode
  | SphereNode
  | CylinderNode
  | PolyhedronNode
  | PolygonNode
  | CircleNode
  | SquareNode
  | TextNode
  | LinearExtrudeNode
  | RotateExtrudeNode
  | OffsetNode
  | ResizeNode
  | ChildrenNode
  | ErrorNode; // ErrorNode can also be a result of a statement

export type ASTNode =
  | ExpressionNode
  | LiteralNode
  | VariableNode
  | FunctionCallNode
  | TranslateNode
  | CubeNode
  | SphereNode
  | CylinderNode
  | PolyhedronNode
  | PolygonNode
  | CircleNode
  | SquareNode
  | TextNode
  | LinearExtrudeNode
  | RotateExtrudeNode
  | OffsetNode
  | ResizeNode
  | IfNode
  | ForLoopNode
  | LetNode
  | EachNode
  | AssertStatementNode
  | EchoStatementNode
  | AssignStatementNode
  | RotateNode
  | ScaleNode
  | MirrorNode
  | MultmatrixNode
  | ColorNode
  | UnionNode
  | DifferenceNode
  | IntersectionNode
  | HullNode
  | MinkowskiNode
  | ModuleDefinitionNode
  | ModuleInstantiationNode
  | FunctionDefinitionNode
  | AssignmentNode
  | SpecialVariableAssignment
  | ChildrenNode
  | IdentifierNode
  | VectorExpressionNode
  | IndexExpressionNode
  | RangeExpressionNode
  | LetExpressionNode
  | ListComprehensionExpressionNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | ConditionalExpressionNode
  | ErrorNode; // Added ErrorNode here


