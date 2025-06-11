/**
 * @file Playwright Global Setup
 * 
 * Global setup for E2E tests - runs once before all tests.
 * Handles environment preparation and validation.
 * 
 * @author Luciano Júnior
 * @date January 2025
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('[INIT] Starting Playwright global setup for OpenSCAD pipeline E2E tests');

  // Launch a browser to verify the application is accessible
  const browser = await chromium.launch({
    args: [
      '--enable-webgl',
      '--enable-accelerated-2d-canvas',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    
    console.log('[DEBUG] Checking if development server is running...');
    
    // Wait for the development server to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';
    
    // Try to access the application with retries
    let retries = 10;
    let serverReady = false;
    
    while (retries > 0 && !serverReady) {
      try {
        await page.goto(baseURL, { timeout: 10000 });
        
        // Check if the main application elements are present
        await page.waitForSelector('h1', { timeout: 5000 });
        await page.waitForSelector('canvas', { timeout: 5000 });
        
        serverReady = true;
        console.log('[DEBUG] ✅ Development server is ready and application is accessible');
      } catch (error) {
        retries--;
        console.log(`[WARN] Server not ready, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!serverReady) {
      throw new Error('Development server is not accessible after multiple attempts');
    }
    
    // Verify WebGL support
    console.log('[DEBUG] Checking WebGL support...');
    
    const webglSupported = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    });
    
    if (!webglSupported) {
      console.log('[WARN] WebGL is not supported in this browser - 3D rendering tests may fail');
    } else {
      console.log('[DEBUG] ✅ WebGL support confirmed');
    }
    
    // Check if required assets are available
    console.log('[DEBUG] Checking required assets...');
    
    const assetsCheck = await page.evaluate(async () => {
      const checks = {
        treeSitterWasm: false,
        openscadWasm: false
      };
      
      try {
        // Check tree-sitter WASM
        const treeSitterResponse = await fetch('/tree-sitter.wasm');
        checks.treeSitterWasm = treeSitterResponse.ok;
        
        // Check OpenSCAD grammar WASM
        const openscadResponse = await fetch('/tree-sitter-openscad.wasm');
        checks.openscadWasm = openscadResponse.ok;
      } catch (error) {
        console.warn('Asset check failed:', error);
      }
      
      return checks;
    });
    
    if (!assetsCheck.treeSitterWasm) {
      console.log('[WARN] tree-sitter.wasm not found - parser tests may fail');
    }
    
    if (!assetsCheck.openscadWasm) {
      console.log('[WARN] tree-sitter-openscad.wasm not found - parser tests may fail');
    }
    
    if (assetsCheck.treeSitterWasm && assetsCheck.openscadWasm) {
      console.log('[DEBUG] ✅ All required WASM assets are available');
    }
    
    // Test basic pipeline functionality
    console.log('[DEBUG] Testing basic pipeline functionality...');
    
    try {
      // Find the editor and input a simple cube
      const editor = page.locator('[data-testid="openscad-editor"]');
      if (await editor.isVisible()) {
        await editor.clear();
        await editor.fill('cube([5, 5, 5]);');
        
        // Try to process it
        const processButton = page.locator('[data-testid="process-button"]');
        if (await processButton.isVisible()) {
          await processButton.click();
          
          // Wait a bit to see if processing starts
          await page.waitForTimeout(2000);
          
          console.log('[DEBUG] ✅ Basic pipeline interaction test completed');
        }
      }
    } catch (error) {
      console.log('[WARN] Basic pipeline test failed - this may be expected if UI elements are not ready');
    }
    
  } finally {
    await browser.close();
  }
  
  console.log('[END] Playwright global setup completed successfully');
}

export default globalSetup;
