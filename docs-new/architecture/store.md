# Store (from src)

- app-store with slices:
  - babylon-rendering-slice
  - config-slice
  - editor-slice
  - openscad-globals-slice (with types)
  - parsing-slice (with types)
- selectors with memoized helpers
- constants under store/constants/

Notes
- Keep slice responsibilities focused; use memoized selectors for performance.
