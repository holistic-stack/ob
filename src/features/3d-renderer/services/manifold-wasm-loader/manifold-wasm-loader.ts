import init from 'manifold-3d';

// Define the ManifoldModule type based on the actual module structure
type ManifoldModule = Awaited<ReturnType<typeof init>>;

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
      const manifoldModule = await init();

      // CRITICAL: Call setup() to initialize the module
      if (typeof manifoldModule.setup === 'function') {
        manifoldModule.setup();
      }

      return manifoldModule;
    } catch (error) {
      console.warn(
        'Failed to load Manifold module from local source, trying CDN fallback...',
        error
      );
      try {
        // @ts-ignore
        const cdnModule = await import('https://cdn.jsdelivr.net/npm/manifold-3d@latest/manifold.js');

        // CRITICAL: Call setup() for CDN module too
        if (typeof cdnModule.setup === 'function') {
          cdnModule.setup();
        }

        return cdnModule;
      } catch (cdnError) {
        console.error('Failed to load Manifold module from both local source and CDN.', cdnError);
        throw cdnError;
      }
    }
  }
}
