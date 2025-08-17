# Constants and Configuration (from src)

OpenSCAD globals (single source of truth)
- src/shared/constants/openscad-globals/
  - openscad-globals.constants.ts (+ tests)

Example (reading globals in a service)
```ts
import { OPENSCAD_GLOBALS } from '@/shared/constants/openscad-globals/openscad-globals.constants';

export const getDefaultFragments = (): number => OPENSCAD_GLOBALS.DEFAULT_FN;
```

Config
- src/shared/config/debounce-config.ts (+ tests)
- src/shared/config/performance-debounce-config.ts (+ tests)

Example (consistent debouncing)
```ts
import { PARSER_DEBOUNCE_MS } from '@/shared/config/debounce-config';

export const debounceMs = PARSER_DEBOUNCE_MS; // reuse across hooks/services
```

Guidelines
- Define new global constants centrally.
- Import constants where needed; avoid magic numbers.
- Keep config pure and typed; prefer readonly structures.
- No OPENSCAD_FALLBACK: do not reintroduce fallback constants or behaviors.
