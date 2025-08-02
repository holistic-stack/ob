/**
 * @file text-generator.ts
 * @description Text Generator Service for OpenSCAD text() primitive
 *
 * Converts text strings to 2D polygon geometry using font information and layout algorithms.
 * Implements OpenSCAD-compatible text rendering with proper alignment, spacing, and direction support.
 *
 * @example
 * ```typescript
 * const textGenerator = new TextGeneratorService();
 *
 * const result = await textGenerator.generateTextPolygon({
 *   text: "Hello World",
 *   size: 12,
 *   font: "Liberation Sans",
 *   halign: "center",
 *   valign: "baseline"
 * });
 *
 * if (result.success) {
 *   console.log(`Generated text with ${result.data.vertices.length} vertices`);
 * }
 * ```
 */

import { createLogger } from '@/shared/services/logger.service';
import type { Result } from '@/shared/types/result.types';
import { error, success } from '@/shared/utils/functional/result';
import type { Polygon2DGeometryData } from '../../../../types/2d-geometry-data';
import type { GeometryGenerationError } from '../../../../types/geometry-data';
import type { TextParameters } from '../../../../types/text-parameters';
import { FontLoaderService } from '../font-loader/font-loader';

const logger = createLogger('TextGeneratorService');

/**
 * Text bounds information
 */
export interface TextBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Text generation result type
 */
export type TextGenerationResult = Result<Polygon2DGeometryData, GeometryGenerationError>;

/**
 * Text Generator Service
 *
 * Converts text strings to 2D polygon geometry compatible with OpenSCAD text() primitive.
 * Handles font loading, glyph extraction, text layout, and polygon tessellation.
 */
export class TextGeneratorService {
  private readonly fontLoader: FontLoaderService;

  constructor(fontLoader?: FontLoaderService) {
    this.fontLoader = fontLoader ?? new FontLoaderService();
    logger.init('[INIT] TextGeneratorService initialized');
  }

