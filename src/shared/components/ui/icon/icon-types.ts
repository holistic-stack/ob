/**
 * @file Icon Types and Definitions
 * 
 * Type definitions for the Icon component system.
 * Provides a comprehensive set of icon names and types.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

/**
 * Available icon names in the system
 * These correspond to SVG icons that can be rendered
 */
export type IconName = 
  // Navigation icons
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  
  // Action icons
  | 'plus'
  | 'minus'
  | 'x'
  | 'check'
  | 'edit'
  | 'delete'
  | 'save'
  | 'copy'
  | 'download'
  | 'upload'
  | 'refresh'
  | 'search'
  | 'filter'
  | 'sort'
  
  // UI icons
  | 'menu'
  | 'close'
  | 'settings'
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'help'
  | 'question'
  | 'eye'
  | 'eye-off'
  | 'heart'
  | 'star'
  | 'bookmark'
  
  // File icons
  | 'file'
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'code'
  
  // Communication icons
  | 'mail'
  | 'phone'
  | 'message'
  | 'notification'
  | 'bell'
  
  // Media icons
  | 'play'
  | 'pause'
  | 'stop'
  | 'volume'
  | 'volume-off'
  | 'fullscreen'
  | 'minimize'
  
  // 3D/Babylon specific icons
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'wireframe'
  | 'camera'
  | 'light'
  | 'rotate'
  | 'scale'
  | 'translate'
  | 'reset'
  | 'debug'
  | 'mesh'
  | 'scene'
  | 'render';

/**
 * Icon size options
 */
export type IconSize = 
  | 'xs'        // 12px
  | 'sm'        // 16px
  | 'md'        // 20px
  | 'lg'        // 24px
  | 'xl'        // 32px
  | '2xl';      // 40px

/**
 * Icon color variants
 */
export type IconColor = 
  | 'current'   // Use current text color
  | 'primary'   // Primary theme color
  | 'secondary' // Secondary theme color
  | 'success'   // Success color (green)
  | 'warning'   // Warning color (yellow)
  | 'error'     // Error color (red)
  | 'muted';    // Muted color (gray)

/**
 * Icon component props interface
 */
export interface IconProps {
  /** Name of the icon to render */
  name: IconName;
  
  /** Size of the icon */
  size?: IconSize;
  
  /** Color variant of the icon */
  color?: IconColor;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Custom style object */
  style?: React.CSSProperties;
  
  /** Accessible label for screen readers */
  'aria-label'?: string;
  
  /** Whether the icon is decorative (hidden from screen readers) */
  'aria-hidden'?: boolean;
  
  /** Test ID for testing */
  'data-testid'?: string;
  
  /** Click handler for interactive icons */
  onClick?: (event: React.MouseEvent<SVGElement>) => void;
}

/**
 * SVG path data for each icon
 * These are the actual SVG path definitions
 */
export interface IconDefinition {
  /** SVG viewBox attribute */
  viewBox: string;
  
  /** SVG path data */
  path: string | string[];
  
  /** Whether the icon should be filled */
  filled?: boolean;
  
  /** Stroke width for outlined icons */
  strokeWidth?: number;
}

/**
 * Icon registry type for storing all icon definitions
 */
export type IconRegistry = Record<IconName, IconDefinition>;

/**
 * All types are exported inline above where they are defined
 */
