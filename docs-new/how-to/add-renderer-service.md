# How to: Add a Renderer Service (Babylon)

1) Create service
- src/features/babylon-renderer/services/<your-service>/<your-service>.ts
- SRP: one responsibility; lifecycle: initialize() / dispose()

2) Use Scene/Engine safely
- Access via existing services: babylon-engine-service, babylon-scene.service.ts
- Track disposables (meshes/materials/observables)

3) Tests with NullEngine
- Use @babylonjs/core NullEngine + Scene
- Co-locate <your-service>.test.ts; assert dispose releases resources

4) Integrate with components/hooks
- Prefer hooks (use-babylon-scene) for lifecycle
- Keep React components thin

Do
- Add JSDoc @file and examples
- Use Result<T,E>

Don’t
- Don’t leak resources; always dispose

