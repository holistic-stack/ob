// Production-ready OpenSCAD Editor components

// OpenSCAD Editor Component
export { OpenscadEditor } from './lib/unified-editor/openscad-editor'; // Feature-toggle based editor
export * from './lib/unified-editor/feature-config'; // Feature configuration types and presets

// Supporting Components
export { OpenscadOutline } from './lib/components/openscad-outline'; // Document outline component
export { FormattingConfig } from './lib/formatting/formatting-config'; // Formatting configuration component

// Default export
export { OpenscadEditor as default } from './lib/unified-editor/openscad-editor';
export * from './lib/openscad-language'; // Language configuration utilities
export * from './lib/formatting'; // Formatting functionality
export * from './lib/diagnostics'; // Real-time error detection and quick fixes
export type { ParseResult, OutlineItem, HoverInfo, ParseError, DocumentSymbol } from './lib/services/openscad-parser-service'; // Parser service types
