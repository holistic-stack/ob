// End-to-end pipeline example (pseudo-real)
import { parseOpenscad } from '@/features/openscad-parser';
import { convertAstToGeometry } from '@/features/openscad-geometry-builder/services/ast-converter/ast-to-geometry-converter';
import { geometryToMeshes } from '@/features/openscad-geometry-builder/services/mesh-converter/geometry-to-mesh-converter';
import { BabylonMeshBuilder } from '@/features/openscad-geometry-builder/services/geometry-bridge/babylon-mesh-builder';

export async function render(code: string, scene: any) {
  const p = parseOpenscad(code); if (!p.success) return p;
  const g = convertAstToGeometry(p.data); if (!g.success) return g;
  const m = geometryToMeshes(g.data); if (!m.success) return m;
  const builder = new BabylonMeshBuilder(scene);
  for (const meshData of m.data) builder.createPolyhedronMesh(meshData);
  return { success: true as const };
}

