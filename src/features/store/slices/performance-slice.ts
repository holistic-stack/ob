/**
 * Zustand Store Slice: Performance
 *
 * Manages performance-related state, including metrics, monitoring status,
 * and performance violations.
 */

import type { StateCreator } from 'zustand';
import type { AppStore, PerformanceSlice } from '../types/store.types.js';

export type { PerformanceSlice };
import type { PerformanceMetrics } from '../../../shared/types/common.types.js';

export const createPerformanceSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1]
): Omit<PerformanceSlice, keyof AppStore['performance']> => ({
  updateMetrics: (metrics: PerformanceMetrics) => {
    set((state) => {
      state.performance.metrics = metrics;
      state.performance.lastUpdated = new Date();
    });
  },
  startMonitoring: () => {
    set((state) => {
      state.performance.isMonitoring = true;
    });
  },
  stopMonitoring: () => {
    set((state) => {
      state.performance.isMonitoring = false;
    });
  },
  recordParseTime: (duration: number) => {
    set((state) => {
      state.performance.metrics.parseTime = duration;
      state.performance.lastUpdated = new Date();
    });
  },
  recordRenderTime: (duration: number) => {
    set((state) => {
      state.performance.metrics.renderTime = duration;
      state.performance.lastUpdated = new Date();
    });
  },
  addPerformanceViolation: (violation: string) => {
    set((state) => {
      state.performance.violations.push(violation);
    });
  },
  clearPerformanceViolations: () => {
    set((state) => {
      state.performance.violations = [];
    });
  },
});
