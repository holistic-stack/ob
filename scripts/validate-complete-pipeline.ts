/**
 * @file Complete Pipeline Validation Script
 * 
 * Comprehensive validation script that tests the entire OpenSCAD to Babylon.js pipeline
 * including TypeScript compilation, unit tests, integration tests, and E2E functionality.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';

/**
 * Validation results interface
 */
interface ValidationResult {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: string;
}

/**
 * Complete pipeline validation class
 */
class PipelineValidator {
  private results: ValidationResult[] = [];
  private startTime: number = Date.now();

  /**
   * Run a validation step and record results
   */
  private async runStep(stepName: string, command: string, cwd?: string): Promise<ValidationResult> {
    console.log(`[INIT] Starting ${stepName}`);
    const stepStart = Date.now();

    try {
      const output = execSync(command, {
        cwd: cwd || process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const duration = Date.now() - stepStart;
      const result: ValidationResult = {
        step: stepName,
        success: true,
        duration,
        details: output.slice(0, 500) // Truncate long outputs
      };

      console.log(`[END] ${stepName} completed successfully in ${duration}ms`);
      this.results.push(result);
      return result;

    } catch (error: any) {
      const duration = Date.now() - stepStart;
      const result: ValidationResult = {
        step: stepName,
        success: false,
        duration,
        error: error.message,
        details: error.stdout || error.stderr
      };

      console.error(`[ERROR] ${stepName} failed in ${duration}ms:`, error.message);
      this.results.push(result);
      return result;
    }
  }

  /**
   * Validate TypeScript compilation
   */
  async validateTypeScript(): Promise<ValidationResult> {
    return this.runStep(
      'TypeScript Compilation',
      'npx tsc --noEmit'
    );
  }

  /**
   * Validate linting
   */
  async validateLinting(): Promise<ValidationResult> {
    return this.runStep(
      'ESLint Validation',
      'npx eslint src --ext .ts,.tsx --max-warnings 0'
    );
  }

  /**
   * Validate unit tests
   */
  async validateUnitTests(): Promise<ValidationResult> {
    return this.runStep(
      'Unit Tests',
      'npx vitest run --reporter=verbose'
    );
  }

  /**
   * Validate specific pipeline components
   */
  async validatePipelineComponents(): Promise<ValidationResult> {
    return this.runStep(
      'Pipeline Component Tests',
      'npx vitest run src/babylon-csg2/openscad-pipeline --reporter=verbose'
    );
  }

  /**
   * Validate AST visitor functionality
   */
  async validateASTVisitor(): Promise<ValidationResult> {
    return this.runStep(
      'AST Visitor Tests',
      'npx vitest run src/babylon-csg2/openscad-ast-visitor --reporter=verbose'
    );
  }

  /**
   * Validate E2E pipeline tests
   */
  async validateE2ETests(): Promise<ValidationResult> {
    return this.runStep(
      'E2E Pipeline Tests',
      'npx vitest run src/babylon-csg2/e2e-tests --reporter=verbose'
    );
  }

  /**
   * Validate build process
   */
  async validateBuild(): Promise<ValidationResult> {
    return this.runStep(
      'Build Process',
      'npm run build'
    );
  }

  /**
   * Check file structure and dependencies
   */
  async validateFileStructure(): Promise<ValidationResult> {
    console.log('[INIT] Starting File Structure Validation');
    const stepStart = Date.now();

    const requiredFiles = [
      'src/babylon-csg2/openscad-pipeline/openscad-pipeline.ts',
      'src/babylon-csg2/openscad-ast-visitor/openscad-ast-visitor.ts',
      'src/babylon-csg2/utils/ast-type-guards.ts',
      'src/babylon-csg2/utils/parser-resource-manager.ts',
      'package.json',
      'tsconfig.json',
      'vite.config.ts'
    ];

    const missingFiles = requiredFiles.filter(file => !existsSync(path.join(process.cwd(), file)));

    const duration = Date.now() - stepStart;

    if (missingFiles.length === 0) {
      const result: ValidationResult = {
        step: 'File Structure Validation',
        success: true,
        duration,
        details: `All ${requiredFiles.length} required files found`
      };

      console.log(`[END] File Structure Validation completed successfully in ${duration}ms`);
      this.results.push(result);
      return result;
    } else {
      const result: ValidationResult = {
        step: 'File Structure Validation',
        success: false,
        duration,
        error: `Missing files: ${missingFiles.join(', ')}`
      };

      console.error(`[ERROR] File Structure Validation failed in ${duration}ms`);
      this.results.push(result);
      return result;
    }
  }

  /**
   * Run complete validation suite
   */
  async runCompleteValidation(): Promise<void> {
    console.log('[INIT] Starting Complete Pipeline Validation');
    console.log('='.repeat(60));

    // Run all validation steps
    await this.validateFileStructure();
    await this.validateTypeScript();
    await this.validateLinting();
    await this.validateUnitTests();
    await this.validatePipelineComponents();
    await this.validateASTVisitor();
    await this.validateE2ETests();
    await this.validateBuild();

    // Generate summary report
    this.generateReport();
  }

  /**
   * Generate validation report
   */
  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(60));
    console.log('COMPLETE PIPELINE VALIDATION REPORT');
    console.log('='.repeat(60));

    console.log(`\n📊 SUMMARY:`);
    console.log(`  Total Steps: ${this.results.length}`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${failureCount}`);
    console.log(`  ⏱️  Total Duration: ${totalDuration}ms`);

    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${result.step} (${result.duration}ms)`);
      
      if (!result.success && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    console.log(`\n🎯 PIPELINE STATUS:`);
    if (failureCount === 0) {
      console.log('  🎉 ALL VALIDATIONS PASSED - PIPELINE IS FULLY FUNCTIONAL!');
      console.log('  ✅ OpenSCAD to Babylon.js pipeline is ready for production');
      console.log('  ✅ TypeScript compilation: 0 errors');
      console.log('  ✅ All tests passing');
      console.log('  ✅ Complete type safety achieved');
    } else {
      console.log('  ⚠️  SOME VALIDATIONS FAILED - PIPELINE NEEDS ATTENTION');
      console.log(`  ❌ ${failureCount} validation step(s) failed`);
      console.log('  🔧 Review failed steps and fix issues before deployment');
    }

    console.log('\n' + '='.repeat(60));

    // Exit with appropriate code
    process.exit(failureCount === 0 ? 0 : 1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const validator = new PipelineValidator();
  await validator.runCompleteValidation();
}

// Run validation if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('[ERROR] Validation script failed:', error);
    process.exit(1);
  });
}

export { PipelineValidator };
