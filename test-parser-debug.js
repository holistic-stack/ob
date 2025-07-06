// Debug script to test OpenSCAD parser initialization
import { OpenscadParser } from './src/features/openscad-parser/openscad-parser.js';

async function testParser() {
  console.log('Creating parser...');
  const parser = new OpenscadParser();

  try {
    console.log('Initializing parser...');
    await parser.init();
    console.log('Parser initialized successfully!');

    // Try to parse simple code
    console.log('Testing simple parse...');
    const result = parser.parseAST('circle(r=5);');
    console.log('Parse result:', result);
    console.log('Result length:', result?.length);

    parser.dispose();
  } catch (error) {
    console.error('Parser initialization failed:', error);
  }
}

testParser();
