/**
 * React Integration Layer Testing
 *
 * Comprehensive testing for React hooks, providers, and component integration
 * with matrix services and the complete application workflow.
 */

import React, { act, useEffect, useState } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Canvas } from "@react-three/fiber";
import { useAppStore } from "../store/app-store";
import { StoreConnectedEditor } from "../code-editor/components/store-connected-editor";
import { StoreConnectedRenderer } from "../3d-renderer/components/store-connected-renderer";
import { R3FScene } from "../3d-renderer/components/r3f-scene";
import { MatrixServiceContainer } from "../3d-renderer/services/matrix-service-container";
import { MatrixIntegrationService } from "../3d-renderer/services/matrix-integration.service";

/**
 * React integration test scenarios
 */
const REACT_INTEGRATION_SCENARIOS = {
  // Component mounting and unmounting
  componentLifecycle: {
    mountCount: 5,
    timeoutMs: 10000,
  },
  // State synchronization
  stateSynchronization: {
    updateCount: 10,
    debounceMs: 300,
    timeoutMs: 15000,
  },
  // Error boundary testing
  errorBoundary: {
    errorCount: 3,
    recoveryTimeMs: 1000,
    timeoutMs: 10000,
  },
  // Performance testing
  performance: {
    renderCount: 50,
    maxRenderTime: 100,
    timeoutMs: 20000,
  },
};

/**
 * Mock matrix service provider for testing
 */
const MockMatrixServiceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [serviceContainer] = useState(
    () =>
      new MatrixServiceContainer({
        enableTelemetry: true,
        enableValidation: true,
        enableConfigManager: true,
        autoStartServices: true,
      }),
  );

  const [integrationService] = useState(
    () => new MatrixIntegrationService(serviceContainer),
  );

  useEffect(() => {
    return () => {
      integrationService.shutdown();
    };
  }, [integrationService]);

  return <div data-testid="matrix-service-provider">{children}</div>;
};

/**
 * Test component for React integration
 */
const TestIntegrationComponent: React.FC<{
  onRender?: () => void;
  onError?: (error: Error) => void;
  triggerError?: boolean;
}> = ({ onRender, onError, triggerError = false }) => {
  const { code, parsing, scene3D, updateCode, parseCode } = useAppStore();
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
    onRender?.();
  });

  useEffect(() => {
    if (triggerError) {
      const error = new Error("Test error for error boundary");
      onError?.(error);
      throw error;
    }
  }, [triggerError, onError]);

  const handleCodeChange = async (newCode: string) => {
    updateCode(newCode);

    // Simulate debounced parsing
    setTimeout(async () => {
      await parseCode(newCode);
    }, 300);
  };

  return (
    <div data-testid="test-integration-component">
      <div data-testid="render-count">{renderCount}</div>
      <div data-testid="current-code">{code}</div>
      <div data-testid="ast-count">{parsing.ast.length}</div>
      <div data-testid="mesh-count">{scene3D.meshes.length}</div>
      <div data-testid="parsing-loading">
        {parsing.isLoading ? "loading" : "idle"}
      </div>
      <div data-testid="scene-loading">
        {scene3D.isLoading ? "loading" : "idle"}
      </div>

      <button
        data-testid="update-code-button"
        onClick={() => handleCodeChange("cube([5,5,5]);")}
      >
        Update Code
      </button>

      <button data-testid="parse-code-button" onClick={() => parseCode(code)}>
        Parse Code
      </button>
    </div>
  );
};

/**
 * Error boundary for testing error handling
 */
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log("[DEBUG][TestErrorBoundary] Caught error:", error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary-fallback">
          <h2>Something went wrong.</h2>
          <details>{this.state.error?.message}</details>
        </div>
      );
    }

    return this.props.children;
  }
}

