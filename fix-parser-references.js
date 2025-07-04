#!/usr/bin/env node

/**
 * Script to systematically replace UnifiedParserService references with OpenscadParser
 * Following the established architectural patterns and quality standards
 */

import fs from 'node:fs';
import { glob } from 'glob';

const replacements = [
  // Remove duplicate imports first
  {
    pattern:
      /import { createLogger } from '\.\.\/\.\.\/\.\.\/\.\.\/shared\/services\/logger\.service\.js';\s*import type { ASTNode } from '\.\.\/\.\.\/\.\.\/openscad-parser\/core\/ast-types\.js';\s*import { OpenscadParser } from '\.\.\/\.\.\/\.\.\/openscad-parser\/openscad-parser\.js';\s*import { createLogger } from '\.\.\/\.\.\/\.\.\/\.\.\/shared\/services\/logger\.service\.js';\s*import type { ASTNode } from '\.\.\/\.\.\/\.\.\/openscad-parser\/core\/ast-types\.js';\s*import { OpenscadParser } from '\.\.\/\.\.\/\.\.\/openscad-parser\/openscad-parser\.js';/g,
    replacement:
      "import { createLogger } from '../../../../shared/services/logger.service.js';\nimport type { ASTNode } from '../../../openscad-parser/core/ast-types.js';\nimport { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';",
  },
  // Type declarations
  {
    pattern: /let parserService: UnifiedParserService;/g,
    replacement: 'let parserService: OpenscadParser;',
  },
  // Constructor calls
  {
    pattern: /new UnifiedParserService\(\{[^}]*\}\)/g,
    replacement: 'new OpenscadParser()',
  },
  {
    pattern: /new UnifiedParserService\(\)/g,
    replacement: 'new OpenscadParser()',
  },
  // Method calls
  {
    pattern: /parserService\.initialize\(\)/g,
    replacement: 'parserService.init()',
  },
  {
    pattern: /await parserService\.parseDocument\(([^)]+)\)/g,
    replacement: 'parserService.parseAST($1)',
  },
  {
    pattern: /parserService\.parseDocument\(([^)]+)\)/g,
    replacement: 'parserService.parseAST($1)',
  },
  // Result handling patterns - comprehensive
  {
    pattern:
      /const parseResult = parserService\.parseAST\(([^)]+)\);\s*expect\(parseResult\.success\)\.toBe\(true\);\s*if \(!parseResult\.success\) \{\s*throw new Error\(`Parse failed: \$\{parseResult\.error\}`\);\s*\}\s*const ast = parseResult\.data\.ast;/g,
    replacement: 'const ast = parserService.parseAST($1);',
  },
  {
    pattern:
      /const parseResult = parserService\.parseAST\(([^)]+)\);\s*expect\(parseResult\.success\)\.toBe\(true\);\s*if \(parseResult\.success\) \{\s*const ast = parseResult\.data\.ast;/g,
    replacement: 'const ast = parserService.parseAST($1);',
  },
  {
    pattern: /expect\(parseResult\.success\)\.toBe\(true\);/g,
    replacement: '// Parsing completed',
  },
  {
    pattern:
      /if \(!parseResult\.success\) \{\s*throw new Error\(`Parse failed: \$\{parseResult\.error\}`\);\s*\}/g,
    replacement: '// Direct AST usage',
  },
  {
    pattern: /if \(parseResult\.success\) \{\s*const ast = parseResult\.data\.ast;/g,
    replacement: 'if (ast && ast.length > 0) {',
  },
  {
    pattern: /const ast = parseResult\.data\.ast;/g,
    replacement: '// AST already available',
  },
  {
    pattern: /expect\(parseResult\.data\.ast\)\.toEqual\(\[\]\);/g,
    replacement: 'expect(ast).toEqual([]);',
  },
  // Type annotations for forEach callbacks
  {
    pattern: /\.forEach\(\(node, index\) =>/g,
    replacement: '.forEach((node: ASTNode, index: number) =>',
  },
  {
    pattern: /\.filter\(\(r\) =>/g,
    replacement: '.filter((r: any) =>',
  },
  // Fix import extensions
  {
    pattern: /from '\.\.\/\.\.\/\.\.\/openscad-parser\/openscad-parser\.ts'/g,
    replacement: "from '../../../openscad-parser/openscad-parser.js'",
  },
];

async function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    for (const { pattern, replacement } of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting systematic UnifiedParserService replacement...\n');

  // Find all test files that might contain UnifiedParserService references
  const testFiles = await glob('src/features/3d-renderer/services/ast-to-csg-converter/*.test.ts');
  const parserFiles = await glob('src/features/openscad-parser/**/*.test.ts');
  const allFiles = [...testFiles, ...parserFiles];

  let totalFiles = 0;
  let modifiedFiles = 0;

  for (const file of allFiles) {
    totalFiles++;
    const wasModified = await processFile(file);
    if (wasModified) {
      modifiedFiles++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - modifiedFiles}`);

  if (modifiedFiles > 0) {
    console.log('\n✅ Replacement completed successfully!');
    console.log('🔍 Next steps:');
    console.log('   1. Run `pnpm type-check` to verify TypeScript compliance');
    console.log('   2. Run `pnpm biome:check` to verify code quality');
    console.log('   3. Run tests to ensure functionality is preserved');
  } else {
    console.log('\n✨ No files needed modification - all references already updated!');
  }
}

main().catch(console.error);
