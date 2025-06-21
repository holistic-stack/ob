import { test as base, ConsoleMessage, Request, Response } from '@playwright/test';

/**
 * @file Debug fixtures for Playwright e2e tests
 * Provides comprehensive console output interception and debugging capabilities
 * 
 * Features:
 * - Console message interception (log, warn, error, info, debug)
 * - Page error monitoring for uncaught exceptions
 * - Network request/response logging
 * - Performance timing logs
 * - Conditional debugging with environment variable control
 * 
 * Usage:
 * - Set DEBUG_E2E=true environment variable to enable detailed logging
 * - All console output is captured and attached to test reports
 * - Errors are collected and can be asserted against
 */

interface DebugLogs {
  consoleLogs: Array<{
    type: string;
    message: string;
    timestamp: string;
    location?: string;
  }>;
  pageErrors: Array<{
    name: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>;
  networkLogs: Array<{
    type: 'request' | 'response' | 'failed';
    url: string;
    method?: string;
    status?: number;
    resourceType?: string;
    timestamp: string;
  }>;
}

type TestFixtures = {
  debugLogs: DebugLogs;
  enableDebugLogging: void;
};

export const test = base.extend<TestFixtures>({
  // Automatic fixture that sets up debug logging
  enableDebugLogging: [async ({ page }, use, testInfo) => {
    const isDebugEnabled = process.env.DEBUG_E2E === 'true' || process.env.CI === 'true';
    const getTimestamp = () => new Date().toISOString();
    
    if (isDebugEnabled) {
      console.log(`🔍 [DEBUG] Starting test: ${testInfo.title}`);
    }

    // Console message interception
    page.on('console', (msg: ConsoleMessage) => {
      const timestamp = getTimestamp();
      const message = msg.text();

      // Filter out known harmless test environment warnings
      const isHarmlessWarning =
        message.includes('React DevTools') ||
        message.includes('server connection lost') ||
        message.includes('WebSocket connection') ||
        message.includes('webkit2.dll') ||
        message.includes('ResizeObserver loop limit exceeded');

      // Highlight Monaco Editor worker issues (don't filter these out)
      const isMonacoWorkerIssue =
        message.includes('Could not create web worker') ||
        message.includes('importScripts') ||
        message.includes('editor.worker.bundle.js') ||
        message.includes('WorkerGlobalScope');

      const logMessage = `🖥️  [CONSOLE ${msg.type().toUpperCase()}] ${timestamp}: ${message}`;

      // Always log Monaco worker issues and errors, even if debug is disabled
      if (isMonacoWorkerIssue || msg.type() === 'error') {
        console.log(`🚨 [MONACO/ERROR] ${logMessage}`);
      } else if (isDebugEnabled && !isHarmlessWarning) {
        console.log(logMessage);
      }

      // Attach console logs to test report (excluding harmless warnings)
      if ((msg.type() === 'error' || msg.type() === 'warn' || isMonacoWorkerIssue) && !isHarmlessWarning) {
        testInfo.annotations.push({
          type: `console-${msg.type()}`,
          description: `${timestamp}: ${message}`
        });
      }
    });

    // Page error monitoring (uncaught exceptions)
    page.on('pageerror', (error: Error) => {
      const timestamp = getTimestamp();
      const errorMessage = `❌ [PAGE ERROR] ${timestamp}: ${error.name}: ${error.message}`;
      
      if (isDebugEnabled) {
        console.error(errorMessage);
        if (error.stack) {
          console.error(`📍 [STACK TRACE] ${error.stack}`);
        }
      }
      
      // Attach page errors to test report
      testInfo.annotations.push({
        type: 'page-error',
        description: `${timestamp}: ${error.name}: ${error.message}`
      });
    });

    // Network request monitoring
    page.on('request', (request: Request) => {
      const timestamp = getTimestamp();
      const requestMessage = `🌐 [REQUEST] ${timestamp}: ${request.method()} ${request.url()} (${request.resourceType()})`;
      
      if (isDebugEnabled) {
        console.log(requestMessage);
      }
    });

    page.on('response', (response: Response) => {
      const timestamp = getTimestamp();
      const responseMessage = `📥 [RESPONSE] ${timestamp}: ${response.status()} ${response.url()}`;
      
      if (isDebugEnabled) {
        console.log(responseMessage);
      }
      
      // Log failed responses
      if (response.status() >= 400) {
        testInfo.annotations.push({
          type: 'failed-response',
          description: `${timestamp}: ${response.status()} ${response.url()}`
        });
      }
    });

    page.on('requestfailed', (request: Request) => {
      const timestamp = getTimestamp();
      const failureMessage = `💥 [REQUEST FAILED] ${timestamp}: ${request.method()} ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`;
      
      if (isDebugEnabled) {
        console.error(failureMessage);
      }
      
      testInfo.annotations.push({
        type: 'request-failed',
        description: `${timestamp}: ${request.method()} ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`
      });
    });

    // Page navigation logging
    page.on('load', () => {
      const timestamp = getTimestamp();
      const loadMessage = `🔄 [PAGE LOAD] ${timestamp}: ${page.url()}`;
      
      if (isDebugEnabled) {
        console.log(loadMessage);
      }
    });

    await use();
    
    if (isDebugEnabled) {
      console.log(`✅ [DEBUG] Completed test: ${testInfo.title}`);
    }
  }, { auto: true }],

  // Debug logs collector fixture
  debugLogs: async ({ page }, use, testInfo) => {
    const logs: DebugLogs = {
      consoleLogs: [],
      pageErrors: [],
      networkLogs: []
    };

    const getTimestamp = () => new Date().toISOString();

    // Collect console logs
    page.on('console', (msg: ConsoleMessage) => {
      logs.consoleLogs.push({
        type: msg.type(),
        message: msg.text(),
        timestamp: getTimestamp(),
        location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined
      });
    });

    // Collect page errors
    page.on('pageerror', (error: Error) => {
      logs.pageErrors.push({
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: getTimestamp()
      });
    });

    // Collect network logs
    page.on('request', (request: Request) => {
      logs.networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: getTimestamp()
      });
    });

    page.on('response', (response: Response) => {
      logs.networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: getTimestamp()
      });
    });

    page.on('requestfailed', (request: Request) => {
      logs.networkLogs.push({
        type: 'failed',
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: getTimestamp()
      });
    });

    await use(logs);

    // Attach collected logs to test report
    if (logs.consoleLogs.length > 0) {
      await testInfo.attach('console-logs', {
        body: JSON.stringify(logs.consoleLogs, null, 2),
        contentType: 'application/json'
      });
    }

    if (logs.pageErrors.length > 0) {
      await testInfo.attach('page-errors', {
        body: JSON.stringify(logs.pageErrors, null, 2),
        contentType: 'application/json'
      });
    }

    if (logs.networkLogs.length > 0) {
      await testInfo.attach('network-logs', {
        body: JSON.stringify(logs.networkLogs, null, 2),
        contentType: 'application/json'
      });
    }
  }
});

export { expect } from '@playwright/test';
