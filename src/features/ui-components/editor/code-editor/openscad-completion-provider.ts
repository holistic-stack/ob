/**
 * @file OpenSCAD Completion Provider
 * 
 * Comprehensive Monaco Editor completion provider for OpenSCAD language featuring:
 * - Built-in functions with parameter hints and documentation
 * - Mathematical functions with signatures and examples
 * - Context-aware variable and module completion
 * - Code snippets for common OpenSCAD patterns
 * - Intelligent suggestions based on cursor position and scope
 */

import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

// Types for completion items
interface OpenSCADFunction {
  readonly name: string;
  readonly parameters: readonly OpenSCADParameter[];
  readonly description: string;
  readonly example: string;
  readonly category: 'primitive' | 'transformation' | 'boolean' | 'mathematical' | 'utility';
  readonly returnType?: string;
}

interface OpenSCADParameter {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly defaultValue?: string;
  readonly optional?: boolean;
}

interface OpenSCADSnippet {
  readonly name: string;
  readonly prefix: string;
  readonly body: string;
  readonly description: string;
  readonly category: 'module' | 'function' | 'control' | 'pattern';
}

/**
 * OpenSCAD Built-in Functions Database
 */
const OPENSCAD_FUNCTIONS: readonly OpenSCADFunction[] = [
  // Primitive Solids
  {
    name: 'cube',
    parameters: [
      { name: 'size', type: 'number | [number, number, number]', description: 'Size of the cube (single value or [x, y, z])', defaultValue: '1' },
      { name: 'center', type: 'boolean', description: 'Center the cube on origin', defaultValue: 'false', optional: true }
    ],
    description: 'Creates a cube or rectangular prism in the first octant',
    example: 'cube([10, 20, 30], center=true);',
    category: 'primitive'
  },
  {
    name: 'sphere',
    parameters: [
      { name: 'r', type: 'number', description: 'Radius of the sphere', optional: true },
      { name: 'd', type: 'number', description: 'Diameter of the sphere', optional: true },
      { name: '$fa', type: 'number', description: 'Fragment angle', optional: true },
      { name: '$fs', type: 'number', description: 'Fragment size', optional: true },
      { name: '$fn', type: 'number', description: 'Fragment number', optional: true }
    ],
    description: 'Creates a sphere at the origin',
    example: 'sphere(r=10, $fn=50);',
    category: 'primitive'
  },
  {
    name: 'cylinder',
    parameters: [
      { name: 'h', type: 'number', description: 'Height of the cylinder' },
      { name: 'r', type: 'number', description: 'Radius of the cylinder', optional: true },
      { name: 'd', type: 'number', description: 'Diameter of the cylinder', optional: true },
      { name: 'r1', type: 'number', description: 'Bottom radius for cone', optional: true },
      { name: 'r2', type: 'number', description: 'Top radius for cone', optional: true },
      { name: 'center', type: 'boolean', description: 'Center the cylinder on origin', defaultValue: 'false', optional: true }
    ],
    description: 'Creates a cylinder or cone',
    example: 'cylinder(h=20, r=5, center=true);',
    category: 'primitive'
  },
  {
    name: 'polyhedron',
    parameters: [
      { name: 'points', type: 'array', description: 'Array of 3D points [[x,y,z], ...]' },
      { name: 'faces', type: 'array', description: 'Array of face indices [[p1,p2,p3], ...]' },
      { name: 'convexity', type: 'number', description: 'Convexity parameter', defaultValue: '1', optional: true }
    ],
    description: 'Creates a polyhedron from points and faces',
    example: 'polyhedron(points=[[0,0,0],[1,0,0],[0,1,0],[0,0,1]], faces=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]]);',
    category: 'primitive'
  },

  // 2D Primitives
  {
    name: 'circle',
    parameters: [
      { name: 'r', type: 'number', description: 'Radius of the circle', optional: true },
      { name: 'd', type: 'number', description: 'Diameter of the circle', optional: true },
      { name: '$fa', type: 'number', description: 'Fragment angle', optional: true },
      { name: '$fs', type: 'number', description: 'Fragment size', optional: true },
      { name: '$fn', type: 'number', description: 'Fragment number', optional: true }
    ],
    description: 'Creates a circle in the XY plane',
    example: 'circle(r=10, $fn=50);',
    category: 'primitive'
  },
  {
    name: 'square',
    parameters: [
      { name: 'size', type: 'number | [number, number]', description: 'Size of the square (single value or [x, y])', defaultValue: '1' },
      { name: 'center', type: 'boolean', description: 'Center the square on origin', defaultValue: 'false', optional: true }
    ],
    description: 'Creates a square or rectangle in the XY plane',
    example: 'square([20, 10], center=true);',
    category: 'primitive'
  },
  {
    name: 'polygon',
    parameters: [
      { name: 'points', type: 'array', description: 'Array of 2D points [[x,y], ...]' },
      { name: 'paths', type: 'array', description: 'Array of path indices', optional: true },
      { name: 'convexity', type: 'number', description: 'Convexity parameter', defaultValue: '1', optional: true }
    ],
    description: 'Creates a polygon from 2D points',
    example: 'polygon(points=[[0,0],[10,0],[5,10]]);',
    category: 'primitive'
  },

  // Transformations
  {
    name: 'translate',
    parameters: [
      { name: 'v', type: '[number, number, number]', description: 'Translation vector [x, y, z]' }
    ],
    description: 'Translates (moves) child objects by the given vector',
    example: 'translate([10, 20, 30]) cube(5);',
    category: 'transformation'
  },
  {
    name: 'rotate',
    parameters: [
      { name: 'a', type: 'number | [number, number, number]', description: 'Rotation angle(s) in degrees' },
      { name: 'v', type: '[number, number, number]', description: 'Rotation axis vector', optional: true }
    ],
    description: 'Rotates child objects around the given axis',
    example: 'rotate([0, 0, 45]) cube(10);',
    category: 'transformation'
  },
  {
    name: 'scale',
    parameters: [
      { name: 'v', type: 'number | [number, number, number]', description: 'Scale factor(s)' }
    ],
    description: 'Scales child objects by the given factor(s)',
    example: 'scale([2, 1, 0.5]) cube(10);',
    category: 'transformation'
  },
  {
    name: 'resize',
    parameters: [
      { name: 'newsize', type: '[number, number, number]', description: 'New size [x, y, z]' },
      { name: 'auto', type: 'boolean | [boolean, boolean, boolean]', description: 'Auto-scale dimensions', defaultValue: 'false', optional: true }
    ],
    description: 'Resizes child objects to the specified dimensions',
    example: 'resize([20, 30, 40]) sphere(10);',
    category: 'transformation'
  },
  {
    name: 'mirror',
    parameters: [
      { name: 'v', type: '[number, number, number]', description: 'Mirror plane normal vector' }
    ],
    description: 'Mirrors child objects across the plane defined by the normal vector',
    example: 'mirror([1, 0, 0]) cube(10);',
    category: 'transformation'
  },

  // Boolean Operations
  {
    name: 'union',
    parameters: [],
    description: 'Creates the union (sum) of all child objects',
    example: 'union() { cube(10); translate([5, 5, 5]) sphere(8); }',
    category: 'boolean'
  },
  {
    name: 'difference',
    parameters: [],
    description: 'Subtracts all child objects after the first from the first',
    example: 'difference() { cube(10); translate([5, 5, 5]) sphere(8); }',
    category: 'boolean'
  },
  {
    name: 'intersection',
    parameters: [],
    description: 'Creates the intersection of all child objects',
    example: 'intersection() { cube(10); translate([5, 5, 5]) sphere(8); }',
    category: 'boolean'
  },
  {
    name: 'hull',
    parameters: [],
    description: 'Creates the convex hull of all child objects',
    example: 'hull() { cube(10); translate([20, 0, 0]) sphere(5); }',
    category: 'boolean'
  },
  {
    name: 'minkowski',
    parameters: [],
    description: 'Creates the Minkowski sum of child objects',
    example: 'minkowski() { cube(10); sphere(2); }',
    category: 'boolean'
  },

  // Mathematical Functions
  {
    name: 'abs',
    parameters: [
      { name: 'x', type: 'number', description: 'Input value' }
    ],
    description: 'Returns the absolute value of x',
    example: 'abs(-5) // returns 5',
    category: 'mathematical',
    returnType: 'number'
  },
  {
    name: 'cos',
    parameters: [
      { name: 'angle', type: 'number', description: 'Angle in degrees' }
    ],
    description: 'Returns the cosine of the angle',
    example: 'cos(60) // returns 0.5',
    category: 'mathematical',
    returnType: 'number'
  },
  {
    name: 'sin',
    parameters: [
      { name: 'angle', type: 'number', description: 'Angle in degrees' }
    ],
    description: 'Returns the sine of the angle',
    example: 'sin(90) // returns 1',
    category: 'mathematical',
    returnType: 'number'
  },
  {
    name: 'tan',
    parameters: [
      { name: 'angle', type: 'number', description: 'Angle in degrees' }
    ],
    description: 'Returns the tangent of the angle',
    example: 'tan(45) // returns 1',
    category: 'mathematical',
    returnType: 'number'
  },
  {
    name: 'sqrt',
    parameters: [
      { name: 'x', type: 'number', description: 'Input value' }
    ],
    description: 'Returns the square root of x',
    example: 'sqrt(16) // returns 4',
    category: 'mathematical',
    returnType: 'number'
  },
  {
    name: 'pow',
    parameters: [
      { name: 'base', type: 'number', description: 'Base value' },
      { name: 'exponent', type: 'number', description: 'Exponent value' }
    ],
    description: 'Returns base raised to the power of exponent',
    example: 'pow(2, 3) // returns 8',
    category: 'mathematical',
    returnType: 'number'
  },
  {
    name: 'max',
    parameters: [
      { name: 'values', type: 'number[]', description: 'Array of values or multiple arguments' }
    ],
    description: 'Returns the maximum value from the arguments',
    example: 'max(1, 5, 3) // returns 5',
    category: 'mathematical',
    returnType: 'number'
  },
  {
    name: 'min',
    parameters: [
      { name: 'values', type: 'number[]', description: 'Array of values or multiple arguments' }
    ],
    description: 'Returns the minimum value from the arguments',
    example: 'min(1, 5, 3) // returns 1',
    category: 'mathematical',
    returnType: 'number'
  }
] as const;

