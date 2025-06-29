/**
 * Result Utilities Test Suite
 *
 * Tests for functional Result utility functions following TDD methodology
 * with comprehensive coverage of all utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  success,
  error,
  some,
  none,
  map,
  mapError,
  chain,
  unwrapOr,
  unwrap,
  combine,
  combineAll,
  tryCatch,
  filter,
  optionToResult,
  resultToOption,
  validate,
} from "./result";

describe("Result Utilities", () => {
  describe("Constructors", () => {
    it("should create success results", () => {
      const result = success("test");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test");
      }
    });

    it("should create error results", () => {
      const result = error("test error");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("test error");
      }
    });

    it("should create Some options", () => {
      const option = some(42);

      expect(option.some).toBe(true);
      if (option.some) {
        expect(option.value).toBe(42);
      }
    });

    it("should create None options", () => {
      const option = none();

      expect(option.some).toBe(false);
    });
  });

  describe("map", () => {
    it("should map over successful results", () => {
      const result = success(5);
      const mapped = map(result, (x) => x * 2);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(10);
      }
    });

    it("should leave error results unchanged", () => {
      const result = error<number, string>("test error");
      const mapped = map(result, (x: number) => x * 2);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe("test error");
      }
    });
  });

  describe("mapError", () => {
    it("should map over error results", () => {
      const result = error("original error");
      const mapped = mapError(result, (err) => `Mapped: ${err}`);

      expect(mapped.success).toBe(false);
      if (!mapped.success) {
        expect(mapped.error).toBe("Mapped: original error");
      }
    });

    it("should leave success results unchanged", () => {
      const result = success(42);
      const mapped = mapError(result, (err) => `Mapped: ${err}`);

      expect(mapped.success).toBe(true);
      if (mapped.success) {
        expect(mapped.data).toBe(42);
      }
    });
  });

  describe("chain", () => {
    it("should chain successful operations", () => {
      const result = success(5);
      const chained = chain(result, (x) => success(x * 2));

      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.data).toBe(10);
      }
    });

    it("should chain operations that can fail", () => {
      const result = success(5);
      const chained = chain(result, (x: number) =>
        x > 3 ? success(x * 2) : error(new Error("too small")),
      );

      expect(chained.success).toBe(true);
      if (chained.success) {
        expect(chained.data).toBe(10);
      }
    });

    it("should not execute chain function on error results", () => {
      const result = error<number, string>("original error");
      const chained = chain(result, (x: number) => success(x * 2));

      expect(chained.success).toBe(false);
      if (!chained.success) {
        expect(chained.error).toBe("original error");
      }
    });
  });

  describe("unwrapOr", () => {
    it("should unwrap successful results", () => {
      const result = success(42);
      const value = unwrapOr(result, 0);

      expect(value).toBe(42);
    });

    it("should return default value for error results", () => {
      const result = error("test error");
      const value = unwrapOr(result, 0);

      expect(value).toBe(0);
    });
  });

  describe("unwrap", () => {
    it("should unwrap successful results", () => {
      const result = success(42);
      const value = unwrap(result);

      expect(value).toBe(42);
    });

    it("should throw for error results", () => {
      const result = error("test error");

      expect(() => unwrap(result)).toThrow(
        "Attempted to unwrap error Result: test error",
      );
    });
  });

  describe("combine", () => {
    it("should combine successful results", () => {
      const results = [success(1), success(2), success(3)];
      const combined = combine(results);

      expect(combined.success).toBe(true);
      if (combined.success) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it("should return first error when any result fails", () => {
      const results = [
        success<number, string>(1),
        error<number, string>("error 2"),
        success<number, string>(3),
      ];
      const combined = combine(results);

      expect(combined.success).toBe(false);
      if (!combined.success) {
        expect(combined.error).toBe("error 2");
      }
    });
  });

  describe("combineAll", () => {
    it("should combine all successful results", () => {
      const results = [success(1), success(2), success(3)];
      const combined = combineAll(results);

      expect(combined.success).toBe(true);
      if (combined.success) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it("should collect all errors", () => {
      const results = [
        success<number, string>(1),
        error<number, string>("error 2"),
        error<number, string>("error 3"),
      ];
      const combined = combineAll(results);

      expect(combined.success).toBe(false);
      if (!combined.success) {
        expect(combined.error).toEqual(["error 2", "error 3"]);
      }
    });
  });

  describe("tryCatch", () => {
    it("should catch successful operations", () => {
      const result = tryCatch(() => 42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("should catch thrown errors", () => {
      const result = tryCatch(() => {
        throw new Error("test error");
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("test error");
      }
    });

    it("should use custom error mapper", () => {
      const result = tryCatch(
        () => {
          throw new Error("original error");
        },
        (err: unknown) => `Mapped: ${(err as Error).message}`,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Mapped: original error");
      }
    });
  });

  describe("filter", () => {
    it("should pass values that match predicate", () => {
      const result = success<number, string>(10);
      const filtered = filter(result, (x: number) => x > 5, "too small");

      expect(filtered.success).toBe(true);
      if (filtered.success) {
        expect(filtered.data).toBe(10);
      }
    });

    it("should fail values that do not match predicate", () => {
      const result = success<number, string>(3);
      const filtered = filter(result, (x: number) => x > 5, "too small");

      expect(filtered.success).toBe(false);
      if (!filtered.success) {
        expect(filtered.error).toBe("too small");
      }
    });

    it("should pass through error results", () => {
      const result = error<number, string>("original error");
      const filtered = filter(result, (x: number) => x > 5, "too small");

      expect(filtered.success).toBe(false);
      if (!filtered.success) {
        expect(filtered.error).toBe("original error");
      }
    });
  });

  describe("Option/Result conversions", () => {
    it("should convert Some to success", () => {
      const option = some(42);
      const result = optionToResult(option, "no value");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("should convert None to error", () => {
      const option = none();
      const result = optionToResult(option, "no value");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("no value");
      }
    });

    it("should convert success to Some", () => {
      const result = success(42);
      const option = resultToOption(result);

      expect(option.some).toBe(true);
      if (option.some) {
        expect(option.value).toBe(42);
      }
    });

    it("should convert error to None", () => {
      const result = error("test error");
      const option = resultToOption(result);

      expect(option.some).toBe(false);
    });
  });

  describe("validate", () => {
    it("should pass validation with no errors", () => {
      const validators = [
        (x: number) => (x > 0 ? null : "must be positive"),
        (x: number) => (x < 100 ? null : "must be less than 100"),
      ];

      const result = validate(50, validators);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(50);
      }
    });

    it("should collect validation errors", () => {
      const validators = [
        (x: number) => (x > 0 ? null : "must be positive"),
        (x: number) => (x < 100 ? null : "must be less than 100"),
      ];

      const result = validate(-5, validators);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toEqual(["must be positive"]);
      }
    });
  });
});
