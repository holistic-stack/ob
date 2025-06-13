import { test, expect } from '@playwright/experimental-ct-react';
import { BabylonRenderer } from './babylon-renderer';



const TestComp = ({code: _code}: {code: string}) => {
  // Mock props for testing
  const pipelineResult = null;
  const isProcessing = false;
  const sceneConfig = {
    enableDebugMode: true,
    showAxes: true,
    showGrid: true,
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#333333'
  };

  return (
    <BabylonRenderer
      pipelineResult={pipelineResult}
      isProcessing={isProcessing}
      sceneConfig={sceneConfig}
    />
  );
};

test.describe('OpenSCAD Multi-View Renderer Component Tests', () => {

  // Simple diagnostic test to identify timeout issues
  test('DIAGNOSTIC: should mount simplified component without timeout', async ({ mount }) => {
    console.log('[DIAGNOSTIC] Starting simplified component mount test');
    const startTime = Date.now();

    try {
      console.log('[DIAGNOSTIC] Attempting to mount simplified component...');

      const component = await mount(
        <TestComp
          code="cube([10, 10, 10]);"
        />
      );

      const mountTime = Date.now() - startTime;
      console.log(`[DIAGNOSTIC] Simplified component mounted successfully in ${mountTime}ms`);

      // Just check if component exists
      await expect(component).toBeVisible({ timeout: 5000 });

      console.log('[DIAGNOSTIC] Checking for basic elements...', await component.locator('[data-testid="renderer-title"]').textContent());

      // Check for basic elements
      await expect(component.locator('[data-testid="renderer-title"]')).toContainText('OpenSCAD Multi-View Renderer');

      const totalTime = Date.now() - startTime;
      console.log(`[DIAGNOSTIC] Simplified test completed successfully in ${totalTime}ms`);

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[DIAGNOSTIC] Simplified test failed after ${totalTime}ms:`, error);
      throw error;
    }
  });



});
