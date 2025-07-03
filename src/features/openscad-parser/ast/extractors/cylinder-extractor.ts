import { type Node as SyntaxNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { extractArguments } from './argument-extractor.js';
import {
  extractNumberParameter,
  extractBooleanParameter,
} from './parameter-extractor.js';
import { getLocation } from '../utils/location-utils.js';
import { ErrorHandler } from '../../error-handling/index.js';

/**
 * Extracts parameters for a cylinder node from a CST node.
 *
 * Cylinder syntax variations:
 * cylinder(h, r|d, center);
 * cylinder(h, r1|d1, r2|d2, center);
 * cylinder(h=val, r=val|d=val, center=val);
 * cylinder(h=val, r1=val|d1=val, r2=val|d2=val, center=val);
 * Special params: $fa, $fs, $fn
 *
 * @param node The CST node representing the cylinder call.
 * @returns An AST CylinderNode or null if extraction fails.
 */
export function extractCylinderNode(node: SyntaxNode, errorHandler?: ErrorHandler, sourceCode?: string): ast.CylinderNode | null {
  if (node.type !== 'call_expression' && node.type !== 'module_call') {
    return null;
  }

  const location = getLocation(node);
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    // 'h' is mandatory, and without an argsNode, it cannot be provided.
    return null;
  }

  const params = extractArguments(argsNode, errorHandler, sourceCode);

  let h: number | undefined;
  let r: number | undefined;
  let d: number | undefined;
  let r1: number | undefined;
  let r2: number | undefined;
  let d1: number | undefined;
  let d2: number | undefined;
  let center: boolean | undefined;
  let $fn: number | undefined;
  let $fa: number | undefined;
  let $fs: number | undefined;

  // Process named arguments first
  for (const param of params) {
    if (param.name) {
      switch (param.name) {
        case 'h':
          h = extractNumberParameter(param) ?? undefined;
          break;
        case 'r':
          r = extractNumberParameter(param) ?? undefined;
          break;
        case 'd':
          d = extractNumberParameter(param) ?? undefined;
          break;
        case 'r1':
          r1 = extractNumberParameter(param) ?? undefined;
          break;
        case 'r2':
          r2 = extractNumberParameter(param) ?? undefined;
          break;
        case 'd1':
          d1 = extractNumberParameter(param) ?? undefined;
          break;
        case 'd2':
          d2 = extractNumberParameter(param) ?? undefined;
          break;
        case 'center':
          center = extractBooleanParameter(param) ?? undefined;
          break;
        case '$fn':
          $fn = extractNumberParameter(param) ?? undefined;
          break;
        case '$fa':
          $fa = extractNumberParameter(param) ?? undefined;
          break;
        case '$fs':
          $fs = extractNumberParameter(param) ?? undefined;
          break;
      }
    }
  }

  // Implement positional argument handling
  const positionalArgs = params.filter(p => !p.name);
  let currentPositionalIndex = 0;

  // 1. Positional 'h'
  if (h === undefined && positionalArgs.length > currentPositionalIndex) {
    const param = positionalArgs[currentPositionalIndex];
    if (param) {
      const val = extractNumberParameter(param);
      if (val !== null) {
        h = val;
        currentPositionalIndex++;
      }
    }
  }

  // 2. Positional 'r1' & 'r2' OR 'r'
  // Check for r1, r2 pattern first (two consecutive numbers)
  if (
    r1 === undefined &&
    r2 === undefined &&
    r === undefined && // Only if no radius-like param already set by name
    positionalArgs.length > currentPositionalIndex + 1
  ) {
    const potential_r1_param = positionalArgs[currentPositionalIndex];
    const potential_r2_param = positionalArgs[currentPositionalIndex + 1];
    if (potential_r1_param && potential_r2_param) {
      const val_r1 = extractNumberParameter(potential_r1_param);
      const val_r2 = extractNumberParameter(potential_r2_param);

      if (val_r1 !== null && val_r2 !== null) {
        r1 = val_r1;
        r2 = val_r2;
        currentPositionalIndex += 2;
      }
    }
  }

  // If r1,r2 pattern didn't match or apply, check for single 'r'
  if (
    r === undefined &&
    r1 === undefined && // only if r is not set and r1 is not set (r2 might be set if r1 was named)
    positionalArgs.length > currentPositionalIndex
  ) {
    // If r1 was set (either by name or above), this positional arg is not r.
    // If r1 is undefined, then this could be r.
    const param = positionalArgs[currentPositionalIndex];
    if (param) {
      const val = extractNumberParameter(param);
      if (val !== null) {
        // If r2 is defined (e.g. named r2= or positional r1,r2), this can't be r for cylinder(h,r,center)
        // This logic is tricky. Standard OpenSCAD: cylinder(h,r) or cylinder(h,r1,r2).
        // If we are here, it means r1,r2 as a pair was not matched positionally.
        // So, if this is a number, it's 'r'.
        r = val;
        currentPositionalIndex++;
      }
    }
  }

  // 3. Positional 'center'
  if (center === undefined && positionalArgs.length > currentPositionalIndex) {
    const param = positionalArgs[currentPositionalIndex];
    if (param) {
      const val = extractBooleanParameter(param);
      if (val !== null) {
        center = val;
        currentPositionalIndex++;
      }
    }
  }

  // Basic validation: 'h' is mandatory for a cylinder.
  // After all attempts (named and positional), if h is still undefined or not a number, it's invalid.
  if (typeof h !== 'number') {
    return null;
  }

  // Construct the CylinderNode
  const cylinderNode: ast.CylinderNode = {
    type: 'cylinder',
    h: h, // h is now guaranteed to be a number.
    location,
  };

  if (r !== undefined) cylinderNode.r = r;
  if (d !== undefined) cylinderNode.d = d;
  if (r1 !== undefined) cylinderNode.r1 = r1;
  if (r2 !== undefined) cylinderNode.r2 = r2;
  if (d1 !== undefined) cylinderNode.d1 = d1;
  if (d2 !== undefined) cylinderNode.d2 = d2;
  if (center !== undefined) cylinderNode.center = center;
  if ($fn !== undefined) cylinderNode.$fn = $fn;
  if ($fa !== undefined) cylinderNode.$fa = $fa;
  if ($fs !== undefined) cylinderNode.$fs = $fs;

  // Logic for deriving r from d, r1 from d1, etc.
  if (d !== undefined && r === undefined) {
    cylinderNode.r = d / 2;
    // If d is given, it implies r1 and r2 are also d/2 if not otherwise specified
    if (r1 === undefined) cylinderNode.r1 = d / 2;
    if (r2 === undefined) cylinderNode.r2 = d / 2;
  }
  if (d1 !== undefined && r1 === undefined) {
    cylinderNode.r1 = d1 / 2;
  }
  if (d2 !== undefined && r2 === undefined) {
    cylinderNode.r2 = d2 / 2;
  }

  // If r is given, and r1/r2 are not, then r1 and r2 default to r.
  if (r !== undefined) {
    if (r1 === undefined) cylinderNode.r1 = r;
    if (r2 === undefined) cylinderNode.r2 = r;
  }

  // If only one of r1 or r2 is defined, the other defaults to it (OpenSCAD behavior for cylinder(r,h))
  // This is implicitly handled if r is defined, as r1 and r2 take r's value.
  // If r is not defined, but one of r1/r2 is, this needs specific handling.
  // However, standard cylinder calls are (h,r) or (h,r1,r2). (h,r1) is not standard.
  // Let's stick to named parameters and documented positional ones for now.

  return cylinderNode;
}
