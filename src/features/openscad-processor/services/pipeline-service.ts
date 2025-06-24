/**
 * @file Pipeline Service
 * 
 * Business logic service for managing OpenSCAD pipeline operations.
 * Following bulletproof-react architecture patterns and SOLID principles.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// TODO: Fix import path when openscad-pipeline is implemented
// import { OpenScadPipeline } from '../../../babylon-csg2/openscad-pipeline/openscad-pipeline';
import { PipelineConfig, PipelineInitializationResult } from '../types/processing-types';

// Temporary mock for OpenScadPipeline until implementation is complete
class MockOpenScadPipeline {
  constructor(_config: any) {}
  async initialize(): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
  async processOpenScadCodeToGeometry(_code: string): Promise<any> {
    return { success: true, value: [] };
  }
}
const OpenScadPipeline = MockOpenScadPipeline;

/**
 * Default pipeline configuration
 */
const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  enableLogging: true,
  enableMetrics: true,
  csg2Timeout: 5000
};

/**
 * Pipeline service class for managing OpenSCAD pipeline operations
 * 
 * This service encapsulates all pipeline-related business logic,
 * making it testable and reusable across different contexts.
 */
export class PipelineService {
  private pipeline: InstanceType<typeof OpenScadPipeline> | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<PipelineInitializationResult> | null = null;

  constructor(private config: PipelineConfig = DEFAULT_PIPELINE_CONFIG) {}

  /**
   * Initialize the pipeline (idempotent operation)
   * 
   * @returns Promise that resolves to initialization result
   */
  async initialize(): Promise<PipelineInitializationResult> {
    // Return existing initialization promise if already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return success if already initialized
    if (this.isInitialized && this.pipeline) {
      return { success: true, pipeline: this.pipeline };
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<PipelineInitializationResult> {
    const startTime = Date.now();
    
    try {
      console.log('[PipelineService] 🚀 Starting pipeline initialization...');
      
      // Create pipeline instance
      const pipelineInstance = new OpenScadPipeline(this.config);
      
      // Initialize the pipeline
      const initResult = await pipelineInstance.initialize();
      if (!initResult.success) {
        throw new Error(`Pipeline initialization failed: ${initResult.error}`);
      }

      // Store initialized pipeline
      this.pipeline = pipelineInstance;
      this.isInitialized = true;
      
      const initializationTime = Date.now() - startTime;
      console.log(`[PipelineService] ✅ Pipeline initialized successfully in ${initializationTime}ms`);
      
      return { success: true, pipeline: this.pipeline };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('[PipelineService] ❌ Pipeline initialization failed:', errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Get the initialized pipeline instance
   * 
   * @throws Error if pipeline is not initialized
   */
  getPipeline(): InstanceType<typeof OpenScadPipeline> {
    if (!this.isInitialized || !this.pipeline) {
      throw new Error('Pipeline not initialized. Call initialize() first.');
    }
    return this.pipeline;
  }

  /**
   * Check if pipeline is ready for use
   */
  isReady(): boolean {
    return this.isInitialized && this.pipeline !== null;
  }

  /**
   * Reset the pipeline service
   */
  reset(): void {
    console.log('[PipelineService] 🔄 Resetting pipeline service...');
    this.pipeline = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get current configuration
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires re-initialization)
   */
  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Reset to force re-initialization with new config
    this.reset();
  }
}

/**
 * Create a singleton pipeline service instance
 */
let pipelineServiceInstance: PipelineService | null = null;

/**
 * Get or create the singleton pipeline service instance
 * 
 * @param config - Optional configuration for new instance
 * @returns Pipeline service instance
 */
export const getPipelineService = (config?: PipelineConfig): PipelineService => {
  if (!pipelineServiceInstance) {
    pipelineServiceInstance = new PipelineService(config);
  }
  return pipelineServiceInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetPipelineService = (): void => {
  if (pipelineServiceInstance) {
    pipelineServiceInstance.reset();
    pipelineServiceInstance = null;
  }
};
