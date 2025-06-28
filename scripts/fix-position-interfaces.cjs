const fs = require('fs');
const path = require('path');

function fixPositionInterfaces(filePath) {
    console.log(`Processing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return 0;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fixCount = 0;
    
    // Pattern 1: {line: number, column: number} -> {line: number, column: number, offset: number}
    const pattern1 = /\{\s*line:\s*(\d+),\s*column:\s*(\d+)\s*\}/g;
    content = content.replace(pattern1, (match, line, column) => {
        fixCount++;
        return `{line: ${line}, column: ${column}, offset: 0}`;
    });
    
    // Pattern 2: Position object with missing offset
    const pattern2 = /position:\s*\{\s*line:\s*(\d+),\s*column:\s*(\d+)\s*\}/g;
    content = content.replace(pattern2, (match, line, column) => {
        fixCount++;
        return `position: {line: ${line}, column: ${column}, offset: 0}`;
    });
    
    // Pattern 3: start/end position objects
    const pattern3 = /(start|end):\s*\{\s*line:\s*(\d+),\s*column:\s*(\d+)\s*\}/g;
    content = content.replace(pattern3, (match, prop, line, column) => {
        fixCount++;
        return `${prop}: {line: ${line}, column: ${column}, offset: 0}`;
    });
    
    if (fixCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${fixCount} Position interface issues in ${filePath}`);
    } else {
        console.log(`No Position interface issues found in ${filePath}`);
    }
    
    return fixCount;
}

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
    console.log('Usage: node fix-position-interfaces.js <file-path>');
    process.exit(1);
}

const totalFixes = fixPositionInterfaces(filePath);
console.log(`Total fixes applied: ${totalFixes}`);