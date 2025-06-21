/**
 * Parse Error Display Component
 * 
 * Enhanced error display component for OpenSCAD parse errors with line numbers,
 * syntax highlighting, and helpful suggestions for common errors.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import React from 'react';
import { clsx } from '../utils';

export interface ParseError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly severity: 'error' | 'warning';
}

export interface ParseErrorDisplayProps {
  readonly errors: readonly ParseError[];
  readonly onErrorClick?: ((error: ParseError) => void) | undefined;
  readonly maxErrors?: number;
  readonly showLineNumbers?: boolean;
  readonly showSuggestions?: boolean;
  readonly className?: string;
}

/**
 * Enhanced parse error display with line numbers and helpful suggestions
 */
export const ParseErrorDisplay: React.FC<ParseErrorDisplayProps> = ({
  errors,
  onErrorClick,
  maxErrors = 5,
  showLineNumbers = true,
  showSuggestions = true,
  className
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  const displayErrors = errors.slice(0, maxErrors);
  const hasMoreErrors = errors.length > maxErrors;

  return (
    <div className={clsx(
      'bg-red-50 border border-red-200 rounded-lg p-4',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-red-800 font-semibold">
          {errors.length === 1 ? '1 Parse Error' : `${errors.length} Parse Errors`}
        </h3>
      </div>

      {/* Error List */}
      <div className="space-y-3">
        {displayErrors.map((error, index) => (
          <ParseErrorItem
            key={index}
            error={error}
            onClick={onErrorClick}
            showLineNumbers={showLineNumbers}
            showSuggestions={showSuggestions}
          />
        ))}
      </div>

      {/* More errors indicator */}
      {hasMoreErrors && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-sm text-red-600">
            ... and {errors.length - maxErrors} more error{errors.length - maxErrors !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Individual parse error item component
 */
interface ParseErrorItemProps {
  readonly error: ParseError;
  readonly onClick?: (error: ParseError) => void;
  readonly showLineNumbers: boolean;
  readonly showSuggestions: boolean;
}

const ParseErrorItem: React.FC<ParseErrorItemProps> = ({
  error,
  onClick,
  showLineNumbers,
  showSuggestions
}) => {
  const suggestion = showSuggestions ? getErrorSuggestion(error.message) : null;
  const isClickable = !!onClick;

  return (
    <div className={clsx(
      'bg-white rounded border border-red-200 p-3',
      isClickable && 'cursor-pointer hover:bg-red-50 transition-colors'
    )}>
      {/* Error header with line/column info */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          {showLineNumbers && (
            <div className="text-xs text-red-600 font-mono mb-1">
              Line {error.line}, Column {error.column}
            </div>
          )}
          <button
            type="button"
            className={clsx(
              'text-left text-sm text-red-800 font-medium',
              isClickable && 'hover:text-red-900 underline'
            )}
            onClick={() => onClick?.(error)}
            disabled={!isClickable}
          >
            {error.message}
          </button>
        </div>
        
        {/* Severity badge */}
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded',
          error.severity === 'error' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-yellow-100 text-yellow-800'
        )}>
          {error.severity}
        </span>
      </div>

      {/* Error suggestion */}
      {suggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-xs font-medium text-blue-800 mb-1">Suggestion:</p>
              <p className="text-xs text-blue-700">{suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get helpful suggestion based on error message
 */
function getErrorSuggestion(message: string): string | null {
  const lowerMessage = message.toLowerCase();

  // Common syntax errors
  if (lowerMessage.includes('unexpected token') || lowerMessage.includes('syntax error')) {
    if (lowerMessage.includes(';')) {
      return 'Check for missing semicolons (;) at the end of statements.';
    }
    if (lowerMessage.includes('{') || lowerMessage.includes('}')) {
      return 'Check for missing or mismatched curly braces { }.';
    }
    if (lowerMessage.includes('(') || lowerMessage.includes(')')) {
      return 'Check for missing or mismatched parentheses ( ).';
    }
    return 'Check your syntax for missing punctuation or typos.';
  }

  // Missing semicolon
  if (lowerMessage.includes('missing') && lowerMessage.includes(';')) {
    return 'Add a semicolon (;) at the end of the statement.';
  }

  // Undefined variables/functions
  if (lowerMessage.includes('undefined') || lowerMessage.includes('not defined')) {
    return 'Check that all variables and functions are properly defined before use.';
  }

  // Invalid parameters
  if (lowerMessage.includes('parameter') || lowerMessage.includes('argument')) {
    return 'Check the function parameters - ensure correct number and types of arguments.';
  }

  // Module errors
  if (lowerMessage.includes('module')) {
    return 'Check module definition and usage - ensure modules are defined before being called.';
  }

  // Boolean operation errors
  if (lowerMessage.includes('union') || lowerMessage.includes('difference') || lowerMessage.includes('intersection')) {
    return 'Boolean operations require valid 3D objects as children.';
  }

  return null;
}

export default ParseErrorDisplay;
