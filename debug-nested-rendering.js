/**
 * Debug script to test the specific nested OpenSCAD code rendering issue
 */

const userCode = `
translate([24,0,0]) {
  union() {
    cube(15, center=true);
    sphere(10);
  }
  translate([24,0,0]) {
    difference() {
      cube(15, center=true);
      sphere(10);
    }
    translate([24,0,0])
      intersection() {
        cube(15, center=true);
        sphere(10);
      }
  }
}
`;

console.log('OpenSCAD Code to test:');
console.log(userCode);
console.log('\nExpected result: 3 objects at positions [24,0,0], [48,0,0], and [72,0,0]');
console.log('- Union at [24,0,0]');
console.log('- Difference at [48,0,0]');
console.log('- Intersection at [72,0,0]');

// Instructions for manual testing
console.log('\n=== MANUAL TESTING INSTRUCTIONS ===');
console.log('1. Open http://localhost:5175/ in browser');
console.log('2. Paste the above OpenSCAD code into the editor');
console.log('3. Check if all 3 objects render correctly');
console.log('4. Verify positions and CSG operations work as expected');