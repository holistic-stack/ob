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
