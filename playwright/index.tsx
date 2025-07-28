/**
 * @file Playwright Component Testing Setup
 *
 * This file configures the test environment for Playwright component testing.
 * It sets up WASM loading, console logging, and network request monitoring
 * to match the main React application environment.
 */

// Import hooks for component testing setup
import { afterMount, beforeMount } from '@playwright/experimental-ct-react/hooks';
// Import React for component wrapping
import React from 'react';

// Import global styles
import '../src/index.css';

// Setup console logging for debugging
console.log('[PLAYWRIGHT][INIT] Setting up component testing environment');

// Enhanced console logging to capture all messages
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

console.log = (...args: any[]) => {
  originalConsoleLog('[PLAYWRIGHT][CONSOLE][LOG]', ...args);
};

console.error = (...args: any[]) => {
  originalConsoleError('[PLAYWRIGHT][CONSOLE][ERROR]', ...args);
};

console.warn = (...args: any[]) => {
  originalConsoleWarn('[PLAYWRIGHT][CONSOLE][WARN]', ...args);
};

console.info = (...args: any[]) => {
  originalConsoleInfo('[PLAYWRIGHT][CONSOLE][INFO]', ...args);
};

// Setup network request monitoring
if (typeof window !== 'undefined') {
  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    console.log(`[PLAYWRIGHT][NETWORK][FETCH] ${options?.method || 'GET'} ${url}`);

    try {
      const response = await originalFetch(...args);
      console.log(
        `[PLAYWRIGHT][NETWORK][RESPONSE] ${response.status} ${response.statusText} ${url}`
      );
      return response;
    } catch (error) {
      console.error(`[PLAYWRIGHT][NETWORK][ERROR] Failed to fetch ${url}:`, error);
      throw error;
    }
  };

  // Monitor XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string, ...args: any[]) {
    (this as any)._playwrightUrl = url;
    (this as any)._playwrightMethod = method;
    console.log(`[PLAYWRIGHT][NETWORK][XHR] ${method} ${url}`);
    return originalXHROpen.call(this, method, url, ...args);
  };

  XMLHttpRequest.prototype.send = function (...args: any[]) {
    this.addEventListener('load', () => {
      console.log(
        `[PLAYWRIGHT][NETWORK][XHR_RESPONSE] ${this.status} ${this.statusText} ${(this as any)._playwrightUrl}`
      );
    });

    this.addEventListener('error', () => {
      console.error(
        `[PLAYWRIGHT][NETWORK][XHR_ERROR] Failed to load ${(this as any)._playwrightUrl}`
      );
    });

    return originalXHRSend.call(this, ...args);
  };
}

// Setup component testing environment following official Playwright patterns
beforeMount(async ({ App }) => {
  console.log('[PLAYWRIGHT][SETUP] Configuring component testing environment');
  console.log(
    '[PLAYWRIGHT][SETUP] WASM files available at: /tree-sitter.wasm, /tree-sitter-openscad.wasm, /manifold.wasm'
  );

  // Return the App component wrapped for testing (following official docs pattern)
  return <App />;
});

afterMount(async () => {
  console.log('[PLAYWRIGHT][CLEANUP] Component test completed');
});

console.log('[PLAYWRIGHT][INIT] Component testing setup complete');
