# Infinite Loop Fix: React Re-render Issue

**Date:** June 2025  
**Issue:** "Too many re-renders. React limits the number of renders to prevent an infinite loop."  
**Status:** ✅ Fixed  

## 🐛 **Root Cause Analysis**

### **Problem 1: Derived State in Render Function**
```typescript
// ❌ WRONG: This causes infinite re-renders
if (pipelineResult && pipelineResult.success && isInitialized) {
  handlePipelineUpdate(); // This triggers state updates during render!
}
```

**Why it failed:** Calling state-updating functions during render creates an infinite loop.

### **Problem 2: Circular Dependencies in useCallback**
```typescript
// ❌ WRONG: Circular dependency
const clearMesh = useCallback(() => {
  if (currentMesh && !currentMesh.isDisposed()) {
    currentMesh.dispose();
  }
  setCurrentMesh(null);
}, [currentMesh]); // Depends on currentMesh

const updateMesh = useCallback(() => {
  clearMesh(); // Depends on clearMesh
}, [clearMesh]); // This creates circular dependency
```

**Why it failed:** `clearMesh` depends on `currentMesh`, `updateMesh` depends on `clearMesh`, creating infinite dependency chain.

## ✅ **Solutions Applied**

### **Fix 1: Use useEffect for Side Effects**
```typescript
// ✅ CORRECT: Use useEffect for pipeline updates
useEffect(() => {
  if (pipelineResult && pipelineResult.success && isInitialized) {
    updateMesh(pipelineResult);
  }
}, [pipelineResult, isInitialized, updateMesh]);
```

**Why it works:** useEffect runs after render, preventing infinite loops.

### **Fix 2: Break Circular Dependencies**
```typescript
// ✅ CORRECT: Use functional state updates
const clearMesh = useCallback(() => {
  setCurrentMesh(prevMesh => {
    if (prevMesh && !prevMesh.isDisposed()) {
      console.log('[DEBUG] Disposing current mesh:', prevMesh.name);
      prevMesh.dispose();
    }
    return null;
  });
}, []); // No dependencies - stable function
```

**Why it works:** 
- Uses functional state update to access current mesh
- No dependencies = stable function reference
- Breaks the circular dependency chain

### **Fix 3: Remove Unnecessary Memoization**
```typescript
// ✅ CORRECT: Simple return without useMemo
return {
  currentMesh,
  updateMesh,
  clearMesh
};
```

**Why it works:** Removes potential circular dependencies from memoization.

## 📚 **React 19 Best Practices Applied**

### **1. Avoid State Updates During Render**
- ❌ Never call state setters in render function
- ✅ Use useEffect for side effects
- ✅ Use event handlers for user interactions

### **2. Stable Function References**
- ❌ Don't create circular dependencies in useCallback
- ✅ Use functional state updates when accessing previous state
- ✅ Minimize dependencies in useCallback

### **3. Proper Effect Usage**
- ✅ Use useEffect for data fetching and side effects
- ✅ Include all dependencies in dependency array
- ✅ Use cleanup functions for resource disposal

## 🔧 **Prevention Strategies**

### **1. Dependency Analysis**
Always check for circular dependencies:
```typescript
// Check: Does A depend on B, and B depend on A?
const A = useCallback(() => { /* uses B */ }, [B]);
const B = useCallback(() => { /* uses A */ }, [A]); // ❌ Circular!
```

### **2. Functional State Updates**
Use when accessing previous state:
```typescript
// ✅ Good: Functional update
setState(prev => prev + 1);

// ❌ Avoid: Direct dependency
const increment = useCallback(() => setState(state + 1), [state]);
```

### **3. Effect vs Render Logic**
```typescript
// ❌ Wrong: Side effects in render
if (condition) {
  doSideEffect(); // Causes infinite loops
}

// ✅ Correct: Side effects in useEffect
useEffect(() => {
  if (condition) {
    doSideEffect();
  }
}, [condition]);
```

## 🎯 **Key Takeaways**

1. **Never update state during render** - use useEffect instead
2. **Watch for circular dependencies** in useCallback hooks
3. **Use functional state updates** to avoid dependencies on current state
4. **Keep useCallback dependencies minimal** and stable
5. **Separate concerns**: render logic vs side effects

## ✅ **Result**

- ✅ Infinite loop eliminated
- ✅ Clean dev server startup
- ✅ Proper React 19 patterns applied
- ✅ Stable component behavior
- ✅ No performance issues

**The BabylonRenderer now follows proper React patterns and renders without infinite loops! 🎉**
