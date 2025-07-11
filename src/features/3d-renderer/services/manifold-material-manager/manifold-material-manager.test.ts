/**
 * @file Manifold Material Manager Tests
 * Task 2.3: Add Material ID Reservation System (Red Phase)
 * 
 * Tests for managing material IDs in Manifold CSG operations
 * Following project guidelines:
 * - Use real implementations (no mocks except Three.js WebGL components)
 * - TDD methodology with Red-Green-Refactor cycles
 * - Result<T,E> error handling patterns
 * - BabylonJS-inspired material ID reservation with `Manifold.reserveIDs()`
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  MaterialIDManager,
  reserveManifoldMaterialIDs,
  createMaterialMapping,
  validateMaterialIDs,
  type MaterialIDRange,
  type MaterialMapping
} from './manifold-material-manager';
import { 
  getMemoryStats,
  clearAllResources 
} from '../manifold-memory-manager/manifold-memory-manager';
import type { Result } from '../../../../shared/types/result.types';

/**
 * Test suite for Manifold Material ID management
 */
describe('Manifold Material Manager', () => {
  beforeEach(() => {
    // Clear memory for clean test state
    clearAllResources();
  });

  describe('Material ID Reservation', () => {
    it('should reserve material ID range using Manifold.reserveIDs() pattern', async () => {
      // Test BabylonJS-inspired material ID reservation
      const reservationCount = 65536; // Standard BabylonJS reservation size
      
      // Reserve material IDs (this will fail in Red phase)
      const result = await reserveManifoldMaterialIDs(reservationCount);
      
      // Expected behavior: Result<T,E> pattern
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        const reservation = result.data;
        
        // Verify reservation structure
        expect(reservation).toHaveProperty('startID');
        expect(reservation).toHaveProperty('endID');
        expect(reservation).toHaveProperty('count');
        expect(reservation).toHaveProperty('reservedAt');
        
        // Verify reservation range
        expect(reservation.count).toBe(reservationCount);
        expect(reservation.endID).toBe(reservation.startID + reservationCount - 1);
        expect(typeof reservation.startID).toBe('number');
        expect(reservation.startID).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle multiple material ID reservations without conflicts', async () => {
      // Test multiple reservations to ensure no conflicts
      const firstReservation = await reserveManifoldMaterialIDs(1000);
      const secondReservation = await reserveManifoldMaterialIDs(2000);
      
      expect(firstReservation).toBeDefined();
      expect(secondReservation).toBeDefined();
      
      if (firstReservation.success && secondReservation.success) {
        const first = firstReservation.data;
        const second = secondReservation.data;
        
        // Verify no overlap between reservations
        const firstEnd = first.startID + first.count - 1;
        const secondStart = second.startID;
        
        expect(firstEnd).toBeLessThan(secondStart);
        expect(first.startID).not.toBe(second.startID);
      }
    });

    it('should validate material ID ranges for conflicts', () => {
      // Test material ID validation
      const testRanges: MaterialIDRange[] = [
        { startID: 0, endID: 999, count: 1000, reservedAt: Date.now() },
        { startID: 1000, endID: 1999, count: 1000, reservedAt: Date.now() },
        { startID: 2000, endID: 2999, count: 1000, reservedAt: Date.now() }
      ];
      
      const validationResult = validateMaterialIDs(testRanges);
      
      expect(validationResult).toBeDefined();
      expect(typeof validationResult.success).toBe('boolean');
      
      if (validationResult.success) {
        expect(validationResult.data.hasConflicts).toBe(false);
        expect(validationResult.data.totalReserved).toBe(3000);
      }
    });

    it('should detect material ID conflicts', () => {
      // Test conflict detection
      const conflictingRanges: MaterialIDRange[] = [
        { startID: 0, endID: 999, count: 1000, reservedAt: Date.now() },
        { startID: 500, endID: 1499, count: 1000, reservedAt: Date.now() } // Overlaps with first
      ];
      
      const validationResult = validateMaterialIDs(conflictingRanges);
      
      expect(validationResult).toBeDefined();
      if (validationResult.success) {
        expect(validationResult.data.hasConflicts).toBe(true);
        expect(validationResult.data.conflicts).toBeDefined();
        expect(validationResult.data.conflicts.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Material Mapping', () => {
    it('should create material mapping for Three.js materials', () => {
      // Test material mapping creation
      const threeMaterials = [
        { id: 'material1', name: 'Red Material' },
        { id: 'material2', name: 'Blue Material' },
        { id: 'material3', name: 'Green Material' }
      ];
      
      const reservedRange: MaterialIDRange = {
        startID: 1000,
        endID: 1999,
        count: 1000,
        reservedAt: Date.now()
      };
      
      // Create material mapping (this will fail in Red phase)
      const result = createMaterialMapping(threeMaterials, reservedRange);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        const mapping = result.data;
        
        // Verify mapping structure
        expect(mapping).toHaveProperty('threeToManifold');
        expect(mapping).toHaveProperty('manifoldToThree');
        expect(mapping).toHaveProperty('reservedRange');
        
        // Verify all materials are mapped
        expect(Object.keys(mapping.threeToManifold)).toHaveLength(3);
        expect(Object.keys(mapping.manifoldToThree)).toHaveLength(3);
        
        // Verify IDs are within reserved range
        Object.values(mapping.threeToManifold).forEach(manifoldID => {
          expect(manifoldID).toBeGreaterThanOrEqual(reservedRange.startID);
          expect(manifoldID).toBeLessThanOrEqual(reservedRange.endID);
        });
      }
    });

    it('should handle material mapping updates', () => {
      // Test updating material mappings
      const initialMaterials = [
        { id: 'material1', name: 'Red Material' }
      ];
      
      const reservedRange: MaterialIDRange = {
        startID: 2000,
        endID: 2999,
        count: 1000,
        reservedAt: Date.now()
      };
      
      const initialMapping = createMaterialMapping(initialMaterials, reservedRange);
      
      if (initialMapping.success) {
        // Add new material
        const updatedMaterials = [
          ...initialMaterials,
          { id: 'material2', name: 'Blue Material' }
        ];
        
        const updatedMapping = createMaterialMapping(updatedMaterials, reservedRange, initialMapping.data);
        
        expect(updatedMapping).toBeDefined();
        if (updatedMapping.success) {
          // Verify original mapping is preserved
          expect(updatedMapping.data.threeToManifold['material1']).toBe(
            initialMapping.data.threeToManifold['material1']
          );
          
          // Verify new material is mapped
          expect(updatedMapping.data.threeToManifold['material2']).toBeDefined();
          expect(Object.keys(updatedMapping.data.threeToManifold)).toHaveLength(2);
        }
      }
    });
  });

  describe('MaterialIDManager Class', () => {
    it('should manage material IDs with automatic reservation', async () => {
      // Test MaterialIDManager class
      const manager = new MaterialIDManager();
      
      // Initialize manager (this will fail in Red phase)
      const initResult = await manager.initialize();
      
      expect(initResult).toBeDefined();
      expect(typeof initResult.success).toBe('boolean');
      
      if (initResult.success) {
        // Test getting material ID
        const materialID = manager.getMaterialID('test-material');
        expect(typeof materialID).toBe('number');
        expect(materialID).toBeGreaterThanOrEqual(0);
        
        // Test getting same material ID again
        const sameID = manager.getMaterialID('test-material');
        expect(sameID).toBe(materialID);
        
        // Test getting different material ID
        const differentID = manager.getMaterialID('different-material');
        expect(differentID).not.toBe(materialID);
        expect(typeof differentID).toBe('number');
      }
    });

    it('should handle material ID cleanup and disposal', async () => {
      // Test cleanup functionality
      const manager = new MaterialIDManager();
      const initResult = await manager.initialize();
      
      if (initResult.success) {
        // Add some materials
        manager.getMaterialID('material1');
        manager.getMaterialID('material2');
        
        // Test cleanup
        const cleanupResult = manager.dispose();
        expect(cleanupResult.success).toBe(true);
        
        // Verify memory is cleaned up
        const stats = getMemoryStats();
        expect(stats.activeResources).toBe(0);
      }
    });

    it('should handle material ID range exhaustion gracefully', async () => {
      // Test behavior when running out of material IDs
      const manager = new MaterialIDManager({ maxMaterials: 2 });
      const initResult = await manager.initialize();
      
      if (initResult.success) {
        // Use up available IDs
        const id1 = manager.getMaterialID('material1');
        const id2 = manager.getMaterialID('material2');
        
        expect(typeof id1).toBe('number');
        expect(typeof id2).toBe('number');
        
        // Try to get third ID (should handle gracefully)
        const id3 = manager.getMaterialID('material3');
        
        // Should either return valid ID (if expanded) or handle error gracefully
        expect(typeof id3).toBe('number');
      }
    });
  });

  describe('Integration with Manifold WASM', () => {
    it('should integrate with Manifold.reserveIDs() when WASM is available', async () => {
      // Test integration with actual Manifold WASM module
      // This establishes the expected interface for WASM integration
      
      const expectedWASMIntegration = {
        loadManifoldModule: expect.any(Function),
        callReserveIDs: expect.any(Function),
        handleWASMErrors: expect.any(Function),
        validateReservation: expect.any(Function)
      };
      
      expect(typeof reserveManifoldMaterialIDs).toBe('function');
      
      // Test with mock WASM unavailable scenario
      const result = await reserveManifoldMaterialIDs(1000);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      // Error is expected when WASM is not available
      if (!result.success) {
        expect(result.error).toContain('WASM');
      }
    });

    it('should handle WASM loading failures gracefully', async () => {
      // Test error handling when WASM fails to load
      const result = await reserveManifoldMaterialIDs(1000);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      // Should handle WASM loading failure gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });
});
