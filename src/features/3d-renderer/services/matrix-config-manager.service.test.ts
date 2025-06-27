/**
 * Matrix Configuration Manager Service Tests
 * 
 * Comprehensive tests for configuration management with runtime validation,
 * environment-specific settings, and performance threshold management following TDD methodology.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MatrixConfigManagerService } from './matrix-config-manager.service';
import { MATRIX_CONFIG } from '../config/matrix-config';

describe('MatrixConfigManagerService', () => {
  let service: MatrixConfigManagerService;

  beforeEach(() => {
    console.log('[INIT][MatrixConfigManagerServiceTest] Setting up test environment');
    service = new MatrixConfigManagerService();
  });

  afterEach(() => {
    console.log('[END][MatrixConfigManagerServiceTest] Cleaning up test environment');
    service.resetToDefaults();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing default initialization');
      
      const config = service.getCurrentConfig();
      expect(config).toBeDefined();
      expect(config.performance.maxDirectOperationSize).toBe(MATRIX_CONFIG.performance.maxDirectOperationSize);
      expect(config.cache.maxCacheSize).toBe(MATRIX_CONFIG.cache.maxCacheSize);
    });

    it('should apply environment-specific configuration', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing environment-specific configuration');
      
      const config = service.getCurrentConfig();
      
      // In test environment, should have test-specific settings
      expect(config.debug.logLevel).toBe('ERROR');
      expect(config.cache.maxCacheSize).toBe(10);
      expect(config.cache.cacheTTL).toBe(1000);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration properties', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing valid configuration validation');
      
      const result = service.applyOverride({
        performance: {
          maxDirectOperationSize: 50000,
          performanceThreshold: 20
        }
      });
      
      expect(result.success).toBe(true);
      
      const config = service.getCurrentConfig();
      expect(config.performance.maxDirectOperationSize).toBe(50000);
      expect(config.performance.performanceThreshold).toBe(20);
    });

    it('should reject invalid configuration values', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing invalid configuration rejection');
      
      const result = service.applyOverride({
        performance: {
          maxDirectOperationSize: -1000 // Invalid negative value
        }
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('maxDirectOperationSize must be a positive number');
      }
    });

    it('should provide warnings for potentially problematic values', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing configuration warnings');
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = service.applyOverride({
        performance: {
          maxDirectOperationSize: 200000000 // Very large value
        }
      });
      
      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN][MatrixConfigManagerService] Configuration warning'),
        expect.arrayContaining([expect.stringContaining('Very large maxDirectOperationSize')])
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate entire configuration', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing complete configuration validation');
      
      const validationResult = service.validateConfiguration();
      
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });
  });

  describe('Configuration Overrides', () => {
    it('should apply and track configuration overrides', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing configuration overrides');
      
      const originalMaxSize = service.getCurrentConfig().cache.maxCacheSize;
      
      const result = service.applyOverride({
        cache: {
          maxCacheSize: 200,
          cacheTTL: 5000
        }
      });
      
      expect(result.success).toBe(true);
      
      const config = service.getCurrentConfig();
      expect(config.cache.maxCacheSize).toBe(200);
      expect(config.cache.cacheTTL).toBe(5000);
      
      const overrides = service.getCurrentOverrides();
      expect(overrides['cache.maxCacheSize']).toBe(200);
      expect(overrides['cache.cacheTTL']).toBe(5000);
    });

    it('should maintain change history', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing change history tracking');
      
      service.applyOverride({
        performance: {
          performanceThreshold: 25
        }
      });
      
      service.applyOverride({
        cache: {
          maxCacheSize: 150
        }
      });
      
      const history = service.getChangeHistory();
      expect(history.length).toBeGreaterThan(0);
      
      const performanceChange = history.find(h => h.property === 'performance.performanceThreshold');
      expect(performanceChange).toBeDefined();
      expect(performanceChange?.newValue).toBe(25);
    });

    it('should reset to defaults', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing reset to defaults');
      
      // Apply some overrides
      service.applyOverride({
        performance: {
          maxDirectOperationSize: 99999
        }
      });
      
      let config = service.getCurrentConfig();
      expect(config.performance.maxDirectOperationSize).toBe(99999);
      
      // Reset to defaults
      service.resetToDefaults();
      
      config = service.getCurrentConfig();
      expect(config.performance.maxDirectOperationSize).toBe(MATRIX_CONFIG.performance.maxDirectOperationSize);
      
      const overrides = service.getCurrentOverrides();
      expect(Object.keys(overrides)).toHaveLength(0);
    });
  });

  describe('Performance Threshold Management', () => {
    it('should suggest threshold adjustments based on metrics', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing threshold adjustment suggestions');
      
      const operationMetrics = {
        add: { averageTime: 2.5, count: 100 }, // Much slower than baseline (1ms)
        multiply: { averageTime: 2.0, count: 50 }, // Faster than baseline (5ms)
        transpose: { averageTime: 2.1, count: 5 } // Insufficient data
      };
      
      const adjustments = service.suggestPerformanceThresholdAdjustments(operationMetrics);
      
      expect(adjustments.length).toBeGreaterThan(0);
      
      const addAdjustment = adjustments.find(a => a.operation === 'add');
      expect(addAdjustment).toBeDefined();
      expect(addAdjustment?.suggestedThreshold).toBeGreaterThan(addAdjustment?.currentThreshold);
      
      const multiplyAdjustment = adjustments.find(a => a.operation === 'multiply');
      expect(multiplyAdjustment).toBeDefined();
      expect(multiplyAdjustment?.suggestedThreshold).toBeLessThan(multiplyAdjustment?.currentThreshold);
      
      // Should not suggest adjustment for transpose due to insufficient data
      const transposeAdjustment = adjustments.find(a => a.operation === 'transpose');
      expect(transposeAdjustment).toBeUndefined();
    });

    it('should apply threshold adjustments with confidence filtering', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing threshold adjustment application');
      
      const adjustments = [
        {
          operation: 'add',
          currentThreshold: 1,
          suggestedThreshold: 3,
          reason: 'Operation consistently slower',
          confidence: 0.8 // High confidence
        },
        {
          operation: 'multiply',
          currentThreshold: 5,
          suggestedThreshold: 2,
          reason: 'Operation consistently faster',
          confidence: 0.3 // Low confidence - should be skipped
        }
      ];
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = service.applyPerformanceThresholdAdjustments(adjustments);
      
      expect(result.success).toBe(true);
      
      // Should warn about low-confidence adjustment
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping low-confidence adjustment for multiply')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Import/Export', () => {
    it('should export configuration correctly', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing configuration export');
      
      // Apply some overrides first
      service.applyOverride({
        performance: {
          performanceThreshold: 30
        }
      });
      
      const exported = service.exportConfiguration();
      const exportData = JSON.parse(exported);
      
      expect(exportData).toHaveProperty('config');
      expect(exportData).toHaveProperty('overrides');
      expect(exportData).toHaveProperty('environment');
      expect(exportData).toHaveProperty('timestamp');
      
      expect(exportData.config.performance.performanceThreshold).toBe(30);
      expect(exportData.overrides['performance.performanceThreshold']).toBe(30);
    });

    it('should import valid configuration', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing configuration import');
      
      const configToImport = {
        config: {
          ...MATRIX_CONFIG,
          performance: {
            ...MATRIX_CONFIG.performance,
            performanceThreshold: 40
          }
        },
        overrides: {
          'performance.performanceThreshold': 40
        },
        environment: 'test',
        timestamp: Date.now()
      };
      
      const result = service.importConfiguration(JSON.stringify(configToImport));
      
      expect(result.success).toBe(true);
      
      const config = service.getCurrentConfig();
      expect(config.performance.performanceThreshold).toBe(40);
    });

    it('should reject invalid configuration imports', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing invalid configuration import rejection');
      
      const invalidConfig = {
        // Missing config section
        overrides: {},
        environment: 'test'
      };
      
      const result = service.importConfiguration(JSON.stringify(invalidConfig));
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing config section');
      }
    });

    it('should handle malformed JSON in import', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing malformed JSON import handling');
      
      const result = service.importConfiguration('invalid json {');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to import configuration');
      }
    });
  });

  describe('Environment Detection', () => {
    it('should detect test environment correctly', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing environment detection');
      
      // In vitest, NODE_ENV should be 'test'
      const config = service.getCurrentConfig();
      
      // Test environment should have specific settings
      expect(config.debug.logLevel).toBe('ERROR');
      expect(config.debug.enablePerformanceLogging).toBe(false);
    });
  });

  describe('Nested Configuration Handling', () => {
    it('should handle deeply nested configuration overrides', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing nested configuration handling');
      
      const result = service.applyOverride({
        debug: {
          enablePerformanceLogging: true,
          logLevel: 'DEBUG'
        },
        errorHandling: {
          maxRetries: 10,
          retryDelay: 2000
        }
      });
      
      expect(result.success).toBe(true);
      
      const config = service.getCurrentConfig();
      expect(config.debug.enablePerformanceLogging).toBe(true);
      expect(config.debug.logLevel).toBe('DEBUG');
      expect(config.errorHandling.maxRetries).toBe(10);
      expect(config.errorHandling.retryDelay).toBe(2000);
    });

    it('should maintain non-overridden nested properties', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing preservation of non-overridden properties');
      
      const originalOperationTimeout = service.getCurrentConfig().performance.operationTimeout;
      
      service.applyOverride({
        performance: {
          performanceThreshold: 50
        }
      });
      
      const config = service.getCurrentConfig();
      expect(config.performance.performanceThreshold).toBe(50);
      expect(config.performance.operationTimeout).toBe(originalOperationTimeout); // Should be preserved
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration validation errors gracefully', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing configuration error handling');
      
      const result = service.applyOverride({
        cache: {
          maxCacheSize: 'invalid' as any // Wrong type
        }
      });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('maxCacheSize must be a positive number');
      }
    });

    it('should maintain configuration integrity on failed overrides', () => {
      console.log('[DEBUG][MatrixConfigManagerServiceTest] Testing configuration integrity on failures');
      
      const originalConfig = service.getCurrentConfig();
      
      const result = service.applyOverride({
        performance: {
          maxDirectOperationSize: -1000 // Invalid value
        }
      });
      
      expect(result.success).toBe(false);
      
      // Configuration should remain unchanged
      const currentConfig = service.getCurrentConfig();
      expect(currentConfig.performance.maxDirectOperationSize).toBe(originalConfig.performance.maxDirectOperationSize);
    });
  });
});
