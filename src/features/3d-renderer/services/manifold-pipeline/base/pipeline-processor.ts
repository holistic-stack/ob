/**
 * @file Base Pipeline Processor
 * @description Abstract base class for all Manifold pipeline processors
 * Implements common functionality and enforces SRP compliance
 */

import { createLogger } from '../../../../../shared/services/logger.service';
import type { Result } from '../../../../../shared/types/result.types';

/**
 * Processing options interface for all processors
 */
export interface ProcessingOptions {
  readonly timeout?: number;
  readonly enableMetrics?: boolean;
  readonly preserveMaterials?: boolean;
  readonly optimizeResult?: boolean;
}

/**
 * Base processor interface enforcing common methods
 */
export interface PipelineProcessor<TInput, TOutput> {
  readonly name: string;
  readonly version: string;
  
  initialize(): Promise<Result<void, string>>;
  process(input: TInput, options?: ProcessingOptions): Promise<Result<TOutput, string>>;
  dispose(): void;
}

/**
 * Abstract base class for all pipeline processors
 * Implements common functionality and enforces SRP
 */
export abstract class BasePipelineProcessor<TInput, TOutput> implements PipelineProcessor<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly version: string;

  protected logger: any;
  protected isInitialized = false;
  protected resources: Set<any> = new Set();

  /**
   * Initialize the processor
   * Subclasses should override initializeInternal() for custom initialization
   */
  async initialize(): Promise<Result<void, string>> {
    try {
      // Initialize logger now that name is available
      if (!this.logger) {
        this.logger = createLogger(this.name);
      }

      this.logger.debug(`[INIT] Initializing ${this.name} v${this.version}`);

      const result = await this.initializeInternal();
      if (!result.success) {
        return result;
      }

      this.isInitialized = true;
      this.logger.debug(`[INIT] ${this.name} initialized successfully`);

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = `Failed to initialize ${this.name}: ${error instanceof Error ? error.message : String(error)}`;
      if (this.logger) {
        this.logger.error(`[ERROR] ${errorMessage}`);
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process input data
   * Subclasses must implement processInternal() for actual processing logic
   */
  async process(input: TInput, options?: ProcessingOptions): Promise<Result<TOutput, string>> {
    if (!this.isInitialized) {
      return { success: false, error: `${this.name} not initialized. Call initialize() first.` };
    }

    try {
      const startTime = performance.now();
      
      this.logger.debug(`[PROCESS] Starting ${this.name} processing`);
      
      const result = await this.processInternal(input, options);
      
      const processingTime = performance.now() - startTime;
      
      if (result.success) {
        this.logger.debug(`[PROCESS] ${this.name} completed successfully`, { processingTime });
      } else {
        this.logger.error(`[PROCESS] ${this.name} failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const errorMessage = `${this.name} processing failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`[ERROR] ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Dispose of processor resources
   * Subclasses should override disposeInternal() for custom cleanup
   */
  dispose(): void {
    try {
      this.logger.debug(`[DISPOSE] Disposing ${this.name}`);
      
      // Clean up tracked resources
      this.resources.forEach(resource => {
        if (resource && typeof resource.delete === 'function') {
          try {
            resource.delete();
          } catch (error) {
            this.logger.warn(`[DISPOSE] Failed to dispose resource: ${error}`);
          }
        }
      });
      this.resources.clear();

      // Call subclass cleanup
      this.disposeInternal();

      this.isInitialized = false;
      this.logger.debug(`[DISPOSE] ${this.name} disposed successfully`);
    } catch (error) {
      this.logger.error(`[DISPOSE] Failed to dispose ${this.name}: ${error}`);
    }
  }

  /**
   * Track a resource for automatic cleanup
   */
  protected trackResource(resource: any): void {
    this.resources.add(resource);
  }

  /**
   * Untrack a resource (when manually cleaned up)
   */
  protected untrackResource(resource: any): void {
    this.resources.delete(resource);
  }

  /**
   * Subclasses override this for custom initialization
   */
  protected async initializeInternal(): Promise<Result<void, string>> {
    return { success: true, data: undefined };
  }

  /**
   * Subclasses must implement this for actual processing logic
   */
  protected abstract processInternal(input: TInput, options?: ProcessingOptions): Promise<Result<TOutput, string>>;

  /**
   * Subclasses override this for custom cleanup
   */
  protected disposeInternal(): void {
    // Default: no additional cleanup needed
  }
}
