# Migration Guide: AppLayout to GridLayout

**Date:** June 24, 2025  
**Version:** v2.0.0  
**Status:** AppLayout Removed - GridLayout Available

## 🚨 **Breaking Change Notice**

The `AppLayout` component has been **removed** in v2.0.0 and replaced with the more focused `GridLayout` component following Single Responsibility Principle (SRP).

## 📋 **Migration Overview**

### **What Changed**
- ❌ **Removed**: `AppLayout` component and all related sub-components
- ✅ **Added**: `GridLayout` component with 12-column grid system
- ✅ **Simplified**: Cleaner API with fewer props
- ✅ **Improved**: Better performance and maintainability

### **Timeline**
- **v2.0.0**: AppLayout removed, GridLayout available
- **v3.0.0**: All AppLayout types will be removed (planned)

## 🔄 **Step-by-Step Migration**

### **Step 1: Update Imports**

**Before (v1.x)**:
```tsx
import { AppLayout } from '@/features/ui-components/layout';
// or
import { AppLayout } from '@/features/ui-components';
```

**After (v2.x)**:
```tsx
import { GridLayout } from '@/features/ui-components/layout';
// or
import { GridLayout } from '@/features/ui-components';
```

### **Step 2: Update Component Usage**

**Before (v1.x)**:
```tsx
function App() {
  const [fileName, setFileName] = useState('untitled.scad');
  
  const handleRender = () => {
    console.log('Rendering...');
  };
  
  const handleMoreOptions = () => {
    console.log('More options...');
  };

  return (
    <AppLayout
      fileName={fileName}
      onFileNameChange={setFileName}
      onRender={handleRender}
      onMoreOptions={handleMoreOptions}
      className="custom-layout"
    />
  );
}
```

**After (v2.x)**:
```tsx
function App() {
  return (
    <div className="h-screen w-screen">
      <GridLayout
        className="custom-layout"
        aria-label="12-Column Grid Layout"
      />
    </div>
  );
}
```

### **Step 3: Handle Removed Props**

| AppLayout Prop | GridLayout Equivalent | Migration Strategy |
|---|---|---|
| `fileName` | ❌ Removed | Move to Monaco editor component |
| `onFileNameChange` | ❌ Removed | Handle in Monaco editor component |
| `onRender` | ❌ Removed | Move to visualization panel |
| `onMoreOptions` | ❌ Removed | Implement in custom toolbar |
| `headerConfig` | ❌ Removed | Use custom header component |
| `toolbarConfig` | ❌ Removed | Use custom toolbar component |
| `footerConfig` | ❌ Removed | Use custom footer component |
| `layoutConfig` | ❌ Removed | Use Tailwind CSS classes |
| `glassConfig` | ❌ Removed | Use glass morphism utilities |
| `className` | ✅ Available | Direct replacement |
| `children` | ❌ Removed | GridLayout has fixed structure |

## 🎯 **Common Migration Patterns**

### **Pattern 1: Simple Layout Replacement**

**Before**:
```tsx
<AppLayout
  fileName="example.scad"
  onFileNameChange={setFileName}
  onRender={handleRender}
  onMoreOptions={handleMoreOptions}
/>
```

**After**:
```tsx
<GridLayout />
```

### **Pattern 2: Custom Styling**

**Before**:
```tsx
<AppLayout
  className="h-full bg-custom"
  glassConfig={{ opacity: 0.2 }}
/>
```

**After**:
```tsx
<GridLayout
  className="h-full bg-custom"
/>
```

### **Pattern 3: Event Handling Migration**

**Before**:
```tsx
const handleRender = () => {
  // Render logic
};

<AppLayout onRender={handleRender} />
```

**After**:
```tsx
// Move render logic to visualization panel or custom component
function CustomApp() {
  const handleRender = () => {
    // Render logic
  };

  return (
    <div className="h-screen w-screen">
      <GridLayout />
      {/* Add custom render button if needed */}
    </div>
  );
}
```

