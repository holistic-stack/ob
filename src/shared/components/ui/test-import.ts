/**
 * @file Test Import - UI Components
 * 
 * Simple test to verify that all UI components can be imported correctly.
 * This helps identify any import or dependency issues.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

// Test imports from the main index file
import { 
  Button, 
  ButtonGroup, 
  Icon, 
  LoadingSpinner 
} from './index';

// Test type imports
import type { 
  ButtonProps, 
  ButtonVariant, 
  ButtonSize,
  IconProps,
  IconName,
  IconSize,
  IconColor,
  LoadingSpinnerProps,
  LoadingSpinnerVariant,
  LoadingSpinnerSize
} from './index';

// Test individual component imports
import { Button as ButtonComponent } from './button/button';
import { Icon as IconComponent } from './icon/icon';
import { LoadingSpinner as SpinnerComponent } from './loading-spinner/loading-spinner';

// Test icon registry import
import { iconRegistry } from './icon/icon-registry';

console.log('[INIT] Testing UI component imports');

// Verify components are functions/objects
console.log('[DEBUG] Button component type:', typeof Button);
console.log('[DEBUG] ButtonGroup component type:', typeof ButtonGroup);
console.log('[DEBUG] Icon component type:', typeof Icon);
console.log('[DEBUG] LoadingSpinner component type:', typeof LoadingSpinner);

// Verify icon registry
console.log('[DEBUG] Icon registry keys count:', Object.keys(iconRegistry).length);
console.log('[DEBUG] Sample icons:', Object.keys(iconRegistry).slice(0, 5));

// Test type checking (these should not cause TypeScript errors)
const buttonVariants: ButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost', 'link'];
const buttonSizes: ButtonSize[] = ['small', 'medium', 'large'];
const iconNames: IconName[] = ['cube', 'sphere', 'cylinder', 'check', 'error'];
const iconSizes: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const iconColors: IconColor[] = ['current', 'primary', 'secondary', 'success', 'warning', 'error', 'muted'];
const spinnerVariants: LoadingSpinnerVariant[] = ['dots', 'bars', 'circle', 'pulse'];
const spinnerSizes: LoadingSpinnerSize[] = ['small', 'medium', 'large'];

console.log('[DEBUG] Type arrays created successfully');
console.log('[DEBUG] Button variants:', buttonVariants);
console.log('[DEBUG] Icon names sample:', iconNames);
console.log('[DEBUG] Spinner variants:', spinnerVariants);

// Test that components are the same when imported differently
console.log('[DEBUG] Button === ButtonComponent:', Button === ButtonComponent);
console.log('[DEBUG] Icon === IconComponent:', Icon === IconComponent);
console.log('[DEBUG] LoadingSpinner === SpinnerComponent:', LoadingSpinner === SpinnerComponent);

console.log('[END] UI component import test completed successfully');

// Export a simple test function
export const testUIComponentsImport = () => {
  console.log('[INIT] Running UI components import test');
  
  try {
    // Test that all components are available
    if (typeof Button !== 'function') {
      throw new Error('Button component not imported correctly');
    }
    
    if (typeof ButtonGroup !== 'function') {
      throw new Error('ButtonGroup component not imported correctly');
    }
    
    if (typeof Icon !== 'function') {
      throw new Error('Icon component not imported correctly');
    }
    
    if (typeof LoadingSpinner !== 'function') {
      throw new Error('LoadingSpinner component not imported correctly');
    }
    
    // Test icon registry
    if (!iconRegistry || typeof iconRegistry !== 'object') {
      throw new Error('Icon registry not imported correctly');
    }
    
    const iconCount = Object.keys(iconRegistry).length;
    if (iconCount < 50) {
      throw new Error(`Expected at least 50 icons, got ${iconCount}`);
    }
    
    console.log('[DEBUG] All components imported successfully');
    console.log('[DEBUG] Icon registry contains', iconCount, 'icons');
    
    return {
      success: true,
      message: 'All UI components imported successfully',
      iconCount,
      components: {
        Button: typeof Button,
        ButtonGroup: typeof ButtonGroup,
        Icon: typeof Icon,
        LoadingSpinner: typeof LoadingSpinner
      }
    };
    
  } catch (error) {
    console.error('[ERROR] UI components import test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    };
  }
};

export default testUIComponentsImport;
