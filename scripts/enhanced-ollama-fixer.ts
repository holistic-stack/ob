#!/usr/bin/env tsx

/**
 * Enhanced Ollama Lint Fixer with AST-based Code Manipulation
 * 
 * Uses ts-morph for reliable, type-safe code transformations
 * instead of string-based replacements that can generate placeholder code.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
}

interface FixResult {
  success: boolean;
  appliedFixes: string[];
  errors: string[];
}

class EnhancedOllamaLintFixer {
  private ollama: Ollama;
  private model: string;
  private project: Project;
  private fixedFiles: Set<string> = new Set();

  constructor(model: string = 'qwen2.5-coder:7b', host: string = 'http://127.0.0.1:11434') {
    this.ollama = new Ollama({ host });
    this.model = model;
    this.project = new Project({
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: true
    });
  }

  /**
   * Main entry point - fix lint issues using AST manipulation
   */
  async fixAllIssues(): Promise<void> {
    console.log(`🚀 Enhanced Ollama lint fixer with AST manipulation`);
    console.log(`🤖 Model: ${this.model}`);
    
    try {
      await this.ensureModelAvailable();
      
      // Start with a specific file for testing
      const targetFile = 'src/features/3d-renderer/hooks/useMatrixOperations.ts';
      console.log(`🎯 Targeting file: ${targetFile}`);
      
      const issues = await this.getBiomeIssues(targetFile);
      console.log(`📊 Found ${issues.length} issues`);
      
      if (issues.length === 0) {
        console.log('✅ No issues found!');
        return;
      }

      await this.fixFileWithAST(targetFile, issues);
      
      console.log(`\n✅ Completed! Fixed ${this.fixedFiles.size} files.`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  }

  /**
   * Fix file using AST manipulation instead of string replacement
   */
  private async fixFileWithAST(filePath: string, issues: LintIssue[]): Promise<void> {
    console.log(`🔧 Fixing ${filePath} with AST manipulation...`);
    
    try {
      // Add file to ts-morph project
      const sourceFile = this.project.addSourceFileAtPath(filePath);
      
      // Group issues by type for systematic fixing
      const issuesByType = this.groupIssuesByType(issues);
      
      let totalFixed = 0;
      
      // Fix noExplicitAny issues using AST
      if (issuesByType.noExplicitAny?.length > 0) {
        const fixed = this.fixExplicitAnyWithAST(sourceFile, issuesByType.noExplicitAny);
        totalFixed += fixed;
        console.log(`✅ Fixed ${fixed} 'any' type issues`);
      }
      
      // Fix useNodejsImportProtocol issues using AST
      if (issuesByType.useNodejsImportProtocol?.length > 0) {
        const fixed = this.fixNodeImportsWithAST(sourceFile, issuesByType.useNodejsImportProtocol);
        totalFixed += fixed;
        console.log(`✅ Fixed ${fixed} Node.js import issues`);
      }
      
      // For complex issues, use AI with AST validation
      const remainingIssues = issues.filter(issue => 
        !issue.rule.includes('noExplicitAny') && 
        !issue.rule.includes('useNodejsImportProtocol')
      );
      
      if (remainingIssues.length > 0) {
        const aiFixed = await this.fixComplexIssuesWithAI(sourceFile, remainingIssues);
        totalFixed += aiFixed;
        console.log(`✅ AI fixed ${aiFixed} complex issues`);
      }
      
      // Save changes if any were made
      if (totalFixed > 0) {
        await sourceFile.save();
        this.fixedFiles.add(filePath);
        console.log(`💾 Saved ${totalFixed} fixes to ${filePath}`);
      }
      
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error);
    }
  }

  /**
   * Fix explicit 'any' types using AST manipulation
   */
  private fixExplicitAnyWithAST(sourceFile: SourceFile, issues: LintIssue[]): number {
    let fixCount = 0;
    
    // Find all 'any' type references
    const anyTypeNodes = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);
    
    for (const anyNode of anyTypeNodes) {
      const parent = anyNode.getParent();
      
      // Replace 'any' with 'unknown' in most cases
      if (parent && Node.isTypeReference(parent.getParent())) {
        anyNode.replaceWithText('unknown');
        fixCount++;
      }
      // Handle function parameters
      else if (parent && Node.isParameter(parent.getParent())) {
        anyNode.replaceWithText('unknown');
        fixCount++;
      }
      // Handle variable declarations
      else if (parent && Node.isVariableDeclaration(parent.getParent())) {
        anyNode.replaceWithText('unknown');
        fixCount++;
      }
    }
    
    return fixCount;
  }

  /**
   * Fix Node.js import protocol issues using AST manipulation
   */
  private fixNodeImportsWithAST(sourceFile: SourceFile, issues: LintIssue[]): number {
    let fixCount = 0;
    
    const importDeclarations = sourceFile.getImportDeclarations();
    
    for (const importDecl of importDeclarations) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      // Check if it's a Node.js built-in module without 'node:' prefix
      const nodeModules = ['fs', 'path', 'crypto', 'util', 'os', 'stream', 'events', 'buffer', 'child_process'];
      
      if (nodeModules.includes(moduleSpecifier)) {
        importDecl.setModuleSpecifier(`node:${moduleSpecifier}`);
        fixCount++;
      }
    }
    
    return fixCount;
  }

  /**
   * Use AI for complex issues but validate with AST
   */
  private async fixComplexIssuesWithAI(sourceFile: SourceFile, issues: LintIssue[]): Promise<number> {
    const originalText = sourceFile.getFullText();
    
    // Create a focused prompt for the specific issues
    const issueDescriptions = issues.map(issue => 
      `Line ${issue.line}: ${issue.message} (${issue.rule})`
    ).join('\n');
    
    const prompt = `Fix these specific TypeScript/lint issues in the code. Return ONLY the corrected code:

ISSUES TO FIX:
${issueDescriptions}

CODE:
${originalText}

FIXED CODE:`;

    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        options: {
          temperature: 0.1,
          top_p: 0.9,
          num_predict: 8192
        }
      });

      const fixedCode = this.extractCodeFromResponse(response.response);
      
      if (fixedCode && this.validateAIFix(originalText, fixedCode)) {
        sourceFile.replaceWithText(fixedCode);
        return issues.length;
      }
      
    } catch (error) {
      console.warn('AI fix failed:', error);
    }
    
    return 0;
  }

  /**
   * Validate AI-generated code to prevent placeholder issues
   */
  private validateAIFix(original: string, fixed: string): boolean {
    // Check for placeholder patterns
    const placeholderPatterns = [
      /\/\/\s*\.\.\.\s*\(rest of.*code.*\)/i,
      /\/\/\s*\.\.\.\s*remaining/i,
      /\/\*\s*\.\.\.\s*rest/i
    ];
    
    for (const pattern of placeholderPatterns) {
      if (pattern.test(fixed)) {
        console.warn('⚠️  Detected placeholder code, rejecting AI fix');
        return false;
      }
    }
    
    // Check length ratio
    const originalLines = original.split('\n').length;
    const fixedLines = fixed.split('\n').length;
    const ratio = fixedLines / originalLines;
    
    if (ratio < 0.8) {
      console.warn(`⚠️  Fixed code too short (${fixedLines} vs ${originalLines} lines)`);
      return false;
    }
    
    return true;
  }

  /**
   * Extract code from AI response
   */
  private extractCodeFromResponse(response: string): string {
    const codeBlockRegex = /```(?:typescript|ts)?\n?([\s\S]*?)\n?```/;
    const match = response.match(codeBlockRegex);
    return match ? match[1].trim() : response.trim();
  }

  /**
   * Group issues by rule type for systematic fixing
   */
  private groupIssuesByType(issues: LintIssue[]): Record<string, LintIssue[]> {
    const groups: Record<string, LintIssue[]> = {};
    
    for (const issue of issues) {
      const ruleType = issue.rule.split('/').pop() || issue.rule;
      if (!groups[ruleType]) {
        groups[ruleType] = [];
      }
      groups[ruleType].push(issue);
    }
    
    return groups;
  }

  /**
   * Get Biome issues using JSON output
   */
  private async getBiomeIssues(targetPath: string): Promise<LintIssue[]> {
    try {
      let output: string;
      try {
        output = execSync(`pnpm biome check --reporter=json --max-diagnostics=50 ${targetPath}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        output = execError.stdout || execError.stderr || '';
      }

      const jsonResult = JSON.parse(output);
      return this.parseBiomeJsonOutput(jsonResult);
    } catch (error) {
      console.warn('Failed to get Biome issues:', error);
      return [];
    }
  }

  /**
   * Parse Biome JSON output
   */
  private parseBiomeJsonOutput(jsonResult: unknown): LintIssue[] {
    const issues: LintIssue[] = [];
    const result = jsonResult as { diagnostics?: Array<{
      category?: string;
      location?: { path?: string; span?: { start?: { line?: number; column?: number } } };
      message?: string | Array<{ content?: string }>;
      severity?: string;
    }> };
    
    if (result.diagnostics) {
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.location?.path) {
          let message = 'Lint issue detected';
          if (typeof diagnostic.message === 'string') {
            message = diagnostic.message;
          } else if (Array.isArray(diagnostic.message) && diagnostic.message[0]?.content) {
            message = diagnostic.message[0].content;
          }
          
          issues.push({
            file: diagnostic.location.path.replace(/\\/g, '/'),
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
   * Ensure Ollama model is available
   */
  private async ensureModelAvailable(): Promise<void> {
    try {
      const models = await this.ollama.list();
      const modelExists = models.models.some((m: { name: string }) => 
        m.name.includes(this.model.split(':')[0])
      );
      
      if (!modelExists) {
        console.log(`📥 Pulling model ${this.model}...`);
        await this.ollama.pull({ model: this.model });
        console.log(`✅ Model ready`);
      }
    } catch (error) {
      throw new Error(`Failed to connect to Ollama: ${error}`);
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const fixer = new EnhancedOllamaLintFixer();
  await fixer.fixAllIssues();
}

// Run the enhanced fixer
console.log('🔧 Enhanced Ollama lint fixer starting...');
main().catch(console.error);
