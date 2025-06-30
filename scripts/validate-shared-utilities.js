#!/usr/bin/env node

/**
 * @file Shared Utilities Validation Script
 *
 * Automated quality gate validation to ensure shared utilities are used consistently
 * across the codebase and prevent regression to duplicated code patterns.
 *
 * This script validates:
 * - Consistent usage of shared utilities instead of duplicated code
 * - Proper import patterns for shared utilities
 * - Result<T,E> error handling patterns
 * - Performance logging consistency
 * - JSDoc documentation completeness
 *
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0 - Phase 5: Quality Gates Implementation
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

// Configuration
const CONFIG = {
  sourceDir: 'src/features/ui-components',
  sharedUtilsDir: 'src/features/ui-components/shared',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
  requiredUtilities: {
    createParseError: 'ast-utils',
    formatPerformanceTime: 'ast-utils',
    validateAST: 'ast-utils',
    logASTOperation: 'ast-utils',
  },
};

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
};

/**
 * Main validation function
 */
async function validateSharedUtilities() {
  console.log('🔍 Starting Shared Utilities Validation...\n');

  try {
    // Get all TypeScript files in the source directory
    const files = await getSourceFiles();
    console.log(`📁 Found ${files.length} TypeScript files to validate\n`);

    // Run validation checks
    await validateFiles(files);

    // Generate report
    generateReport();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  }
}

/**
 * Get all TypeScript source files
 */
