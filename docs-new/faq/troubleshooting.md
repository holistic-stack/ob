# Troubleshooting FAQ

- Visual tests are failing on CI
  - Re-run locally with the same browser versions; update snapshots only when intended
- TypeScript errors popped up after a small change
  - Ensure types are explicit; avoid any; add type guards or refine unions