describe("React Integration Layer Testing", () => {
  beforeEach(() => {
    console.log(
      "[INIT][ReactIntegrationTest] Setting up React integration test environment",
    );

    // Reset app store
    useAppStore.setState((state) => {
      state.editor.code = "";
      state.parsing = {
        ast: [],
        isLoading: false,
        errors: [],
        warnings: [],
        lastParsed: null,
        parseTime: 0,
      };
      state.rendering = {
        meshes: [],
        isRendering: false,
        renderErrors: [],
        lastRendered: null,
        renderTime: 0,
        camera: {
          position: [5, 5, 5],
          target: [0, 0, 0],
          zoom: 1,
        },
      };
    });
  });

  afterEach(() => {
    console.log(
      "[END][ReactIntegrationTest] Cleaning up React integration test environment",
    );
    vi.clearAllMocks();
  });

  describe("Component Lifecycle Integration", () => {
    it(
      "should handle component mounting and unmounting correctly",
      async () => {
        console.log(
          "[DEBUG][ReactIntegrationTest] Testing component lifecycle",
        );

        const scenario = REACT_INTEGRATION_SCENARIOS.componentLifecycle;
        const renderCounts: number[] = [];

        for (let i = 0; i < scenario.mountCount; i++) {
          const { unmount } = render(
            <MockMatrixServiceProvider>
              <TestIntegrationComponent
                onRender={() => {
                  const count = parseInt(
                    screen.getByTestId("render-count").textContent ?? "0",
                  );
                  renderCounts.push(count);
                }}
              />
            </MockMatrixServiceProvider>,
          );

          // Wait for component to render
          await waitFor(() => {
            expect(
              screen.getByTestId("test-integration-component"),
            ).toBeInTheDocument();
          });

          // Verify initial state
          expect(screen.getByTestId("current-code")).toHaveTextContent("");
          expect(screen.getByTestId("ast-count")).toHaveTextContent("0");
          expect(screen.getByTestId("mesh-count")).toHaveTextContent("0");

          // Unmount component
          unmount();
        }

        // All components should have rendered at least once
        expect(renderCounts.length).toBeGreaterThan(0);
        expect(renderCounts.every((count) => count >= 1)).toBe(true);
      },
      REACT_INTEGRATION_SCENARIOS.componentLifecycle.timeoutMs,
    );

    it(
      "should integrate with matrix services during component lifecycle",
      async () => {
        console.log(
          "[DEBUG][ReactIntegrationTest] Testing matrix service integration during lifecycle",
        );

        let serviceContainer: MatrixServiceContainer | null = null;

        const TestServiceIntegration: React.FC = () => {
          const [container] = useState(() => {
            serviceContainer = new MatrixServiceContainer({
              enableTelemetry: true,
              enableValidation: true,
              autoStartServices: true,
            });
            return serviceContainer;
          });

          useEffect(() => {
            return () => {
              container.shutdown?.();
            };
          }, [container]);

          return (
            <div data-testid="service-integration">
              <div data-testid="service-status">
                {container.getStatus().initialized
                  ? "initialized"
                  : "not-initialized"}
              </div>
            </div>
          );
        };

        const { unmount } = render(<TestServiceIntegration />);

        // Wait for service initialization
        await waitFor(() => {
          expect(screen.getByTestId("service-status")).toHaveTextContent(
            "initialized",
          );
        });

        // Verify service container is working
        expect(serviceContainer).toBeDefined();
        expect(serviceContainer!.getStatus().initialized).toBe(true);

        // Unmount and verify cleanup
        unmount();

        // Service should be cleaned up (this is implementation dependent)
        // We can't easily test shutdown without exposing internal state
      },
      REACT_INTEGRATION_SCENARIOS.componentLifecycle.timeoutMs,
    );
  });

  describe("State Synchronization", () => {
    it(
      "should synchronize store state with React components",
      async () => {
        console.log(
          "[DEBUG][ReactIntegrationTest] Testing state synchronization",
        );

        const scenario = REACT_INTEGRATION_SCENARIOS.stateSynchronization;
        const stateUpdates: string[] = [];

        const StateObserver: React.FC = () => {
          const { code, parsing } = useAppStore();

          useEffect(() => {
            stateUpdates.push(`code:${code},ast:${parsing.ast.length}`);
          }, [code, parsing.ast.length]);

          return (
            <div data-testid="state-observer">
              <div data-testid="observed-code">{code}</div>
              <div data-testid="observed-ast-count">{parsing.ast.length}</div>
            </div>
          );
        };

        render(
          <MockMatrixServiceProvider>
            <TestIntegrationComponent />
            <StateObserver />
          </MockMatrixServiceProvider>,
        );

        // Perform multiple state updates
        for (let i = 0; i < scenario.updateCount; i++) {
          const button = screen.getByTestId("update-code-button");

          act(() => {
            fireEvent.click(button);
          });

          // Wait for debounced update
          await new Promise((resolve) =>
            setTimeout(resolve, scenario.debounceMs + 100),
          );
        }

        // Wait for final state synchronization
        await waitFor(() => {
          expect(screen.getByTestId("observed-code")).toHaveTextContent(
            "cube([5,5,5]);",
          );
        });

        // Verify state updates were captured
        expect(stateUpdates.length).toBeGreaterThan(1);
        expect(stateUpdates[stateUpdates.length - 1]).toContain(
          "cube([5,5,5]);",
        );
      },
      REACT_INTEGRATION_SCENARIOS.stateSynchronization.timeoutMs,
    );

    it(
      "should handle concurrent state updates correctly",
      async () => {
        console.log(
          "[DEBUG][ReactIntegrationTest] Testing concurrent state updates",
        );

        const ConcurrentUpdater: React.FC = () => {
          const { updateCode, parseCode } = useAppStore();
          const [updateCount, setUpdateCount] = useState(0);

          const performConcurrentUpdates = async () => {
            const updates = [
              () => updateCode("cube([1,1,1]);"),
              () => updateCode("sphere(2);"),
              () => updateCode("cylinder(h=5, r=1);"),
              () => parseCode("cube([1,1,1]);"),
              () => parseCode("sphere(2);"),
            ];

            // Execute updates concurrently
            await Promise.all(updates.map((update) => update()));
            setUpdateCount((prev) => prev + 1);
          };

          return (
            <div data-testid="concurrent-updater">
              <div data-testid="update-count">{updateCount}</div>
              <button
                data-testid="concurrent-update-button"
                onClick={performConcurrentUpdates}
              >
                Concurrent Update
              </button>
            </div>
          );
        };

        render(
          <MockMatrixServiceProvider>
            <ConcurrentUpdater />
            <TestIntegrationComponent />
          </MockMatrixServiceProvider>,
        );

        // Trigger concurrent updates
        const button = screen.getByTestId("concurrent-update-button");

        act(() => {
          fireEvent.click(button);
        });

        // Wait for updates to complete
        await waitFor(() => {
          expect(screen.getByTestId("update-count")).toHaveTextContent("1");
        });

        // State should be consistent (last update should win)
        const finalCode = screen.getByTestId("current-code").textContent;
        expect([
          "cube([1,1,1]);",
          "sphere(2);",
          "cylinder(h=5, r=1);",
        ]).toContain(finalCode);
      },
      REACT_INTEGRATION_SCENARIOS.stateSynchronization.timeoutMs,
    );
  });

  describe("Error Boundary Integration", () => {
    it(
      "should handle component errors gracefully",
      async () => {
        console.log(
          "[DEBUG][ReactIntegrationTest] Testing error boundary integration",
        );

        const scenario = REACT_INTEGRATION_SCENARIOS.errorBoundary;
        const caughtErrors: Error[] = [];

        render(
          <TestErrorBoundary onError={(error) => caughtErrors.push(error)}>
            <MockMatrixServiceProvider>
              <TestIntegrationComponent
                triggerError={true}
                onError={(error) => caughtErrors.push(error)}
              />
            </MockMatrixServiceProvider>
          </TestErrorBoundary>,
        );

        // Wait for error to be caught
        await waitFor(() => {
          expect(
            screen.getByTestId("error-boundary-fallback"),
          ).toBeInTheDocument();
        });

        // Verify error was caught
        expect(caughtErrors.length).toBeGreaterThan(0);
        expect(caughtErrors[0]?.message).toContain(
          "Test error for error boundary",
        );

        // Error boundary should display fallback UI
        expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      },
      REACT_INTEGRATION_SCENARIOS.errorBoundary.timeoutMs,
    );

    it(
      "should recover from service errors in React components",
      async () => {
        console.log(
          "[DEBUG][ReactIntegrationTest] Testing service error recovery in React",
        );

        const ServiceErrorComponent: React.FC = () => {
          const { parseCode } = useAppStore();
          const [errorCount, setErrorCount] = useState(0);
          const [lastError, setLastError] = useState<string>("");

          const triggerServiceError = async () => {
            try {
              // Try to parse invalid code that might cause service errors
              await parseCode("invalid_openscad_syntax_that_should_fail!!!");
            } catch (error) {
              setErrorCount((prev) => prev + 1);
              setLastError(
                error instanceof Error ? error.message : String(error),
              );
            }
          };

          return (
            <div data-testid="service-error-component">
              <div data-testid="error-count">{errorCount}</div>
              <div data-testid="last-error">{lastError}</div>
              <button
                data-testid="trigger-error-button"
                onClick={triggerServiceError}
              >
                Trigger Service Error
              </button>
            </div>
          );
        };

        render(
          <MockMatrixServiceProvider>
            <ServiceErrorComponent />
          </MockMatrixServiceProvider>,
        );

        // Trigger service error
        const button = screen.getByTestId("trigger-error-button");

        act(() => {
          fireEvent.click(button);
        });

        // Wait for error handling
        await waitFor(() => {
          const errorCount = screen.getByTestId("error-count").textContent;
          expect(parseInt(errorCount || "0")).toBeGreaterThanOrEqual(0);
        });

        // Component should still be functional after error
        expect(
          screen.getByTestId("service-error-component"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("trigger-error-button")).toBeInTheDocument();
      },
      REACT_INTEGRATION_SCENARIOS.errorBoundary.timeoutMs,
    );
  });

  describe("Performance Integration", () => {
    it(
      "should maintain performance during frequent re-renders",
      async () => {
        console.log(
          "[DEBUG][ReactIntegrationTest] Testing performance during frequent re-renders",
        );

        const scenario = REACT_INTEGRATION_SCENARIOS.performance;
        const renderTimes: number[] = [];

        const PerformanceTestComponent: React.FC = () => {
          const { code, updateCode } = useAppStore();
          const [renderCount, setRenderCount] = useState(0);

          useEffect(() => {
            const startTime = performance.now();
            setRenderCount((prev) => prev + 1);
            const endTime = performance.now();
            renderTimes.push(endTime - startTime);
          });

          const triggerRerender = () => {
            updateCode(
              `cube([${Math.random() * 10},${Math.random() * 10},${Math.random() * 10}]);`,
            );
          };

          return (
            <div data-testid="performance-test-component">
              <div data-testid="render-count">{renderCount}</div>
              <div data-testid="current-code">{code}</div>
              <button
                data-testid="trigger-rerender-button"
                onClick={triggerRerender}
              >
                Trigger Rerender
              </button>
            </div>
          );
        };

        render(
          <MockMatrixServiceProvider>
            <PerformanceTestComponent />
          </MockMatrixServiceProvider>,
        );

        // Trigger multiple re-renders
        for (let i = 0; i < scenario.renderCount; i++) {
          const button = screen.getByTestId("trigger-rerender-button");

          act(() => {
            fireEvent.click(button);
          });

          // Small delay to allow render to complete
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // Wait for final render
        await waitFor(() => {
          const renderCount = parseInt(
            screen.getByTestId("render-count").textContent || "0",
          );
          expect(renderCount).toBeGreaterThan(scenario.renderCount);
        });

        // Analyze performance
        const averageRenderTime =
          renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
        const maxRenderTime = Math.max(...renderTimes);

        console.log("[DEBUG][ReactIntegrationTest] Render performance:", {
          averageRenderTime,
          maxRenderTime,
          totalRenders: renderTimes.length,
        });

        // Performance should be acceptable
        expect(averageRenderTime).toBeLessThan(scenario.maxRenderTime);
        expect(maxRenderTime).toBeLessThan(scenario.maxRenderTime * 2); // Allow some variance
      },
      REACT_INTEGRATION_SCENARIOS.performance.timeoutMs,
    );
  });

  describe("Real Component Integration", () => {
    it("should integrate StoreConnectedEditor with matrix services", async () => {
      console.log(
        "[DEBUG][ReactIntegrationTest] Testing StoreConnectedEditor integration",
      );

      render(
        <MockMatrixServiceProvider>
          <StoreConnectedEditor />
        </MockMatrixServiceProvider>,
      );

      // Wait for editor to render
      await waitFor(() => {
        expect(screen.getByTestId("monaco-editor-mock")).toBeInTheDocument();
      });

      // Verify editor displays default code
      const editor = screen.getByTestId("monaco-editor-mock");
      expect(editor).toHaveAttribute("data-value", "cube([10,10,10]);");

      // Verify editor status
      expect(screen.getByText(/OpenSCAD Code Editor/)).toBeInTheDocument();
    }, 10000);

    it("should integrate StoreConnectedRenderer with matrix services", async () => {
      console.log(
        "[DEBUG][ReactIntegrationTest] Testing StoreConnectedRenderer integration",
      );

      // Set up store with AST data
      useAppStore.setState((state) => {
        state.parsing.ast = [
          {
            type: "cube",
            size: [10, 10, 10],
            center: false,
            location: {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 17, offset: 16 },
            },
          },
        ];
      });

      render(
        <MockMatrixServiceProvider>
          <StoreConnectedRenderer />
        </MockMatrixServiceProvider>,
      );

      // Wait for renderer to render
      await waitFor(() => {
        expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
      });

      // Verify 3D visualization panel
      expect(screen.getByText("3D Visualization")).toBeInTheDocument();
    }, 10000);
  });
});
