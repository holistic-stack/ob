import { OpenscadParser } from './src/features/openscad-parser/openscad-parser.js';

const parser = new OpenscadParser();
await parser.init();

console.log('=== recursiveFunction ===');
const code1 = `function factorial(n) = n <= 1 ? 1 : n * factorial(n-1);`;
const ast1 = parser.parseAST(code1);
console.log('Length:', ast1.length);
ast1.forEach((node, i) => console.log('Node', i, ':', node.type));

console.log('\n=== animationExample ===');
const code2 = `rotate([0, 0, $t * 360]) {
    translate([10, 0, 0]) {
        cube([2, 1, 1]);
    }
}`;
const ast2 = parser.parseAST(code2);
console.log('Length:', ast2.length);
ast2.forEach((node, i) => console.log('Node', i, ':', node.type));

console.log('\n=== complexForLoopPattern ===');
const code3 = `for (i = [0:5]) {
    for (j = [0:3]) {
        translate([i*10, j*10, 0]) {
            rotate([0, 0, i*j*15]) {
                cube([5, 5, 1]);
            }
        }
    }
}`;
const ast3 = parser.parseAST(code3);
console.log('Length:', ast3.length);
ast3.forEach((node, i) => console.log('Node', i, ':', node.type));

console.log('\n=== libraryUsagePattern ===');
const code4 = `use <MCAD/boxes.scad>;
include <utils.scad>;

box_width = 50;
box_height = 30;
wall_thickness = 2;

roundedBox([box_width, box_height, 20], wall_thickness, true);`;
const ast4 = parser.parseAST(code4);
console.log('Length:', ast4.length);
ast4.forEach((node, i) => console.log('Node', i, ':', node.type));
