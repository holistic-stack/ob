/**
 * @file Error Display Component
 * 
 * A focused component for displaying pipeline errors with proper logging.
 * Follows SRP by handling only error display concerns.
 */
import React, { useEffect } from 'react';
import { ErrorDisplayProps } from '../../types/pipeline-types';
import './error-display.css';

/**
 * Error display component with structured error information
 * 
 * Features:
 * - Clear error messaging
 * - Detailed error information when available
 * - Dismissible interface
 * - Proper accessibility
 */
export function ErrorDisplay({ 
  error, 
  onClear, 
  details 
}: ErrorDisplayProps): React.JSX.Element {
  console.log('[INIT] ErrorDisplay component rendering for error:', error);

  useEffect(() => {
    console.error('[ERROR] Displaying error to user:', error);
    if (details) {
      console.error('[ERROR] Error details:', details);
    }
  }, [error, details]);

  const handleClear = () => {
    console.log('[DEBUG] User clearing error display');
    onClear();
  };

  const formatErrorDetails = (details: unknown): string => {
    if (typeof details === 'string') {
      return details;
    }
    if (details instanceof Error) {
      return details.message;
    }
    if (typeof details === 'object' && details !== null) {
      try {
        return JSON.stringify(details, null, 2);
      } catch {
        return String(details);
      }
    }
    return String(details);
  };

  return (
    <div className="error-display" role="alert" aria-live="polite">
      <div className="error-header">
        <div className="error-icon" aria-hidden="true">
          ⚠️
        </div>
        <h3 className="error-title">Pipeline Error</h3>
        <button
          type="button"
          className="error-close"
          onClick={handleClear}
          aria-label="Dismiss error"
          title="Close error message"
        >
          ✕
        </button>
      </div>

      <div className="error-content">
        <p className="error-message">{error}</p>        {details !== undefined && (
          <details className="error-details">
            <summary className="error-details-summary">
              Technical Details
            </summary>
            <pre className="error-details-content">
              {formatErrorDetails(details)}
            </pre>
          </details>
        )}
      </div>

      <div className="error-actions">
        <button
          type="button"
          className="error-action-button"
          onClick={handleClear}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
