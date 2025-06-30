// Quick type check to see actual SphereNode structure
import type { SphereNode } from '@holistic-stack/openscad-parser';

// This will force TypeScript to show the actual type in IDE
const sphereTest: SphereNode = {
  type: 'sphere',
  // Let's see what properties are actually available...
};

export { sphereTest };
