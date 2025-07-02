/**
 * @file Simple AST Validator Implementation
 *
 * Simplified AST validation for OpenSCAD constructs focusing on essential
 * validation rules and error reporting.
 *
 * Following TypeScript 5.8, DRY, and SRP principles.
 */

import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/utils/functional/result.js';
import { error, success } from '../../../../shared/utils/functional/result.js';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  DifferenceNode,
  FunctionDefinitionNode,
  ModuleDefinitionNode,
  SourceLocation,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../ast-types.js';

const _logger = createLogger('SimpleValidator');

/**
 * Validation error with source location information
 */
export interface ValidationError {
  readonly message: string;
  readonly location?: SourceLocation;
  readonly severity: 'error' | 'warning' | 'info';
  readonly code: string;
}

/**
 * Validation result containing validated AST and any issues found
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationError[];
  readonly validatedAST: ASTNode[];
}

/**
 * Simplified AST validator for OpenSCAD constructs
 * Provides essential validation and error reporting
 */
export class SimpleValidator {
  private readonly logger = createLogger('SimpleValidator');

  constructor() {
    this.logger.debug('SimpleValidator initialized');
  }

  /**
   * Validate an array of AST nodes
   * @param nodes - AST nodes to validate
   * @returns Validation result with errors and warnings
   */
  validateAST(nodes: ASTNode[]): Result<ValidationResult, ValidationError> {
    this.logger.debug(`Starting validation of ${nodes.length} AST nodes`);

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Validate each node
      for (const node of nodes) {
        this.validateNode(node, errors, warnings);
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAST: nodes,
      };

      this.logger.debug(
        `Validation completed: ${result.isValid ? 'VALID' : 'INVALID'} (${errors.length} errors, ${warnings.length} warnings)`
      );

      return success(result);
    } catch (err) {
      const validationError: ValidationError = {
        message: `Validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error',
        code: 'VALIDATION_FAILURE',
      };

      this.logger.error(`Validation failed: ${validationError.message}`);
      return error(validationError);
    }
  }

  /**
   * Validate a single AST node
   * @param node - AST node to validate
   * @param errors - Array to collect errors
   * @param warnings - Array to collect warnings
   */
  private validateNode(
    node: ASTNode,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    this.logger.debug(`Validating node: ${node.type}`);

    switch (node.type) {
      case 'cube':
        this.validateCube(node as CubeNode, errors, warnings);
        break;
      case 'sphere':
        this.validateSphere(node as SphereNode, errors, warnings);
        break;
      case 'cylinder':
        this.validateCylinder(node as CylinderNode, errors, warnings);
        break;
      case 'translate':
        this.validateTranslate(node as TranslateNode, errors, warnings);
        break;
      case 'union':
        this.validateUnion(node as UnionNode, errors, warnings);
        break;
      case 'difference':
        this.validateDifference(node as DifferenceNode, errors, warnings);
        break;
      case 'module_definition':
        this.validateModuleDefinition(node as ModuleDefinitionNode, errors, warnings);
        break;
      case 'function_definition':
        this.validateFunctionDefinition(node as FunctionDefinitionNode, errors, warnings);
        break;
      default:
        this.addWarning(
          warnings,
          `Unknown node type: ${node.type}`,
          'UNKNOWN_NODE_TYPE',
          node.location
        );
    }

    // Recursively validate children if they exist
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.validateNode(child, errors, warnings);
      }
    }

    // Recursively validate body if it exists
    if ('body' in node && Array.isArray(node.body)) {
      for (const bodyNode of node.body) {
        this.validateNode(bodyNode, errors, warnings);
      }
    }
  }

  /**
   * Validate cube primitive
   */
  private validateCube(
    node: CubeNode,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    if (typeof node.size === 'number') {
      if (node.size <= 0) {
        this.addError(errors, 'Cube size must be positive', 'INVALID_CUBE_SIZE', node.location);
      }
    } else if (Array.isArray(node.size)) {
      if (node.size.length !== 3) {
        this.addError(
          errors,
          'Cube size vector must have exactly 3 components',
          'INVALID_CUBE_SIZE_VECTOR',
          node.location
        );
      }
    }
  }

  /**
   * Validate sphere primitive
   */
  private validateSphere(
    node: SphereNode,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    if (typeof node.r === 'number' && node.r <= 0) {
      this.addError(
        errors,
        'Sphere radius must be positive',
        'INVALID_SPHERE_RADIUS',
        node.location
      );
    }
  }

  /**
   * Validate cylinder primitive
   */
  private validateCylinder(
    node: CylinderNode,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    if (typeof node.h === 'number' && node.h <= 0) {
      this.addError(
        errors,
        'Cylinder height must be positive',
        'INVALID_CYLINDER_HEIGHT',
        node.location
      );
    }
  }

  /**
   * Validate translate transformation
   */
  private validateTranslate(
    node: TranslateNode,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    if (!Array.isArray(node.v) || node.v.length !== 3) {
      this.addError(
        errors,
        'Translate vector must have exactly 3 components',
        'INVALID_TRANSLATE_VECTOR',
        node.location
      );
    }
  }

  /**
   * Validate union CSG operation
   */
  private validateUnion(
    node: UnionNode,
    _errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (node.children.length === 0) {
      this.addWarning(warnings, 'Union operation has no children', 'EMPTY_UNION', node.location);
    }
  }

  /**
   * Validate difference CSG operation
   */
  private validateDifference(
    node: DifferenceNode,
    _errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (node.children.length === 0) {
      this.addWarning(
        warnings,
        'Difference operation has no children',
        'EMPTY_DIFFERENCE',
        node.location
      );
    }
  }

  /**
   * Validate module definition
   */
  private validateModuleDefinition(
    node: ModuleDefinitionNode,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    // Validate parameters are unique
    const paramSet = new Set<string>();
    for (const param of node.parameters || []) {
      if (paramSet.has(param)) {
        this.addError(
          errors,
          `Duplicate parameter name: ${param}`,
          'DUPLICATE_MODULE_PARAMETER',
          node.location
        );
      }
      paramSet.add(param);
    }
  }

  /**
   * Validate function definition
   */
  private validateFunctionDefinition(
    node: FunctionDefinitionNode,
    errors: ValidationError[],
    _warnings: ValidationError[]
  ): void {
    // Validate parameters are unique
    const paramSet = new Set<string>();
    for (const param of node.parameters || []) {
      if (paramSet.has(param)) {
        this.addError(
          errors,
          `Duplicate parameter name: ${param}`,
          'DUPLICATE_FUNCTION_PARAMETER',
          node.location
        );
      }
      paramSet.add(param);
    }
  }

  /**
   * Add validation error
   */
  private addError(
    errors: ValidationError[],
    message: string,
    code: string,
    location?: SourceLocation
  ): void {
    const validationError: ValidationError = {
      message,
      code,
      severity: 'error',
      ...(location && { location }),
    };
    errors.push(validationError);
    this.logger.error(`Validation error [${code}]: ${message}`);
  }

  /**
   * Add validation warning
   */
  private addWarning(
    warnings: ValidationError[],
    message: string,
    code: string,
    location?: SourceLocation
  ): void {
    const warning: ValidationError = {
      message,
      code,
      severity: 'warning',
      ...(location && { location }),
    };
    warnings.push(warning);
    this.logger.warn(`Validation warning [${code}]: ${message}`);
  }
}
