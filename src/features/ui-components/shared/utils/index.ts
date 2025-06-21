/**
 * Shared utility functions for UI components
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { clsx } from 'clsx';

// Re-export clsx
export { clsx };

/**
 * Utility function to combine class names conditionally
 * Re-export of clsx for consistency
 */
export const cn = clsx;

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Extract line number from error message
 */
export function extractLineNumber(message: string): number | null {
  const match = message.match(/line\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract column number from error message
 */
export function extractColumnNumber(message: string): number | null {
  const match = message.match(/column\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
