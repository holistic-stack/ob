/**
 * Matrix Configuration Manager Service
 *
 * Enhanced configuration management with runtime validation, environment-specific settings,
 * and performance threshold management following bulletproof-react patterns.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import { MATRIX_CONFIG, type MatrixConfig } from '../config/matrix-config.js';
import type { MatrixConfigOverride } from '../types/matrix.types.js';

const logger = createLogger('MatrixConfigManagerService');

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
  readonly development: Partial<MatrixConfig>;
  readonly test: Partial<MatrixConfig>;
  readonly production: Partial<MatrixConfig>;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

/**
 * Performance threshold adjustment
 */
export interface PerformanceThresholdAdjustment {
  readonly operation: string;
  readonly currentThreshold: number;
  readonly suggestedThreshold: number;
  readonly reason: string;
  readonly confidence: number; // 0-1
}

/**
 * Configuration change event
 */
export interface ConfigurationChangeEvent {
  readonly timestamp: number;
  readonly section: keyof MatrixConfig;
  readonly property: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly reason: string;
}

/**
 * Matrix Configuration Manager Service
 */
export class MatrixConfigManagerService {
  private currentConfig: MatrixConfig;
  private readonly configOverrides = new Map<string, unknown>();
  private readonly changeHistory: ConfigurationChangeEvent[] = [];
  private readonly validationRules = new Map<string, (value: unknown) => ConfigValidationResult>();
  private readonly performanceBaselines = new Map<string, number>();

  constructor() {
    logger.init('Initializing configuration manager');

    this.currentConfig = { ...MATRIX_CONFIG };
    this.initializeValidationRules();
    this.initializePerformanceBaselines();
    this.applyEnvironmentSpecificConfig();
  }

  /**
   * Initialize validation rules for configuration properties
   */
  private initializeValidationRules(): void {
    // Performance validation rules
    this.validationRules.set('performance.maxDirectOperationSize', (value) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      if (typeof value !== 'number' || value <= 0) {
        errors.push('maxDirectOperationSize must be a positive number');
      } else if (value > 100000000) {
        // 100M elements
        warnings.push('Very large maxDirectOperationSize may cause memory issues');
        suggestions.push('Consider using batch processing for matrices this large');
      } else if (value < 1000) {
        warnings.push('Small maxDirectOperationSize may limit performance');
        suggestions.push('Consider increasing for better performance with larger matrices');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    });

    // Cache validation rules
    this.validationRules.set('cache.maxCacheSize', (value) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      if (typeof value !== 'number' || value <= 0) {
        errors.push('maxCacheSize must be a positive number');
      } else if (value > 10000) {
        warnings.push('Very large cache size may consume excessive memory');
        suggestions.push('Monitor memory usage with large cache sizes');
      } else if (value < 10) {
        warnings.push('Small cache size may reduce performance benefits');
        suggestions.push('Consider increasing cache size for better performance');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    });

    // Memory validation rules
    this.validationRules.set('performance.maxMemoryUsage', (value) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      if (typeof value !== 'number' || value <= 0) {
        errors.push('maxMemoryUsage must be a positive number');
      } else if (value > 1024 * 1024 * 1024) {
        // 1GB
        warnings.push('Very high memory limit may cause system instability');
        suggestions.push('Monitor system memory usage carefully');
      } else if (value < 10 * 1024 * 1024) {
        // 10MB
        warnings.push('Low memory limit may restrict matrix operations');
        suggestions.push('Consider increasing memory limit for complex operations');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    });

    logger.debug('Validation rules initialized');
  }

  /**
   * Initialize performance baselines for threshold management
   */
  private initializePerformanceBaselines(): void {
    this.performanceBaselines.set('add', 1);
    this.performanceBaselines.set('subtract', 1);
    this.performanceBaselines.set('multiply', 5);
    this.performanceBaselines.set('transpose', 2);
    this.performanceBaselines.set('inverse', 10);
    this.performanceBaselines.set('determinant', 5);
    this.performanceBaselines.set('eigenvalues', 50);
    this.performanceBaselines.set('svd', 30);

    logger.debug('Performance baselines initialized');
  }

