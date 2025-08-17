# Store Slices Cheatsheet

Slices
- parsing-slice.ts: AST/result state; actions: setCode, setAST; selectors: selectAST
- babylon-rendering-slice.ts: camera/scene/UI; selectors for modes and grid
- editor-slice.ts: editor content and settings
- config-slice.ts: app config flags
- openscad-globals-slice/: OpenSCAD globals ($fn/$fs/$fa)

Tips
- Prefer memoized selectors (reselect)
- Co-locate slice tests with slice file

