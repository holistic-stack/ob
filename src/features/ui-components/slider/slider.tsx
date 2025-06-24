/**
 * Liquid Glass Slider Component
 * 
 * A slider component implementing Apple's Liquid Glass design system with
 * glass morphism effects, range support, and accessibility features.
 */

import React, { forwardRef, useId, useCallback } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  validateGlassConfig,
  type GlassComponentProps,
  type ComponentSize,
  type GlassConfig,
  type AriaProps,
} from '../shared';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Slider orientation types
 */
export type SliderOrientation = 'horizontal' | 'vertical';

/**
 * Slider value types - can be single number or range array
 */
export type SliderValue = number | [number, number];

/**
 * Props for the Slider component
 */
export interface SliderProps extends Omit<GlassComponentProps, 'children'>, AriaProps {
  /** Current value(s) */
  readonly value: SliderValue;
  
  /** Minimum value */
  readonly min: number;
  
  /** Maximum value */
  readonly max: number;
  
  /** Step increment */
  readonly step?: number;
  
  /** Whether this is a range slider */
  readonly isRange?: boolean;
  
  /** Slider orientation */
  readonly orientation?: SliderOrientation;
  
  /** Slider size */
  readonly size?: ComponentSize;
  
  /** Label text */
  readonly label?: string;
  
  /** Whether to show value labels */
  readonly showValueLabel?: boolean;
  
  /** Whether to show min/max labels */
  readonly showMinMaxLabels?: boolean;
  
  /** Whether to show tick marks */
  readonly showTicks?: boolean;
  
  /** Custom value formatter */
  readonly formatValue?: (value: number) => string;
  
  /** Whether the slider is disabled */
  readonly disabled?: boolean;
  
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;
  
  /** Whether the slider is over a light background */
  readonly overLight?: boolean;
  
  /** Change handler */
  readonly onChange?: (value: SliderValue) => void;
  
  /** Custom CSS class name */
  readonly className?: string;
  
  /** Custom inline styles */
  readonly style?: React.CSSProperties;
  
  /** Test ID for testing */
  readonly 'data-testid'?: string;
  
  /** Custom ARIA valuetext */
  readonly 'aria-valuetext'?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clamps a value between min and max
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Normalizes a value to a percentage between 0 and 1
 */
const normalizeValue = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

/**
 * Generates size-specific classes for slider track
 */
const generateTrackSizeClasses = (size: ComponentSize, orientation: SliderOrientation): string => {
  const sizeMap: Record<ComponentSize, { horizontal: string; vertical: string }> = {
    xs: { horizontal: 'h-1', vertical: 'w-1 h-32' },
    sm: { horizontal: 'h-2', vertical: 'w-2 h-40' },
    md: { horizontal: 'h-3', vertical: 'w-3 h-48' },
    lg: { horizontal: 'h-4', vertical: 'w-4 h-56' },
    xl: { horizontal: 'h-5', vertical: 'w-5 h-64' },
  };
  
  return sizeMap[size][orientation];
};

/**
 * Generates size-specific classes for slider thumb
 */
const generateThumbSizeClasses = (size: ComponentSize): string => {
  const sizeMap: Record<ComponentSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };
  
  return sizeMap[size];
};

// ============================================================================
// Slider Component
// ============================================================================