## 🔧 **Advanced Migration Scenarios**

### **Scenario 1: Custom Header/Footer**

If you were using `headerConfig` or `footerConfig`:

**Before**:
```tsx
<AppLayout
  headerConfig={{
    logoContent: <CustomLogo />,
    userAvatarContent: <UserAvatar />
  }}
  footerConfig={{
    expanded: true,
    maxMessages: 100
  }}
/>
```

**After**:
```tsx
<div className="h-screen w-screen flex flex-col">
  <CustomHeader />
  <div className="flex-1">
    <GridLayout />
  </div>
  <CustomFooter />
</div>
```

### **Scenario 2: Complex State Management**

If you were managing complex layout state:

**Before**:
```tsx
const [layoutState, setLayoutState] = useState({
  activeTabId: 'openscad',
  splitPosition: 50,
  footerExpanded: false
});

<AppLayout
  // ... complex state props
/>
```

**After**:
```tsx
// Use Zustand store or React context for state management
const useLayoutStore = create((set) => ({
  activeTabId: 'openscad',
  splitPosition: 50,
  footerExpanded: false,
  // ... actions
}));

function App() {
  return <GridLayout />;
}
```

## ⚠️ **Breaking Changes Summary**

### **Removed Components**
- `AppLayout` - Use `GridLayout`
- `HeaderBar` - Create custom header
- `Toolbar` - Create custom toolbar  
- `FooterBar` - Create custom footer
- `Splitter` - Built into GridLayout

### **Removed Types**
- `AppLayoutProps` - Use `GridLayoutProps`
- `HeaderBarProps` - Create custom types
- `ToolbarProps` - Create custom types
- `FooterBarProps` - Create custom types
- `LayoutState` - Use custom state management
- `LayoutActions` - Use custom actions

### **Removed Features**
- File name management
- Built-in toolbar with tabs
- Built-in console footer
- Complex layout configuration
- Built-in glass morphism configuration

## ✅ **Benefits of Migration**

### **Simplified API**
- Fewer props to manage
- Cleaner component interface
- Easier to understand and maintain

### **Better Performance**
- Smaller bundle size
- Faster rendering
- Optimized for 12-column grid

### **Enhanced Flexibility**
- Build custom layouts as needed
- Better separation of concerns
- Easier to test and debug

### **Future-Proof**
- Built with modern React patterns
- Follows SRP principles
- Comprehensive test coverage

## 🧪 **Testing Your Migration**

### **Unit Tests**
```tsx
// Update your tests
describe('App Layout Migration', () => {
  it('should render GridLayout instead of AppLayout', () => {
    render(<App />);
    
    // Look for GridLayout elements
    expect(screen.getByTestId('grid-layout-container')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor-section')).toBeInTheDocument();
    expect(screen.getByTestId('threejs-viewer-section')).toBeInTheDocument();
  });
});
```

### **E2E Tests**
```tsx
// Update Playwright tests
test('should display 12-column grid layout', async ({ page }) => {
  await page.goto('/');
  
  await expect(page.getByTestId('grid-layout-container')).toBeVisible();
  await expect(page.getByTestId('monaco-editor-section')).toBeVisible();
  await expect(page.getByTestId('threejs-viewer-section')).toBeVisible();
});
```

## 🆘 **Need Help?**

### **Common Issues**

**Issue**: TypeScript errors about missing AppLayout
**Solution**: Update imports to use GridLayout

**Issue**: Missing file name functionality
**Solution**: Implement file management in Monaco editor component

**Issue**: Missing toolbar functionality  
**Solution**: Create custom toolbar component

**Issue**: Missing console footer
**Solution**: Create custom console component

### **Support Resources**
- [GridLayout Documentation](./ui-components-library.md#gridlayout-component)
- [Liquid Glass Design System](./liquid-glass-design-system.md)
- [TypeScript Guidelines](./typescript-guidelines.md)

---

**Migration completed successfully? The GridLayout component provides a solid foundation for building modern, maintainable layouts with the 12-column grid system.**
