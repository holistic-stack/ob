/**
 * @file Branded Types Tests
 * 
 * Comprehensive test suite for branded types and their utilities.
 * Tests type safety, validation, and factory functions.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBranded,
  unBrand,
  createEngineId,
  createSceneId,
  createMeshId,
  createMaterialId,
  createHexColor,
  createEmailAddress,
  createURL,
  createPercentage,
  createNormalized,
  isValidHexColor,
  isValidEmail,
  isValidURL,
  isValidPercentage,
  isValidNormalized,
  isEngineId,
  isSceneId,
  isMeshId,
  serializeBranded,
  deserializeBranded,
} from './branded-types';

describe('Branded Types', () => {
  beforeEach(() => {
    console.log('[INIT] Starting branded types test');
  });

  describe('Core Branded Type Infrastructure', () => {
    it('should create branded types with validation', () => {
      console.log('[DEBUG] Testing branded type creation');
      
      const validator = (value: string) => value.length > 0;
      const brandedValue = createBranded<string, 'TestBrand'>('test', validator);
      
      expect(brandedValue).toBe('test');
      
      console.log('[DEBUG] Branded type creation test passed');
    });

    it('should throw error for invalid branded type', () => {
      console.log('[DEBUG] Testing invalid branded type creation');
      
      const validator = (value: string) => value.length > 5;
      
      expect(() => {
        createBranded<string, 'TestBrand'>('test', validator, 'Value too short');
      }).toThrow('Value too short');
      
      console.log('[DEBUG] Invalid branded type test passed');
    });

    it('should unbrand values correctly', () => {
      console.log('[DEBUG] Testing unbranding');
      
      const brandedValue = createBranded<string, 'TestBrand'>('test');
      const unbrandedValue = unBrand(brandedValue);
      
      expect(unbrandedValue).toBe('test');
      expect(typeof unbrandedValue).toBe('string');
      
      console.log('[DEBUG] Unbranding test passed');
    });
  });

  describe('Entity ID Factories', () => {
    it('should create unique engine IDs', () => {
      console.log('[DEBUG] Testing engine ID creation');
      
      const id1 = createEngineId();
      const id2 = createEngineId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1).toMatch(/^engine_\d+_[a-z0-9]+$/);
      
      console.log('[DEBUG] Engine ID creation test passed');
    });

    it('should create unique scene IDs', () => {
      console.log('[DEBUG] Testing scene ID creation');
      
      const id1 = createSceneId();
      const id2 = createSceneId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1).toMatch(/^scene_\d+_[a-z0-9]+$/);
      
      console.log('[DEBUG] Scene ID creation test passed');
    });

    it('should create unique mesh IDs', () => {
      console.log('[DEBUG] Testing mesh ID creation');
      
      const id1 = createMeshId();
      const id2 = createMeshId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1).toMatch(/^mesh_\d+_[a-z0-9]+$/);
      
      console.log('[DEBUG] Mesh ID creation test passed');
    });

    it('should create unique material IDs', () => {
      console.log('[DEBUG] Testing material ID creation');
      
      const id1 = createMaterialId();
      const id2 = createMaterialId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1).toMatch(/^material_\d+_[a-z0-9]+$/);
      
      console.log('[DEBUG] Material ID creation test passed');
    });

    it('should create IDs with custom prefixes', () => {
      console.log('[DEBUG] Testing custom prefix IDs');
      
      const customEngineId = createEngineId('custom');
      const customSceneId = createSceneId('test');
      
      expect(customEngineId).toMatch(/^custom_\d+_[a-z0-9]+$/);
      expect(customSceneId).toMatch(/^test_\d+_[a-z0-9]+$/);
      
      console.log('[DEBUG] Custom prefix ID test passed');
    });
  });

  describe('Validation Functions', () => {
    it('should validate hex colors correctly', () => {
      console.log('[DEBUG] Testing hex color validation');
      
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#123ABC')).toBe(true);
      expect(isValidHexColor('FF0000')).toBe(false);
      expect(isValidHexColor('#GG0000')).toBe(false);
      expect(isValidHexColor('#FF00')).toBe(false);
      
      console.log('[DEBUG] Hex color validation test passed');
    });

    it('should validate email addresses correctly', () => {
      console.log('[DEBUG] Testing email validation');
      
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      
      console.log('[DEBUG] Email validation test passed');
    });

    it('should validate URLs correctly', () => {
      console.log('[DEBUG] Testing URL validation');
      
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
      expect(isValidURL('ftp://files.example.com')).toBe(true);
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('://invalid')).toBe(false);
      
      console.log('[DEBUG] URL validation test passed');
    });

    it('should validate percentage values correctly', () => {
      console.log('[DEBUG] Testing percentage validation');
      
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
      
      console.log('[DEBUG] Percentage validation test passed');
    });

    it('should validate normalized values correctly', () => {
      console.log('[DEBUG] Testing normalized validation');
      
      expect(isValidNormalized(0)).toBe(true);
      expect(isValidNormalized(0.5)).toBe(true);
      expect(isValidNormalized(1)).toBe(true);
      expect(isValidNormalized(-0.1)).toBe(false);
      expect(isValidNormalized(1.1)).toBe(false);
      
      console.log('[DEBUG] Normalized validation test passed');
    });
  });

  describe('Safe Factory Functions', () => {
    it('should create valid hex colors', () => {
      console.log('[DEBUG] Testing hex color creation');
      
      const color1 = createHexColor('#FF0000');
      const color2 = createHexColor('#fff');
      
      expect(color1).toBe('#FF0000');
      expect(color2).toBe('#fff');
      
      console.log('[DEBUG] Hex color creation test passed');
    });

    it('should throw for invalid hex colors', () => {
      console.log('[DEBUG] Testing invalid hex color creation');
      
      expect(() => createHexColor('invalid')).toThrow('Invalid hex color format');
      expect(() => createHexColor('#GG0000')).toThrow('Invalid hex color format');
      
      console.log('[DEBUG] Invalid hex color test passed');
    });

    it('should create valid email addresses', () => {
      console.log('[DEBUG] Testing email address creation');
      
      const email = createEmailAddress('test@example.com');
      expect(email).toBe('test@example.com');
      
      console.log('[DEBUG] Email address creation test passed');
    });

    it('should throw for invalid email addresses', () => {
      console.log('[DEBUG] Testing invalid email address creation');
      
      expect(() => createEmailAddress('invalid')).toThrow('Invalid email address format');
      
      console.log('[DEBUG] Invalid email address test passed');
    });

    it('should create valid URLs', () => {
      console.log('[DEBUG] Testing URL creation');
      
      const url = createURL('https://example.com');
      expect(url).toBe('https://example.com');
      
      console.log('[DEBUG] URL creation test passed');
    });

    it('should throw for invalid URLs', () => {
      console.log('[DEBUG] Testing invalid URL creation');
      
      expect(() => createURL('invalid')).toThrow('Invalid URL format');
      
      console.log('[DEBUG] Invalid URL test passed');
    });

    it('should create valid percentages', () => {
      console.log('[DEBUG] Testing percentage creation');
      
      const percentage = createPercentage(75);
      expect(percentage).toBe(75);
      
      console.log('[DEBUG] Percentage creation test passed');
    });

    it('should throw for invalid percentages', () => {
      console.log('[DEBUG] Testing invalid percentage creation');
      
      expect(() => createPercentage(-1)).toThrow('Percentage must be between 0 and 100');
      expect(() => createPercentage(101)).toThrow('Percentage must be between 0 and 100');
      
      console.log('[DEBUG] Invalid percentage test passed');
    });

    it('should create valid normalized values', () => {
      console.log('[DEBUG] Testing normalized value creation');
      
      const normalized = createNormalized(0.75);
      expect(normalized).toBe(0.75);
      
      console.log('[DEBUG] Normalized value creation test passed');
    });

    it('should throw for invalid normalized values', () => {
      console.log('[DEBUG] Testing invalid normalized value creation');
      
      expect(() => createNormalized(-0.1)).toThrow('Normalized value must be between 0 and 1');
      expect(() => createNormalized(1.1)).toThrow('Normalized value must be between 0 and 1');
      
      console.log('[DEBUG] Invalid normalized value test passed');
    });
  });

  describe('Type Guards', () => {
    it('should identify engine IDs correctly', () => {
      console.log('[DEBUG] Testing engine ID type guard');
      
      const engineId = createEngineId();
      const sceneId = createSceneId();
      
      expect(isEngineId(engineId)).toBe(true);
      expect(isEngineId(sceneId)).toBe(false);
      expect(isEngineId('not-an-id')).toBe(false);
      expect(isEngineId(123)).toBe(false);
      
      console.log('[DEBUG] Engine ID type guard test passed');
    });

    it('should identify scene IDs correctly', () => {
      console.log('[DEBUG] Testing scene ID type guard');
      
      const sceneId = createSceneId();
      const meshId = createMeshId();
      
      expect(isSceneId(sceneId)).toBe(true);
      expect(isSceneId(meshId)).toBe(false);
      expect(isSceneId('not-an-id')).toBe(false);
      
      console.log('[DEBUG] Scene ID type guard test passed');
    });

    it('should identify mesh IDs correctly', () => {
      console.log('[DEBUG] Testing mesh ID type guard');
      
      const meshId = createMeshId();
      const engineId = createEngineId();
      
      expect(isMeshId(meshId)).toBe(true);
      expect(isMeshId(engineId)).toBe(false);
      expect(isMeshId('not-an-id')).toBe(false);
      
      console.log('[DEBUG] Mesh ID type guard test passed');
    });
  });

  describe('Serialization Support', () => {
    it('should serialize branded types correctly', () => {
      console.log('[DEBUG] Testing branded type serialization');
      
      const engineId = createEngineId();
      const serialized = serializeBranded(engineId);
      
      expect(typeof serialized).toBe('string');
      expect(serialized).toBe(engineId);
      
      console.log('[DEBUG] Branded type serialization test passed');
    });

    it('should deserialize to branded types correctly', () => {
      console.log('[DEBUG] Testing branded type deserialization');
      
      const originalId = createEngineId();
      const serialized = serializeBranded(originalId);
      const deserialized = deserializeBranded<string, 'EngineId'>(serialized);
      
      expect(deserialized).toBe(originalId);
      
      console.log('[DEBUG] Branded type deserialization test passed');
    });

    it('should handle serialization round trip', () => {
      console.log('[DEBUG] Testing serialization round trip');
      
      const originalColor = createHexColor('#FF0000');
      const serialized = serializeBranded(originalColor);
      const deserialized = deserializeBranded<string, 'HexColor'>(
        serialized,
        isValidHexColor
      );
      
      expect(deserialized).toBe(originalColor);
      
      console.log('[DEBUG] Serialization round trip test passed');
    });
  });
});
