# Read Recent Changes

Find pipeline-impacting diffs
```bash
git --no-pager log --since="2 weeks ago" -- src/features/openscad-parser src/features/openscad-geometry-builder src/features/babylon-renderer
```

Grep for exports changed
```bash
git --no-pager show HEAD | grep "export .* from" -n
```

Scan tests added/changed
```bash
git --no-pager log --name-only --pretty=format: | grep "\.test\.[tj]sx\?$" | sort -u
```

