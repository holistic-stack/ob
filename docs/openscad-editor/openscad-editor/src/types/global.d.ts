/**
 * Global type declarations for the OpenSCAD editor package
 * Following TypeScript best practices for module declarations
 */

// Re-export types from @types/resolve to ensure they're available
declare module 'resolve' {
  import type { SyncOpts, AsyncOpts } from '@types/resolve';
  
  interface ResolveFunction {
    (id: string, cb: (err: Error | null, res?: string, pkg?: any) => void): void;
    (id: string, opts: AsyncOpts, cb: (err: Error | null, res?: string, pkg?: any) => void): void;
    sync: (id: string, opts?: SyncOpts) => string;
    isCore: (id: string) => boolean | undefined;
  }
  
  const resolve: ResolveFunction;
  export = resolve;
}
