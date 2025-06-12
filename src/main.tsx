/**
 * @file Main React application entry point
 * 
 * Entry point for the OpenSCAD to Babylon.js pipeline testing application.
 * Provides a complete interface for testing the pipeline:
 * OpenSCAD code → @holistic-stack/openscad-parser:parseAST → CSG2 Babylon JS → Babylon JS scene
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[INIT] 🚀 Starting OpenSCAD Babylon Pipeline React App - timestamp:', new Date().toISOString());

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[ERROR] ❌ Root element not found');
  throw new Error('Root element not found');
}

console.log('[DEBUG] ✅ Root element found, creating React root...');
const root = ReactDOM.createRoot(rootElement);

console.log('[DEBUG] ✅ React root created, rendering App component...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('[END] ✅ React app render initiated successfully');
