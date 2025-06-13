/**
 * @file Statistics Calculator
 * 
 * Pure functions for processing statistics calculations.
 * Following DRY and SOLID principles.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { ProcessingStats } from '../types/processing-types';

/**
 * Pure function to create initial processing stats
 */
export const createInitialStats = (): ProcessingStats => ({
  totalRuns: 0,
  successCount: 0,
  errorCount: 0,
  averageTime: 0
});

/**
 * Pure function to update processing stats
 * 
 * @param stats - Current statistics
 * @param processingTime - Time taken for the current operation
 * @param success - Whether the operation was successful
 * @returns Updated statistics
 */
export const updateProcessingStats = (
  stats: ProcessingStats,
  processingTime: number,
  success: boolean
): ProcessingStats => ({
  totalRuns: stats.totalRuns + 1,
  successCount: stats.successCount + (success ? 1 : 0),
  errorCount: stats.errorCount + (success ? 0 : 1),
  averageTime: (stats.averageTime * stats.totalRuns + processingTime) / (stats.totalRuns + 1)
});

/**
 * Pure function to calculate success rate
 * 
 * @param stats - Processing statistics
 * @returns Success rate as a percentage (0-100)
 */
export const calculateSuccessRate = (stats: ProcessingStats): number => {
  if (stats.totalRuns === 0) return 0;
  return (stats.successCount / stats.totalRuns) * 100;
};

/**
 * Pure function to format processing time
 * 
 * @param timeMs - Time in milliseconds
 * @returns Formatted time string
 */
export const formatProcessingTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${Math.round(timeMs)}ms`;
  }
  return `${(timeMs / 1000).toFixed(2)}s`;
};
