/**
 * @file Use Processing Stats Hook
 * 
 * Focused hook for managing processing statistics.
 * Following Single Responsibility Principle.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useState, useCallback } from 'react';
import { ProcessingStats } from '../types/processing-types';
import { createInitialStats, updateProcessingStats } from '../utils/stats-calculator';

/**
 * Hook state for processing statistics
 */
export interface UseProcessingStatsState {
  readonly stats: ProcessingStats;
  readonly updateStats: (processingTime: number, success: boolean) => void;
  readonly resetStats: () => void;
  readonly getSuccessRate: () => number;
  readonly getAverageTimeFormatted: () => string;
}

/**
 * Hook for managing processing statistics
 * 
 * This hook encapsulates all statistics-related logic,
 * providing a clean interface for tracking processing performance.
 * 
 * @returns Processing statistics state and actions
 */
export function useProcessingStats(): UseProcessingStatsState {
  const [stats, setStats] = useState<ProcessingStats>(createInitialStats);

  /**
   * Update processing statistics
   * 
   * @param processingTime - Time taken for the processing operation
   * @param success - Whether the operation was successful
   */
  const updateStats = useCallback((processingTime: number, success: boolean) => {
    setStats(prev => {
      const newStats = updateProcessingStats(prev, processingTime, success);
      
      console.log('[useProcessingStats] 📊 Stats updated:', {
        totalRuns: newStats.totalRuns,
        successRate: `${((newStats.successCount / newStats.totalRuns) * 100).toFixed(1)}%`,
        averageTime: `${newStats.averageTime.toFixed(0)}ms`
      });
      
      return newStats;
    });
  }, []);

  /**
   * Reset all statistics
   */
  const resetStats = useCallback(() => {
    console.log('[useProcessingStats] 🔄 Resetting statistics...');
    setStats(createInitialStats());
  }, []);

  /**
   * Get success rate as percentage
   */
  const getSuccessRate = useCallback((): number => {
    if (stats.totalRuns === 0) return 0;
    return (stats.successCount / stats.totalRuns) * 100;
  }, [stats.successCount, stats.totalRuns]);

  /**
   * Get formatted average processing time
   */
  const getAverageTimeFormatted = useCallback((): string => {
    if (stats.averageTime < 1000) {
      return `${Math.round(stats.averageTime)}ms`;
    }
    return `${(stats.averageTime / 1000).toFixed(2)}s`;
  }, [stats.averageTime]);

  return {
    stats,
    updateStats,
    resetStats,
    getSuccessRate,
    getAverageTimeFormatted
  };
}