  /**
   * Generate 2D polygon geometry from text parameters
   *
   * @param params - OpenSCAD text parameters
   * @returns Result containing polygon geometry or error
   */
  async generateTextPolygon(params: TextParameters): Promise<TextGenerationResult> {
    try {
      logger.debug(`[GENERATE] Generating text polygon for: "${params.text}"`);

      // Validate parameters
      const validationResult = this.validateParameters(params);
      if (!validationResult.success) {
        return validationResult;
      }

      // Handle empty text
      if (!params.text || params.text.length === 0) {
        return this.createEmptyTextPolygon(params);
      }

      // Normalize parameters with defaults
      const normalizedParams = this.normalizeParameters(params);

      // Generate text layout
      const layout = await this.generateTextLayout(normalizedParams);

      // Convert layout to polygon geometry
      const polygonGeometry = this.layoutToPolygon(layout, normalizedParams);

      logger.debug(
        `[SUCCESS] Generated text polygon with ${polygonGeometry.vertices.length} vertices`
      );

      return success(polygonGeometry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[ERROR] Text generation failed: ${errorMessage}`);

      return error({
        type: 'COMPUTATION_ERROR',
        message: `Text generation failed: ${errorMessage}`,
        details: { params },
      });
    }
  }

  /**
   * Calculate bounding box for text polygon
   *
   * @param textPolygon - Generated text polygon
   * @returns Bounding box information
   */
  calculateTextBounds(textPolygon: Polygon2DGeometryData): TextBounds {
    if (textPolygon.vertices.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const vertex of textPolygon.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Validate text generation parameters
   */
  private validateParameters(params: TextParameters): Result<void, GeometryGenerationError> {
    if (params.size !== undefined && params.size <= 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Text size must be positive',
        details: { size: params.size },
      });
    }

    if (params.spacing !== undefined && params.spacing <= 0) {
      return error({
        type: 'INVALID_PARAMETERS',
        message: 'Text spacing must be positive',
        details: { spacing: params.spacing },
      });
    }

    return success(undefined);
  }

  /**
   * Normalize parameters with OpenSCAD defaults
   */
  private normalizeParameters(params: TextParameters): Required<TextParameters> {
    return {
      text: params.text,
      size: params.size ?? 10,
      font: params.font ?? 'Liberation Sans',
      halign: params.halign ?? 'left',
      valign: params.valign ?? 'baseline',
      spacing: params.spacing ?? 1.0,
      direction: params.direction ?? 'ltr',
      language: params.language ?? 'en',
      script: params.script ?? 'latin',
      $fn: params.$fn ?? 16,
    };
  }

  /**
   * Create empty polygon for empty text
   */
  private createEmptyTextPolygon(params: TextParameters): TextGenerationResult {
    const emptyPolygon: Polygon2DGeometryData = {
      vertices: [],
      outline: [],
      holes: [],
      metadata: {
        primitiveType: '2d-polygon',
        parameters: params,
        fragmentCount: 0,
        generatedAt: Date.now(),
        isConvex: true,
        area: 0,
      },
    };

    return success(emptyPolygon);
  }

  /**
   * Generate text layout from normalized parameters
   */
  private async generateTextLayout(params: Required<TextParameters>): Promise<TextLayout> {
    try {
      // Load the font
      const fontResult = await this.fontLoader.loadFont(params.font);
      if (!fontResult.success) {
        logger.warn(`[FONT_FALLBACK] Failed to load font "${params.font}", using approximations`);
        return this.generateApproximateLayout(params);
      }

      // Get font metrics
      const metricsResult = await this.fontLoader.getFontMetrics(fontResult.data, params.size);
      if (!metricsResult.success) {
        logger.warn(`[METRICS_FALLBACK] Failed to get font metrics, using approximations`);
        return this.generateApproximateLayout(params);
      }

      const fontMetrics = metricsResult.data;
      const characters = params.text.split('');
      const glyphs = [];
      let currentX = 0;

      // Generate layout for each character
      for (const char of characters) {
        const glyphResult = await this.fontLoader.getGlyphOutline(
          fontResult.data,
          char,
          params.size
        );

        if (glyphResult.success) {
          const glyph = glyphResult.data;
          glyphs.push({
            character: char,
            x: currentX,
            y: 0,
            width: glyph.bounds.width,
            height: glyph.bounds.height,
          });

          currentX += glyph.advance * params.spacing;
        } else {
          // Fallback for characters that can't be loaded
          const charWidth = params.size * 0.6;
          glyphs.push({
            character: char,
            x: currentX,
            y: 0,
            width: charWidth,
            height: params.size,
          });

          currentX += charWidth * params.spacing;
        }
      }

      return {
        glyphs,
        totalWidth: currentX,
        totalHeight: fontMetrics.lineHeight,
        baseline: Math.abs(fontMetrics.descent),
      };
    } catch (err) {
      logger.warn(`[LAYOUT_FALLBACK] Text layout generation failed, using approximations: ${err}`);
      return this.generateApproximateLayout(params);
    }
  }

  /**
   * Convert text layout to polygon geometry
   */
  private layoutToPolygon(
    layout: TextLayout,
    params: Required<TextParameters>
  ): Polygon2DGeometryData {
    const vertices: Array<{ x: number; y: number }> = [];
    const outline: number[] = [];

    // Apply alignment offsets
    const alignmentOffset = this.calculateAlignmentOffset(layout, params);

    // Generate simple rectangular approximation for each character
    // TODO: Replace with actual glyph outline extraction
    for (const glyph of layout.glyphs) {
      if (glyph.character.trim() === '') continue; // Skip spaces

      const x = glyph.x + alignmentOffset.x;
      const y = glyph.y + alignmentOffset.y;

      // Create simple rectangle for character
      const startIndex = vertices.length;
      vertices.push(
        { x, y },
        { x: x + glyph.width, y },
        { x: x + glyph.width, y: y + glyph.height },
        { x, y: y + glyph.height }
      );

      // Add outline indices for this character
      outline.push(startIndex, startIndex + 1, startIndex + 2, startIndex + 3);
    }

    return {
      vertices,
      outline,
      holes: [],
      metadata: {
        primitiveType: '2d-polygon',
        parameters: params,
        fragmentCount: vertices.length,
        generatedAt: Date.now(),
        isConvex: false, // Text is generally not convex
        area: this.calculatePolygonArea(vertices, outline),
      },
    };
  }

  /**
   * Calculate alignment offset based on halign and valign
   */
  private calculateAlignmentOffset(
    layout: TextLayout,
    params: Required<TextParameters>
  ): { x: number; y: number } {
    let x = 0;
    let y = 0;

    // Horizontal alignment
    switch (params.halign) {
      case 'center':
        x = -layout.totalWidth / 2;
        break;
      case 'right':
        x = -layout.totalWidth;
        break;
      default:
        x = 0;
        break;
    }

    // Vertical alignment
    switch (params.valign) {
      case 'top':
        y = -layout.totalHeight;
        break;
      case 'center':
        y = -layout.totalHeight / 2;
        break;
      case 'bottom':
        y = 0;
        break;
      case 'baseline':
        y = -layout.baseline;
        break;
      default:
        y = -layout.baseline;
        break;
    }

    return { x, y };
  }

  /**
   * Generate approximate text layout when font loading fails
   */
  private generateApproximateLayout(params: Required<TextParameters>): TextLayout {
    const characters = params.text.split('');
    const charWidth = params.size * 0.6; // Approximate character width
    const charHeight = params.size;

    const glyphs = characters.map((char, index) => ({
      character: char,
      x: index * charWidth * params.spacing,
      y: 0,
      width: charWidth,
      height: charHeight,
    }));

    return {
      glyphs,
      totalWidth: glyphs.length > 0 ? glyphs[glyphs.length - 1].x + charWidth : 0,
      totalHeight: charHeight,
      baseline: charHeight * 0.2, // Approximate baseline
    };
  }

  /**
   * Calculate approximate polygon area
   */
  private calculatePolygonArea(
    vertices: Array<{ x: number; y: number }>,
    outline: number[]
  ): number {
    if (outline.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < outline.length; i++) {
      const j = (i + 1) % outline.length;
      const idxI = outline[i];
      const idxJ = outline[j];
      if (idxI === undefined || idxJ === undefined) continue;
      const vi = vertices[idxI];
      const vj = vertices[idxJ];
      if (vi === undefined || vj === undefined) continue;
      area += vi.x * vj.y - vj.x * vi.y;
    }

    return Math.abs(area) / 2;
  }
}

/**
 * Simple text layout interface for internal use
 */
interface TextLayout {
  readonly glyphs: readonly {
    readonly character: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }[];
  readonly totalWidth: number;
  readonly totalHeight: number;
  readonly baseline: number;
}
