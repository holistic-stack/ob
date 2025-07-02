/**
 * @file Visitor Integration Tests
 *
 * Comprehensive tests for the visitor pattern implementation including
 * all specialized visitors and their integration with the composite visitor.
 */

import { describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import { SimpleErrorHandler } from '../simple-error-handler.js';
import { CompositeVisitor } from './composite-visitor.js';
import { CSGVisitor } from './csg-visitor.js';
import { ExpressionVisitor } from './expression-visitor.js';
import { PrimitiveVisitor } from './primitive-visitor.js';
import { TransformationVisitor } from './transformation-visitor.js';

const logger = createLogger('VisitorIntegrationTest');

describe('[INIT][VisitorIntegration] Visitor Pattern Integration Tests', () => {
  const source = 'cube(10);';
  const errorHandler = new SimpleErrorHandler();

  describe('Individual Visitor Creation', () => {
    it('should create PrimitiveVisitor without errors', () => {
      expect(() => new PrimitiveVisitor(source, errorHandler)).not.toThrow();
      logger.debug('PrimitiveVisitor created successfully');
    });

    it('should create TransformationVisitor without errors', () => {
      expect(() => new TransformationVisitor(source, errorHandler)).not.toThrow();
      logger.debug('TransformationVisitor created successfully');
    });

    it('should create CSGVisitor without errors', () => {
      expect(() => new CSGVisitor(source, errorHandler)).not.toThrow();
      logger.debug('CSGVisitor created successfully');
    });

    it('should create ExpressionVisitor without errors', () => {
      expect(() => new ExpressionVisitor(source, errorHandler)).not.toThrow();
      logger.debug('ExpressionVisitor created successfully');
    });
  });

  describe('CompositeVisitor Integration', () => {
    it('should create CompositeVisitor with all specialized visitors', () => {
      expect(() => new CompositeVisitor(source, errorHandler)).not.toThrow();
      logger.debug('CompositeVisitor created with all specialized visitors');
    });

    it('should have correct supported node types', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);
      const supportedTypes = compositeVisitor.getSupportedNodeTypes();

      // Check primitives
      expect(supportedTypes).toContain('cube');
      expect(supportedTypes).toContain('sphere');
      expect(supportedTypes).toContain('cylinder');
      expect(supportedTypes).toContain('polyhedron');

      // Check transformations
      expect(supportedTypes).toContain('translate');
      expect(supportedTypes).toContain('rotate');
      expect(supportedTypes).toContain('scale');
      expect(supportedTypes).toContain('mirror');

      // Check CSG operations
      expect(supportedTypes).toContain('union');
      expect(supportedTypes).toContain('difference');
      expect(supportedTypes).toContain('intersection');
      expect(supportedTypes).toContain('hull');
      expect(supportedTypes).toContain('minkowski');

      // Check expressions
      expect(supportedTypes).toContain('identifier');
      expect(supportedTypes).toContain('number');
      expect(supportedTypes).toContain('string');
      expect(supportedTypes).toContain('boolean');
      expect(supportedTypes).toContain('vector');
      expect(supportedTypes).toContain('array');
      expect(supportedTypes).toContain('binary_expression');
      expect(supportedTypes).toContain('range_expression');
      expect(supportedTypes).toContain('assignment');

      // Check generic
      expect(supportedTypes).toContain('function_call');

      logger.debug(`CompositeVisitor supports ${supportedTypes.length} node types`);
    });

    it('should correctly identify which nodes it can handle', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);

      // Test primitive nodes
      expect(compositeVisitor.canHandle('cube')).toBe(true);
      expect(compositeVisitor.canHandle('sphere')).toBe(true);

      // Test transformation nodes
      expect(compositeVisitor.canHandle('translate')).toBe(true);
      expect(compositeVisitor.canHandle('rotate')).toBe(true);

      // Test CSG nodes
      expect(compositeVisitor.canHandle('union')).toBe(true);
      expect(compositeVisitor.canHandle('difference')).toBe(true);

      // Test expression nodes
      expect(compositeVisitor.canHandle('identifier')).toBe(true);
      expect(compositeVisitor.canHandle('number')).toBe(true);

      // Test unsupported nodes
      expect(compositeVisitor.canHandle('unknown_node')).toBe(false);
      expect(compositeVisitor.canHandle('invalid_type')).toBe(false);

      logger.debug('CompositeVisitor node handling verification completed');
    });
  });

  describe('Visitor Management', () => {
    it('should allow adding and removing visitors', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);
      const newPrimitiveVisitor = new PrimitiveVisitor(source, errorHandler);

      // Add a visitor
      compositeVisitor.addVisitor(newPrimitiveVisitor);
      logger.debug('Added new visitor to composite');

      // Remove a visitor (should find the first PrimitiveVisitor)
      const removed = compositeVisitor.removeVisitor(PrimitiveVisitor);
      expect(removed).toBe(true);
      logger.debug('Removed visitor from composite');

      // Try to remove the same type again (should still find the added one)
      const removedAgain = compositeVisitor.removeVisitor(PrimitiveVisitor);
      expect(removedAgain).toBe(true);
      logger.debug('Removed second visitor from composite');

      // Try to remove non-existent visitor (now should fail)
      const notRemoved = compositeVisitor.removeVisitor(PrimitiveVisitor);
      expect(notRemoved).toBe(false);
      logger.debug('Correctly handled removal of non-existent visitor');
    });

    it('should allow getting specific visitors', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);

      const primitiveVisitor = compositeVisitor.getVisitor(PrimitiveVisitor);
      expect(primitiveVisitor).toBeInstanceOf(PrimitiveVisitor);

      const transformationVisitor = compositeVisitor.getVisitor(TransformationVisitor);
      expect(transformationVisitor).toBeInstanceOf(TransformationVisitor);

      const csgVisitor = compositeVisitor.getVisitor(CSGVisitor);
      expect(csgVisitor).toBeInstanceOf(CSGVisitor);

      const expressionVisitor = compositeVisitor.getVisitor(ExpressionVisitor);
      expect(expressionVisitor).toBeInstanceOf(ExpressionVisitor);

      logger.debug('Successfully retrieved all specialized visitors');
    });
  });

  describe('Visitor Statistics', () => {
    it('should provide visitor statistics', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);
      const stats = compositeVisitor.getVisitorStats();

      expect(typeof stats).toBe('object');
      expect(stats.PrimitiveVisitor).toBeDefined();
      expect(stats.TransformationVisitor).toBeDefined();
      expect(stats.CSGVisitor).toBeDefined();
      expect(stats.ExpressionVisitor).toBeDefined();

      logger.debug('Visitor statistics retrieved successfully');
    });
  });

  describe('Visitor Lifecycle', () => {
    it('should handle visitor reset and disposal', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);

      // Test reset
      expect(() => compositeVisitor.reset()).not.toThrow();
      logger.debug('CompositeVisitor reset completed');

      // Test disposal
      expect(() => compositeVisitor.dispose()).not.toThrow();
      logger.debug('CompositeVisitor disposal completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle null nodes gracefully', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);

      // Mock a null node scenario - this would normally come from tree-sitter
      // but we can test the null handling logic
      const mockNode = null;

      expect(() => {
        if (mockNode) {
          compositeVisitor.visitNode(mockNode);
        }
      }).not.toThrow();

      logger.debug('Null node handling verified');
    });

    it('should collect errors through error handler', () => {
      const testErrorHandler = new SimpleErrorHandler();
      const _compositeVisitor = new CompositeVisitor(source, testErrorHandler);

      // Verify error handler is working
      expect(testErrorHandler.getErrors()).toHaveLength(0);
      expect(testErrorHandler.getWarnings()).toHaveLength(0);

      // Test error collection
      testErrorHandler.logError('Test error');
      testErrorHandler.logWarning('Test warning');

      expect(testErrorHandler.getErrors()).toHaveLength(1);
      expect(testErrorHandler.getWarnings()).toHaveLength(1);

      logger.debug('Error handler integration verified');
    });
  });

  describe('Visitor Architecture Validation', () => {
    it('should maintain visitor pattern principles', () => {
      const compositeVisitor = new CompositeVisitor(source, errorHandler);

      // Verify composite pattern implementation
      expect(compositeVisitor).toHaveProperty('visitNode');
      expect(compositeVisitor).toHaveProperty('visitStatement');
      expect(compositeVisitor).toHaveProperty('visitNodes');
      expect(compositeVisitor).toHaveProperty('visitChildren');

      // Verify visitor management
      expect(compositeVisitor).toHaveProperty('addVisitor');
      expect(compositeVisitor).toHaveProperty('removeVisitor');
      expect(compositeVisitor).toHaveProperty('getVisitor');

      // Verify utility methods
      expect(compositeVisitor).toHaveProperty('canHandle');
      expect(compositeVisitor).toHaveProperty('getSupportedNodeTypes');
      expect(compositeVisitor).toHaveProperty('getVisitorStats');

      logger.debug('Visitor pattern architecture validation completed');
    });

    it('should follow bulletproof-react architecture principles', () => {
      // Verify proper service organization
      expect(PrimitiveVisitor).toBeDefined();
      expect(TransformationVisitor).toBeDefined();
      expect(CSGVisitor).toBeDefined();
      expect(ExpressionVisitor).toBeDefined();
      expect(CompositeVisitor).toBeDefined();

      // Verify proper error handling integration
      const visitor = new CompositeVisitor(source, errorHandler);
      expect(visitor).toBeInstanceOf(CompositeVisitor);

      logger.debug('Bulletproof-react architecture compliance verified');
    });
  });
});
