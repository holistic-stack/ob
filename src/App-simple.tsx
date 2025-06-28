/**
 * Simplified App Component for Testing
 *
 * A minimal version to test the core functionality without Monaco Editor
 */

import React, { useEffect } from "react";
import { useAppStore } from "./features/store";

const SimpleApp: React.FC = () => {
  const { code, ast, parseCode, isParsingLoading, parsingErrors } =
    useAppStore();

  useEffect(() => {
    console.log("[INIT][SimpleApp] Component mounted");
    console.log("[DEBUG][SimpleApp] Store state:", {
      codeLength: code.length,
      astLength: ast.length,
      isLoading: isParsingLoading,
      errors: parsingErrors,
    });
  }, [code, ast, isParsingLoading, parsingErrors]);

  const handleParseClick = async () => {
    console.log("[DEBUG][SimpleApp] Manual parse triggered");
    const result = await parseCode(code);
    console.log("[DEBUG][SimpleApp] Parse result:", result);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          OpenSCAD 3D Visualizer - Simple Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Display */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">OpenSCAD Code</h2>
            <div className="bg-gray-700 p-4 rounded font-mono text-sm">
              {code ?? "No code loaded"}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Length: {code.length} characters
              </span>
              <button
                onClick={() => void handleParseClick()}
                disabled={isParsingLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
              >
                {isParsingLoading ? "Parsing..." : "Parse Code"}
              </button>
            </div>
          </div>

          {/* AST Display */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Abstract Syntax Tree</h2>
            <div className="bg-gray-700 p-4 rounded text-sm max-h-64 overflow-y-auto">
              {ast.length > 0 ? (
                <pre>{JSON.stringify(ast, null, 2)}</pre>
              ) : (
                <span className="text-gray-400">No AST generated</span>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Nodes: {ast.length}
            </div>
          </div>
        </div>

        {/* Errors */}
        {parsingErrors.length > 0 && (
          <div className="mt-8 bg-red-900 border border-red-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Parsing Errors</h3>
            {parsingErrors.map((error: string, index: number) => (
              <div key={index} className="text-red-300 text-sm">
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 bg-gray-800 px-6 py-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${isParsingLoading ? "bg-yellow-500" : "bg-green-500"}`}
              />
              <span className="text-sm">
                {isParsingLoading ? "Processing" : "Ready"}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Code: {code.length} chars | AST: {ast.length} nodes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;
