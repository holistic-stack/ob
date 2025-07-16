/**
 * @file Progress Bar Component
 *
 * A flexible progress bar component for displaying operation progress.
 * Supports determinate and indeterminate progress with customizable styling.
 *
 * @example
 * ```tsx
 * // Basic usage with operation
 * <ProgressBar operation={progressOperation} />
 *
 * // Manual progress
 * <ProgressBar
 *   percentage={75}
 *   title="Processing..."
 *   showPercentage={true}
 * />
 *
 * // Indeterminate progress
 * <ProgressBar
 *   isIndeterminate={true}
 *   title="Loading..."
 * />
 * ```
 */

import type React from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type { ProgressOperation } from '../../services/progress/progress.service';

const logger = createLogger('ProgressBar');

/**
 * Progress bar size variants
 */
export type ProgressBarSize = 'sm' | 'md' | 'lg';

/**
 * Progress bar color variants
 */
export type ProgressBarColor = 'blue' | 'green' | 'yellow' | 'red' | 'gray';

/**
 * Progress bar props
 */
export interface ProgressBarProps {
  readonly operation?: ProgressOperation;
  readonly percentage?: number;
  readonly title?: string;
  readonly description?: string;
  readonly isIndeterminate?: boolean;
  readonly showPercentage?: boolean;
  readonly showTimeRemaining?: boolean;
  readonly showCancelButton?: boolean;
  readonly size?: ProgressBarSize;
  readonly color?: ProgressBarColor;
  readonly className?: string;
  readonly onCancel?: () => void;
  readonly 'data-testid'?: string;
}

/**
 * Format time remaining in human-readable format
 */
const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.ceil(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s remaining`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s remaining`
      : `${minutes}m remaining`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m remaining` : `${hours}h remaining`;
};

/**
 * Get size classes for progress bar
 */
const getSizeClasses = (
  size: ProgressBarSize
): { container: string; bar: string; text: string } => {
  switch (size) {
    case 'sm':
      return {
        container: 'h-2',
        bar: 'h-2',
        text: 'text-xs',
      };
    case 'md':
      return {
        container: 'h-3',
        bar: 'h-3',
        text: 'text-sm',
      };
    case 'lg':
      return {
        container: 'h-4',
        bar: 'h-4',
        text: 'text-base',
      };
    default:
      return getSizeClasses('md');
  }
};

/**
 * Get color classes for progress bar
 */
const getColorClasses = (color: ProgressBarColor): { bar: string; background: string } => {
  switch (color) {
    case 'blue':
      return {
        bar: 'bg-blue-500',
        background: 'bg-blue-100',
      };
    case 'green':
      return {
        bar: 'bg-green-500',
        background: 'bg-green-100',
      };
    case 'yellow':
      return {
        bar: 'bg-yellow-500',
        background: 'bg-yellow-100',
      };
    case 'red':
      return {
        bar: 'bg-red-500',
        background: 'bg-red-100',
      };
    case 'gray':
      return {
        bar: 'bg-gray-500',
        background: 'bg-gray-200',
      };
    default:
      return getColorClasses('blue');
  }
};

/**
 * Progress Bar Component
 *
 * Displays progress for long-running operations with support for
 * determinate and indeterminate progress, cancellation, and time estimates.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  operation,
  percentage: propPercentage,
  title: propTitle,
  description: propDescription,
  isIndeterminate: propIsIndeterminate,
  showPercentage = true,
  showTimeRemaining = true,
  showCancelButton = false,
  size = 'md',
  color = 'blue',
  className = '',
  onCancel,
  'data-testid': dataTestId = 'progress-bar',
}) => {
  // Extract values from operation or use props
  const rawPercentage = operation?.state?.percentage ?? propPercentage ?? 0;
  const percentage = Math.min(100, Math.max(0, rawPercentage));
  const title = operation?.config?.title ?? propTitle ?? 'Processing...';
  const description = operation?.state?.message ?? propDescription;
  const isIndeterminate = operation?.state?.isIndeterminate ?? propIsIndeterminate ?? false;
  const isCompleted = operation?.state?.isCompleted ?? false;
  const isCancelled = operation?.state?.isCancelled ?? false;
  const error = operation?.state?.error;
  const estimatedTimeRemaining = operation?.state?.estimatedTimeRemaining;
  const canCancel =
    operation?.config?.cancellable && showCancelButton && !isCompleted && !isCancelled;

  // Determine color based on state
  const effectiveColor = error ? 'red' : isCancelled ? 'gray' : isCompleted ? 'green' : color;

  const sizeClasses = getSizeClasses(size);
  const colorClasses = getColorClasses(effectiveColor);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (operation) {
      logger.debug(`[CANCEL] Cancel requested for operation: ${operation.id}`);
      // The parent component should handle cancellation through the progress hook
    }
  };

  return (
    <div className={`progress-bar ${className}`} data-testid={dataTestId}>
      {/* Header with title and actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 truncate ${sizeClasses.text}`}>{title}</h3>
          {description && (
            <p className={`text-gray-500 truncate ${sizeClasses.text}`}>{description}</p>
          )}
          {error && <p className={`text-red-600 truncate ${sizeClasses.text}`}>Error: {error}</p>}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {/* Percentage display */}
          {showPercentage && !isIndeterminate && (
            <span className={`font-mono text-gray-600 ${sizeClasses.text}`}>
              {Math.round(percentage)}%
            </span>
          )}

          {/* Time remaining */}
          {showTimeRemaining && estimatedTimeRemaining && !isCompleted && !isCancelled && (
            <span className={`text-gray-500 ${sizeClasses.text}`}>
              {formatTimeRemaining(estimatedTimeRemaining)}
            </span>
          )}

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={handleCancel}
              className={`text-gray-400 hover:text-gray-600 ${sizeClasses.text}`}
              aria-label="Cancel operation"
              data-testid="cancel-button"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={`w-full ${colorClasses.background} rounded-full overflow-hidden ${sizeClasses.container}`}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title}
      >
        {isIndeterminate ? (
          /* Indeterminate progress animation */
          <div
            className={`${sizeClasses.bar} ${colorClasses.bar} rounded-full animate-pulse`}
            style={{ width: '100%' }}
          />
        ) : (
          /* Determinate progress */
          <div
            className={`${sizeClasses.bar} ${colorClasses.bar} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        )}
      </div>

      {/* Status indicators */}
      {isCompleted && (
        <div className={`flex items-center mt-1 text-green-600 ${sizeClasses.text}`}>
          <span className="mr-1">✓</span>
          <span>Completed</span>
        </div>
      )}

      {isCancelled && (
        <div className={`flex items-center mt-1 text-gray-500 ${sizeClasses.text}`}>
          <span className="mr-1">✕</span>
          <span>Cancelled</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
