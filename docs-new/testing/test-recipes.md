# Test Recipes

Fragment calculator
- Test $fn=3 path and $fs/$fa formulas
- File: services/fragment-calculator/fragment-calculator.test.ts

Babylon service with NullEngine
```ts
import { NullEngine, Scene } from '@babylonjs/core';
let engine = new NullEngine();
let scene = new Scene(engine);
// init service; assert dispose cleans resources
```

Geometry builder factory
- Use result/geometry assertions in test-utilities/

