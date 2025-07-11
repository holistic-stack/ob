import init, { type ManifoldModule } from 'manifold-3d';

/**
 * A service to manage the asynchronous loading of the Manifold WASM module.
 * It ensures that the module is only initialized once (singleton pattern).
 */
export class ManifoldWasmLoader {
  private static instance: Promise<ManifoldModule> | null = null;

  /**
   * Loads the Manifold WASM module.
   * If the module is already being loaded, it returns the existing promise.
   * Otherwise, it starts the loading process and caches the promise.
   * It includes a fallback to a CDN if the local module fails to load.
   * @returns A promise that resolves to the Manifold module.
   */
  public load(): Promise<ManifoldModule> {
    if (!ManifoldWasmLoader.instance) {
      ManifoldWasmLoader.instance = this.loadWithFallback();
    }
    return ManifoldWasmLoader.instance;
  }

  private async loadWithFallback(): Promise<ManifoldModule> {
    try {
      return await init();
    } catch (error) {
      console.warn(
        'Failed to load Manifold module from local source, trying CDN fallback...',
        error
      );
      try {
        // @ts-ignore
        return await import('https://cdn.jsdelivr.net/npm/manifold-3d@latest/manifold.js');
      } catch (cdnError) {
        console.error('Failed to load Manifold module from both local source and CDN.', cdnError);
        throw cdnError;
      }
    }
  }
}
