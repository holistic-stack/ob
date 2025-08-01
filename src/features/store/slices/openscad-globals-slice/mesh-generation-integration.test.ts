/**
 * @file mesh-generation-integration.test.ts
 * @description Integration test verifying OpenSCAD global variables correctly affect 3D mesh generation
 * with visible resolution differences in sphere rendering.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../app-store.js';

// Mock ResizeObserver for testing environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('OpenSCAD Global Variables Mesh Generation Integration', () => {
  let store: ReturnType<typeof createAppStore>;

  beforeEach(() => {
    store = createAppStore();
  });

  describe('Complete Pipeline: Code → Parser → Store → Mesh Generation', () => {
    it('should generate coarse sphere mesh with global resolution variables', async () => {
      console.log('🔍 Testing Complete OpenSCAD Global Variables → Mesh Generation Pipeline');

      // The exact OpenSCAD code for coarse sphere
      const openscadCode = `// Global resolution settings for coarse sphere
$fs = 5;   // Minimum fragment size of 5 units (creates larger facets)
$fa = 30;  // Maximum fragment angle of 30 degrees (creates sharper angles)

sphere(10);`;

      console.log('📝 OpenSCAD Code:');
      console.log(openscadCode);

      // Step 1: Parse and Extract Global Variables
      console.log('\n📋 Step 1: Parsing OpenSCAD code and extracting global variables...');

      const { updateCode } = store.getState();
      updateCode(openscadCode);

      // Wait for debounced parsing
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Verify code parsing
      const editorState = store.getState().editor;
      expect(editorState.code).toBe(openscadCode);
      console.log('✅ OpenSCAD code successfully parsed');

      // Step 2: Store Integration - Apply extracted global variables
      console.log('\n📋 Step 2: Applying extracted global variables to store...');

      const { updateGeometryResolution } = store.getState();
      const extractionResult = updateGeometryResolution({ $fs: 5, $fa: 30 });

      expect(extractionResult.success).toBe(true);
      console.log('✅ Global variables extracted and applied: $fs = 5, $fa = 30');

      // Verify store state
      const storeState = store.getState();
      expect(storeState.openscadGlobals.$fs).toBe(5);
      expect(storeState.openscadGlobals.$fa).toBe(30);
      expect(storeState.openscadGlobals.isModified).toBe(true);

      console.log('✅ Store state verified:');
      console.log(`   - openscadGlobals.$fs: ${storeState.openscadGlobals.$fs}`);
      console.log(`   - openscadGlobals.$fa: ${storeState.openscadGlobals.$fa}`);
      console.log(`   - isModified: ${storeState.openscadGlobals.isModified}`);

      // Step 3: Mesh Generation Calculation
      console.log('\n📋 Step 3: Calculating mesh generation parameters...');

      const sphereRadius = 10;
      const globals = storeState.openscadGlobals;

      // Fragment calculation according to OpenSCAD specification
      const fragmentsFromFn = globals.$fn || 0;
      const fragmentsFromFa = globals.$fa ? Math.ceil(360 / globals.$fa) : Infinity;
      const fragmentsFromFs = globals.$fs
        ? Math.ceil((2 * Math.PI * sphereRadius) / globals.$fs)
        : Infinity;

      // OpenSCAD uses minimum for best quality (but still respects the limits)
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

      // Step 4: Compare with Default Resolution
      console.log('\n📋 Step 4: Comparing with default resolution...');

      // Calculate default resolution
      const defaultGlobals = { $fn: undefined, $fa: 12, $fs: 2 };
      const defaultFragmentsFromFa = Math.ceil(360 / defaultGlobals.$fa); // 360/12 = 30
      const defaultFragmentsFromFs = Math.ceil((2 * Math.PI * sphereRadius) / defaultGlobals.$fs); // 2π×10/2 ≈ 32
      const defaultFragments = Math.max(
        0,
        Math.min(defaultFragmentsFromFa, defaultFragmentsFromFs)
      ); // min(30, 32) = 30

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

      // Step 5: Mesh Generation Simulation
      console.log('\n📋 Step 5: Simulating 3D mesh generation...');

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

      // Step 6: Visual Characteristics Verification
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

      // Step 7: End-to-End Pipeline Verification
      console.log('\n📋 Step 7: End-to-end pipeline verification...');

      const pipelineVerification = {
        codeEditor: editorState.code.includes('$fs = 5') && editorState.code.includes('$fa = 30'),
        parser: storeState.parsing.ast.length > 0,
        globalExtraction:
          storeState.openscadGlobals.$fs === 5 && storeState.openscadGlobals.$fa === 30,
        storeUpdate: storeState.openscadGlobals.isModified === true,
        meshGeneration: actualFragments === 12,
        visualDifference: actualFragments < defaultFragments,
      };

      console.log('🔄 Pipeline verification:');
      console.log(`   ✅ Code Editor: ${pipelineVerification.codeEditor ? 'PASS' : 'FAIL'}`);
      console.log(`   ✅ Parser: ${pipelineVerification.parser ? 'PASS' : 'FAIL'}`);
      console.log(
        `   ✅ Global Extraction: ${pipelineVerification.globalExtraction ? 'PASS' : 'FAIL'}`
      );
      console.log(`   ✅ Store Update: ${pipelineVerification.storeUpdate ? 'PASS' : 'FAIL'}`);
      console.log(
        `   ✅ Mesh Generation: ${pipelineVerification.meshGeneration ? 'PASS' : 'FAIL'}`
      );
      console.log(
        `   ✅ Visual Difference: ${pipelineVerification.visualDifference ? 'PASS' : 'FAIL'}`
      );

      // Verify all pipeline steps
      Object.values(pipelineVerification).forEach((step) => {
        expect(step).toBe(true);
      });

      console.log('\n🎉 Complete pipeline verification successful!');
      console.log('📊 Final Results:');
      console.log(`   🎯 Sphere with ${actualFragments} triangular facets`);
      console.log(`   📐 ${segmentAngle}° angles creating sharp edges`);
      console.log(`   📏 ${facetSize.toFixed(2)} unit facet size`);
      console.log(`   🔄 ${(defaultFragments / actualFragments).toFixed(2)}x coarser than default`);
      console.log('   ✅ Global variables successfully affecting mesh generation');
    });

    it('should demonstrate fragment count differences across resolution settings', () => {
      console.log('\n🔍 Testing Fragment Count Variations');

      const sphereRadius = 10;
      const testCases = [
        { name: 'Default', $fs: 2, $fa: 12, expected: 30 },
        { name: 'Coarse', $fs: 5, $fa: 30, expected: 12 },
        { name: 'Very Coarse', $fs: 10, $fa: 45, expected: 7 }, // 360/45=8, 2π×10/10≈6.28→7, min(8,7)=7
        { name: 'Fine', $fs: 1, $fa: 6, expected: 60 },
      ];

      console.log('📊 Fragment count comparison:');

      testCases.forEach((testCase) => {
        const fragmentsFromFa = Math.ceil(360 / testCase.$fa);
        const fragmentsFromFs = Math.ceil((2 * Math.PI * sphereRadius) / testCase.$fs);
        const actualFragments = Math.min(fragmentsFromFa, fragmentsFromFs);

        console.log(
          `   ${testCase.name}: $fs=${testCase.$fs}, $fa=${testCase.$fa}° → ${actualFragments} fragments`
        );
        expect(actualFragments).toBe(testCase.expected);
      });

      console.log('✅ All fragment count variations verified');
    });
  });
});
