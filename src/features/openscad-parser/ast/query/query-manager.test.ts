/**
 * Tests for the QueryManager class
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Language, Tree } from 'web-tree-sitter';
import { OpenscadParser } from '../../openscad-parser.js';
import { LRUQueryCache } from './lru-query-cache.js';
import { QueryManager } from './query-manager.js';

describe('QueryManager', () => {
  let parser: OpenscadParser;
  let language: Language;
  let tree: Tree;
  let queryManager: QueryManager;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
    language = parser.getLanguage()!;
    tree = parser.parseCST('cube(10); sphere(5);')!;
    queryManager = new QueryManager(language, new LRUQueryCache());
  });

  afterEach(() => {
    queryManager.dispose();
    tree.delete();
    parser.dispose();
  });

  it('should execute a query and cache the results', () => {
    const queryString = '(module_instantiation) @capture';
    const results1 = queryManager.executeQuery(queryString, tree);
    expect(results1.length).toBe(2);
    expect(queryManager.getCacheStats().misses).toBe(1);
    expect(queryManager.getCacheStats().hits).toBe(0);

    const results2 = queryManager.executeQuery(queryString, tree);
    expect(results2.length).toBe(2);
    expect(queryManager.getCacheStats().misses).toBe(1);
    expect(queryManager.getCacheStats().hits).toBe(1);
  });

  it('should find nodes by type', () => {
    const results = queryManager.findNodesByType('module_instantiation', tree);
    expect(results.length).toBe(2);
  });

  it('should clear the cache', () => {
    const queryString = '(module_instantiation) @capture';
    queryManager.executeQuery(queryString, tree);
    expect(queryManager.getCacheStats().size).toBe(1);
    queryManager.clearCache();
    expect(queryManager.getCacheStats().size).toBe(0);
  });

  it('should get cache statistics', () => {
    const queryString = '(module_instantiation) @capture';
    queryManager.executeQuery(queryString, tree);
    queryManager.executeQuery(queryString, tree);
    const stats = queryManager.getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
  });
});
