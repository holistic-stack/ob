/**
 * Zustand Store Slice: Configuration
 *
 * Manages application configuration, including theme settings,
 * feature toggles, and performance preferences.
 */

import type { StateCreator } from 'zustand';
import type { AppStore, ConfigSlice } from '../types/store.types.js';
import type { AppConfig } from '../../../shared/types/common.types.js';

interface ConfigSliceConfig {
  DEFAULT_CONFIG: AppConfig;
}

export const createConfigSlice = (
  set: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[0],
  get: Parameters<StateCreator<AppStore, [['zustand/immer', never]], [], AppStore>>[1],
  { DEFAULT_CONFIG }: ConfigSliceConfig
): Omit<ConfigSlice, 'config'> => {
  return {
    updateConfig: (configUpdate: Partial<AppConfig>) => {
      set((state) => {
        state.config = { ...state.config, ...configUpdate };
      });
    },

    resetConfig: () => {
      set((state) => {
        state.config = { ...DEFAULT_CONFIG };
      });
    },

    toggleRealTimeParsing: () => {
      set((state) => {
        state.config.enableRealTimeParsing = !state.config.enableRealTimeParsing;
      });
    },

    toggleRealTimeRendering: () => {
      set((state) => {
        state.config.enableRealTimeRendering = !state.config.enableRealTimeRendering;
      });
    },

    toggleAutoSave: () => {
      set((state) => {
        state.config.enableAutoSave = !state.config.enableAutoSave;
      });
    },
  };
};
