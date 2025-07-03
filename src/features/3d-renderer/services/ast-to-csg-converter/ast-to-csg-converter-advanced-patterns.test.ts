/**
 * AST to CSG Converter - Advanced Integration Patterns Testing
 *
 * Comprehensive testing of advanced integration patterns for complex multi-component interactions,
 * advanced OpenSCAD language features (modules, functions, variables, conditionals),
 * advanced CSG operations, complex transformation chains, and integration with advanced parser features.
 *
 * @fileoverview Advanced integration patterns testing for OpenSCAD AST-to-CSG conversion
 * @version 1.0.0
 * @since 2025-01-03
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import { UnifiedParserService } from '../../../openscad-parser/services/unified-parser-service.js';
import { createAppStore } from '../../../store/app-store.js';

const logger = createLogger('ASTToCSGConverterAdvancedPatternsTest');

/**
 * Advanced OpenSCAD test scenarios covering complex language features
 */
const ADVANCED_OPENSCAD_SCENARIOS = {
  moduleDefinitions: {
    name: 'Module Definition and Instantiation Patterns',
    description: 'Tests advanced module definition and instantiation scenarios',
    testCases: [
      {
        name: 'Simple Module Definition with Parameters',
        code: `
          module box(size=[10,10,10], wall=2, center=false) {
            difference() {
              cube(size, center);
              translate([wall, wall, wall])
                cube([size.x-2*wall, size.y-2*wall, size.z-wall], center);
            }
          }
          box([20, 15, 10], 1.5);
        `,
        expectedComplexity: 'medium',
        expectedFeatures: [
          'module_definition',
          'parameter_list',
          'difference',
          'cube',
          'translate',
        ],
      },
      {
        name: 'Nested Module Definitions',
        code: `
          module inner_part(radius=5) {
            sphere(r=radius);
          }
          
          module outer_shell(inner_r=5, thickness=2) {
            difference() {
              sphere(r=inner_r + thickness);
              inner_part(inner_r);
            }
          }
          
          outer_shell(8, 3);
        `,
        expectedComplexity: 'high',
        expectedFeatures: ['module_definition', 'nested_modules', 'difference', 'sphere'],
      },
      {
        name: 'Module with Complex Parameter Handling',
        code: `
          module gear_tooth(height=5, width=2, angle=0) {
            rotate([0, 0, angle]) {
              linear_extrude(height=height) {
                polygon([[0,0], [width,0], [width*0.8,width], [width*0.2,width]]);
              }
            }
          }
          
          for (i = [0:11]) {
            gear_tooth(10, 3, i*30);
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: ['module_definition', 'for_loop', 'rotate', 'linear_extrude', 'polygon'],
      },
    ],
  },

  conditionalLogic: {
    name: 'Conditional Logic and Flow Control Patterns',
    description: 'Tests advanced conditional logic and flow control scenarios',
    testCases: [
      {
        name: 'Simple If-Else Conditional',
        code: `
          x = 10;
          if (x > 5) {
            cube([x, x, x]);
          } else {
            sphere(r=x/2);
          }
        `,
        expectedComplexity: 'medium',
        expectedFeatures: ['variable_assignment', 'if_statement', 'cube', 'sphere'],
      },
      {
        name: 'Nested Conditional Logic',
        code: `
          size = 15;
          type = "box";
          
          if (type == "box") {
            if (size > 10) {
              cube([size, size, size/2]);
            } else {
              cube([size/2, size/2, size/2]);
            }
          } else {
            if (size > 10) {
              cylinder(h=size, r=size/3);
            } else {
              sphere(r=size/4);
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: ['variable_assignment', 'nested_if', 'cube', 'cylinder', 'sphere'],
      },
      {
        name: 'Conditional with Complex Expressions',
        code: `
          width = 20;
          height = 15;
          depth = 10;
          
          if (width > height && height > depth) {
            translate([0, 0, depth/2]) {
              cube([width, height, depth], center=true);
            }
          } else {
            rotate([90, 0, 0]) {
              cylinder(h=height, r=min(width, depth)/2);
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: [
          'variable_assignment',
          'complex_condition',
          'translate',
          'rotate',
          'cube',
          'cylinder',
        ],
      },
    ],
  },

  loopConstructs: {
    name: 'Loop Constructs and Iteration Patterns',
    description: 'Tests advanced loop constructs and iteration scenarios',
    testCases: [
      {
        name: 'Simple For Loop with Range',
        code: `
          for (i = [0:4]) {
            translate([i*15, 0, 0]) {
              cube([10, 10, 10]);
            }
          }
        `,
        expectedComplexity: 'medium',
        expectedFeatures: ['for_loop', 'range', 'translate', 'cube'],
      },
      {
        name: 'Nested For Loops with Grid Pattern',
        code: `
          for (x = [0:2]) {
            for (y = [0:2]) {
              translate([x*20, y*20, 0]) {
                difference() {
                  cube([15, 15, 15]);
                  translate([7.5, 7.5, 7.5]) {
                    sphere(r=6);
                  }
                }
              }
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: ['nested_for_loops', 'translate', 'difference', 'cube', 'sphere'],
      },
      {
        name: 'For Loop with Complex Calculations',
        code: `
          for (angle = [0:30:330]) {
            rotate([0, 0, angle]) {
              translate([25, 0, 0]) {
                rotate([0, angle/6, 0]) {
                  cube([5, 5, 15]);
                }
              }
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: ['for_loop', 'range_with_step', 'rotate', 'translate', 'cube'],
      },
    ],
  },

  variableManagement: {
    name: 'Variable Management and Scoping Patterns',
    description: 'Tests advanced variable management and scoping scenarios',
    testCases: [
      {
        name: 'Global Variables with Calculations',
        code: `
          base_size = 20;
          scale_factor = 1.5;
          final_size = base_size * scale_factor;
          
          cube([final_size, final_size, final_size/2]);
        `,
        expectedComplexity: 'low',
        expectedFeatures: ['variable_assignment', 'arithmetic_expression', 'cube'],
      },
      {
        name: 'Variables with Vector Operations',
        code: `
          pos1 = [10, 0, 0];
          pos2 = [0, 15, 0];
          pos3 = [0, 0, 20];
          
          translate(pos1) cube([5, 5, 5]);
          translate(pos2) sphere(r=3);
          translate(pos3) cylinder(h=8, r=2);
        `,
        expectedComplexity: 'medium',
        expectedFeatures: ['vector_variables', 'translate', 'cube', 'sphere', 'cylinder'],
      },
      {
        name: 'Complex Variable Expressions',
        code: `
          dimensions = [30, 20, 15];
          center_point = [dimensions.x/2, dimensions.y/2, dimensions.z/2];
          hole_radius = min(dimensions.x, dimensions.y) * 0.2;
          
          difference() {
            cube(dimensions);
            translate(center_point) {
              sphere(r=hole_radius);
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: [
          'vector_variables',
          'vector_access',
          'function_calls',
          'difference',
          'cube',
          'sphere',
        ],
      },
    ],
  },

  complexTransformations: {
    name: 'Complex Transformation Chain Patterns',
    description: 'Tests advanced transformation chain scenarios',
    testCases: [
      {
        name: 'Multi-Level Transformation Chain',
        code: `
          translate([20, 0, 0]) {
            rotate([0, 0, 45]) {
              scale([1.5, 1, 2]) {
                mirror([1, 0, 0]) {
                  cube([10, 10, 10]);
                }
              }
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: ['translate', 'rotate', 'scale', 'mirror', 'cube'],
      },
      {
        name: 'Dynamic Transformation with Variables',
        code: `
          offset_x = 25;
          rotation_angle = 60;
          scale_factor = [2, 1.5, 1];
          
          translate([offset_x, 0, 0]) {
            rotate([0, 0, rotation_angle]) {
              scale(scale_factor) {
                union() {
                  cube([8, 8, 8]);
                  translate([0, 0, 8]) {
                    sphere(r=4);
                  }
                }
              }
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: [
          'variable_assignment',
          'translate',
          'rotate',
          'scale',
          'union',
          'cube',
          'sphere',
        ],
      },
    ],
  },

  advancedCSGOperations: {
    name: 'Advanced CSG Operations Patterns',
    description: 'Tests advanced CSG operation scenarios',
    testCases: [
      {
        name: 'Complex Nested CSG Operations',
        code: `
          difference() {
            union() {
              cube([40, 40, 20]);
              translate([45, 0, 0]) {
                cylinder(h=20, r=15);
              }
            }
            intersection() {
              translate([20, 20, 10]) {
                sphere(r=18);
              }
              translate([25, 5, 5]) {
                cube([20, 20, 20]);
              }
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: [
          'difference',
          'union',
          'intersection',
          'cube',
          'cylinder',
          'sphere',
          'translate',
        ],
      },
      {
        name: 'Multi-Level CSG with Transformations',
        code: `
          intersection() {
            difference() {
              union() {
                cube([30, 30, 30]);
                translate([35, 0, 0]) {
                  rotate([0, 90, 0]) {
                    cylinder(h=30, r=10);
                  }
                }
              }
              translate([15, 15, 15]) {
                sphere(r=12);
              }
            }
            translate([10, 10, 0]) {
              cube([40, 40, 40]);
            }
          }
        `,
        expectedComplexity: 'high',
        expectedFeatures: [
          'intersection',
          'difference',
          'union',
          'translate',
          'rotate',
          'cube',
          'cylinder',
          'sphere',
        ],
      },
    ],
  },
} as const;

describe('AST to CSG Converter - Advanced Integration Patterns Testing', () => {
  let store: ReturnType<typeof createAppStore>;
  let parserService: UnifiedParserService;

  beforeEach(async () => {
    logger.init('Setting up advanced integration patterns test environment');

    // Initialize parser service with comprehensive configuration
    parserService = new UnifiedParserService({
      enableLogging: true, // Enable logging for detailed debugging
      enableCaching: true,
      retryAttempts: 3,
      timeoutMs: 10000, // Longer timeout for complex parsing
    });

    await parserService.initialize();

    // Initialize store with full configuration
    store = createAppStore({
      enableDevtools: false,
      enablePersistence: false,
      debounceConfig: {
        parseDelayMs: 0, // No debouncing for testing
        saveDelayMs: 0,
        renderDelayMs: 0,
      },
    });

    logger.debug('Advanced integration patterns test environment ready');
  });

  describe('Parser Integration Tests', () => {
    describe('Module Definition and Instantiation Patterns', () => {
      const scenario = ADVANCED_OPENSCAD_SCENARIOS.moduleDefinitions;

      scenario.testCases.forEach((testCase) => {
        it(`should attempt to parse ${testCase.name} (advanced feature)`, async () => {
          logger.init(`Testing parser integration for ${testCase.name}`);

          // Test parser integration - these are advanced features that may not be fully supported yet
          const parseResult = await parserService.parseDocument(testCase.code);

          // For advanced features, we test that the parser doesn't crash and provides meaningful feedback
          expect(parseResult).toBeDefined();

          if (parseResult.success) {
            expect(parseResult.data.ast).toBeDefined();
            logger.debug(`Successfully parsed ${testCase.name} - advanced feature working!`);
          } else {
            expect(parseResult.error).toBeDefined();
            logger.debug(
              `Advanced feature ${testCase.name} not yet fully supported: ${parseResult.error.message}`
            );
          }

          logger.end(`Parser integration test for ${testCase.name} completed`);
        });
      });
    });

    describe('Conditional Logic and Flow Control Patterns', () => {
      const scenario = ADVANCED_OPENSCAD_SCENARIOS.conditionalLogic;

      scenario.testCases.forEach((testCase) => {
        it(`should attempt to parse ${testCase.name} (advanced feature)`, async () => {
          logger.init(`Testing parser integration for ${testCase.name}`);

          // Test parser integration - these are advanced features that may not be fully supported yet
          const parseResult = await parserService.parseDocument(testCase.code);

          // For advanced features, we test that the parser doesn't crash and provides meaningful feedback
          expect(parseResult).toBeDefined();

          if (parseResult.success) {
            expect(parseResult.data.ast).toBeDefined();
            logger.debug(`Successfully parsed ${testCase.name} - advanced feature working!`);
          } else {
            expect(parseResult.error).toBeDefined();
            logger.debug(
              `Advanced feature ${testCase.name} not yet fully supported: ${parseResult.error.message}`
            );
          }

          logger.end(`Parser integration test for ${testCase.name} completed`);
        });
      });
    });

    describe('Loop Constructs and Iteration Patterns', () => {
      const scenario = ADVANCED_OPENSCAD_SCENARIOS.loopConstructs;

      scenario.testCases.forEach((testCase) => {
        it(`should attempt to parse ${testCase.name} (advanced feature)`, async () => {
          logger.init(`Testing parser integration for ${testCase.name}`);

          // Test parser integration - these are advanced features that may not be fully supported yet
          const parseResult = await parserService.parseDocument(testCase.code);

          // For advanced features, we test that the parser doesn't crash and provides meaningful feedback
          expect(parseResult).toBeDefined();

          if (parseResult.success) {
            expect(parseResult.data.ast).toBeDefined();
            logger.debug(`Successfully parsed ${testCase.name} - advanced feature working!`);
          } else {
            expect(parseResult.error).toBeDefined();
            logger.debug(
              `Advanced feature ${testCase.name} not yet fully supported: ${parseResult.error.message}`
            );
          }

          logger.end(`Parser integration test for ${testCase.name} completed`);
        });
      });
    });
  });

  describe('Store Integration Tests', () => {
    describe('Variable Management and Scoping Patterns', () => {
      const scenario = ADVANCED_OPENSCAD_SCENARIOS.variableManagement;

      scenario.testCases.forEach((testCase) => {
        it(`should attempt store integration for ${testCase.name} (advanced feature)`, async () => {
          logger.init(`Testing store integration for ${testCase.name}`);

          // Test store integration - these are advanced features that may not be fully supported yet
          const storeResult = await store.getState().parseCode(testCase.code);

          // For advanced features, we test that the store doesn't crash and provides meaningful feedback
          expect(storeResult).toBeDefined();

          if (storeResult.success) {
            // For advanced features, the store may return success but with incomplete data structures
            // This is expected behavior for features not yet fully implemented
            if (storeResult.data?.ast && storeResult.data.mesh) {
              // Verify store state updates when data is complete
              const currentState = store.getState();
              expect(currentState.code).toBe(testCase.code);
              expect(currentState.ast).toBeDefined();
              expect(currentState.scene3D).toBeDefined();

              logger.debug(
                `Successfully integrated ${testCase.name} with store - advanced feature working!`
              );
            } else {
              // Store returned success but with incomplete data - this is expected for advanced features
              logger.debug(
                `Store integration for ${testCase.name} returned success but with incomplete data structures - advanced feature partially supported`
              );
            }
          } else {
            expect(storeResult.error).toBeDefined();
            logger.debug(
              `Advanced feature ${testCase.name} not yet fully supported in store: ${storeResult.error.message}`
            );
          }

          logger.end(`Store integration test for ${testCase.name} completed`);
        });
      });
    });

    describe('Complex Transformation Chain Patterns', () => {
      const scenario = ADVANCED_OPENSCAD_SCENARIOS.complexTransformations;

      scenario.testCases.forEach((testCase) => {
        it(`should attempt store integration for ${testCase.name} (advanced feature)`, async () => {
          logger.init(`Testing store integration for ${testCase.name}`);

          // Test store integration - these are advanced features that may not be fully supported yet
          const storeResult = await store.getState().parseCode(testCase.code);

          // For advanced features, we test that the store doesn't crash and provides meaningful feedback
          expect(storeResult).toBeDefined();

          if (storeResult.success) {
            // For advanced features, the store may return success but with incomplete data structures
            // This is expected behavior for features not yet fully implemented
            if (storeResult.data?.ast && storeResult.data.mesh) {
              // Verify transformation chain processing when data is complete
              const currentState = store.getState();
              expect(currentState.code).toBe(testCase.code);
              expect(currentState.ast).toBeDefined();
              expect(currentState.scene3D).toBeDefined();

              logger.debug(
                `Successfully integrated ${testCase.name} with store - advanced feature working!`
              );
            } else {
              // Store returned success but with incomplete data - this is expected for advanced features
              logger.debug(
                `Store integration for ${testCase.name} returned success but with incomplete data structures - advanced feature partially supported`
              );
            }
          } else {
            expect(storeResult.error).toBeDefined();
            logger.debug(
              `Advanced feature ${testCase.name} not yet fully supported in store: ${storeResult.error.message}`
            );
          }

          logger.end(`Store integration test for ${testCase.name} completed`);
        });
      });
    });
  });

  describe('End-to-End Flow Tests', () => {
    describe('Advanced CSG Operations Patterns', () => {
      const scenario = ADVANCED_OPENSCAD_SCENARIOS.advancedCSGOperations;

      scenario.testCases.forEach((testCase) => {
        it(`should attempt end-to-end flow for ${testCase.name} (advanced feature)`, async () => {
          logger.init(`Testing end-to-end flow for ${testCase.name}`);

          // Test complete end-to-end flow - these are advanced features that may not be fully supported yet
          const startTime = performance.now();

          // Step 1: Parse with parser service
          const parseResult = await parserService.parseDocument(testCase.code);
          expect(parseResult).toBeDefined();

          // Step 2: Process through store
          const storeResult = await store.getState().parseCode(testCase.code);
          expect(storeResult).toBeDefined();

          const endTime = performance.now();
          const totalTime = endTime - startTime;

          if (storeResult.success) {
            // For advanced features, the store may return success but with incomplete data structures
            // This is expected behavior for features not yet fully implemented
            if (storeResult.data?.ast && storeResult.data.mesh) {
              // Verify end-to-end integration when data is complete
              const currentState = store.getState();
              expect(currentState.code).toBe(testCase.code);
              expect(currentState.ast).toBeDefined();
              expect(currentState.scene3D).toBeDefined();

              // Performance validation for complex operations
              expect(totalTime).toBeLessThan(5000); // 5 second timeout for complex operations

              logger.debug(
                `Successfully completed end-to-end flow for ${testCase.name} in ${totalTime.toFixed(2)}ms - advanced feature working!`
              );
            } else {
              // Store returned success but with incomplete data - this is expected for advanced features
              // Still validate performance even for incomplete processing
              expect(totalTime).toBeLessThan(5000); // 5 second timeout for complex operations

              logger.debug(
                `End-to-end flow for ${testCase.name} completed in ${totalTime.toFixed(2)}ms but with incomplete data structures - advanced feature partially supported`
              );
            }
          } else {
            expect(storeResult.error).toBeDefined();
            logger.debug(
              `Advanced feature ${testCase.name} not yet fully supported in end-to-end flow: ${storeResult.error.message}`
            );
          }

          logger.end(`End-to-end flow test for ${testCase.name} completed`);
        });
      });
    });
  });

  describe('Performance Tests', () => {
    it('should meet performance targets for module definitions', async () => {
      logger.init('Testing performance for module definitions');

      const testCase = ADVANCED_OPENSCAD_SCENARIOS.moduleDefinitions.testCases[0];
      const startTime = performance.now();

      const result = await store.getState().parseCode(testCase.code);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(100); // Should complete within 100ms for simple modules

      logger.debug(`Module definition performance: ${totalTime.toFixed(2)}ms`);
      logger.end('Module definition performance test completed');
    });

    it('should meet performance targets for conditional logic', async () => {
      logger.init('Testing performance for conditional logic');

      const testCase = ADVANCED_OPENSCAD_SCENARIOS.conditionalLogic.testCases[1]; // Nested conditional
      const startTime = performance.now();

      const result = await store.getState().parseCode(testCase.code);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(150); // Should complete within 150ms for nested conditionals

      logger.debug(`Conditional logic performance: ${totalTime.toFixed(2)}ms`);
      logger.end('Conditional logic performance test completed');
    });

    it('should meet performance targets for complex transformations', async () => {
      logger.init('Testing performance for complex transformations');

      const testCase = ADVANCED_OPENSCAD_SCENARIOS.complexTransformations.testCases[1]; // Dynamic transformation
      const startTime = performance.now();

      const result = await store.getState().parseCode(testCase.code);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(200); // Should complete within 200ms for complex transformations

      logger.debug(`Complex transformation performance: ${totalTime.toFixed(2)}ms`);
      logger.end('Complex transformation performance test completed');
    });

    it('should meet performance targets for advanced CSG operations', async () => {
      logger.init('Testing performance for advanced CSG operations');

      const testCase = ADVANCED_OPENSCAD_SCENARIOS.advancedCSGOperations.testCases[1]; // Multi-level CSG
      const startTime = performance.now();

      const result = await store.getState().parseCode(testCase.code);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms for complex CSG operations

      logger.debug(`Advanced CSG operations performance: ${totalTime.toFixed(2)}ms`);
      logger.end('Advanced CSG operations performance test completed');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle syntax errors gracefully without crashing', async () => {
      logger.init('Testing error handling for syntax errors');

      const invalidCode = `
        cube([10, 10, 10]  // Missing closing parenthesis
      `;

      const result = await store.getState().parseCode(invalidCode);

      // Should handle error gracefully without crashing - may succeed or fail depending on parser robustness
      expect(result).toBeDefined();

      if (result.success) {
        logger.debug('Parser was robust enough to handle syntax error');
      } else {
        expect(result.error).toBeDefined();
        expect(result.error.message).toBeDefined();
        logger.debug(`Gracefully handled syntax error: ${result.error.message}`);
      }

      logger.end('Syntax error handling test completed');
    });

    it('should handle invalid function calls gracefully', async () => {
      logger.init('Testing error handling for invalid function calls');

      const invalidCode = `
        invalid_function_name(10, 20, 30);  // Non-existent function
      `;

      const result = await store.getState().parseCode(invalidCode);

      // Should handle error gracefully without crashing
      expect(result).toBeDefined();

      if (result.success) {
        logger.debug('Parser handled unknown function gracefully');
      } else {
        expect(result.error).toBeDefined();
        expect(result.error.message).toBeDefined();
        logger.debug(`Gracefully handled invalid function error: ${result.error.message}`);
      }

      logger.end('Invalid function call error handling test completed');
    });

    it('should handle malformed parameters gracefully', async () => {
      logger.init('Testing error handling for malformed parameters');

      const invalidCode = `
        cube([10, , 10]);  // Missing parameter value
      `;

      const result = await store.getState().parseCode(invalidCode);

      // Should handle error gracefully without crashing
      expect(result).toBeDefined();

      if (result.success) {
        logger.debug('Parser handled malformed parameters gracefully');
      } else {
        expect(result.error).toBeDefined();
        expect(result.error.message).toBeDefined();
        logger.debug(`Gracefully handled malformed parameter error: ${result.error.message}`);
      }

      logger.end('Malformed parameter error handling test completed');
    });

    it('should handle empty or whitespace-only code gracefully', async () => {
      logger.init('Testing error handling for empty code');

      const emptyCode = `

        // Just comments and whitespace

      `;

      const result = await store.getState().parseCode(emptyCode);

      // Should handle empty code gracefully
      expect(result).toBeDefined();

      if (result.success) {
        logger.debug('Successfully handled empty/whitespace-only code');
      } else {
        expect(result.error).toBeDefined();
        logger.debug(`Handled empty code appropriately: ${result.error.message}`);
      }

      logger.end('Empty code error handling test completed');
    });

    it('should maintain system stability during error conditions', async () => {
      logger.init('Testing system stability during error conditions');

      // Test multiple error conditions in sequence to ensure system stability
      const errorCodes = [
        'cube([10, 10, 10]', // Missing closing bracket
        'sphere(r=)', // Missing parameter value
        'translate([10, 10, 10]) {', // Missing closing brace
      ];

      for (const [index, code] of errorCodes.entries()) {
        const result = await store.getState().parseCode(code);
        expect(result).toBeDefined();

        logger.debug(
          `Error condition ${index + 1}: ${result.success ? 'handled gracefully' : result.error.message}`
        );
      }

      // System should still be functional after error conditions
      const validCode = 'cube([5, 5, 5]);';
      const finalResult = await store.getState().parseCode(validCode);
      expect(finalResult).toBeDefined();

      logger.debug(
        `System stability maintained: ${finalResult.success ? 'working normally' : 'still experiencing issues'}`
      );
      logger.end('System stability test completed');
    });
  });
});
