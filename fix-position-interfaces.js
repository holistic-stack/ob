// Script to fix Position interface issues by adding missing offset property
import fs from 'fs';
import path from 'path';

function fixPositionInterfaces(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match Position objects missing offset property
    // Matches: { line: <number>, column: <number> }
    const positionPattern = /(\{\s*line:\s*\d+,\s*column:\s*\d+\s*\})/g;
    
    let matches = [...content.matchAll(positionPattern)];
    if (matches.length === 0) return;
    
    console.log(`Fixing ${matches.length} Position interfaces in ${filePath}`);
    
    // Replace from end to beginning to preserve indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const originalMatch = match[1];
      
      // Extract line and column numbers
      const lineMatch = originalMatch.match(/line:\s*(\d+)/);
      const columnMatch = originalMatch.match(/column:\s*(\d+)/);
      
      if (lineMatch && columnMatch) {
        const line = parseInt(lineMatch[1]);
        const column = parseInt(columnMatch[1]);
        
        // Calculate a reasonable offset based on line and column
        const offset = (line - 1) * 50 + column - 1;
        
        // Create the replacement with offset
        const replacement = originalMatch.replace(
          /(\{\s*line:\s*\d+,\s*column:\s*\d+)\s*\}/,
          `$1, offset: ${offset} }`
        );
        
        // Replace in content
        content = content.substring(0, match.index) + 
                 replacement + 
                 content.substring(match.index + originalMatch.length);
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${matches.length} Position interfaces in ${filePath}`);
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Get files from command line arguments or default list
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('Usage: node fix-position-interfaces.js <file1> <file2> ...');
  process.exit(1);
}

files.forEach(fixPositionInterfaces);