# Mesh Disposal Checklist

- Always dispose meshes/materials/textures/observables
- Track disposables in services; call dispose() on unmount
- Verify with getTotalVertices()/getTotalIndices() after dispose
- Use render-cache/scene-refresh utilities to prevent stale refs