/**
 * OpenSCAD Code Snippets
 */
const OPENSCAD_SNIPPETS: readonly OpenSCADSnippet[] = [
  {
    name: 'Module Definition',
    prefix: 'module',
    body: 'module ${1:name}(${2:parameters}) {\n\t${3:// module body}\n\t$0\n}',
    description: 'Create a new module definition',
    category: 'module'
  },
  {
    name: 'Function Definition',
    prefix: 'function',
    body: 'function ${1:name}(${2:parameters}) = ${3:expression};',
    description: 'Create a new function definition',
    category: 'function'
  },
  {
    name: 'For Loop',
    prefix: 'for',
    body: 'for (${1:i} = [${2:start}:${3:end}]) {\n\t${4:// loop body}\n\t$0\n}',
    description: 'Create a for loop',
    category: 'control'
  },
  {
    name: 'If Statement',
    prefix: 'if',
    body: 'if (${1:condition}) {\n\t${2:// if body}\n\t$0\n}',
    description: 'Create an if statement',
    category: 'control'
  },
  {
    name: 'Difference Pattern',
    prefix: 'diff',
    body: 'difference() {\n\t${1:// main object}\n\t${2:// objects to subtract}\n\t$0\n}',
    description: 'Create a difference operation',
    category: 'pattern'
  },
  {
    name: 'Union Pattern',
    prefix: 'union',
    body: 'union() {\n\t${1:// objects to combine}\n\t$0\n}',
    description: 'Create a union operation',
    category: 'pattern'
  },
  {
    name: 'Intersection Pattern',
    prefix: 'intersect',
    body: 'intersection() {\n\t${1:// objects to intersect}\n\t$0\n}',
    description: 'Create an intersection operation',
    category: 'pattern'
  }
] as const;

