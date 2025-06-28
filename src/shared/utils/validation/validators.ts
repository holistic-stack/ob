/**
 * Validation Utilities
 *
 * Pure functional validators for form validation, data validation,
 * and input sanitization following functional programming patterns.
 */

import type { ValidationRule } from "../../types/common.types";
import type { ValidationResult } from "../../types/result.types";
import { success, error, validate } from "../functional/result";

/**
 * Basic validation functions
 */
export const required = (message = "This field is required") => {
  return <T>(value: T): string | null => {
    if (value === null || value === undefined || value === "") {
      return message;
    }
    return null;
  };
};

export const minLength = (min: number, message?: string) => {
  return (value: string): string | null => {
    if (value.length < min) {
      return message ?? `Must be at least ${min} characters`;
    }
    return null;
  };
};

export const maxLength = (max: number, message?: string) => {
  return (value: string): string | null => {
    if (value.length > max) {
      return message ?? `Must be no more than ${max} characters`;
    }
    return null;
  };
};

export const pattern = (regex: RegExp, message?: string) => {
  return (value: string): string | null => {
    if (!regex.test(value)) {
      return message ?? "Invalid format";
    }
    return null;
  };
};

export const email = (message = "Invalid email address") => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern(emailRegex, message);
};

export const url = (message = "Invalid URL") => {
  return (value: string): string | null => {
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  };
};

/**
 * Numeric validation functions
 */
export const min = (minimum: number, message?: string) => {
  return (value: number): string | null => {
    if (value < minimum) {
      return message ?? `Must be at least ${minimum}`;
    }
    return null;
  };
};

export const max = (maximum: number, message?: string) => {
  return (value: number): string | null => {
    if (value > maximum) {
      return message ?? `Must be no more than ${maximum}`;
    }
    return null;
  };
};

export const integer = (message = "Must be an integer") => {
  return (value: number): string | null => {
    if (!Number.isInteger(value)) {
      return message;
    }
    return null;
  };
};

export const positive = (message = "Must be positive") => {
  return (value: number): string | null => {
    if (value <= 0) {
      return message;
    }
    return null;
  };
};

export const negative = (message = "Must be negative") => {
  return (value: number): string | null => {
    if (value >= 0) {
      return message;
    }
    return null;
  };
};

/**
 * Array validation functions
 */
export const minItems = <T>(minimum: number, message?: string) => {
  return (value: ReadonlyArray<T>): string | null => {
    if (value.length < minimum) {
      return message ?? `Must have at least ${minimum} items`;
    }
    return null;
  };
};

export const maxItems = <T>(maximum: number, message?: string) => {
  return (value: ReadonlyArray<T>): string | null => {
    if (value.length > maximum) {
      return message ?? `Must have no more than ${maximum} items`;
    }
    return null;
  };
};

export const uniqueItems = <T>(message = "Items must be unique") => {
  return (value: ReadonlyArray<T>): string | null => {
    const unique = new Set(value);
    if (unique.size !== value.length) {
      return message;
    }
    return null;
  };
};

/**
 * Object validation functions
 */
export const hasProperty = <T extends Record<string, unknown>>(
  property: keyof T,
  message?: string,
) => {
  return (value: T): string | null => {
    if (!(property in value)) {
      return message ?? `Missing required property: ${String(property)}`;
    }
    return null;
  };
};

export const propertyType = <T extends Record<string, unknown>>(
  property: keyof T,
  expectedType: string,
  message?: string,
) => {
  return (value: T): string | null => {
    const actualType = typeof value[property];
    if (actualType !== expectedType) {
      return (
        message ??
        `Property ${String(property)} must be of type ${expectedType}`
      );
    }
    return null;
  };
};

/**
 * Conditional validation functions
 */
export const whenInvalid = <T>(
  condition: (value: T) => boolean,
  validator: (value: T) => string | null,
) => {
  return (value: T): string | null => {
    if (condition(value)) {
      return validator(value);
    }
    return null;
  };
};

export const unlessValid = <T>(
  condition: (value: T) => boolean,
  validator: (value: T) => string | null,
) => {
  return (value: T): string | null => {
    if (!condition(value)) {
      return validator(value);
    }
    return null;
  };
};

/**
 * Composite validation functions
 */
export const oneOf = <T>(
  validators: ReadonlyArray<(value: T) => string | null>,
  message = "Must satisfy at least one condition",
) => {
  return (value: T): string | null => {
    for (const validator of validators) {
      if (validator(value) === null) {
        return null;
      }
    }
    return message;
  };
};

export const allOf = <T>(
  validators: ReadonlyArray<(value: T) => string | null>,
) => {
  return (value: T): string | null => {
    for (const validator of validators) {
      const result = validator(value);
      if (result !== null) {
        return result;
      }
    }
    return null;
  };
};

/**
 * OpenSCAD-specific validators
 */
export const openscadIdentifier = (message = "Invalid OpenSCAD identifier") => {
  const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return pattern(identifierRegex, message);
};

export const openscadNumber = (message = "Invalid OpenSCAD number") => {
  return (value: string): string | null => {
    const numberRegex = /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
    if (!numberRegex.test(value.trim())) {
      return message;
    }
    return null;
  };
};

export const openscadVector = (dimensions: number, message?: string) => {
  return (value: string): string | null => {
    const vectorRegex =
      /^\[\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\s*(?:,\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\s*)*\]$/;
    const match = value.trim().match(vectorRegex);

    if (!match) {
      return message ?? "Invalid vector format";
    }

    const components = value
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    if (components.length !== dimensions) {
      return message ?? `Vector must have exactly ${dimensions} components`;
    }

    return null;
  };
};

/**
 * File validation functions
 */
export const fileExtension = (
  extensions: ReadonlyArray<string>,
  message?: string,
) => {
  return (filename: string): string | null => {
    const ext = filename.toLowerCase().split(".").pop();
    if (!ext || !extensions.includes(ext)) {
      return (
        message ??
        `File must have one of these extensions: ${extensions.join(", ")}`
      );
    }
    return null;
  };
};

export const fileSize = (maxSizeBytes: number, message?: string) => {
  return (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      return message ?? `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };
};

/**
 * Validation schema builder
 */
export const createValidationSchema = <T>(
  rules: ReadonlyArray<ValidationRule<T>>,
): ((value: T) => ValidationResult<T>) => {
  return (value: T) => {
    return validate(
      value,
      rules.map((rule) => rule.validate),
    );
  };
};

/**
 * Form validation utilities
 */
export const validateField = <T>(
  value: T,
  validators: ReadonlyArray<(value: T) => string | null>,
): ValidationResult<T> => {
  return validate(value, validators);
};

export const validateForm = <T extends Record<string, unknown>>(
  values: T,
  schema: Record<keyof T, ReadonlyArray<(value: unknown) => string | null>>,
): ValidationResult<T> => {
  const errors: string[] = [];

  for (const [field, validators] of Object.entries(schema)) {
    const fieldValue = values[field as keyof T];
    const fieldResult = validateField(fieldValue, validators);

    if (!fieldResult.success) {
      errors.push(...fieldResult.error.map((err) => `${field}: ${err}`));
    }
  }

  if (errors.length > 0) {
    return error(Object.freeze(errors));
  }

  return success(values);
};
