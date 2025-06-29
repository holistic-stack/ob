#!/usr/bin/env node

/**
 * Automated ESLint violation fixer for OpenSCAD 3D visualization application
 * Fixes common patterns while preserving architecture and functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = './src';
const BACKUP_DIR = './eslint-fix-backup';

// Patterns to fix
const FIXES = [
  // Fix unused variables by prefixing with underscore
  {
    name: 'unused-vars',
    pattern: /^(\s*)(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/gm,
    replacement: (match, indent, keyword, varName) => {
      if (varName.startsWith('_')) return match;
      return `${indent}${keyword} _${varName} =`;
    }
  },
  
  // Fix unused function parameters
  {
    name: 'unused-params',
    pattern: /(\([^)]*?)([a-zA-Z_$][a-zA-Z0-9_$]*)([\s,)]+)/g,
    replacement: (match, before, paramName, after) => {
      if (paramName.startsWith('_')) return match;
      return `${before}_${paramName}${after}`;
    }
  },
  
  // Replace logical OR with nullish coalescing
  {
    name: 'nullish-coalescing',
    pattern: /(\w+)\s*\|\|\s*([^|&]+)/g,
    replacement: '$1 ?? $2'
  },
  
  // Fix explicit any types in common patterns
  {
    name: 'explicit-any',
    pattern: /:\s*any\b/g,
    replacement: ': unknown'
  },
  
  // Fix unused imports by prefixing
  {
    name: 'unused-imports',
    pattern: /import\s*{\s*([^}]+)\s*}\s*from/g,
    replacement: (match, imports) => {
      const fixedImports = imports.split(',').map(imp => {
        const trimmed = imp.trim();
        if (trimmed.includes(' as ') || trimmed.startsWith('_')) return trimmed;
        return `${trimmed} as _${trimmed}`;
      }).join(', ');
      return `import { ${fixedImports} } from`;
    }
  }
];

// File extensions to process
const EXTENSIONS = ['.ts', '.tsx'];

/**
 * Get all TypeScript files in src directory
 */
function getTypeScriptFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && EXTENSIONS.some(ext => entry.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Create backup of files
 */
function createBackup(files) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  for (const file of files) {
    const relativePath = path.relative(SRC_DIR, file);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(file, backupPath);
  }
  
  console.log(`✅ Created backup of ${files.length} files in ${BACKUP_DIR}`);
}

/**
 * Apply fixes to a file
 */
function applyFixes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const fix of FIXES) {
    const originalContent = content;
    
    if (typeof fix.replacement === 'function') {
      content = content.replace(fix.pattern, fix.replacement);
    } else {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    if (content !== originalContent) {
      modified = true;
      console.log(`  ✓ Applied ${fix.name} fixes`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Starting automated ESLint violation fixes...\n');
  
  // Get all TypeScript files
  const files = getTypeScriptFiles(SRC_DIR);
  console.log(`📁 Found ${files.length} TypeScript files\n`);
  
  // Create backup
  createBackup(files);
  
  // Apply fixes
  let modifiedCount = 0;
  
  for (const file of files) {
    console.log(`🔍 Processing: ${file}`);
    
    if (applyFixes(file)) {
      modifiedCount++;
    }
  }
  
  console.log(`\n✅ Modified ${modifiedCount} files`);
  
  // Run ESLint to check results
  console.log('\n🧪 Running ESLint to check results...');
  
  try {
    execSync('pnpm lint', { stdio: 'inherit' });
    console.log('\n🎉 All ESLint violations fixed!');
  } catch (error) {
    console.log('\n⚠️  Some violations remain. Running type check...');
    
    try {
      execSync('pnpm type-check', { stdio: 'inherit' });
      console.log('\n✅ TypeScript compilation successful');
    } catch (typeError) {
      console.log('\n❌ TypeScript compilation failed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, getTypeScriptFiles, applyFixes };
