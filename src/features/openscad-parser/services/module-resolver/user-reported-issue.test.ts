/**
 * @file User-reported issue with module parameter binding.
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { OpenscadParser } from '@/features/openscad-parser';

describe('Module Parameter Binding', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should correctly bind parameters for the user-reported issue', async () => {
    const code = `
      // module with default values
      // sphereSize=5, cubeSize=5, translateValue=10
      module mod1(sphereSize=5, cubeSize=5, translateValue=10){
          sphere(sphereSize);
          translate([translateValue,0,0]) cube(cubeSize);
      }
      mod1();
      translate([0,25,0]) mod1(10,cubeSize=10,translateValue=15);
      translate([0,-25,0]) rotate([0,0,-90]) mod1(sphereSize=10,cubeSize=10,translateValue=15);
      translate([0,50,0]) mod1(10,cubeSize=10);
    `;

    // Create BabylonJS test environment
    const engine = new NullEngine();
    const _scene = new Scene(engine); // Prefixed with _ to indicate intentionally unused

    const result = await parser.parse(code);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const { body } = result.data;

    expect(body).toBeDefined();
    expect(body.length).toBeGreaterThan(0);

    // TODO: Add BabylonJS rendering logic here
    // const _babylonObjects = await renderASTToBabylon(scene, ast);

    // TODO: Add assertions to verify the generated geometry
  });
});
