/**
 * @file text-parameters.ts
 * @description Extended text parameters and font handling types for text primitive generation.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Vector2 } from './geometry-data';

/**
 * Font data structure for loaded fonts
 */
export interface FontData {
  readonly family: string;
  readonly style: 'normal' | 'italic' | 'oblique';
  readonly weight: number;
  readonly data: ArrayBuffer;
  readonly format: 'truetype' | 'opentype' | 'woff' | 'woff2';
}

/**
 * Glyph outline data
 */
export interface GlyphOutline {
  readonly character: string;
  readonly vertices: readonly Vector2[];
  readonly outlines: readonly (readonly number[])[];
  readonly holes: readonly (readonly number[])[];
  readonly advance: number;
  readonly bounds: {
    readonly xMin: number;
    readonly yMin: number;
    readonly xMax: number;
    readonly yMax: number;
  };
}

/**
 * Text layout information
 */
export interface TextLayout {
  readonly glyphs: readonly GlyphOutline[];
  readonly totalWidth: number;
  readonly totalHeight: number;
  readonly baseline: number;
  readonly ascender: number;
  readonly descender: number;
}

/**
 * Common font families for text rendering
 */
export const COMMON_FONT_FAMILIES = [
  'Liberation Sans',
  'Arial',
  'Helvetica',
  'sans-serif',
] as const;

/**
 * Common font styles
 */
export const COMMON_FONT_STYLES = ['normal', 'italic', 'oblique'] as const;

/**
 * Default font specification
 */
export const DEFAULT_FONT_SPECIFICATION = 'Liberation Sans';

/**
 * Default text parameters
 */
export const DEFAULT_TEXT_PARAMETERS = {
  text: '',
  size: 10,
  font: DEFAULT_FONT_SPECIFICATION,
  halign: 'left' as const,
  valign: 'baseline' as const,
  spacing: 1,
  direction: 'ltr' as const,
  language: 'en',
  script: 'latin',
};

/**
 * Supported font formats
 */
export const SUPPORTED_FONT_FORMATS = ['truetype', 'opentype', 'woff', 'woff2'] as const;

/**
 * Format font string from family and style
 */
export function formatFontString(family: string, style?: string): string {
  return style ? `${family}:style=${style}` : family;
}

/**
 * Parse font string into family and style
 */
export function parseFontString(fontString: string): { family: string; style?: string } {
  const match = fontString.match(/^(.+?):style=(.+)$/);
  if (match) {
    return { family: match[1], style: match[2] };
  }
  return { family: fontString };
}

/**
 * Normalize text parameters with defaults
 */
export function normalizeTextParameters(params: Partial<typeof DEFAULT_TEXT_PARAMETERS>) {
  return { ...DEFAULT_TEXT_PARAMETERS, ...params };
}
