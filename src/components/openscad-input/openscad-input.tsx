/**
 * @file OpenSCAD Input Component
 * 
 * A focused component for handling OpenSCAD code input with syntax validation.
 * Follows SRP by handling only input concerns and basic validation.
 */
import React, { useCallback, useState, useEffect } from 'react';
import { OpenSCADInputProps, OpenSCADValidationResult } from '../../types/pipeline-types';
import './openscad-input.css';

/**
 * OpenSCAD code input component with basic validation
 * 
 * Features:
 * - Syntax-highlighted textarea (basic)
 * - Real-time validation
 * - Example code snippets
 * - Proper accessibility
 */
export function OpenSCADInput({ 
  value, 
  onChange, 
  disabled = false, 
  onValidate 
}: OpenSCADInputProps): React.JSX.Element {
  console.log('[INIT] OpenSCADInput component rendering');
  
  const [validationResult, setValidationResult] = useState<OpenSCADValidationResult>({ valid: true });

  // Basic OpenSCAD syntax validation
  const validateOpenSCAD = useCallback((code: string): OpenSCADValidationResult => {
    console.log('[DEBUG] Validating OpenSCAD code, length:', code.length);
    
    const errors: string[] = [];
    
    // Basic syntax checks
    if (code.trim().length === 0) {
      return { valid: true }; // Empty code is valid
    }
    
    // Check for basic bracket matching
    const openBrackets = (code.match(/\{/g) || []).length;
    const closeBrackets = (code.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Mismatched curly brackets');
    }
    
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Mismatched parentheses');
    }
    
    const openSquare = (code.match(/\[/g) || []).length;
    const closeSquare = (code.match(/\]/g) || []).length;
    if (openSquare !== closeSquare) {
      errors.push('Mismatched square brackets');
    }
    
    // Check for basic OpenSCAD keywords
    const hasValidKeywords = /\b(cube|sphere|cylinder|translate|rotate|scale|union|difference|intersection)\b/.test(code);
    if (!hasValidKeywords && code.trim().length > 0) {
      errors.push('No recognized OpenSCAD operations found');
    }
      const result: OpenSCADValidationResult = errors.length === 0 
      ? { valid: true } 
      : { valid: false, errors };
    console.log('[DEBUG] Validation result:', result);
    return result;
  }, []);

  // Validate on code change
  useEffect(() => {
    const result = validateOpenSCAD(value);
    setValidationResult(result);
    onValidate?.(result);
  }, [value, validateOpenSCAD, onValidate]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    console.log('[DEBUG] OpenSCAD input changed');
    onChange(newValue);
  }, [onChange]);

  const handleExampleSelect = useCallback((example: string) => {
    console.log('[DEBUG] Example selected:', example.substring(0, 20) + '...');
    onChange(example);
  }, [onChange]);

  const examples = [
    {
      name: 'Simple Cube',
      code: 'cube([10, 10, 10]);'
    },
    {
      name: 'Sphere',
      code: 'sphere(5);'
    },
    {
      name: 'Cylinder',
      code: 'cylinder(h=10, r=3);'
    },
    {
      name: 'Union Example',
      code: 'union() {\n  cube([10, 10, 10]);\n  translate([15, 0, 0])\n    sphere(5);\n}'
    },
    {
      name: 'Difference Example',
      code: 'difference() {\n  cube([20, 20, 20]);\n  translate([10, 10, 10])\n    sphere(8);\n}'
    }
  ];

  return (
    <div className="openscad-input">
      <div className="openscad-input-header">
        <label htmlFor="openscad-code" className="openscad-input-label">
          OpenSCAD Code
        </label>
        
        <div className="example-buttons">
          <span className="example-label">Examples:</span>
          {examples.map((example) => (
            <button
              key={example.name}
              type="button"
              className="example-button"
              onClick={() => handleExampleSelect(example.code)}
              disabled={disabled}
              title={`Load ${example.name} example`}
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>

      <textarea
        id="openscad-code"
        data-testid="openscad-editor"
        className={`openscad-textarea ${validationResult.valid ? 'valid' : 'invalid'}`}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Enter OpenSCAD code here..."
        rows={15}
        spellCheck={false}
        aria-describedby={validationResult.valid ? undefined : 'validation-errors'}
      />

      {!validationResult.valid && (
        <div id="validation-errors" className="validation-errors" role="alert">
          <h4 className="validation-title">Syntax Issues:</h4>
          <ul className="validation-list">
            {validationResult.errors.map((error, index) => (
              <li key={index} className="validation-error">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="input-info">
        <span className="char-count">
          {value.length} characters
        </span>
        {validationResult.valid && value.trim().length > 0 && (
          <span className="status-indicator valid">✓ Valid syntax</span>
        )}
      </div>
    </div>
  );
}
