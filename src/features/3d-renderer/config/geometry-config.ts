/**
 * Geometry Configuration
 * 
 * Centralized configuration for geometric operations, constants, and thresholds
 * following bulletproof-react configuration patterns.
 */

export const GEOMETRY_CONFIG = {
  /**
   * Precision and numerical constants
   */
  precision: {
    /** Epsilon value for plane operations (from Plane.EPSILON) */
    epsilon: 1e-5,
    /** General tolerance for floating point comparisons */
    tolerance: 1e-10,
    /** Angle threshold for geometric operations */
    angleThreshold: Math.PI / 180
  },

  /**
   * BSP tree operation constants
   */
  bsp: {
    /** Coplanar polygon classification */
    coplanar: 0,
    /** Front polygon classification */
    front: 1,
    /** Back polygon classification */
    back: 2,
    /** Spanning polygon classification */
    spanning: 3
  },

  /**
   * Performance thresholds and limits
   */
  performance: {
    /** Maximum number of polygons for CSG operations */
    maxPolygons: 10000,
    /** Maximum number of vertices for geometry processing */
    maxVertices: 50000,
    /** Render time threshold in milliseconds */
    renderTimeThreshold: 16, // <16ms requirement
    /** Maximum triangle count for single geometry */
    maxTriangles: 100000
  },

  /**
   * Buffer and memory management
   */
  buffers: {
    /** Default buffer size multiplier */
    sizeMultiplier: 1.5,
    /** Minimum buffer size */
    minSize: 1024,
    /** Maximum buffer size */
    maxSize: 1024 * 1024 * 10 // 10MB
  },

  /**
   * CSG operation defaults
   */
  csg: {
    /** Default material index for CSG operations */
    defaultMaterialIndex: 0,
    /** Enable shadow casting for CSG meshes */
    enableShadows: true,
    /** Enable shadow receiving for CSG meshes */
    enableShadowReceiving: true
  }
} as const;

/**
 * Type for geometry configuration
 */
export type GeometryConfig = typeof GEOMETRY_CONFIG;

/**
 * Get epsilon value for plane operations
 */
export const getEpsilon = (): number => GEOMETRY_CONFIG.precision.epsilon;

/**
 * Get BSP classification constants
 */
export const getBSPConstants = () => GEOMETRY_CONFIG.bsp;

/**
 * Get performance thresholds
 */
export const getPerformanceThresholds = () => GEOMETRY_CONFIG.performance;

/**
 * Validate if triangle count is within limits
 */
export const isTriangleCountValid = (count: number): boolean => {
  return count <= GEOMETRY_CONFIG.performance.maxTriangles;
};

/**
 * Validate if polygon count is within limits
 */
export const isPolygonCountValid = (count: number): boolean => {
  return count <= GEOMETRY_CONFIG.performance.maxPolygons;
};

/**
 * Validate if vertex count is within limits
 */
export const isVertexCountValid = (count: number): boolean => {
  return count <= GEOMETRY_CONFIG.performance.maxVertices;
};