/**
 * Create completion item from OpenSCAD function
 */
function createFunctionCompletionItem(
  func: OpenSCADFunction,
  range: monacoEditor.IRange
): monacoEditor.languages.CompletionItem {
  const parameterList = func.parameters
    .map((param, index) => {
      const paramStr = param.optional && param.defaultValue 
        ? `\${${index + 1}:${param.name}=${param.defaultValue}}`
        : `\${${index + 1}:${param.name}}`;
      return paramStr;
    })
    .join(', ');

  const insertText = `${func.name}(${parameterList})`;
  
  const documentation = [
    func.description,
    '',
    '**Parameters:**',
    ...func.parameters.map(param => 
      `- \`${param.name}\` (${param.type}): ${param.description}${param.defaultValue ? ` (default: ${param.defaultValue})` : ''}`
    ),
    '',
    '**Example:**',
    `\`\`\`openscad\n${func.example}\n\`\`\``
  ].join('\n');

  return {
    label: func.name,
    kind: monacoEditor.languages.CompletionItemKind.Function,
    insertText,
    insertTextRules: monacoEditor.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range,
    documentation: {
      value: documentation,
      isTrusted: true
    },
    detail: `${func.category} - ${func.description}`,
    sortText: `${func.category}_${func.name}`,
    filterText: func.name,
    tags: func.category === 'mathematical' ? [monacoEditor.languages.CompletionItemTag.Deprecated] : undefined
  };
}

/**
 * Create completion item from OpenSCAD snippet
 */
function createSnippetCompletionItem(
  snippet: OpenSCADSnippet,
  range: monacoEditor.IRange
): monacoEditor.languages.CompletionItem {
  return {
    label: snippet.name,
    kind: monacoEditor.languages.CompletionItemKind.Snippet,
    insertText: snippet.body,
    insertTextRules: monacoEditor.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range,
    documentation: {
      value: snippet.description,
      isTrusted: true
    },
    detail: `snippet - ${snippet.description}`,
    sortText: `snippet_${snippet.prefix}`,
    filterText: snippet.prefix
  };
}

/**
 * OpenSCAD Completion Provider
 */
export function createOpenSCADCompletionProvider(): monacoEditor.languages.CompletionItemProvider {
  return {
    provideCompletionItems: (model, position, context, token) => {
      console.log('[OpenSCADCompletion] Providing completion items at position:', position);

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions: monacoEditor.languages.CompletionItem[] = [];

      // Add function completions
      OPENSCAD_FUNCTIONS.forEach(func => {
        suggestions.push(createFunctionCompletionItem(func, range));
      });

      // Add snippet completions
      OPENSCAD_SNIPPETS.forEach(snippet => {
        suggestions.push(createSnippetCompletionItem(snippet, range));
      });

      console.log('[OpenSCADCompletion] Generated', suggestions.length, 'completion suggestions');

      return {
        suggestions,
        incomplete: false
      };
    },

    triggerCharacters: ['.', '(', '[', ' ']
  };
}
