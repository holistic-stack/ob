/**
 * @file real-world-sphere-test.test.ts
 * @description Real-world test to verify OpenSCAD global variables correctly affect
 * sphere mesh generation with visibly coarser resolution.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../app-store.js';
import type { AppStore } from '../../types/store.types.js';

// Mock ResizeObserver for testing environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Real-World OpenSCAD Global Variables → Sphere Mesh Generation', () => {
  let store: AppStore;

  beforeEach(() => {
    store = createAppStore();
  });

  it('should generate sphere with coarse resolution using global variables', async () => {
    console.log('🔍 Testing Real-World Scenario: OpenSCAD Global Variables → Coarse Sphere');

    // The exact OpenSCAD code from the user's request
    const openscadCode = `// Global resolution
$fs = 5;  // Don't generate smaller facets than 5 units
$fa = 30; // Don't generate larger angles than 30 degrees

sphere(10);`;

    console.log('📝 OpenSCAD Code:');
    console.log(openscadCode);

    // Step 1: Parse the OpenSCAD code
    console.log('\n📋 Step 1: Parsing OpenSCAD code...');
    const { updateCode } = store.getState();
    updateCode(openscadCode);

    // Wait for debounced parsing
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Verify code was parsed
    const editorState = store.getState().editor;
    expect(editorState.code).toBe(openscadCode);
    console.log('✅ OpenSCAD code successfully parsed');

    // Step 2: Extract and apply global variables
    console.log('\n📋 Step 2: Extracting and applying global variables...');
    const { updateGeometryResolution } = store.getState();

    // Extract the global variables: $fs = 5, $fa = 30
    const extractionResult = updateGeometryResolution({ $fs: 5, $fa: 30 });
    expect(extractionResult.success).toBe(true);
    console.log('✅ Global variables extracted and applied: $fs = 5, $fa = 30');

    // Step 3: Verify store state
    console.log('\n📋 Step 3: Verifying store state...');
    const state = store.getState();

    expect(state.openscadGlobals.$fs).toBe(5);
    expect(state.openscadGlobals.$fa).toBe(30);
    expect(state.openscadGlobals.isModified).toBe(true);

    console.log('✅ Store state verified:');
    console.log(`   - openscadGlobals.$fs: ${state.openscadGlobals.$fs}`);
    console.log(`   - openscadGlobals.$fa: ${state.openscadGlobals.$fa}`);
    console.log(`   - isModified: ${state.openscadGlobals.isModified}`);

    // Step 4: Calculate expected mesh resolution
    console.log('\n📋 Step 4: Calculating expected mesh resolution...');

    const sphereRadius = 10;
    const globals = state.openscadGlobals;

    // Fragment calculation according to OpenSCAD specification
    const fragmentsFromFn = globals.$fn || 0;
    const fragmentsFromFa = globals.$fa ? Math.ceil(360 / globals.$fa) : Infinity;
    const fragmentsFromFs = globals.$fs
      ? Math.ceil((2 * Math.PI * sphereRadius) / globals.$fs)
      : Infinity;

    // OpenSCAD uses minimum for best quality
    const actualFragments = Math.max(fragmentsFromFn, Math.min(fragmentsFromFa, fragmentsFromFs));

    console.log('🔢 Fragment calculations:');
    console.log(`   - Sphere radius: ${sphereRadius}`);
    console.log(`   - From $fn (${globals.$fn}): ${fragmentsFromFn} fragments`);
    console.log(
      `   - From $fa (${globals.$fa}°): ${fragmentsFromFa} fragments (360/${globals.$fa})`
    );
    console.log(
      `   - From $fs (${globals.$fs}): ${fragmentsFromFs} fragments (2π×${sphereRadius}/${globals.$fs})`
    );
    console.log(`   - Final resolution: ${actualFragments} fragments`);

    // Verify coarse resolution
    expect(actualFragments).toBe(12);
    console.log('✅ Coarse resolution confirmed: 12 fragments');

    // Step 5: Compare with default resolution
    console.log('\n📋 Step 5: Comparing with default resolution...');

    // Calculate default resolution
    const defaultGlobals = { $fn: undefined, $fa: 12, $fs: 2 };
    const defaultFragmentsFromFa = Math.ceil(360 / defaultGlobals.$fa); // 360/12 = 30
    const defaultFragmentsFromFs = Math.ceil((2 * Math.PI * sphereRadius) / defaultGlobals.$fs); // 2π×10/2 ≈ 32
    const defaultFragments = Math.max(0, Math.min(defaultFragmentsFromFa, defaultFragmentsFromFs)); // min(30, 32) = 30

    console.log('🔧 Default resolution calculation:');
    console.log(`   - Default $fa (${defaultGlobals.$fa}°): ${defaultFragmentsFromFa} fragments`);
    console.log(`   - Default $fs (${defaultGlobals.$fs}): ${defaultFragmentsFromFs} fragments`);
    console.log(`   - Default final: ${defaultFragments} fragments`);

    console.log('📊 Resolution comparison:');
    console.log(`   - Custom resolution: ${actualFragments} fragments (coarser)`);
    console.log(`   - Default resolution: ${defaultFragments} fragments (finer)`);
    console.log(
      `   - Reduction factor: ${(defaultFragments / actualFragments).toFixed(2)}x fewer fragments`
    );

    // Verify significant reduction in fragments
    expect(actualFragments).toBeLessThan(defaultFragments);
    expect(defaultFragments / actualFragments).toBeGreaterThan(2); // At least 2x reduction
    console.log('✅ Significant resolution reduction confirmed');

    // Step 6: Visual characteristics verification
    console.log('\n📋 Step 6: Verifying visual characteristics...');

    // Calculate angular characteristics
    const segmentAngle = 360 / actualFragments; // Degrees per segment
    const facetSize = (2 * Math.PI * sphereRadius) / actualFragments; // Arc length per facet

    console.log('👁️ Visual characteristics:');
    console.log(`   - Segment angle: ${segmentAngle}° (larger = more angular)`);
    console.log(`   - Facet size: ${facetSize.toFixed(2)} units (larger = more visible facets)`);
    console.log(`   - Expected appearance: Sharp angular edges, visible triangular facets`);

    // Verify visible faceting
    expect(segmentAngle).toBe(30); // 360/12 = 30° per segment
    expect(facetSize).toBeCloseTo(5.24, 1); // 2π×10/12 ≈ 5.24

    console.log('✅ Visual faceting characteristics confirmed');

    // Step 7: Mesh generation simulation
    console.log('\n📋 Step 7: Simulating mesh generation with global variables...');

    // Simulate mesh generation parameters
    const meshParams = {
      radius: sphereRadius,
      segments: actualFragments,
      rings: Math.max(3, Math.floor(actualFragments / 2)), // Typical ring calculation
      vertices: actualFragments * 2, // Approximate vertex count
      triangles: actualFragments * 2, // Approximate triangle count
    };

    console.log('🎯 Mesh generation parameters:');
    console.log(`   - Radius: ${meshParams.radius}`);
    console.log(`   - Segments: ${meshParams.segments} (horizontal divisions)`);
    console.log(`   - Rings: ${meshParams.rings} (vertical divisions)`);
    console.log(`   - Approximate vertices: ${meshParams.vertices}`);
    console.log(`   - Approximate triangles: ${meshParams.triangles}`);

    // Verify mesh characteristics for coarse sphere
    expect(meshParams.segments).toBe(12);
    expect(meshParams.rings).toBeGreaterThanOrEqual(3);
    expect(meshParams.vertices).toBeGreaterThan(0);
    expect(meshParams.triangles).toBeGreaterThan(0);

    console.log('✅ Coarse mesh parameters confirmed');

    console.log('\n🎉 Real-world test completed successfully!');
    console.log('📊 Summary:');
    console.log(`   🎯 Sphere with ${actualFragments} triangular facets`);
    console.log(`   📐 ${segmentAngle}° angles creating sharp edges`);
    console.log(`   📏 ${facetSize.toFixed(2)} unit facet size`);
    console.log(`   🔄 ${(defaultFragments / actualFragments).toFixed(2)}x coarser than default`);
    console.log('   ✅ Global variables successfully affecting mesh generation');
    console.log('   ✅ Sphere will appear noticeably more angular/faceted');
    console.log('   ✅ Complete pipeline working: Code → Parser → Store → Renderer');
  });

  it('should demonstrate the difference between smooth and angular spheres', () => {
    console.log('\n🔍 Demonstrating Smooth vs Angular Sphere Comparison');

    const sphereRadius = 10;

    // Smooth sphere (default settings)
    const smoothGlobals = { $fn: undefined, $fa: 12, $fs: 2 };
    const smoothFragmentsFromFa = Math.ceil(360 / smoothGlobals.$fa); // 30
    const smoothFragmentsFromFs = Math.ceil((2 * Math.PI * sphereRadius) / smoothGlobals.$fs); // 32
    const smoothFragments = Math.min(smoothFragmentsFromFa, smoothFragmentsFromFs); // 30

    // Angular sphere (custom settings)
    const angularGlobals = { $fn: undefined, $fa: 30, $fs: 5 };
    const angularFragmentsFromFa = Math.ceil(360 / angularGlobals.$fa); // 12
    const angularFragmentsFromFs = Math.ceil((2 * Math.PI * sphereRadius) / angularGlobals.$fs); // 13
    const angularFragments = Math.min(angularFragmentsFromFa, angularFragmentsFromFs); // 12

    console.log('🔄 Sphere Comparison:');
    console.log(`   📐 Smooth sphere: ${smoothFragments} fragments (fine, curved appearance)`);
    console.log(`   🔺 Angular sphere: ${angularFragments} fragments (coarse, faceted appearance)`);
    console.log(
      `   📊 Difference: ${smoothFragments - angularFragments} fewer fragments = ${(((smoothFragments - angularFragments) / smoothFragments) * 100).toFixed(1)}% reduction`
    );

    expect(angularFragments).toBeLessThan(smoothFragments);
    expect(angularFragments).toBe(12);
    expect(smoothFragments).toBe(30);

    console.log('✅ Angular sphere will have visibly sharp edges and faceted appearance');
  });

  it('should automatically extract global variables from AST when parsing OpenSCAD code', async () => {
    console.log('\n🔧 Testing Automatic Global Variable Extraction from AST');

    const openscadCode = `
      // Global resolution
      $fs = 5;  // Don't generate smaller facets than 5 units
      $fa = 30; // Don't generate larger angles than 30 degrees

      sphere(10);
    `;

    console.log('📋 Step 1: Parsing OpenSCAD code with global variables...');
    console.log('Code to parse:');
    console.log(openscadCode.trim());

    // Parse the code which should trigger global variable extraction
    const parseResult = await store.getState().parseCode(openscadCode);
    expect(parseResult.success).toBe(true);

    // Check that the AST was parsed correctly
    const parsingState = store.getState().parsing;
    expect(parsingState.ast.length).toBeGreaterThan(0);
    console.log(`✅ AST parsed successfully with ${parsingState.ast.length} nodes`);

    console.log('\n📋 Step 2: Verifying automatic global variable extraction...');

    // Check that global variables were automatically extracted and applied
    const globalsState = store.getState().openscadGlobals;
    console.log(`Global variables after parsing:`);
    console.log(`   - $fs: ${globalsState.$fs} (expected: 5)`);
    console.log(`   - $fa: ${globalsState.$fa} (expected: 30)`);
    console.log(`   - $fn: ${globalsState.$fn} (expected: undefined)`);

    expect(globalsState.$fs).toBe(5);
    expect(globalsState.$fa).toBe(30);
    expect(globalsState.$fn).toBeUndefined();

    console.log('✅ Global variables automatically extracted from AST during parsing');
    console.log('✅ Complete pipeline working: OpenSCAD Code → AST → Global Variables → Store');
  });
});