/**
 * Liquid Glass Slider component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <Slider
 *   value={50}
 *   min={0}
 *   max={100}
 *   label="Volume"
 *   showValueLabel
 *   onChange={(value) => setValue(value)}
 * />
 * ```
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      min,
      max,
      step = 1,
      isRange = false,
      orientation = 'horizontal',
      size = 'md',
      label,
      showValueLabel = false,
      showMinMaxLabels = false,
      showTicks = false,
      formatValue = (val) => val.toString(),
      disabled = false,
      glassConfig,
      overLight = true,
      onChange,
      className,
      style,
      'data-testid': dataTestId = 'slider-container',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-valuetext': ariaValueText,
      ...rest
    },
    ref
  ) => {
    // ========================================================================
    // State and Configuration
    // ========================================================================
    
    const sliderId = useId();
    const trackId = useId();
    
    // Ensure step is at least 1 if 0 is provided
    const validStep = step ?? 1;
    
    // Normalize and clamp values
    const normalizedValue = isRange
      ? Array.isArray(value)
        ? (() => {
            const [val1, val2] = value;
            const clampedVal1 = clamp(val1, min, max);
            const clampedVal2 = clamp(val2, min, max);
            // Ensure min <= max
            return clampedVal1 <= clampedVal2 ? [clampedVal1, clampedVal2] : [clampedVal2, clampedVal1];
          })()
        : [min, max]
      : clamp(typeof value === 'number' ? value : min, min, max);
    
    // Validate and merge glass configuration
    const glassConfigResult = validateGlassConfig(glassConfig ?? {});
    const defaultConfigResult = validateGlassConfig({});
    const finalGlassConfig = glassConfigResult.success 
      ? glassConfigResult.data 
      : (defaultConfigResult.success ? defaultConfigResult.data : {} as any);

    // ========================================================================
    // Event Handlers
    // ========================================================================
    
    const handleSingleChange = useCallback((newValue: number) => {
      if (!disabled && onChange) {
        onChange(clamp(newValue, min, max));
      }
    }, [disabled, onChange, min, max]);

    const handleRangeChange = useCallback((newValue: number, index: 0 | 1) => {
      if (!disabled && onChange && Array.isArray(normalizedValue)) {
        const newRange: [number, number] = [...normalizedValue] as [number, number];
        newRange[index] = clamp(newValue, min, max);
        
        // Ensure min <= max
        if (newRange[0] > newRange[1]) {
          if (index === 0) {
            newRange[1] = newRange[0];
          } else {
            newRange[0] = newRange[1];
          }
        }
        
        onChange(newRange);
      }
    }, [disabled, onChange, normalizedValue, min, max]);

    // ========================================================================
    // Style Generation
    // ========================================================================
    
    const glassClasses = generateGlassClasses(finalGlassConfig, overLight);
    const trackSizeClasses = generateTrackSizeClasses(size, orientation);
    const thumbSizeClasses = generateThumbSizeClasses(size);
    
    const containerClasses = generateAccessibleStyles(
      clsx(
        // Base container styles
        'relative',
        'p-4',
        
        // Glass morphism effects
        glassClasses,
        
        // Orientation
        orientation === 'vertical' ? 'flex flex-col items-center' : 'flex flex-col',
        
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        
        // Custom className
        className
      )
    );

    const trackClasses = clsx(
      // Base track styles
      'relative',
      'rounded-full',
      'bg-gray-300',
      
      // Size classes
      trackSizeClasses,
      
      // Orientation
      orientation === 'horizontal' ? 'w-full' : 'h-full',
      
      // Dark theme
      !overLight && 'bg-gray-600'
    );

    const thumbClasses = clsx(
      // Base thumb styles
      'absolute',
      'rounded-full',
      'bg-white',
      'border-2',
      'border-blue-500',
      'shadow-lg',
      'cursor-pointer',
      'transform -translate-x-1/2 -translate-y-1/2',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      
      // Size classes
      thumbSizeClasses,
      
      // Hover and active states
      !disabled && [
        'hover:scale-110',
        'active:scale-95',
      ],
      
      // Disabled state
      disabled && 'cursor-not-allowed opacity-50'
    );

    // ========================================================================
    // Render Helpers
    // ========================================================================
    
    const renderThumb = (thumbValue: number, index?: number) => {
      const percentage = normalizeValue(thumbValue, min, max) * 100;
      const position = orientation === 'horizontal' 
        ? { left: `${percentage}%`, top: '50%' }
        : { bottom: `${percentage}%`, left: '50%' };
      
      const thumbId = index !== undefined ? `${sliderId}-thumb-${index}` : sliderId;
      const ariaLabelValue = index !== undefined 
        ? `${label ?? 'Slider'} ${index === 0 ? 'minimum' : 'maximum'}`
        : ariaLabel ?? label ?? 'Slider';

      return (
        <input
          key={thumbId}
          ref={index === 0 || index === undefined ? ref : undefined}
          id={thumbId}
          type="range"
          min={min}
          max={max}
          step={validStep}
          value={thumbValue}
          disabled={disabled}
          className={clsx(
            'sr-only',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          )}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value);
            if (isRange && index !== undefined) {
              handleRangeChange(newValue, index as 0 | 1);
            } else {
              handleSingleChange(newValue);
            }
          }}
          onKeyDown={(e) => {
            const currentValue = thumbValue;
            let newValue = currentValue;

            switch (e.key) {
              case 'ArrowRight':
              case 'ArrowUp':
                e.preventDefault();
                newValue = Math.min(currentValue + validStep, max);
                break;
              case 'ArrowLeft':
              case 'ArrowDown':
                e.preventDefault();
                newValue = Math.max(currentValue - validStep, min);
                break;
              case 'Home':
                e.preventDefault();
                newValue = min;
                break;
              case 'End':
                e.preventDefault();
                newValue = max;
                break;
              default:
                return;
            }

            if (isRange && index !== undefined) {
              handleRangeChange(newValue, index as 0 | 1);
            } else {
              handleSingleChange(newValue);
            }
          }}
          aria-label={ariaLabelValue}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-valuetext={ariaValueText}
          {...rest}
        />
      );
    };

    const renderValueLabel = (labelValue: number, position: number) => (
      <div
        className={clsx(
          'absolute',
          'px-2 py-1',
          'text-xs font-medium',
          'bg-gray-800 text-white',
          'rounded',
          'transform -translate-x-1/2',
          orientation === 'horizontal' ? '-top-8' : '-left-12',
          overLight ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        )}
        style={orientation === 'horizontal' 
          ? { left: `${position}%` }
          : { bottom: `${position}%` }
        }
      >
        {formatValue(labelValue)}
      </div>
    );

    const renderTicks = () => {
      if (!showTicks) return null;
      
      const ticks = [];
      for (let i = min; i <= max; i += validStep) {
        const percentage = normalizeValue(i, min, max) * 100;
        ticks.push(
          <div
            key={i}
            data-testid={`slider-tick-${i}`}
            className={clsx(
              'absolute',
              'bg-gray-400',
              orientation === 'horizontal' 
                ? 'w-px h-2 transform -translate-x-1/2'
                : 'h-px w-2 transform -translate-y-1/2',
              !overLight && 'bg-gray-500'
            )}
            style={orientation === 'horizontal' 
              ? { left: `${percentage}%`, top: '100%' }
              : { bottom: `${percentage}%`, left: '100%' }
            }
          />
        );
      }
      return ticks;
    };

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={sliderId}
            className={clsx(
              'block text-sm font-medium',
              overLight ? 'text-gray-700' : 'text-gray-200',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}
        
        {/* Slider Container */}
        <div
          className={containerClasses}
          style={style}
          data-testid={dataTestId}
        >
          {/* Min/Max Labels */}
          {showMinMaxLabels && (
            <div className={clsx(
              'flex justify-between text-xs',
              overLight ? 'text-gray-600' : 'text-gray-400',
              orientation === 'vertical' ? 'flex-col h-full' : 'w-full mb-2'
            )}>
              <span>{formatValue(min)}</span>
              <span>{formatValue(max)}</span>
            </div>
          )}
          
          {/* Track */}
          <div
            data-testid="slider-track"
            className={trackClasses}
          >
            {/* Ticks */}
            {renderTicks()}
            
            {/* Value Labels */}
            {showValueLabel && (
              <>
                {isRange && Array.isArray(normalizedValue) ? (
                  <>
                    {normalizedValue[0] !== undefined && renderValueLabel(normalizedValue[0], normalizeValue(normalizedValue[0], min, max) * 100)}
                    {normalizedValue[1] !== undefined && renderValueLabel(normalizedValue[1], normalizeValue(normalizedValue[1], min, max) * 100)}
                  </>
                ) : (
                  renderValueLabel(
                    typeof normalizedValue === 'number' ? normalizedValue : (normalizedValue[0] ?? min),
                    normalizeValue(typeof normalizedValue === 'number' ? normalizedValue : (normalizedValue[0] ?? min), min, max) * 100
                  )
                )}
              </>
            )}
            
            {/* Thumbs */}
            {isRange && Array.isArray(normalizedValue) ? (
              <>
                <div
                  className={thumbClasses}
                  style={{
                    [orientation === 'horizontal' ? 'left' : 'bottom']: 
                      `${normalizeValue(normalizedValue[0] ?? min, min, max) * 100}%`,
                    [orientation === 'horizontal' ? 'top' : 'left']: '50%'
                  }}
                />
                <div
                  className={thumbClasses}
                  style={{
                    [orientation === 'horizontal' ? 'left' : 'bottom']: 
                      `${normalizeValue(normalizedValue[1] ?? max, min, max) * 100}%`,
                    [orientation === 'horizontal' ? 'top' : 'left']: '50%'
                  }}
                />
                {normalizedValue[0] !== undefined && renderThumb(normalizedValue[0], 0)}
                {normalizedValue[1] !== undefined && renderThumb(normalizedValue[1], 1)}
              </>
            ) : (
              <>
                <div
                  className={thumbClasses}
                  style={{
                    [orientation === 'horizontal' ? 'left' : 'bottom']: 
                      `${normalizeValue(typeof normalizedValue === 'number' ? normalizedValue : (normalizedValue[0] ?? min), min, max) * 100}%`,
                    [orientation === 'horizontal' ? 'top' : 'left']: '50%'
                  }}
                />
                {renderThumb(typeof normalizedValue === 'number' ? normalizedValue : (normalizedValue[0] ?? min))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

// ============================================================================
// Default Export
// ============================================================================

export default Slider;
