/**
 * @file Processing Service
 * 
 * Business logic service for OpenSCAD code processing operations.
 * Following bulletproof-react architecture patterns and SOLID principles.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { MeshGeometryData, PipelineResult, createPipelineFailure } from '../../../types/pipeline-types';
import { ProcessingContext } from '../types/processing-types';
import { PipelineService } from './pipeline-service';
import { isValidGeometryData } from '../utils/geometry-converter';

/**
 * Processing service class for handling OpenSCAD code processing
 * 
 * This service encapsulates all processing-related business logic,
 * making it testable and reusable.
 */
export class ProcessingService {
  constructor(private pipelineService: PipelineService) {}

  /**
   * Process OpenSCAD code to geometry data
   * 
   * @param code - OpenSCAD code to process
   * @param abortController - Optional abort controller for cancellation
   * @returns Promise that resolves to processing result
   */
  async processCode(
    code: string,
    abortController?: AbortController
  ): Promise<PipelineResult<MeshGeometryData | MeshGeometryData[]>> {
    const context: ProcessingContext = {
      code,
      abortController: abortController || new AbortController(),
      startTime: Date.now()
    };

    return this.performProcessing(context);
  }

  /**
   * Perform the actual processing operation
   */
  private async performProcessing(
    context: ProcessingContext
  ): Promise<PipelineResult<MeshGeometryData | MeshGeometryData[]>> {
    console.log('[ProcessingService] 🔄 Starting OpenSCAD processing...');

    try {
      // Validate input
      if (!context.code.trim()) {
        throw new Error('Cannot process empty code');
      }

      // Check if aborted
      if (context.abortController.signal.aborted) {
        throw new Error('Processing was aborted');
      }

      // Get pipeline instance
      const pipeline = this.pipelineService.getPipeline();

      // Process with timeout handling
      const result = await Promise.race([
        pipeline.processOpenScadCodeToGeometry(context.code),
        this.createTimeoutPromise(context.abortController.signal)
      ]);

      // Validate result
      if (!result.success) {
        throw new Error(`Processing failed: ${result.error || 'No valid result'}`);
      }

      // Validate geometry data
      if (result.value) {
        const geometryArray = Array.isArray(result.value) ? result.value : [result.value];
        const invalidGeometry = geometryArray.find((geo: any) => !isValidGeometryData(geo));
        
        if (invalidGeometry) {
          console.warn('[ProcessingService] ⚠️ Invalid geometry data detected:', invalidGeometry.name);
        }
      }

      const processingTime = Date.now() - context.startTime;
      console.log(`[ProcessingService] ✅ Processing completed successfully in ${processingTime}ms`);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      console.error('[ProcessingService] ❌ Processing failed:', errorMessage);

      return createPipelineFailure<MeshGeometryData | MeshGeometryData[]>(errorMessage);
    }
  }

  /**
   * Create a timeout promise that rejects when aborted
   */
  private createTimeoutPromise(signal: AbortSignal): Promise<never> {
    return new Promise((_, reject) => {
      const onAbort = () => {
        reject(new Error('Processing was aborted'));
      };

      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  /**
   * Validate OpenSCAD code syntax (basic validation)
   * 
   * @param code - Code to validate
   * @returns Validation result
   */
  validateCode(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!code.trim()) {
      errors.push('Code cannot be empty');
    }

    // Basic syntax checks
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Mismatched braces');
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      errors.push('Mismatched parentheses');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get processing statistics for a code sample
   * 
   * @param code - Code to analyze
   * @returns Code statistics
   */
  getCodeStats(code: string) {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => line.trim().startsWith('//'));
    
    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length - commentLines.length,
      commentLines: commentLines.length,
      emptyLines: lines.length - nonEmptyLines.length,
      characters: code.length,
      words: code.split(/\s+/).filter(word => word.length > 0).length
    };
  }
}

/**
 * Create a processing service instance
 * 
 * @param pipelineService - Pipeline service instance
 * @returns Processing service instance
 */
export const createProcessingService = (pipelineService: PipelineService): ProcessingService => {
  return new ProcessingService(pipelineService);
};
