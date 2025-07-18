/**
 * @file Progress Bar Component Tests
 *
 * Tests for the ProgressBar component following TDD principles.
 * Tests rendering, interaction, and integration with progress operations.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type {
  ProgressOperation,
  ProgressOperationConfig,
  ProgressState,
} from '../../services/progress/progress.service';
import { ProgressBar } from './progress-bar';

/**
 * Mock progress operation factory for testing
 *
 * Creates a complete ProgressOperation with sensible defaults and allows
 * partial overrides for specific test scenarios.
 *
 * @param overrides - Partial overrides for config and state
 * @returns Complete ProgressOperation for testing
 *
 * @example
 * ```typescript
 * // Create operation with default values
 * const operation = createMockOperation();
 *
 * // Override specific state properties
 * const completedOperation = createMockOperation({
 *   state: { isCompleted: true, percentage: 100 }
 * });
 *
 * // Override config properties
 * const cancellableOperation = createMockOperation({
 *   config: { cancellable: true, title: 'Custom Title' }
 * });
 * ```
 */
const createMockOperation = (
  overrides: {
    config?: Partial<ProgressOperationConfig>;
    state?: Partial<ProgressState>;
    id?: string;
    abortController?: AbortController;
  } = {}
): ProgressOperation => {
  const defaultConfig: ProgressOperationConfig = {
    type: 'parsing' as const,
    title: 'Test Operation',
    total: 100,
    cancellable: false,
  };

  const defaultState: ProgressState = {
    current: 0,
    total: 100 as number | undefined,
    percentage: 0,
    stage: undefined as string | undefined,
    message: undefined as string | undefined,
    isIndeterminate: false,
    isCompleted: false,
    isCancelled: false,
    error: undefined as string | undefined,
    startTime: new Date(),
    estimatedTimeRemaining: undefined as number | undefined,
  };

  return {
    id: overrides.id ?? 'test-operation',
    config: { ...defaultConfig, ...overrides.config },
    state: { ...defaultState, ...overrides.state },
    abortController: overrides.abortController,
  };
};

