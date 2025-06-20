/**
 * @file Result Types Tests
 * 
 * Comprehensive test suite for Result/Either types and functional error handling.
 * Tests type safety, error propagation, and composable error handling patterns.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Result,
  Option,
  AsyncResult,
  Ok,
  Err,
  Some,
  None,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  unwrapErr,
  map,
  mapErr,
  flatMap,
  flatMapErr,
  apply,
  isSome,
  isNone,
  unwrapOption,
  unwrapOptionOr,
  unwrapOptionOrElse,
  mapOption,
  flatMapOption,
  filterOption,
  fromNullable,
  toNullable,
  resultToOption,
  optionToResult,
  AsyncOk,
  AsyncErr,
  mapAsync,
  flatMapAsync,
  tryCatch,
  tryCatchSync,
  all,
  any,
  partition,
  pipe,
  pipeResult,
} from './result-types';

describe('Result Types', () => {
  beforeEach(() => {
    console.log('[INIT] Starting result types test');
  });

  describe('Core Result Type', () => {
    it('should create successful results with Ok', () => {
      console.log('[DEBUG] Testing Ok result creation');

      const result = Ok(42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);

      console.log('[DEBUG] Ok result creation test passed');
    });

    it('should create error results with Err', () => {
      console.log('[DEBUG] Testing Err result creation');

      const result = Err('Something went wrong');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Something went wrong');
      }
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);

      console.log('[DEBUG] Err result creation test passed');
    });

    it('should handle complex data types', () => {
      console.log('[DEBUG] Testing complex data types in results');

      const complexData = { id: 1, name: 'test', items: [1, 2, 3] };
      const result = Ok(complexData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(complexData);
        expect(result.data.items).toHaveLength(3);
      }

      console.log('[DEBUG] Complex data types test passed');
    });
  });

  describe('Result Utility Functions', () => {
    it('should unwrap successful results', () => {
      console.log('[DEBUG] Testing result unwrapping');
      
      const result = Ok(42);
      const value = unwrap(result);
      
      expect(value).toBe(42);
      
      console.log('[DEBUG] Result unwrapping test passed');
    });

    it('should throw when unwrapping error results', () => {
      console.log('[DEBUG] Testing unwrap error handling');
      
      const result = Err('Error message');
      
      expect(() => unwrap(result)).toThrow('Called unwrap on error result: Error message');
      
      console.log('[DEBUG] Unwrap error handling test passed');
    });

    it('should return default value with unwrapOr', () => {
      console.log('[DEBUG] Testing unwrapOr with default values');
      
      const successResult = Ok(42);
      const errorResult = Err('Error');
      
      expect(unwrapOr(successResult, 0)).toBe(42);
      expect(unwrapOr(errorResult, 0)).toBe(0);
      
      console.log('[DEBUG] UnwrapOr test passed');
    });

    it('should compute default value with unwrapOrElse', () => {
      console.log('[DEBUG] Testing unwrapOrElse with computed defaults');
      
      const successResult = Ok(42);
      const errorResult = Err('Error');
      
      expect(unwrapOrElse(successResult, () => 0)).toBe(42);
      expect(unwrapOrElse(errorResult, (error) => error.length)).toBe(5);
      
      console.log('[DEBUG] UnwrapOrElse test passed');
    });

    it('should unwrap error from failed results', () => {
      console.log('[DEBUG] Testing error unwrapping');
      
      const result = Err('Error message');
      const error = unwrapErr(result);
      
      expect(error).toBe('Error message');
      
      console.log('[DEBUG] Error unwrapping test passed');
    });

    it('should throw when unwrapping error from success results', () => {
      console.log('[DEBUG] Testing unwrapErr error handling');
      
      const result = Ok(42);
      
      expect(() => unwrapErr(result)).toThrow('Called unwrapErr on success result: 42');
      
      console.log('[DEBUG] UnwrapErr error handling test passed');
    });
  });

  describe('Result Transformation Functions', () => {
    it('should transform successful results with map', () => {
      console.log('[DEBUG] Testing result mapping');

      const result = Ok(42);
      const mapped = map(result, (x) => x * 2);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(84);
      }

      console.log('[DEBUG] Result mapping test passed');
    });

    it('should preserve errors when mapping', () => {
      console.log('[DEBUG] Testing error preservation in mapping');

      const result = Err('Error');
      const mapped = map(result, (x: number) => x * 2);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe('Error');
      }

      console.log('[DEBUG] Error preservation test passed');
    });

    it('should transform errors with mapErr', () => {
      console.log('[DEBUG] Testing error mapping');

      const result = Err('Error');
      const mapped = mapErr(result, (error) => `Transformed: ${error}`);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe('Transformed: Error');
      }

      console.log('[DEBUG] Error mapping test passed');
    });

    it('should preserve success when mapping errors', () => {
      console.log('[DEBUG] Testing success preservation in error mapping');

      const result = Ok(42);
      const mapped = mapErr(result, (error: string) => `Transformed: ${error}`);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(42);
      }

      console.log('[DEBUG] Success preservation test passed');
    });

    it('should chain operations with flatMap', () => {
      console.log('[DEBUG] Testing result chaining with flatMap');

      const result = Ok(42);
      const chained = flatMap(result, (x) => x > 0 ? Ok(x * 2) : Err('Negative'));

      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.data).toBe(84);
      }

      console.log('[DEBUG] Result chaining test passed');
    });

    it('should short-circuit on error with flatMap', () => {
      console.log('[DEBUG] Testing error short-circuiting in flatMap');

      const result = Err('Initial error');
      const chained = flatMap(result, (x: number) => Ok(x * 2));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe('Initial error');
      }

      console.log('[DEBUG] Error short-circuiting test passed');
    });

    it('should apply functions in Result context', () => {
      console.log('[DEBUG] Testing function application in Result context');

      const resultFn = Ok((x: number) => x * 2);
      const resultData = Ok(42);
      const applied = apply(resultFn, resultData);

      expect(applied.success).toBe(true);
      if (applied.success) {
        expect(applied.data).toBe(84);
      }

      console.log('[DEBUG] Function application test passed');
    });

    it('should handle errors in function application', () => {
      console.log('[DEBUG] Testing error handling in function application');

      const resultFn = Err('Function error');
      const resultData = Ok(42);
      const applied = apply(resultFn, resultData);

      expect(applied.success).toBe(false);
      if (!applied.success) {
        expect(applied.error).toBe('Function error');
      }

      console.log('[DEBUG] Error handling in function application test passed');
    });
  });

  describe('Option Type', () => {
    it('should create Some values', () => {
      console.log('[DEBUG] Testing Some option creation');

      const option = Some(42);

      expect(option.isSome).toBe(true);
      if (option.isSome) {
        expect(option.value).toBe(42);
      }
      expect(isSome(option)).toBe(true);
      expect(isNone(option)).toBe(false);

      console.log('[DEBUG] Some option creation test passed');
    });

    it('should create None values', () => {
      console.log('[DEBUG] Testing None option creation');

      const option = None;

      expect(option.isSome).toBe(false);
      expect(isSome(option)).toBe(false);
      expect(isNone(option)).toBe(true);

      console.log('[DEBUG] None option creation test passed');
    });

    it('should unwrap Some options', () => {
      console.log('[DEBUG] Testing option unwrapping');

      const option = Some(42);
      const value = unwrapOption(option);

      expect(value).toBe(42);

      console.log('[DEBUG] Option unwrapping test passed');
    });

    it('should throw when unwrapping None options', () => {
      console.log('[DEBUG] Testing None unwrap error handling');

      const option = None;

      expect(() => unwrapOption(option)).toThrow('Called unwrap on None option');

      console.log('[DEBUG] None unwrap error handling test passed');
    });

    it('should return default value with unwrapOptionOr', () => {
      console.log('[DEBUG] Testing unwrapOptionOr with default values');

      const someOption = Some(42);
      const noneOption = None;

      expect(unwrapOptionOr(someOption, 0)).toBe(42);
      expect(unwrapOptionOr(noneOption, 0)).toBe(0);

      console.log('[DEBUG] UnwrapOptionOr test passed');
    });

    it('should compute default value with unwrapOptionOrElse', () => {
      console.log('[DEBUG] Testing unwrapOptionOrElse with computed defaults');

      const someOption = Some(42);
      const noneOption = None;

      expect(unwrapOptionOrElse(someOption, () => 0)).toBe(42);
      expect(unwrapOptionOrElse(noneOption, () => 100)).toBe(100);

      console.log('[DEBUG] UnwrapOptionOrElse test passed');
    });
  });

  describe('Option Transformation Functions', () => {
    it('should transform Some values with mapOption', () => {
      console.log('[DEBUG] Testing option mapping');

      const option = Some(42);
      const mapped = mapOption(option, (x) => x * 2);

      expect(mapped.isSome).toBe(true);
      if (mapped.isSome) {
        expect(mapped.value).toBe(84);
      }

      console.log('[DEBUG] Option mapping test passed');
    });

    it('should preserve None when mapping', () => {
      console.log('[DEBUG] Testing None preservation in mapping');

      const option = None;
      const mapped = mapOption(option, (x: number) => x * 2);

      expect(mapped.isSome).toBe(false);

      console.log('[DEBUG] None preservation test passed');
    });

    it('should chain operations with flatMapOption', () => {
      console.log('[DEBUG] Testing option chaining with flatMapOption');

      const option = Some(42);
      const chained = flatMapOption(option, (x) => x > 0 ? Some(x * 2) : None);

      expect(chained.isSome).toBe(true);
      if (chained.isSome) {
        expect(chained.value).toBe(84);
      }

      console.log('[DEBUG] Option chaining test passed');
    });

    it('should short-circuit on None with flatMapOption', () => {
      console.log('[DEBUG] Testing None short-circuiting in flatMapOption');

      const option = None;
      const chained = flatMapOption(option, (x: number) => Some(x * 2));

      expect(chained.isSome).toBe(false);

      console.log('[DEBUG] None short-circuiting test passed');
    });

    it('should filter option values', () => {
      console.log('[DEBUG] Testing option filtering');

      const someOption = Some(42);
      const filteredTrue = filterOption(someOption, (x) => x > 0);
      const filteredFalse = filterOption(someOption, (x) => x < 0);

      expect(filteredTrue.isSome).toBe(true);
      if (filteredTrue.isSome) {
        expect(filteredTrue.value).toBe(42);
      }
      expect(filteredFalse.isSome).toBe(false);

      console.log('[DEBUG] Option filtering test passed');
    });

    it('should handle None in filtering', () => {
      console.log('[DEBUG] Testing None handling in filtering');

      const option = None;
      const filtered = filterOption(option, (x: number) => x > 0);

      expect(filtered.isSome).toBe(false);

      console.log('[DEBUG] None handling in filtering test passed');
    });
  });

  describe('Conversion Functions', () => {
    it('should convert nullable values to Options', () => {
      console.log('[DEBUG] Testing nullable to Option conversion');

      const someValue = fromNullable(42);
      const nullValue = fromNullable(null);
      const undefinedValue = fromNullable(undefined);

      expect(someValue.isSome).toBe(true);
      if (someValue.isSome) {
        expect(someValue.value).toBe(42);
      }
      expect(nullValue.isSome).toBe(false);
      expect(undefinedValue.isSome).toBe(false);

      console.log('[DEBUG] Nullable to Option conversion test passed');
    });

    it('should convert Options to nullable values', () => {
      console.log('[DEBUG] Testing Option to nullable conversion');

      const someOption = Some(42);
      const noneOption = None;

      expect(toNullable(someOption)).toBe(42);
      expect(toNullable(noneOption)).toBe(null);

      console.log('[DEBUG] Option to nullable conversion test passed');
    });

    it('should convert Results to Options', () => {
      console.log('[DEBUG] Testing Result to Option conversion');

      const successResult = Ok(42);
      const errorResult = Err('Error');

      const someOption = resultToOption(successResult);
      const noneOption = resultToOption(errorResult);

      expect(someOption.isSome).toBe(true);
      if (someOption.isSome) {
        expect(someOption.value).toBe(42);
      }
      expect(noneOption.isSome).toBe(false);

      console.log('[DEBUG] Result to Option conversion test passed');
    });

    it('should convert Options to Results', () => {
      console.log('[DEBUG] Testing Option to Result conversion');

      const someOption = Some(42);
      const noneOption = None;

      const successResult = optionToResult(someOption, 'Error');
      const errorResult = optionToResult(noneOption, 'Error');

      expect(successResult.success).toBe(true);
      if (successResult.success) {
        expect(successResult.data).toBe(42);
      }
      expect(errorResult.success).toBe(false);
      if (!errorResult.success) {
        expect(errorResult.error).toBe('Error');
      }

      console.log('[DEBUG] Option to Result conversion test passed');
    });
  });

  describe('Async Result Functions', () => {
    it('should create async successful results', async () => {
      console.log('[DEBUG] Testing async Ok result creation');

      const asyncResult = AsyncOk(42);
      const result = await asyncResult;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }

      console.log('[DEBUG] Async Ok result creation test passed');
    });

    it('should create async error results', async () => {
      console.log('[DEBUG] Testing async Err result creation');

      const asyncResult = AsyncErr('Error');
      const result = await asyncResult;

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Error');
      }

      console.log('[DEBUG] Async Err result creation test passed');
    });

    it('should transform async results with mapAsync', async () => {
      console.log('[DEBUG] Testing async result mapping');

      const asyncResult = AsyncOk(42);
      const mapped = await mapAsync(asyncResult, (x) => x * 2);

      expect(mapped.success).toBe(true);
      expect(mapped.data).toBe(84);

      console.log('[DEBUG] Async result mapping test passed');
    });

    it('should handle async transformation functions', async () => {
      console.log('[DEBUG] Testing async transformation functions');

      const asyncResult = AsyncOk(42);
      const mapped = await mapAsync(asyncResult, async (x) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return x * 2;
      });

      expect(mapped.success).toBe(true);
      expect(mapped.data).toBe(84);

      console.log('[DEBUG] Async transformation functions test passed');
    });

    it('should chain async operations with flatMapAsync', async () => {
      console.log('[DEBUG] Testing async result chaining');

      const asyncResult = AsyncOk(42);
      const chained = await flatMapAsync(asyncResult, (x) => AsyncOk(x * 2));

      expect(chained.success).toBe(true);
      expect(chained.data).toBe(84);

      console.log('[DEBUG] Async result chaining test passed');
    });

    it('should catch promise errors with tryCatch', async () => {
      console.log('[DEBUG] Testing promise error catching');

      const successResult = await tryCatch(async () => 42);
      const errorResult = await tryCatch(async () => {
        throw new Error('Async error');
      });

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe(42);
      expect(errorResult.success).toBe(false);
      expect(errorResult.error.message).toBe('Async error');

      console.log('[DEBUG] Promise error catching test passed');
    });

    it('should catch synchronous errors with tryCatchSync', () => {
      console.log('[DEBUG] Testing synchronous error catching');

      const successResult = tryCatchSync(() => 42);
      const errorResult = tryCatchSync(() => {
        throw new Error('Sync error');
      });

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe(42);
      expect(errorResult.success).toBe(false);
      expect(errorResult.error.message).toBe('Sync error');

      console.log('[DEBUG] Synchronous error catching test passed');
    });
  });

  describe('Combinators', () => {
    it('should combine successful results with all', () => {
      console.log('[DEBUG] Testing all combinator with successes');

      const results = [Ok(1), Ok(2), Ok(3)] as const;
      const combined = all(results);

      expect(combined.success).toBe(true);
      expect(combined.data).toEqual([1, 2, 3]);

      console.log('[DEBUG] All combinator with successes test passed');
    });

    it('should fail fast with all combinator', () => {
      console.log('[DEBUG] Testing all combinator fail fast');

      const results = [Ok(1), Err('Error'), Ok(3)] as const;
      const combined = all(results);

      expect(combined.success).toBe(false);
      expect(combined.error).toBe('Error');

      console.log('[DEBUG] All combinator fail fast test passed');
    });

    it('should return first success with any combinator', () => {
      console.log('[DEBUG] Testing any combinator with first success');

      const results = [Err('Error1'), Ok(42), Err('Error2')];
      const result = any(results);

      expect(result.success).toBe(true);
      expect(result.data).toBe(42);

      console.log('[DEBUG] Any combinator with first success test passed');
    });

    it('should return last error with any combinator when all fail', () => {
      console.log('[DEBUG] Testing any combinator with all failures');

      const results = [Err('Error1'), Err('Error2'), Err('Error3')];
      const result = any(results);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error3');

      console.log('[DEBUG] Any combinator with all failures test passed');
    });

    it('should partition results into successes and errors', () => {
      console.log('[DEBUG] Testing result partitioning');

      const results = [Ok(1), Err('Error1'), Ok(2), Err('Error2'), Ok(3)];
      const partitioned = partition(results);

      expect(partitioned.successes).toEqual([1, 2, 3]);
      expect(partitioned.errors).toEqual(['Error1', 'Error2']);

      console.log('[DEBUG] Result partitioning test passed');
    });
  });

  describe('Pipeline Functions', () => {
    it('should create value pipelines', () => {
      console.log('[DEBUG] Testing value pipeline creation');

      const result = pipe(42)
        .map(x => x * 2)
        .map(x => x + 1)
        .value();

      expect(result).toBe(85);

      console.log('[DEBUG] Value pipeline creation test passed');
    });

    it('should create result pipelines', () => {
      console.log('[DEBUG] Testing result pipeline creation');

      const result = pipeResult(Ok(42))
        .map(x => x * 2)
        .flatMap(x => x > 50 ? Ok(x + 1) : Err('Too small'))
        .result();

      expect(result.success).toBe(true);
      expect(result.data).toBe(85);

      console.log('[DEBUG] Result pipeline creation test passed');
    });

    it('should handle errors in result pipelines', () => {
      console.log('[DEBUG] Testing error handling in result pipelines');

      const result = pipeResult(Ok(10))
        .map(x => x * 2)
        .flatMap(x => x > 50 ? Ok(x + 1) : Err('Too small'))
        .result();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too small');

      console.log('[DEBUG] Error handling in result pipelines test passed');
    });

    it('should use unwrapOr in pipelines', () => {
      console.log('[DEBUG] Testing unwrapOr in pipelines');

      const successValue = pipeResult(Ok(42)).unwrapOr(0);
      const errorValue = pipeResult(Err('Error')).unwrapOr(0);

      expect(successValue).toBe(42);
      expect(errorValue).toBe(0);

      console.log('[DEBUG] UnwrapOr in pipelines test passed');
    });

    it('should use unwrapOrElse in pipelines', () => {
      console.log('[DEBUG] Testing unwrapOrElse in pipelines');

      const successValue = pipeResult(Ok(42)).unwrapOrElse(() => 0);
      const errorValue = pipeResult(Err('Error')).unwrapOrElse((error) => error.length);

      expect(successValue).toBe(42);
      expect(errorValue).toBe(5);

      console.log('[DEBUG] UnwrapOrElse in pipelines test passed');
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle nested Result types', () => {
      console.log('[DEBUG] Testing nested Result types');

      const nestedResult: Result<Result<number, string>, string> = Ok(Ok(42));
      const flattened = flatMap(nestedResult, (innerResult) => innerResult);

      expect(flattened.success).toBe(true);
      expect(flattened.data).toBe(42);

      console.log('[DEBUG] Nested Result types test passed');
    });

    it('should handle complex error types', () => {
      console.log('[DEBUG] Testing complex error types');

      interface CustomError {
        code: number;
        message: string;
        details?: unknown;
      }

      const error: CustomError = { code: 404, message: 'Not found' };
      const result: Result<string, CustomError> = Err(error);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(404);
      expect(result.error.message).toBe('Not found');

      console.log('[DEBUG] Complex error types test passed');
    });

    it('should maintain type safety in transformations', () => {
      console.log('[DEBUG] Testing type safety in transformations');

      const stringResult: Result<string, Error> = Ok('42');
      const numberResult = map(stringResult, (str) => parseInt(str, 10));

      expect(numberResult.success).toBe(true);
      expect(typeof numberResult.data).toBe('number');
      expect(numberResult.data).toBe(42);

      console.log('[DEBUG] Type safety in transformations test passed');
    });
  });
});
