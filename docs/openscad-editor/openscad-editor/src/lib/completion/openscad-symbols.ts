/**
 * OpenSCAD Built-in Symbols Database
 * 
 * Comprehensive database of OpenSCAD built-in modules, functions, and constants
 * for intelligent code completion.
 */

export interface SymbolInfo {
  name: string;
  type: 'module' | 'function' | 'constant' | 'variable';
  category: string;
  description: string;
  parameters?: ParameterInfo[];
  returnType?: string;
  examples?: string[];
  documentation?: string;
}

export interface ParameterInfo {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

// OpenSCAD Built-in Modules
export const OPENSCAD_MODULES: SymbolInfo[] = [
  // Basic 3D Primitives
  {
    name: 'cube',
    type: 'module',
    category: '3D Primitives',
    description: 'Creates a cube or rectangular prism',
    parameters: [
      { name: 'size', type: 'number | [number, number, number]', description: 'Size of the cube', required: true },
      { name: 'center', type: 'boolean', description: 'Center the cube on origin', required: false, defaultValue: 'false' }
    ],
    examples: [
      'cube(10);',
      'cube([10, 20, 30]);',
      'cube(10, center=true);'
    ],
    documentation: 'Creates a cube with specified dimensions. Can be a single value for all dimensions or an array [x,y,z].'
  },
  {
    name: 'sphere',
    type: 'module',
    category: '3D Primitives',
    description: 'Creates a sphere',
    parameters: [
      { name: 'r', type: 'number', description: 'Radius of the sphere', required: false },
      { name: 'd', type: 'number', description: 'Diameter of the sphere', required: false },
      { name: '$fn', type: 'number', description: 'Number of facets', required: false }
    ],
    examples: [
      'sphere(r=5);',
      'sphere(d=10);',
      'sphere(r=5, $fn=50);'
    ],
    documentation: 'Creates a sphere with specified radius or diameter.'
  },
  {
    name: 'cylinder',
    type: 'module',
    category: '3D Primitives',
    description: 'Creates a cylinder or cone',
    parameters: [
      { name: 'h', type: 'number', description: 'Height of cylinder', required: true },
      { name: 'r', type: 'number', description: 'Radius (uniform)', required: false },
      { name: 'r1', type: 'number', description: 'Bottom radius', required: false },
      { name: 'r2', type: 'number', description: 'Top radius', required: false },
      { name: 'd', type: 'number', description: 'Diameter (uniform)', required: false },
      { name: 'center', type: 'boolean', description: 'Center on Z axis', required: false, defaultValue: 'false' },
      { name: '$fn', type: 'number', description: 'Number of facets', required: false }
    ],
    examples: [
      'cylinder(h=10, r=5);',
      'cylinder(h=10, r1=5, r2=2);',
      'cylinder(h=10, d=8, center=true);'
    ],
    documentation: 'Creates a cylinder or cone. Use r for uniform radius, or r1/r2 for different top/bottom radii.'
  },

  // 2D Primitives
  {
    name: 'circle',
    type: 'module',
    category: '2D Primitives',
    description: 'Creates a circle',
    parameters: [
      { name: 'r', type: 'number', description: 'Radius of circle', required: false },
      { name: 'd', type: 'number', description: 'Diameter of circle', required: false },
      { name: '$fn', type: 'number', description: 'Number of facets', required: false }
    ],
    examples: [
      'circle(r=5);',
      'circle(d=10);',
      'circle(r=5, $fn=100);'
    ]
  },
  {
    name: 'square',
    type: 'module',
    category: '2D Primitives',
    description: 'Creates a square or rectangle',
    parameters: [
      { name: 'size', type: 'number | [number, number]', description: 'Size of square/rectangle', required: true },
      { name: 'center', type: 'boolean', description: 'Center on origin', required: false, defaultValue: 'false' }
    ],
    examples: [
      'square(10);',
      'square([10, 20]);',
      'square(10, center=true);'
    ]
  },
  {
    name: 'polygon',
    type: 'module',
    category: '2D Primitives',
    description: 'Creates a polygon from points',
    parameters: [
      { name: 'points', type: '[[number, number], ...]', description: 'Array of 2D points', required: true },
      { name: 'paths', type: 'number[]', description: 'Path indices (optional)', required: false }
    ],
    examples: [
      'polygon([[0,0], [10,0], [5,10]]);',
      'polygon(points=[[0,0], [10,0], [10,10], [0,10]]);'
    ]
  },

  // Transformations
  {
    name: 'translate',
    type: 'module',
    category: 'Transformations',
    description: 'Moves objects in 3D space',
    parameters: [
      { name: 'v', type: '[number, number, number]', description: 'Translation vector [x, y, z]', required: true }
    ],
    examples: [
      'translate([10, 0, 0]) cube(5);',
      'translate([x, y, z]) sphere(r=2);'
    ]
  },
  {
    name: 'rotate',
    type: 'module',
    category: 'Transformations',
    description: 'Rotates objects around axes',
    parameters: [
      { name: 'a', type: 'number | [number, number, number]', description: 'Rotation angle(s) in degrees', required: true },
      { name: 'v', type: '[number, number, number]', description: 'Rotation axis vector', required: false }
    ],
    examples: [
      'rotate([0, 0, 45]) cube(10);',
      'rotate(a=45, v=[0, 0, 1]) cube(10);',
      'rotate(90) square(10);'
    ]
  },
  {
    name: 'scale',
    type: 'module',
    category: 'Transformations',
    description: 'Scales objects by factor(s)',
    parameters: [
      { name: 'v', type: 'number | [number, number, number]', description: 'Scale factor(s)', required: true }
    ],
    examples: [
      'scale(2) cube(5);',
      'scale([2, 1, 0.5]) cube(10);'
    ]
  },
  {
    name: 'mirror',
    type: 'module',
    category: 'Transformations',
    description: 'Mirrors objects across a plane',
    parameters: [
      { name: 'v', type: '[number, number, number]', description: 'Normal vector of mirror plane', required: true }
    ],
    examples: [
      'mirror([1, 0, 0]) cube(10);',
      'mirror([0, 1, 0]) sphere(5);'
    ]
  },

  // Boolean Operations
  {
    name: 'union',
    type: 'module',
    category: 'Boolean Operations',
    description: 'Combines multiple objects (default operation)',
    examples: [
      'union() { cube(10); translate([5, 0, 0]) sphere(3); }'
    ]
  },
  {
    name: 'difference',
    type: 'module',
    category: 'Boolean Operations',
    description: 'Subtracts objects from the first object',
    examples: [
      'difference() { cube(10); translate([5, 5, 5]) sphere(3); }'
    ]
  },
  {
    name: 'intersection',
    type: 'module',
    category: 'Boolean Operations',
    description: 'Keeps only the intersection of objects',
    examples: [
      'intersection() { cube(10); sphere(7); }'
    ]
  },

  // Advanced Operations
  {
    name: 'hull',
    type: 'module',
    category: 'Advanced Operations',
    description: 'Creates convex hull of objects',
    examples: [
      'hull() { translate([0, 0, 0]) sphere(3); translate([10, 10, 0]) sphere(3); }'
    ]
  },
  {
    name: 'minkowski',
    type: 'module',
    category: 'Advanced Operations',
    description: 'Performs Minkowski sum of objects',
    examples: [
      'minkowski() { cube(10); sphere(2); }'
    ]
  },

  // Extrusion
  {
    name: 'linear_extrude',
    type: 'module',
    category: 'Extrusion',
    description: 'Extrudes 2D shapes into 3D',
    parameters: [
      { name: 'height', type: 'number', description: 'Extrusion height', required: true },
      { name: 'center', type: 'boolean', description: 'Center on Z axis', required: false, defaultValue: 'false' },
      { name: 'convexity', type: 'number', description: 'Convexity parameter', required: false },
      { name: 'twist', type: 'number', description: 'Twist angle in degrees', required: false },
      { name: 'slices', type: 'number', description: 'Number of slices', required: false },
      { name: 'scale', type: 'number | [number, number]', description: 'Scale factor at top', required: false }
    ],
    examples: [
      'linear_extrude(height=10) square(5);',
      'linear_extrude(height=10, twist=90) square(5);'
    ]
  },
  {
    name: 'rotate_extrude',
    type: 'module',
    category: 'Extrusion',
    description: 'Rotates 2D shapes around Y axis',
    parameters: [
      { name: 'angle', type: 'number', description: 'Rotation angle in degrees', required: false, defaultValue: '360' },
      { name: 'convexity', type: 'number', description: 'Convexity parameter', required: false },
      { name: '$fn', type: 'number', description: 'Number of facets', required: false }
    ],
    examples: [
      'rotate_extrude() translate([10, 0, 0]) circle(2);',
      'rotate_extrude(angle=180) square([5, 10]);'
    ]
  }
];

// OpenSCAD Built-in Functions
export const OPENSCAD_FUNCTIONS: SymbolInfo[] = [
  // Mathematical Functions
  {
    name: 'sin',
    type: 'function',
    category: 'Mathematical',
    description: 'Sine function',
    parameters: [{ name: 'angle', type: 'number', description: 'Angle in degrees', required: true }],
    returnType: 'number',
    examples: ['sin(30)', 'sin(angle)']
  },
  {
    name: 'cos',
    type: 'function',
    category: 'Mathematical',
    description: 'Cosine function',
    parameters: [{ name: 'angle', type: 'number', description: 'Angle in degrees', required: true }],
    returnType: 'number',
    examples: ['cos(45)', 'cos(rotation_angle)']
  },
  {
    name: 'tan',
    type: 'function',
    category: 'Mathematical',
    description: 'Tangent function',
    parameters: [{ name: 'angle', type: 'number', description: 'Angle in degrees', required: true }],
    returnType: 'number',
    examples: ['tan(60)', 'tan(slope_angle)']
  },
  {
    name: 'sqrt',
    type: 'function',
    category: 'Mathematical',
    description: 'Square root function',
    parameters: [{ name: 'value', type: 'number', description: 'Input value', required: true }],
    returnType: 'number',
    examples: ['sqrt(16)', 'sqrt(x*x + y*y)']
  },
  {
    name: 'pow',
    type: 'function',
    category: 'Mathematical',
    description: 'Power function',
    parameters: [
      { name: 'base', type: 'number', description: 'Base value', required: true },
      { name: 'exponent', type: 'number', description: 'Exponent', required: true }
    ],
    returnType: 'number',
    examples: ['pow(2, 3)', 'pow(radius, 2)']
  },
  {
    name: 'abs',
    type: 'function',
    category: 'Mathematical',
    description: 'Absolute value function',
    parameters: [{ name: 'value', type: 'number', description: 'Input value', required: true }],
    returnType: 'number',
    examples: ['abs(-5)', 'abs(x - center_x)']
  },
  {
    name: 'min',
    type: 'function',
    category: 'Mathematical',
    description: 'Minimum value from arguments',
    parameters: [{ name: '...values', type: 'number[]', description: 'Values to compare', required: true }],
    returnType: 'number',
    examples: ['min(1, 2, 3)', 'min(width, height)']
  },
  {
    name: 'max',
    type: 'function',
    category: 'Mathematical',
    description: 'Maximum value from arguments',
    parameters: [{ name: '...values', type: 'number[]', description: 'Values to compare', required: true }],
    returnType: 'number',
    examples: ['max(1, 2, 3)', 'max(width, height)']
  },

  // Vector/List Functions
  {
    name: 'len',
    type: 'function',
    category: 'Vector/List',
    description: 'Length of vector or list',
    parameters: [{ name: 'vector', type: 'any[]', description: 'Vector or list', required: true }],
    returnType: 'number',
    examples: ['len([1, 2, 3])', 'len(points)']
  },
  {
    name: 'norm',
    type: 'function',
    category: 'Vector/List',
    description: 'Euclidean norm of vector',
    parameters: [{ name: 'vector', type: 'number[]', description: 'Vector', required: true }],
    returnType: 'number',
    examples: ['norm([3, 4])', 'norm([x, y, z])']
  },
  {
    name: 'cross',
    type: 'function',
    category: 'Vector/List',
    description: 'Cross product of two 3D vectors',
    parameters: [
      { name: 'a', type: '[number, number, number]', description: 'First vector', required: true },
      { name: 'b', type: '[number, number, number]', description: 'Second vector', required: true }
    ],
    returnType: '[number, number, number]',
    examples: ['cross([1, 0, 0], [0, 1, 0])', 'cross(v1, v2)']
  },

  // String Functions
  {
    name: 'str',
    type: 'function',
    category: 'String',
    description: 'Convert values to string',
    parameters: [{ name: '...values', type: 'any[]', description: 'Values to convert', required: true }],
    returnType: 'string',
    examples: ['str("value: ", x)', 'str(width, "x", height)']
  },

  // Utility Functions
  {
    name: 'echo',
    type: 'function',
    category: 'Utility',
    description: 'Print values to console',
    parameters: [{ name: '...values', type: 'any[]', description: 'Values to print', required: true }],
    returnType: 'void',
    examples: ['echo("Debug:", x)', 'echo("Point:", [x, y])']
  }
];

// OpenSCAD Constants and Special Variables
export const OPENSCAD_CONSTANTS: SymbolInfo[] = [
  {
    name: '$fn',
    type: 'constant',
    category: 'Special Variables',
    description: 'Number of facets for curved surfaces',
    examples: ['$fn = 50;', 'sphere(r=5, $fn=100);']
  },
  {
    name: '$fa',
    type: 'constant',
    category: 'Special Variables',
    description: 'Minimum angle for facets',
    examples: ['$fa = 12;', '$fa = 6;']
  },
  {
    name: '$fs',
    type: 'constant',
    category: 'Special Variables',
    description: 'Minimum facet size',
    examples: ['$fs = 2;', '$fs = 0.1;']
  },
  {
    name: '$t',
    type: 'constant',
    category: 'Special Variables',
    description: 'Animation time variable (0-1)',
    examples: ['rotate($t * 360) cube(10);', 'translate([$t * 50, 0, 0]) sphere(2);']
  },
  {
    name: '$vpr',
    type: 'constant',
    category: 'Special Variables',
    description: 'Viewport rotation [x, y, z]',
    examples: ['$vpr', 'echo("Viewport rotation:", $vpr);']
  },
  {
    name: '$vpt',
    type: 'constant',
    category: 'Special Variables',
    description: 'Viewport translation [x, y, z]',
    examples: ['$vpt', 'echo("Viewport center:", $vpt);']
  },
  {
    name: '$vpd',
    type: 'constant',
    category: 'Special Variables',
    description: 'Viewport distance',
    examples: ['$vpd', 'echo("Viewport distance:", $vpd);']
  }
];

// Aggregate all symbols
export const ALL_OPENSCAD_SYMBOLS: SymbolInfo[] = [
  ...OPENSCAD_MODULES,
  ...OPENSCAD_FUNCTIONS,
  ...OPENSCAD_CONSTANTS
];

// Create symbol lookup maps for quick access
export const SYMBOL_BY_NAME = new Map<string, SymbolInfo>();
export const SYMBOLS_BY_CATEGORY = new Map<string, SymbolInfo[]>();

// Initialize lookup maps
ALL_OPENSCAD_SYMBOLS.forEach(symbol => {
  SYMBOL_BY_NAME.set(symbol.name, symbol);
  
  if (!SYMBOLS_BY_CATEGORY.has(symbol.category)) {
    SYMBOLS_BY_CATEGORY.set(symbol.category, []);
  }
  SYMBOLS_BY_CATEGORY.get(symbol.category)!.push(symbol);
});

// Common OpenSCAD code snippets
export const OPENSCAD_SNIPPETS: { [key: string]: string } = {
  'module': 'module ${1:name}(${2:parameters}) {\n\t${3:// module content}\n}',
  'function': 'function ${1:name}(${2:parameters}) = ${3:expression};',
  'for': 'for (${1:i} = [${2:start}:${3:step}:${4:end}]) {\n\t${5:// loop content}\n}',
  'if': 'if (${1:condition}) {\n\t${2:// if content}\n}',
  'difference': 'difference() {\n\t${1:// main object}\n\t${2:// objects to subtract}\n}',
  'intersection': 'intersection() {\n\t${1:// objects to intersect}\n}',
  'hull': 'hull() {\n\t${1:// objects for convex hull}\n}',
  'translate': 'translate([${1:x}, ${2:y}, ${3:z}]) ${4:object}',
  'rotate': 'rotate([${1:x}, ${2:y}, ${3:z}]) ${4:object}',
  'scale': 'scale([${1:x}, ${2:y}, ${3:z}]) ${4:object}'
};

export default {
  modules: OPENSCAD_MODULES,
  functions: OPENSCAD_FUNCTIONS,
  constants: OPENSCAD_CONSTANTS,
  all: ALL_OPENSCAD_SYMBOLS,
  byName: SYMBOL_BY_NAME,
  byCategory: SYMBOLS_BY_CATEGORY,
  snippets: OPENSCAD_SNIPPETS
};
