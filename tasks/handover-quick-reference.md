# OpenSCAD Babylon - Handover Quick Reference

## 🚀 **QUICK START**

**Status**: Clean architecture migration **COMPLETE** ✅  
**Remaining**: Final cleanup only (2-3 hours)  
**Risk**: LOW (no functional changes)

## 📋 **IMMEDIATE ACTIONS**

### **1. Validate Current State**
```bash
# These MUST pass before starting:
pnpm type-check
pnpm test openscad-workflow-integration
```

### **2. Find Legacy Code**
```bash
# Run these searches to find what needs cleanup:
grep -r "extractGlobalVariables\|convertASTToMeshes" src/ --include="*.ts" --include="*.tsx"
grep -r "createSphereMesh\|createCubeMesh\|createCylinderMesh" src/ --include="*.ts" --include="*.tsx"
grep -r "@deprecated" src/ --include="*.ts" --include="*.tsx"
```

### **3. Replace Patterns**
```typescript
// ❌ REMOVE these imports:
import { extractGlobalVariables, convertASTToMeshes } from '...';
import { createSphereMesh, createCubeMesh } from '...';

// ✅ REPLACE with:
import { OpenSCADRenderingPipelineService } from '../../../openscad-geometry-builder/services/pipeline/openscad-rendering-pipeline';
import { useOpenSCADWorkflow } from '../../../visual-testing/components/openscad-workflow-test-scene/openscad-workflow-test-scene';
```

## 🎯 **CLEAN API REFERENCE**

### **Hook Approach (Recommended)**
```typescript
const { meshes, status, error, WorkflowComponent } = useOpenSCADWorkflow(
  openscadCode, 
  babylonScene
);
```

### **Component Approach**
```typescript
<OpenSCADWorkflowTestScene
  openscadCode="sphere(5);"
  babylonScene={scene}
  onMeshesGenerated={handleMeshes}
  onError={handleError}
  onStatusUpdate={handleStatus}
/>
```

### **Service Approach**
```typescript
const pipeline = new OpenSCADRenderingPipelineService();
const result = pipeline.convertASTToMeshes(ast, scene, undefined, 'component-name');
```

## 🛡️ **SAFETY RULES**

### **DO NOT TOUCH** ✅
- `src/features/visual-testing/components/openscad-workflow-test-scene/` (NEW CLEAN)
- `src/features/openscad-geometry-builder/services/pipeline/` (UNIFIED)
- Any passing tests

### **SAFE TO REMOVE** 🧹
- Functions with `@deprecated`
- Legacy imports
- Migration documentation
- Backward compatibility code

## ✅ **VALIDATION CHECKLIST**

After each change:
- [ ] `pnpm type-check` - Zero errors
- [ ] `pnpm biome:check` - Zero violations
- [ ] `pnpm test openscad-workflow-integration` - All pass

Final validation:
- [ ] `pnpm build` - Successful
- [ ] No legacy function references remain
- [ ] Documentation shows only clean API

## 🆘 **IF SOMETHING BREAKS**

1. **Revert the problematic change**
2. **Keep the new clean architecture intact**
3. **The core migration is complete and stable**
4. **Legacy cleanup can be done incrementally**

## 📞 **REFERENCE FILES**

- **Implementation Example**: `src/features/visual-testing/components/openscad-workflow-test-scene/openscad-workflow-test-scene.tsx`
- **Working Tests**: `src/features/visual-testing/components/openscad-workflow-test-scene/openscad-workflow-integration.test.ts`
- **Usage Guide**: `docs/openscad-workflow-usage-guide.md`
- **Full Handover**: `tasks/handover.md`

## 🎉 **SUCCESS CRITERIA**

```bash
# These commands should return NO RESULTS:
grep -r "extractGlobalVariables" src/
grep -r "convertASTToMeshes" src/
grep -r "@deprecated" src/

# These commands MUST succeed:
pnpm type-check
pnpm biome:check
pnpm test openscad-workflow-integration
pnpm build
```

**The clean architecture is COMPLETE and READY** ✅