  /**
   * Apply environment-specific configuration
   */
  private applyEnvironmentSpecificConfig(): void {
    const environment = this.detectEnvironment();
    logger.debug(`Applying ${environment} environment configuration`);

    const envConfig = this.getEnvironmentConfig();
    const envSpecific = envConfig[environment];

    if (envSpecific) {
      this.mergeConfiguration(envSpecific);
    }
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): keyof EnvironmentConfig {
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'test') return 'test';
      if (nodeEnv === 'production') return 'production';
    }

    // Browser environment detection
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
        return 'development';
      }
    }

    return 'development';
  }

  /**
   * Get environment-specific configuration
   */
  private getEnvironmentConfig(): EnvironmentConfig {
    return {
      development: {
        debug: {
          ...MATRIX_CONFIG.debug,
          enablePerformanceLogging: true,
          enableTracing: false,
          logLevel: 'DEBUG',
        },
        performance: {
          ...MATRIX_CONFIG.performance,
          performanceThreshold: 16, // More relaxed for development
        },
      },
      test: {
        debug: {
          ...MATRIX_CONFIG.debug,
          enablePerformanceLogging: true,
          enableTracing: false,
          logLevel: 'ERROR',
        },
        cache: {
          ...MATRIX_CONFIG.cache,
          maxCacheSize: 100, // Smaller cache for tests
          cacheTTL: 300000, // Shorter TTL for tests
        },
      },
      production: {
        debug: {
          ...MATRIX_CONFIG.debug,
          enablePerformanceLogging: true,
          enableTracing: false,
          logLevel: 'WARN',
        },
        performance: {
          ...MATRIX_CONFIG.performance,
          performanceThreshold: 16, // Stricter for production
        },
        errorHandling: {
          ...MATRIX_CONFIG.errorHandling,
          enableAutoRecovery: true,
          maxRetries: 3,
        },
      },
    };
  }

  /**
   * Merge configuration with validation
   */
  private mergeConfiguration(override: Partial<MatrixConfig>): Result<void, string> {
    try {
      const flatOverride = this.flattenConfig(override);

      for (const [key, value] of Object.entries(flatOverride)) {
        const validationResult = this.validateConfigProperty(key, value);

        if (!validationResult.isValid) {
          return error(
            `Configuration validation failed for ${key}: ${validationResult.errors.join(', ')}`
          );
        }

        if (validationResult.warnings.length > 0) {
          logger.warn(
            `Configuration warning for ${key}:`,
            validationResult.warnings
          );
        }

        // Apply the override
        this.setNestedProperty(this.currentConfig, key, value);
        this.configOverrides.set(key, value);

        // Record the change
        this.recordConfigurationChange(
          'debug',
          key,
          undefined,
          value,
          'Manual configuration override'
        );
      }

      return success(undefined);
    } catch (err) {
      return error(
        `Failed to merge configuration: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Flatten nested configuration object
   */
  private flattenConfig(config: Partial<MatrixConfig>, prefix = ''): Record<string, unknown> {
    const flattened: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(config)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenConfig(value as Record<string, unknown>, fullKey));
      } else {
        flattened[fullKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Set nested property in configuration object
   */
  private setNestedProperty(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key && !(key in current)) {
        current[key] = {};
      }
      if (key) {
        current = current[key] as Record<string, unknown>;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      current[lastKey] = value;
    }
  }

  /**
   * Validate configuration property
   */
  private validateConfigProperty(key: string, value: unknown): ConfigValidationResult {
    const validator = this.validationRules.get(key);

    if (validator) {
      return validator(value);
    }

    // Default validation for unknown properties
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  }

  /**
   * Record configuration change
   */
  private recordConfigurationChange(
    section: keyof MatrixConfig,
    property: string,
    oldValue: unknown,
    newValue: unknown,
    reason: string
  ): void {
    const change: ConfigurationChangeEvent = {
      timestamp: Date.now(),
      section,
      property,
      oldValue,
      newValue,
      reason,
    };

    this.changeHistory.push(change);

    // Maintain history size limit
    if (this.changeHistory.length > 1000) {
      this.changeHistory.shift();
    }

    logger.debug(
      `Configuration changed: ${section}.${property} = ${newValue} (${reason})`
    );
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): MatrixConfig {
    return { ...this.currentConfig };
  }

  /**
   * Apply configuration override
   */
  applyOverride(override: MatrixConfigOverride): Result<void, string> {
    logger.debug('Applying configuration override');
    return this.mergeConfiguration(override as Partial<MatrixConfig>);
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    logger.debug('Resetting configuration to defaults');

    this.currentConfig = { ...MATRIX_CONFIG };
    this.configOverrides.clear();
    this.applyEnvironmentSpecificConfig();

    this.recordConfigurationChange(
      'debug',
      'all',
      'overridden',
      'defaults',
      'Reset to default configuration'
    );
  }

  /**
   * Validate entire configuration
   */
  validateConfiguration(): ConfigValidationResult {
    logger.debug('Validating entire configuration');

    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const allSuggestions: string[] = [];

    const flatConfig = this.flattenConfig(this.currentConfig);

    for (const [key, value] of Object.entries(flatConfig)) {
      const result = this.validateConfigProperty(key, value);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      allSuggestions.push(...result.suggestions);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions,
    };
  }

  /**
   * Suggest performance threshold adjustments based on historical data
   */
  suggestPerformanceThresholdAdjustments(
    operationMetrics: Record<string, { averageTime: number; count: number }>
  ): PerformanceThresholdAdjustment[] {
    logger.debug('Analyzing performance thresholds');

    const adjustments: PerformanceThresholdAdjustment[] = [];

    for (const [operation, metrics] of Object.entries(operationMetrics)) {
      const baseline = this.performanceBaselines.get(operation);
      if (!baseline || metrics.count < 10) continue; // Need sufficient data

      const currentThreshold = baseline;
      const actualPerformance = metrics.averageTime;

      // Suggest adjustment if actual performance is consistently different
      const ratio = actualPerformance / currentThreshold;

      if (ratio > 1.5 || ratio < 0.5) {
        const suggestedThreshold = Math.round(actualPerformance * 1.2); // 20% buffer
        const confidence = Math.min(0.9, metrics.count / 100); // Higher confidence with more data

        adjustments.push({
          operation,
          currentThreshold,
          suggestedThreshold,
          reason:
            ratio > 1.5
              ? 'Operation consistently slower than threshold'
              : 'Operation consistently faster than threshold - threshold can be tightened',
          confidence,
        });
      }
    }

    return adjustments;
  }

  /**
   * Apply performance threshold adjustments
   */
  applyPerformanceThresholdAdjustments(
    adjustments: PerformanceThresholdAdjustment[]
  ): Result<void, string> {
    logger.debug(
      `Applying ${adjustments.length} threshold adjustments`
    );

    try {
      for (const adjustment of adjustments) {
        if (adjustment.confidence < 0.5) {
          logger.warn(
            `Skipping low-confidence adjustment for ${adjustment.operation}`
          );
          continue;
        }

        this.performanceBaselines.set(adjustment.operation, adjustment.suggestedThreshold);

        this.recordConfigurationChange(
          'performance',
          `${adjustment.operation}_threshold`,
          adjustment.currentThreshold,
          adjustment.suggestedThreshold,
          `Automatic threshold adjustment: ${adjustment.reason}`
        );
      }

      return success(undefined);
    } catch (err) {
      return error(
        `Failed to apply threshold adjustments: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Get configuration change history
   */
  getChangeHistory(limit = 100): ConfigurationChangeEvent[] {
    return this.changeHistory.slice(-limit);
  }

  /**
   * Get current configuration overrides
   */
  getCurrentOverrides(): Record<string, unknown> {
    return Object.fromEntries(this.configOverrides);
  }

  /**
   * Export configuration for backup/sharing
   */
  exportConfiguration(): string {
    const exportData = {
      config: this.currentConfig,
      overrides: this.getCurrentOverrides(),
      environment: this.detectEnvironment(),
      timestamp: Date.now(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration from backup
   */
  importConfiguration(configJson: string): Result<void, string> {
    try {
      const importData = JSON.parse(configJson);

      if (!importData.config) {
        return error('Invalid configuration format - missing config section');
      }

      // Validate imported configuration
      const tempConfig = { ...importData.config };
      const validationResult = this.validateConfiguration();

      if (!validationResult.isValid) {
        return error(`Imported configuration is invalid: ${validationResult.errors.join(', ')}`);
      }

      // Apply imported configuration
      this.currentConfig = tempConfig;

      if (importData.overrides) {
        this.configOverrides.clear();
        for (const [key, value] of Object.entries(importData.overrides)) {
          this.configOverrides.set(key, value);
        }
      }

      this.recordConfigurationChange(
        'debug',
        'all',
        'previous',
        'imported',
        'Configuration imported from backup'
      );

      logger.debug('Configuration imported successfully');
      return success(undefined);
    } catch (err) {
      return error(
        `Failed to import configuration: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