async function getSourceFiles() {
  return new Promise((resolve, reject) => {
    const pattern = path.join(CONFIG.sourceDir, '**/*.ts');
    const options = {
      ignore: CONFIG.excludePatterns.map((p) => path.join(CONFIG.sourceDir, p)),
    };

    glob(pattern, options, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

/**
 * Validate all files
 */
async function validateFiles(files) {
  for (const file of files) {
    await validateFile(file);
  }
}

/**
 * Validate individual file
 */
async function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  console.log(`🔍 Validating: ${relativePath}`);

  // Skip shared utilities files themselves
  if (filePath.includes('/shared/')) {
    console.log(`  ⏭️  Skipping shared utility file\n`);
    return;
  }

  // Run validation checks
  const checks = [
    validateErrorHandlingPatterns,
    validatePerformanceLogging,
    validateImportPatterns,
    validateResultTypes,
    validateJSDocComments,
  ];

  let fileHasErrors = false;

  for (const check of checks) {
    const result = check(content, relativePath);
    if (result.errors.length > 0) {
      fileHasErrors = true;
      results.errors.push(...result.errors);
    }
    results.warnings += result.warnings;
  }

  if (fileHasErrors) {
    results.failed++;
    console.log(`  ❌ Validation failed\n`);
  } else {
    results.passed++;
    console.log(`  ✅ Validation passed\n`);
  }
}

/**
 * Validate error handling patterns
 */
function validateErrorHandlingPatterns(content, filePath) {
  const errors = [];
  const warnings = 0;

  // Check for manual error object creation instead of createParseError
  const manualErrorPattern =
    /{\s*message:\s*[^,]+,\s*line:\s*\d+,\s*column:\s*\d+,\s*severity:\s*['"]error['"]?\s*}/g;
  const matches = content.match(manualErrorPattern);

  if (matches) {
    errors.push({
      file: filePath,
      type: 'ERROR_HANDLING',
      message: `Manual error object creation detected. Use createParseError() instead.`,
      details: `Found ${matches.length} manual error object(s). Use shared utility createParseError() for consistent error formatting.`,
    });
  }

  // Check for createParseError import when error handling is present
  const hasErrorHandling = content.includes('ParseError') || content.includes('error');
  const hasCreateParseErrorImport = content.includes('createParseError');

  if (hasErrorHandling && !hasCreateParseErrorImport && !filePath.includes('shared/')) {
    errors.push({
      file: filePath,
      type: 'MISSING_IMPORT',
      message: `Error handling detected but createParseError not imported.`,
      details: `Consider importing createParseError from shared/ast-utils for consistent error handling.`,
    });
  }

  return { errors, warnings };
}

/**
 * Validate performance logging patterns
 */
function validatePerformanceLogging(content, filePath) {
  const errors = [];
  const warnings = 0;

  // Check for manual time formatting instead of formatPerformanceTime
  const manualTimePattern = /\$\{[^}]*\.toFixed\(\d+\)\}ms/g;
  const matches = content.match(manualTimePattern);

  if (matches) {
    errors.push({
      file: filePath,
      type: 'PERFORMANCE_LOGGING',
      message: `Manual time formatting detected. Use formatPerformanceTime() instead.`,
      details: `Found ${matches.length} manual time formatting(s). Use shared utility formatPerformanceTime() for consistent formatting.`,
    });
  }

  return { errors, warnings };
}

/**
 * Validate import patterns
 */
function validateImportPatterns(content, filePath) {
  const errors = [];
  const warnings = 0;

  // Check for wildcard imports of shared utilities
  const wildcardImportPattern = /import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]*shared[^'"]*['"];?/g;
  const matches = content.match(wildcardImportPattern);

  if (matches) {
    errors.push({
      file: filePath,
      type: 'IMPORT_PATTERN',
      message: `Wildcard imports of shared utilities detected.`,
      details: `Use specific imports instead of wildcard imports for better tree-shaking and clarity.`,
    });
  }

  return { errors, warnings };
}

/**
 * Validate Result<T,E> type patterns
 */
function validateResultTypes(content, _filePath) {
  const errors = [];
  let warnings = 0;

  // Check for inconsistent Result type usage
  const hasAsyncFunctions = content.includes('async ') || content.includes('Promise<');
  const hasResultType = content.includes('Result<');
  const hasManualSuccessFailure = content.includes('{ success:') && content.includes('error:');

  if (hasAsyncFunctions && hasManualSuccessFailure && !hasResultType) {
    warnings++;
    // Note: This is a warning, not an error, as not all async functions need Result types
  }

  return { errors, warnings };
}

/**
 * Validate JSDoc comments completeness
 */
function validateJSDocComments(content, _filePath) {
  const errors = [];
  let warnings = 0;

  // Check for exported functions without JSDoc
  const exportedFunctionPattern = /export\s+(async\s+)?function\s+\w+/g;
  const jsdocPattern = /\/\*\*[\s\S]*?\*\//g;

  const exportedFunctions = content.match(exportedFunctionPattern) || [];
  const jsdocComments = content.match(jsdocPattern) || [];

  if (exportedFunctions.length > jsdocComments.length) {
    warnings += exportedFunctions.length - jsdocComments.length;
  }

  return { errors, warnings };
}

/**
 * Generate validation report
 */
function generateReport() {
  console.log('\n📊 Validation Report');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed} files`);
  console.log(`❌ Failed: ${results.failed} files`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`🚨 Total Errors: ${results.errors.length}\n`);

  if (results.errors.length > 0) {
    console.log('🔍 Detailed Error Report:');
    console.log('-'.repeat(30));

    // Group errors by type
    const errorsByType = {};
    results.errors.forEach((error) => {
      if (!errorsByType[error.type]) {
        errorsByType[error.type] = [];
      }
      errorsByType[error.type].push(error);
    });

    Object.keys(errorsByType).forEach((type) => {
      console.log(`\n📋 ${type} (${errorsByType[type].length} errors):`);
      errorsByType[type].forEach((error) => {
        console.log(`  📁 ${error.file}`);
        console.log(`     ${error.message}`);
        console.log(`     ${error.details}\n`);
      });
    });
  }

  // Recommendations
  if (results.failed > 0 || results.warnings > 0) {
    console.log('\n💡 Recommendations:');
    console.log('-'.repeat(20));
    console.log('1. Use createParseError() for consistent error formatting');
    console.log('2. Use formatPerformanceTime() for consistent time formatting');
    console.log('3. Import specific functions instead of wildcard imports');
    console.log('4. Add JSDoc comments to exported functions');
    console.log('5. Consider using Result<T,E> types for error handling');
    console.log('\n📖 See docs/shared-utilities-guide.md for detailed guidance');
  }

  console.log(`\n${'='.repeat(50)}`);

  if (results.failed === 0) {
    console.log('🎉 All validations passed! Shared utilities are being used consistently.');
  } else {
    console.log('❌ Validation failed. Please address the errors above.');
  }
}

// Run validation if this script is executed directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  validateSharedUtilities();
}

export { validateSharedUtilities, CONFIG };
