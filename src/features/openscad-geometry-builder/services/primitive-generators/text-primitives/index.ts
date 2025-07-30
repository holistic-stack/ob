/**
 * @file text-primitives/index.ts
 * @description Export all text primitive generators - COMPLETED IMPLEMENTATION.
 *
 * Provides comprehensive text-to-polygon conversion with font loading and glyph extraction.
 * Supports OpenSCAD text() primitive with full parameter compatibility.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

// Text Parameters Types
export type {
  FontLoadResult,
  FontSpecification,
  NormalizedTextParameters,
  TextDirection,
  TextHorizontalAlignment,
  TextLayout,
  TextParameters,
  TextRenderingConfig,
  TextVerticalAlignment,
} from '../../../types/text-parameters';
export {
  COMMON_FONT_FAMILIES,
  COMMON_FONT_STYLES,
  DEFAULT_FONT_SPECIFICATION,
  DEFAULT_TEXT_PARAMETERS,
  formatFontString,
  normalizeTextParameters,
  parseFontString,
  SUPPORTED_FONT_FORMATS,
} from '../../../types/text-parameters';
export type {
  AvailableFontInfo,
  FontCacheStatistics,
  FontInfo,
  FontLoadError,
  FontMetrics,
  GlyphOutline,
} from './font-loader/font-loader';
// Font Loader Service
export { FontLoaderService } from './font-loader/font-loader';
export type { TextBounds, TextGenerationResult } from './text-generator/text-generator';
// Text Generator Service
export { TextGeneratorService } from './text-generator/text-generator';
// export * from './text-generator';

// Temporary export to make this file a valid module
export const PLACEHOLDER_TEXT_PRIMITIVES = 'TODO: Implement text primitives' as const;
