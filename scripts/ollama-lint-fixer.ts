#!/usr/bin/env tsx

/**
 * Ollama-powered Automated Lint and TypeScript Error Fixer
 *
 * This script uses lightweight Ollama models to automatically fix:
 * - Biome lint violations
 * - TypeScript compilation errors
 *
 * Recommended models for 8GB RAM:
 * - qwen2.5-coder:7b (Primary - 92% precision)
 * - codegemma:7b (Alternative - 90% precision)
 * - phi3:3.8b (Fast option - 88% precision)
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ollama } from 'ollama';
import { Project, SourceFile, SyntaxKind, Node } from 'ts-morph';

interface LintIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
}

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

interface FixResult {
  success: boolean;
  originalCode: string;
  fixedCode: string;
  appliedFixes: string[];
  errors: string[];
}

class OllamaLintFixer {
  private ollama: Ollama;
  private model: string;
  private maxRetries: number = 3;
  private fixedFiles: Set<string> = new Set();
  private project: Project;

  constructor(model: string = 'qwen2.5-coder:7b', host: string = 'http://127.0.0.1:11434') {
    this.ollama = new Ollama({ host });
    this.model = model;
    this.project = new Project({
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: true
    });
  }

  /**
   * Main entry point - fix all lint and TypeScript issues
   */
  async fixAllIssues(): Promise<void> {
    console.log(`🚀 Starting automated lint fixing with model: ${this.model}`);
    console.log(`📍 Current working directory: ${process.cwd()}`);

    try {
      // Check if Ollama is running and model is available
      await this.ensureModelAvailable();

      // Get current issues - start with a specific problematic file for testing
      console.log('🔍 Scanning for lint issues...');
      const biomeIssues = await this.getBiomeIssues('src/features/3d-renderer/hooks/useMatrixOperations.ts');
      const tsErrors = await this.getTypeScriptErrors();

      console.log(
        `📊 Found ${biomeIssues.length} Biome issues and ${tsErrors.length} TypeScript errors`
      );

      if (biomeIssues.length === 0 && tsErrors.length === 0) {
        console.log('✅ No issues found! Code is already clean.');
        return;
      }

      // Fix TypeScript errors first (they often resolve other issues)
      if (tsErrors.length > 0) {
        console.log('\n🔧 Fixing TypeScript errors...');
        await this.fixTypeScriptErrors(tsErrors);
      }

      // Then fix remaining Biome issues
      if (biomeIssues.length > 0) {
        console.log('\n🔧 Fixing Biome lint issues...');
        await this.fixBiomeIssues(biomeIssues);
      }

      // Final validation
      await this.validateFixes();

      console.log(`\n✅ Completed! Fixed ${this.fixedFiles.size} files.`);
    } catch (error) {
      console.error('❌ Error during automated fixing:', error);
      process.exit(1);
    }
  }

  /**
   * Ensure Ollama is running and the model is available
   */
  private async ensureModelAvailable(): Promise<void> {
    try {
      const models = await this.ollama.list();
      const modelExists = models.models.some((m: { name: string }) => m.name.includes(this.model.split(':')[0]));

      if (!modelExists) {
        console.log(`📥 Model ${this.model} not found. Pulling...`);
        await this.ollama.pull({ model: this.model });
        console.log(`✅ Model ${this.model} pulled successfully`);
      }
    } catch (error) {
      throw new Error(`Failed to connect to Ollama or pull model: ${error}`);
    }
  }

  /**
   * Get Biome lint issues using JSON output for better parsing
   */
  private async getBiomeIssues(targetPath: string = '.'): Promise<LintIssue[]> {
    try {
      let output: string;
      try {
        // Use JSON reporter with limited diagnostics to avoid truncation
        output = execSync(`pnpm biome check --reporter=json --max-diagnostics=100 ${targetPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: unknown) {
        // Biome returns non-zero exit code when issues are found
        const execError = error as { stdout?: string; stderr?: string };
        output = execError.stdout || execError.stderr || '';
      }

      // Try to parse as JSON first, then fall back to text parsing
      try {
        const jsonResult = JSON.parse(output);
        return this.parseBiomeJsonOutput(jsonResult);
      } catch {
        return this.parseBiomeTextOutput(output);
      }
    } catch (error) {
      console.warn('Failed to get Biome issues:', error);
      return [];
    }
  }

  /**
   * Parse Biome JSON output format
   */
  private parseBiomeJsonOutput(jsonResult: unknown): LintIssue[] {
    const issues: LintIssue[] = [];

    const result = jsonResult as { diagnostics?: Array<{
      category?: string;
      location?: {
        path?: string;
        span?: {
          start?: {
            line?: number;
            column?: number;
          };
        };
      };
      message?: string | Array<{ content?: string }>;
      severity?: string;
    }> };

    if (result.diagnostics) {
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.location?.path) {
          const filePath = typeof diagnostic.location.path === 'string'
            ? diagnostic.location.path
            : String(diagnostic.location.path);

          // Extract message content
          let message = 'Lint issue detected';
          if (typeof diagnostic.message === 'string') {
            message = diagnostic.message;
          } else if (Array.isArray(diagnostic.message) && diagnostic.message[0]?.content) {
            message = diagnostic.message[0].content;
          }

          issues.push({
            file: filePath.replace(/\\/g, '/'),
            line: diagnostic.location.span?.start?.line || 0,
            column: diagnostic.location.span?.start?.column || 0,
            rule: diagnostic.category || '',
            message,
            severity: diagnostic.severity === 'error' ? 'error' : 'warning'
          });
        }
      }
    }

    return issues;
  }

  /**
   * Parse Biome text output format
   */
  private parseBiomeTextOutput(output: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const lines = output.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for file:line:column pattern like: src\file.ts:167:21
      const match = line.match(/^(.+?):(\d+):(\d+)\s+.*?(\w+\/\w+\/\w+)/);
      if (match) {
        const [, filePath, lineNum, colNum, rule] = match;

        // Look for the error message in subsequent lines
        let message = '';
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          const nextLine = lines[j].trim();
          if (nextLine.startsWith('×')) {
            message = nextLine.replace(/^×\s*/, '');
            break;
          }
        }

        issues.push({
          file: filePath.replace(/\\/g, '/'), // Normalize path separators
          line: parseInt(lineNum),
          column: parseInt(colNum),
          rule: rule,
          message: message || 'Lint issue detected',
          severity: 'error',
        });
      }
    }

    return issues;
  }

  /**
   * Get TypeScript compilation errors
   */
  private async getTypeScriptErrors(): Promise<TypeScriptError[]> {
    try {
      execSync('pnpm type-check', { encoding: 'utf-8', stdio: 'pipe' });
      return []; // No errors
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const errors: TypeScriptError[] = [];

      // Parse TypeScript error format: file(line,column): error TS#### message
      const errorRegex = /(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/g;
      let match: RegExpExecArray | null;

      match = errorRegex.exec(output);
      while (match !== null) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5],
        });
        match = errorRegex.exec(output);
      }

      return errors;
    }
  }

  /**
   * Fix TypeScript errors using AI
   */
  private async fixTypeScriptErrors(errors: TypeScriptError[]): Promise<void> {
    const fileGroups = this.groupErrorsByFile(errors);

    for (const [filePath, fileErrors] of fileGroups) {
      console.log(`🔧 Fixing TypeScript errors in ${filePath}...`);
      await this.fixFileErrors(filePath, fileErrors, 'typescript');
    }
  }

  /**
   * Fix Biome lint issues using AI
   */
  private async fixBiomeIssues(issues: LintIssue[]): Promise<void> {
    const fileGroups = this.groupIssuesByFile(issues);

    for (const [filePath, fileIssues] of fileGroups) {
      console.log(`🔧 Fixing Biome issues in ${filePath}...`);
      await this.fixFileErrors(filePath, fileIssues, 'biome');
    }
  }

  /**
   * Group errors by file for batch processing
   */
  private groupErrorsByFile(errors: TypeScriptError[]): Map<string, TypeScriptError[]> {
    const groups = new Map<string, TypeScriptError[]>();

    for (const error of errors) {
      if (!groups.has(error.file)) {
        groups.set(error.file, []);
      }
      groups.get(error.file)?.push(error);
    }

    return groups;
  }

  /**
   * Group issues by file for batch processing
   */
  private groupIssuesByFile(issues: LintIssue[]): Map<string, LintIssue[]> {
    const groups = new Map<string, LintIssue[]>();

    for (const issue of issues) {
      if (!groups.has(issue.file)) {
        groups.set(issue.file, []);
      }
      groups.get(issue.file)?.push(issue);
    }

    return groups;
  }

  /**
   * Fix errors in a specific file using AI
   */
  private async fixFileErrors(
    filePath: string,
    errors: (TypeScriptError | LintIssue)[],
    type: 'typescript' | 'biome'
  ): Promise<void> {
    try {
      const fullPath = join(process.cwd(), filePath);
      const originalCode = readFileSync(fullPath, 'utf-8');

      const fixResult = await this.generateFix(originalCode, errors, type);

      if (fixResult.success && fixResult.fixedCode !== originalCode) {
        writeFileSync(fullPath, fixResult.fixedCode, 'utf-8');
        this.fixedFiles.add(filePath);
        console.log(`✅ Fixed ${errors.length} issues in ${filePath}`);
      } else {
        console.log(`⚠️  Could not fix issues in ${filePath}: ${fixResult.errors.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error);
    }
  }

  /**
   * Generate AI-powered fix for code issues
   */
  private async generateFix(
    code: string,
    errors: (TypeScriptError | LintIssue)[],
    type: 'typescript' | 'biome'
  ): Promise<FixResult> {
    const errorDescriptions = errors
      .map((error) => {
        if ('code' in error && error.code) {
          return `Line ${error.line}: ${error.message} (${error.code})`;
        }
        return `Line ${error.line}: ${error.message}`;
      })
      .join('\n');

    const prompt = this.buildFixPrompt(code, errorDescriptions, type);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🤖 Attempting fix (${attempt}/${this.maxRetries})...`);

        const response = await this.ollama.generate({
          model: this.model,
          prompt,
          options: {
            temperature: 0.1, // Low temperature for consistent fixes
            top_p: 0.9,
            num_predict: 4096,
          },
        });

        const fixedCode = this.extractCodeFromResponse(response.response);

        if (fixedCode && fixedCode !== code) {
          // Validate that the fixed code is not significantly shorter (indicating truncation)
          const originalLines = code.split('\n').length;
          const fixedLines = fixedCode.split('\n').length;
          const lengthRatio = fixedLines / originalLines;

          if (lengthRatio < 0.8) {
            console.warn(`⚠️  Fixed code is too short (${fixedLines} vs ${originalLines} lines), likely truncated. Retrying...`);
            continue;
          }

          return {
            success: true,
            originalCode: code,
            fixedCode,
            appliedFixes: [`Fixed ${errors.length} ${type} issues`],
            errors: [],
          };
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          return {
            success: false,
            originalCode: code,
            fixedCode: code,
            appliedFixes: [],
            errors: [`All ${this.maxRetries} attempts failed: ${error}`],
          };
        }
      }
    }

    return {
      success: false,
      originalCode: code,
      fixedCode: code,
      appliedFixes: [],
      errors: ['No valid fix generated'],
    };
  }

  /**
   * Build the prompt for AI model
   */
  private buildFixPrompt(code: string, errors: string, type: 'typescript' | 'biome'): string {
    const typeDescription =
      type === 'typescript' ? 'TypeScript compilation errors' : 'Biome lint violations';

    return `You are an expert TypeScript developer. Fix the following ${typeDescription} in this code.

CRITICAL REQUIREMENTS:
1. Return the COMPLETE corrected code - never use placeholders like "// ... (rest of the code remains unchanged)"
2. Include ALL original code with only the specific errors fixed
3. Preserve all existing functionality, imports, exports, and structure
4. Fix only the specific issues mentioned below
5. Use explicit types instead of 'any' when possible
6. Follow modern TypeScript best practices
7. Do not truncate, summarize, or omit any part of the original code
8. The output must be the same length or very similar to the input

ERRORS TO FIX:
${errors}

ORIGINAL CODE (${code.split('\n').length} lines):
\`\`\`typescript
${code}
\`\`\`

FIXED CODE (must be complete, no placeholders, all ${code.split('\n').length} lines):`;
  }

  /**
   * Extract code from AI response and validate it's not placeholder code
   */
  private extractCodeFromResponse(response: string): string {
    // Try to extract code from markdown blocks
    const codeBlockRegex = /```(?:typescript|ts|javascript|js)?\n?([\s\S]*?)\n?```/;
    const match = response.match(codeBlockRegex);

    let extractedCode = match ? match[1].trim() : response.trim();

    // Validate that the code doesn't contain placeholder patterns
    const placeholderPatterns = [
      /\/\/\s*\.\.\.\s*\(rest of the code remains unchanged\)/i,
      /\/\/\s*\.\.\.\s*rest of.*code/i,
      /\/\/\s*\.\.\.\s*remaining code/i,
      /\/\/\s*\.\.\.\s*other.*code/i,
      /\/\/\s*\.\.\.\s*existing.*code/i,
      /\/\*\s*\.\.\.\s*rest of.*code.*\*\//i,
      /\/\*\s*\.\.\.\s*remaining.*code.*\*\//i,
    ];

    for (const pattern of placeholderPatterns) {
      if (pattern.test(extractedCode)) {
        console.warn('⚠️  Detected placeholder code in AI response, rejecting...');
        return '';
      }
    }

    return extractedCode;
  }

  /**
   * Validate that fixes were successful
   */
  private async validateFixes(): Promise<void> {
    console.log('\n🔍 Validating fixes...');

    try {
      // Check TypeScript compilation
      execSync('pnpm type-check', { stdio: 'pipe' });
      console.log('✅ TypeScript compilation successful');
    } catch (_error) {
      console.warn('⚠️  TypeScript errors still remain');
    }

    try {
      // Check Biome issues
      execSync('pnpm biome:check', { stdio: 'pipe' });
      console.log('✅ Biome checks passed');
    } catch (_error) {
      console.warn('⚠️  Biome issues still remain');
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const modelFlag = args.find((arg) => arg.startsWith('--model='));
  const hostFlag = args.find((arg) => arg.startsWith('--host='));

  const model = modelFlag ? modelFlag.split('=')[1] : 'qwen2.5-coder:7b';
  const host = hostFlag ? hostFlag.split('=')[1] : 'http://127.0.0.1:11434';

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🤖 Ollama Automated Lint Fixer

Usage: tsx scripts/ollama-lint-fixer.ts [options]

Options:
  --model=<model>    Ollama model to use (default: qwen2.5-coder:7b)
                     Recommended: qwen2.5-coder:7b, codegemma:7b, phi3:3.8b
  --host=<host>      Ollama host URL (default: http://127.0.0.1:11434)
  --help, -h         Show this help message

Examples:
  tsx scripts/ollama-lint-fixer.ts
  tsx scripts/ollama-lint-fixer.ts --model=codegemma:7b
  tsx scripts/ollama-lint-fixer.ts --model=phi3:3.8b --host=http://localhost:11434

Recommended Models for 8GB RAM:
  - qwen2.5-coder:7b (Best precision: 92%)
  - codegemma:7b (Good stability: 90%)
  - phi3:3.8b (Fastest: 88%)
`);
    process.exit(0);
  }

  const fixer = new OllamaLintFixer(model, host);
  await fixer.fixAllIssues();
}

// Run if called directly
console.log('🔧 Ollama lint fixer starting...');
main().catch(console.error);
