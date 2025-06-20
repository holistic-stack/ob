import { type ClassValue, clsx } from 'clsx';

/**
 * Utility function to combine class names using clsx
 * This is a common pattern in modern React applications for conditional styling
 * 
 * @param inputs - Class values to combine
 * @returns Combined class string
 * 
 * @example
 * ```tsx
 * cn('base-class', condition && 'conditional-class', 'another-class')
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
