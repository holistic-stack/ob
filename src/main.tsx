/**
 * @file main.tsx
 * @description This is the main entry point for the OpenSCAD 3D Visualization application.
 * It sets up the React root, initializes the logger, and renders the main App component.
 *
 * @architectural_decision
 * The application uses React 19's createRoot API for concurrent rendering features.
 * A structured logger is initialized at the very beginning to provide consistent logging throughout the application lifecycle.
 * StrictMode is temporarily disabled to aid in debugging snapshot caching issues, but should be re-enabled in production.
 *
 * @example
 * ```html
 * <!-- This file is the entry point specified in the Vite configuration. -->
 * <!-- It targets the 'root' div in the index.html file. -->
 * <div id="root"></div>
 * ```
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { createLogger } from './shared/services/logger.service';

/**
 * @constant logger
 * @description Initializes a logger instance specifically for the `main.tsx` file.
 * This logger is used to track the application's startup process, including React version and environment details.
 * @example
 * ```typescript
 * logger.init('Starting OpenSCAD 3D Visualization Application');
 * logger.debug('React version:', React.version);
 * ```
 */
const logger = createLogger('Main');

logger.init('Starting OpenSCAD 3D Visualization Application');
logger.debug('React version:', React.version);
logger.debug('Environment:', import.meta.env.MODE);

/**
 * @constant rootElement
 * @description Retrieves the DOM element with the ID 'root', which serves as the mount point for the React application.
 * @throws {Error} If the 'root' element is not found in the document, an error is thrown to prevent the application from proceeding without a valid mount point.
 * @example
 * ```typescript
 * const rootElement = document.getElementById('root');
 * if (!rootElement) {
 *   logger.error('Root element not found');
 *   throw new Error('Root element not found');
 * }
 * ```
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  logger.error('Root element not found');
  throw new Error('Root element not found');
}

logger.debug('Creating React root');
/**
 * @constant root
 * @description Creates a React root using `ReactDOM.createRoot` for concurrent rendering.
 * This is the entry point for rendering the React component tree into the DOM.
 * @architectural_decision
 * Using `ReactDOM.createRoot` enables React 19's concurrent features, which can improve perceived performance and responsiveness.
 * @example
 * ```typescript
 * const root = ReactDOM.createRoot(rootElement);
 * root.render(<App />);
 * ```
 */
const root = ReactDOM.createRoot(rootElement);

logger.debug('Rendering application');
root.render(
  // Temporarily disable StrictMode to debug snapshot caching issues
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

logger.init('Application initialized successfully');
