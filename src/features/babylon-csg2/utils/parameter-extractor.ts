/**
 * @file Provides utility functions for safely extracting and validating parameters from OpenSCAD AST nodes.
 * @author Luciano Júnior
 */

import { ParameterValue, Vector3D } from '@holistic-stack/openscad-parser';

/**
 * Extracts a 3D vector from a parameter value.
 * If the value is a single number, it is used for all three components.
 * If the value is a vector, it is returned as is.
 * @param value The parameter value to extract the vector from.
 * @param defaultValue The default value to use if the parameter is undefined.
 * @returns A 3D vector.
 */
export const extractVector3 = (
  value: ParameterValue | undefined,
  defaultValue: Vector3D = [1, 1, 1]
): Vector3D => {
  if (typeof value === 'number') {
    return [value, value, value];
  }
  if (Array.isArray(value)) {
    return value as Vector3D;
  }
  return defaultValue;
};
