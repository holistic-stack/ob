# Performance Playbook

- Keep frame time <16ms; prefer caching (geometry-cache, render-cache)
- Control tessellation with $fn/$fs/$fa via fragment-calculator
- Dispose aggressively; avoid hidden observers
- Use performance debounce configs for heavy paths

