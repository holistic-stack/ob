import { test, expect } from "@playwright/experimental-ct-react";
import { BabylonRenderer } from "./babylon-renderer";
import useOpenSCADProcessor from "@/features/openscad-processor";
import { PipelineResult } from "@/types/pipeline-types";
import { useEffect } from "react";
import { BabylonRenderStory } from "./babylon-renderer.story";


test.describe("OpenSCAD Multi-View Renderer Component Tests", () => {
  // Simple diagnostic test to identify timeout issues
  test("DIAGNOSTIC: should mount simplified component without timeout", async ({
    mount,
  }) => {
    console.log("[DIAGNOSTIC] Starting simplified component mount test");
    const startTime = Date.now();

    try {      console.log("[DIAGNOSTIC] Attempting to mount simplified component...");

      const component = await mount(<BabylonRenderStory code="cube([10, 10, 10]);" />);

      const mountTime = Date.now() - startTime;
      console.log(
        `[DIAGNOSTIC] Simplified component mounted successfully in ${mountTime}ms`
      );

      console.log("[DIAGNOSTIC] Checking for canvas element...");
      
      // Check if the canvas element is visible
      const canvas = component.locator('canvas.babylon-canvas');
      await expect(canvas).toBeVisible({ timeout: 15000 });
      
      // Verify canvas has the correct attributes
      await expect(canvas).toHaveAttribute('aria-label', '3D Scene Canvas');
      
      console.log("[DIAGNOSTIC] Canvas element found and verified");

      const totalTime = Date.now() - startTime;
      console.log(
        `[DIAGNOSTIC] Simplified test completed successfully in ${totalTime}ms`
      );
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(
        `[DIAGNOSTIC] Simplified test failed after ${totalTime}ms:`,
        error
      );
      throw error;
    }
  });
});