describe('ProgressBar', () => {
  describe('Basic Rendering', () => {
    it('should render with manual props', () => {
      render(
        <ProgressBar percentage={50} title="Manual Progress" description="Test description" />
      );

      expect(screen.getByText('Manual Progress')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render with operation data', () => {
      const operation = createMockOperation({
        config: {
          type: 'parsing',
          title: 'Operation Title',
        },
        state: {
          current: 75,
          total: 100,
          percentage: 75,
          message: 'Operation message',
        },
      });

      render(<ProgressBar operation={operation} />);

      expect(screen.getByText('Operation Title')).toBeInTheDocument();
      expect(screen.getByText('Operation message')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should prioritize operation data over props', () => {
      const operation = createMockOperation({
        config: { title: 'Operation Title' },
        state: { percentage: 60 },
      });

      render(<ProgressBar operation={operation} percentage={30} title="Prop Title" />);

      expect(screen.getByText('Operation Title')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.queryByText('Prop Title')).not.toBeInTheDocument();
      expect(screen.queryByText('30%')).not.toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should show determinate progress', () => {
      render(<ProgressBar percentage={75} title="Determinate Progress" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should show indeterminate progress', () => {
      render(
        <ProgressBar isIndeterminate={true} title="Indeterminate Progress" showPercentage={false} />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).not.toHaveAttribute('aria-valuenow');
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('should handle percentage bounds correctly', () => {
      const { rerender } = render(
        <ProgressBar percentage={-10} title="Test Progress" showPercentage={true} />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();

      rerender(<ProgressBar percentage={150} title="Test Progress" showPercentage={true} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      render(<ProgressBar size="sm" title="Small Progress" data-testid="small-progress" />);

      const container = screen.getByTestId('small-progress');
      expect(container.querySelector('.h-2')).toBeInTheDocument();
      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });

    it('should apply medium size classes (default)', () => {
      render(<ProgressBar title="Medium Progress" data-testid="medium-progress" />);

      const container = screen.getByTestId('medium-progress');
      expect(container.querySelector('.h-3')).toBeInTheDocument();
      expect(container.querySelector('.text-sm')).toBeInTheDocument();
    });

    it('should apply large size classes', () => {
      render(<ProgressBar size="lg" title="Large Progress" data-testid="large-progress" />);

      const container = screen.getByTestId('large-progress');
      expect(container.querySelector('.h-4')).toBeInTheDocument();
      expect(container.querySelector('.text-base')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should apply blue color (default)', () => {
      render(<ProgressBar title="Blue Progress" data-testid="blue-progress" />);

      const container = screen.getByTestId('blue-progress');
      expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
    });

    it('should apply green color', () => {
      render(<ProgressBar color="green" title="Green Progress" data-testid="green-progress" />);

      const container = screen.getByTestId('green-progress');
      expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
      expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
    });

    it('should apply red color for errors', () => {
      const operation = createMockOperation({
        state: { error: 'Something went wrong' },
      });

      render(<ProgressBar operation={operation} data-testid="error-progress" />);

      const container = screen.getByTestId('error-progress');
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
      expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
    });

    it('should apply green color for completed operations', () => {
      const operation = createMockOperation({
        state: { isCompleted: true, percentage: 100 },
      });

      render(<ProgressBar operation={operation} data-testid="completed-progress" />);

      const container = screen.getByTestId('completed-progress');
      expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should apply gray color for cancelled operations', () => {
      const operation = createMockOperation({
        state: { isCancelled: true },
      });

      render(<ProgressBar operation={operation} data-testid="cancelled-progress" />);

      const container = screen.getByTestId('cancelled-progress');
      expect(container.querySelector('.bg-gray-500')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('Time Estimation', () => {
    it('should show time remaining', () => {
      const operation = createMockOperation({
        state: {
          percentage: 50,
          estimatedTimeRemaining: 30000, // 30 seconds
        },
      });

      render(<ProgressBar operation={operation} showTimeRemaining={true} />);

      expect(screen.getByText('30s remaining')).toBeInTheDocument();
    });

    it('should format minutes correctly', () => {
      const operation = createMockOperation({
        state: {
          percentage: 25,
          estimatedTimeRemaining: 90000, // 90 seconds = 1m 30s
        },
      });

      render(<ProgressBar operation={operation} showTimeRemaining={true} />);

      expect(screen.getByText('1m 30s remaining')).toBeInTheDocument();
    });

    it('should format hours correctly', () => {
      const operation = createMockOperation({
        state: {
          percentage: 10,
          estimatedTimeRemaining: 3900000, // 65 minutes = 1h 5m
        },
      });

      render(<ProgressBar operation={operation} showTimeRemaining={true} />);

      expect(screen.getByText('1h 5m remaining')).toBeInTheDocument();
    });

    it('should hide time remaining when disabled', () => {
      const operation = createMockOperation({
        state: {
          percentage: 50,
          estimatedTimeRemaining: 30000,
        },
      });

      render(<ProgressBar operation={operation} showTimeRemaining={false} />);

      expect(screen.queryByText('remaining')).not.toBeInTheDocument();
    });
  });

  describe('Cancellation', () => {
    it('should show cancel button for cancellable operations', () => {
      const operation = createMockOperation({
        config: { cancellable: true },
      });

      render(<ProgressBar operation={operation} showCancelButton={true} />);

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('should hide cancel button for non-cancellable operations', () => {
      const operation = createMockOperation({
        config: { cancellable: false },
      });

      render(<ProgressBar operation={operation} showCancelButton={true} />);

      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
    });

    it('should hide cancel button for completed operations', () => {
      const operation = createMockOperation({
        config: { cancellable: true },
        state: { isCompleted: true },
      });

      render(<ProgressBar operation={operation} showCancelButton={true} />);

      expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      const operation = createMockOperation({
        config: { cancellable: true },
      });

      render(<ProgressBar operation={operation} showCancelButton={true} onCancel={onCancel} />);

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ProgressBar percentage={60} title="Accessible Progress" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Accessible Progress');
    });

    it('should have proper cancel button accessibility', () => {
      const operation = createMockOperation({
        config: { cancellable: true },
      });

      render(<ProgressBar operation={operation} showCancelButton={true} />);

      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton).toHaveAttribute('aria-label', 'Cancel operation');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(
        <ProgressBar
          title="Custom Progress"
          className="custom-progress-class"
          data-testid="custom-progress"
        />
      );

      const container = screen.getByTestId('custom-progress');
      expect(container).toHaveClass('custom-progress-class');
    });

    it('should apply custom data-testid', () => {
      render(<ProgressBar title="Test Progress" data-testid="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing operation gracefully', () => {
      render(<ProgressBar />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle operation without state', () => {
      const incompleteOperation = createMockOperation({
        config: { type: 'parsing' as const, title: 'Test' },
        state: undefined as any, // Simulate missing state
      });

      render(<ProgressBar operation={incompleteOperation} />);

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should show percentage display toggle', () => {
      const { rerender } = render(<ProgressBar percentage={75} showPercentage={true} />);

      expect(screen.getByText('75%')).toBeInTheDocument();

      rerender(<ProgressBar percentage={75} showPercentage={false} />);

      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });
  });
});
