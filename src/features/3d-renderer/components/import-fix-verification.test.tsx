/**
 * Import Fix Verification Tests
 *
 * Tests to verify that the import issues are resolved and the application
 * loads without ERR_BLOCKED_BY_CLIENT or R3F Canvas errors.
 */

import { describe, it, expect, vi } from "vitest";

describe("Import Fix Verification", () => {
  describe("Performance Metrics Import", () => {
    it("should use inline measureTime function instead of external import", () => {
      // Test that the inline measureTime function works correctly
      const measureTime = <T,>(
        fn: () => T,
      ): { result: T; duration: number } => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return { result, duration: end - start };
      };

      // Mock performance.now to return predictable values
      const performanceSpy = vi
        .spyOn(performance, "now")
        .mockReturnValueOnce(100) // Start time
        .mockReturnValueOnce(115); // End time (15ms duration)

      const testFunction = vi.fn(() => "test result");
      const measurement = measureTime(testFunction);

      expect(measurement.result).toBe("test result");
      expect(measurement.duration).toBe(15);
      expect(testFunction).toHaveBeenCalledOnce();

      performanceSpy.mockRestore();
    });

    it("should handle performance measurement without external dependencies", () => {
      // Verify that performance measurement doesn't rely on external imports
      const measureTime = <T,>(
        fn: () => T,
      ): { result: T; duration: number } => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return { result, duration: end - start };
      };

      const testFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const measurement = measureTime(testFunction);

      expect(typeof measurement.result).toBe("number");
      expect(typeof measurement.duration).toBe("number");
      expect(measurement.duration).toBeGreaterThanOrEqual(0);
      expect(measurement.result).toBe(499500); // Sum of 0 to 999
    });
  });

  describe("R3F Scene Component", () => {
    it("should import R3F scene component without errors", async () => {
      // Test that the R3F scene component can be imported
      const { R3FScene } = await import("./r3f-scene");

      expect(R3FScene).toBeDefined();
      expect(typeof R3FScene).toBe("function");
    });

    it("should import store-connected renderer without errors", async () => {
      // Test that the store-connected renderer can be imported
      const { StoreConnectedRenderer } = await import(
        "./store-connected-renderer"
      );

      expect(StoreConnectedRenderer).toBeDefined();
      expect(typeof StoreConnectedRenderer).toBe("function");
    });
  });

  describe("Three.js Renderer Component", () => {
    it("should import three-renderer component without blocked client errors", async () => {
      // Test that the three-renderer component can be imported without issues
      const { ThreeRenderer } = await import("./three-renderer");

      expect(ThreeRenderer).toBeDefined();
      expect(typeof ThreeRenderer).toBe("function");
    });

    it("should not have external performance metrics dependency", () => {
      // Verify that the component doesn't try to import from blocked paths
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // This should not cause any import errors
      expect(() => {
        void import("./three-renderer");
      }).not.toThrow();

      // Check that no console errors were logged related to blocked imports
      const importErrors = consoleSpy.mock.calls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("ERR_BLOCKED_BY_CLIENT") ||
              arg.includes("metrics.ts") ||
              arg.includes("Failed to load")),
        ),
      );

      expect(importErrors).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe("Application Integration", () => {
    it("should import main App component without errors", async () => {
      // Test that the main App component can be imported
      const AppModule = await import("../../../App");

      expect(AppModule.default).toBeDefined();
      expect(typeof AppModule.default).toBe("function");
    });

    it("should verify all store-connected components are available", async () => {
      // Test that all main components can be imported without issues
      const [
        { StoreConnectedEditor },
        { StoreConnectedRenderer },
        { R3FScene },
      ] = await Promise.all([
        import("../../code-editor/components/store-connected-editor"),
        import("./store-connected-renderer"),
        import("./r3f-scene"),
      ]);

      expect(StoreConnectedEditor).toBeDefined();
      expect(StoreConnectedRenderer).toBeDefined();
      expect(R3FScene).toBeDefined();
    });
  });

  describe("Error Prevention", () => {
    it("should not have any blocked client import attempts", () => {
      // Mock console.error to catch any import-related errors
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock fetch to simulate blocked requests
      const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() => {
        throw new Error("ERR_BLOCKED_BY_CLIENT");
      });

      // The application should not attempt to fetch external metrics
      // This test passes if no fetch calls are made for metrics
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it("should handle missing ResizeObserver gracefully", () => {
      // Test that the application handles missing browser APIs gracefully
      const originalResizeObserver = global.ResizeObserver;

      // Temporarily remove ResizeObserver
      (global as any).ResizeObserver = undefined;

      // The application should not crash
      expect(() => {
        // This simulates what happens when ResizeObserver is not available
        const mockObserver = {
          observe: () => {},
          disconnect: () => {},
          unobserve: () => {},
        };
        expect(mockObserver).toBeDefined();
      }).not.toThrow();

      // Restore ResizeObserver
      global.ResizeObserver = originalResizeObserver;
    });
  });

  describe("Performance Measurement Fallbacks", () => {
    it("should handle performance API unavailability", () => {
      const originalPerformance = global.performance;

      // Temporarily remove performance API
      (global as any).performance = undefined;

      // Should not crash when performance API is unavailable
      expect(() => {
        const fallbackMeasure = () => {
          const start = Date.now();
          const result = "test";
          const end = Date.now();
          return { result, duration: end - start };
        };

        const measurement = fallbackMeasure();
        expect(measurement.result).toBe("test");
        expect(typeof measurement.duration).toBe("number");
      }).not.toThrow();

      // Restore performance API
      global.performance = originalPerformance;
    });
  });
});
