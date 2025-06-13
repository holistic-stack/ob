/**
 * @file Statistics Calculator Tests
 * 
 * Tests for pure statistics calculation functions.
 * These tests demonstrate the improved testability after refactoring.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialStats,
  updateProcessingStats,
  calculateSuccessRate,
  formatProcessingTime
} from './stats-calculator';

describe('Stats Calculator (Pure Functions)', () => {
  describe('createInitialStats', () => {
    it('should create initial stats with zero values', () => {
      const stats = createInitialStats();
      
      expect(stats).toEqual({
        totalRuns: 0,
        successCount: 0,
        errorCount: 0,
        averageTime: 0
      });
    });
  });

  describe('updateProcessingStats', () => {
    it('should update stats for successful operation', () => {
      const initialStats = createInitialStats();
      const updatedStats = updateProcessingStats(initialStats, 1000, true);
      
      expect(updatedStats).toEqual({
        totalRuns: 1,
        successCount: 1,
        errorCount: 0,
        averageTime: 1000
      });
    });

    it('should update stats for failed operation', () => {
      const initialStats = createInitialStats();
      const updatedStats = updateProcessingStats(initialStats, 500, false);
      
      expect(updatedStats).toEqual({
        totalRuns: 1,
        successCount: 0,
        errorCount: 1,
        averageTime: 500
      });
    });

    it('should calculate correct average time over multiple operations', () => {
      const initialStats = createInitialStats();
      
      // First operation: 1000ms
      const stats1 = updateProcessingStats(initialStats, 1000, true);
      
      // Second operation: 500ms
      const stats2 = updateProcessingStats(stats1, 500, true);
      
      expect(stats2.averageTime).toBe(750); // (1000 + 500) / 2
      expect(stats2.totalRuns).toBe(2);
      expect(stats2.successCount).toBe(2);
    });

    it('should maintain immutability', () => {
      const initialStats = createInitialStats();
      const updatedStats = updateProcessingStats(initialStats, 1000, true);
      
      // Original stats should not be modified
      expect(initialStats.totalRuns).toBe(0);
      expect(updatedStats.totalRuns).toBe(1);
    });
  });

  describe('calculateSuccessRate', () => {
    it('should return 0 for no runs', () => {
      const stats = createInitialStats();
      expect(calculateSuccessRate(stats)).toBe(0);
    });

    it('should calculate 100% success rate', () => {
      const stats = {
        totalRuns: 5,
        successCount: 5,
        errorCount: 0,
        averageTime: 1000
      };
      
      expect(calculateSuccessRate(stats)).toBe(100);
    });

    it('should calculate 50% success rate', () => {
      const stats = {
        totalRuns: 4,
        successCount: 2,
        errorCount: 2,
        averageTime: 1000
      };
      
      expect(calculateSuccessRate(stats)).toBe(50);
    });
  });

  describe('formatProcessingTime', () => {
    it('should format milliseconds for times under 1 second', () => {
      expect(formatProcessingTime(500)).toBe('500ms');
      expect(formatProcessingTime(999)).toBe('999ms');
    });

    it('should format seconds for times over 1 second', () => {
      expect(formatProcessingTime(1000)).toBe('1.00s');
      expect(formatProcessingTime(1500)).toBe('1.50s');
      expect(formatProcessingTime(2345)).toBe('2.35s');
    });

    it('should round milliseconds properly', () => {
      expect(formatProcessingTime(123.7)).toBe('124ms');
      expect(formatProcessingTime(123.4)).toBe('123ms');
    });
  });
});
