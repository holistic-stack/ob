# TypeScript Guidelines and Best Practices

This document provides comprehensive guidelines for TypeScript development, covering version migration best practices, modern features, and developer best practices. All formatting and linting rules are enforced by Biome v2.0.6.

## Table of Contents

1. [Biome Integration and Formatting Rules](#biome-integration-and-formatting-rules)
2. [Version Migration Guide](#version-migration-guide)
3. [TypeScript 5.x Features](#typescript-5x-features)
4. [ESM and Module Best Practices](#esm-and-module-best-practices)
5. [Strict Mode and Type Safety](#strict-mode-and-type-safety)
6. [Advanced Type Patterns](#advanced-type-patterns)
7. [Performance and Optimization](#performance-and-optimization)
8. [Developer Cheatsheet](#developer-cheatsheet)
9. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

## Biome Integration and Formatting Rules

This project uses **Biome v2.0.6** for linting and formatting. All code examples in this document follow Biome's enforced rules.

### Biome Formatting Standards

**1. Code Formatting (Enforced by Biome)**
```typescript
// ✅ Biome enforced formatting
const config = {
  apiUrl: 'https://api.example.com', // Single quotes for JS
  timeout: 5000,                     // Always semicolons
  retries: 3,                        // 2-space indentation
};

// ✅ JSX uses double quotes
const component = <div className="container">Content</div>;

// ✅ Arrow functions always use parentheses
const handler = (event) => {
  console.log('Event handled');
};
```

**2. Linting Rules (Enforced by Biome) - MANDATORY COMPLIANCE**
- `noExplicitAny: "error"` - Never use `any` type (use `unknown` instead)
- `noUnusedVariables: "error"` - Remove unused variables (prefix with `_` if intentional)
- `noUnusedFunctionParameters: "error"` - Remove unused parameters (prefix with `_` if intentional)
- `noNonNullAssertion: "error"` - Avoid `!` operators (use proper null checks)
- `noEmptyBlockStatements: "error"` - No empty `{}` blocks (add comments if intentional)
- `useOptionalChain: "error"` - Use `?.` instead of manual null checks
- `useTemplate: "error"` - Use template literals over string concatenation
- `noUndeclaredVariables: "error"` - All variables must be declared

**3. Import/Export Standards**
```typescript
// ✅ Biome enforced import formatting
import { Vector3, Mesh, Scene } from 'three';
import type { Material } from 'three';

// ✅ Named exports preferred
export const createUser = (name: string) => ({ name });
export const deleteUser = (id: string) => { /* ... */ };
```

### Biome Configuration Alignment

All TypeScript code must pass:
```bash
pnpm biome:check  # Must return 0 violations
pnpm type-check   # Must return 0 TypeScript errors
```

### Common Biome Violations and Fixes

**1. noExplicitAny Violations**
```typescript
// ❌ Biome ERROR
const mockFn = vi.fn().mockImplementation((x: any) => x);

// ✅ Fix: Use proper types
const mockFn = vi.fn().mockImplementation((x: unknown) => x);
```

**2. noUnusedVariables/noUnusedFunctionParameters**
```typescript
// ❌ Biome ERROR
function handler(event: Event, unusedParam: string) {
  console.log(event);
}

// ✅ Fix: Prefix unused with underscore
function handler(event: Event, _unusedParam: string) {
  console.log(event);
}
```

**3. noNonNullAssertion**
```typescript
// ❌ Biome ERROR
const result = canvasRef.current!.getContext('2d')!;

// ✅ Fix: Use proper null checks
if (!canvasRef.current) throw new Error('Canvas not found');
const context = canvasRef.current.getContext('2d');
if (!context) throw new Error('2D context not supported');
const result = context;
```

**4. noEmptyBlockStatements**
```typescript
// ❌ Biome ERROR
const fallback = () => {};

// ✅ Fix: Add comment or implementation
const fallback = () => {
  // Intentionally empty - no action needed
};
```

## Version Migration Guide

### TypeScript 3.x to 4.x Migration

#### Deprecated Practices to Avoid

**1. Implicit Any in Catch Clauses**
```typescript
// ❌ TypeScript 3.x - implicit any
try {
  // some code
} catch (error) {
  console.log(error.message); // error is implicitly any
}

// ✅ TypeScript 4.x+ - explicit typing
try {
  // some code
} catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  }
}
```

**2. Breaking Changes in Lib Files**
- DOM types became more strict
- Some global types were removed or changed

**3. Stricter Checks for Operators**
```typescript
// ❌ No longer allowed in 4.x
declare let x: string | number;
if (x > 0) {} // Error: Operator '>' cannot be applied to types 'string | number'

// ✅ Correct approach
if (typeof x === 'number' && x > 0) {}
```

### TypeScript 4.x to 5.x Migration

#### Major Breaking Changes

**1. Node.js Version Requirements**
- Minimum Node.js version: 12.20, 14.15, 16.0, or later
- TypeScript 5.0+ requires ECMAScript 2018 target

**2. Enum Overhaul**
```typescript
// ❌ No longer allowed in 5.x
enum SomeEvenDigit {
  Zero = 0,
  Two = 2,
  Four = 4
}
let m: SomeEvenDigit = 1; // Error in 5.x

// ✅ Correct usage
let m: SomeEvenDigit = SomeEvenDigit.Zero;
```

**3. Deprecated Compiler Options**
- `--target: ES3` (deprecated)
- `--out` (deprecated)
- `--noImplicitUseStrict` (deprecated)
- `--keyofStringsOnly` (deprecated)
- `--suppressExcessPropertyErrors` (deprecated)
- `--suppressImplicitAnyIndexErrors` (deprecated)
- `--noStrictGenericChecks` (deprecated)
- `--charset` (deprecated)
- `--importsNotUsedAsValues` (deprecated, use `--verbatimModuleSyntax`)
- `--preserveValueImports` (deprecated, use `--verbatimModuleSyntax`)

### TypeScript 5.1 to 5.8 Migration

#### New Features to Adopt

**1. TypeScript 5.0 - Decorators**
```typescript
// ✅ New standard decorators (no --experimentalDecorators needed)
function loggedMethod(target: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);
  return function (this: any, ...args: any[]) {
    console.log(`Calling ${methodName}`);
    return target.call(this, ...args);
  };
}

class MyClass {
  @loggedMethod
  myMethod() {
    return "Hello";
  }
}
```

**2. TypeScript 5.0 - const Type Parameters**
```typescript
// ✅ More precise inference with const type parameters
function getNamesExactly<const T extends readonly string[]>(arg: T): T {
  return arg;
}

// Inferred type: readonly ["Alice", "Bob", "Eve"]
const names = getNamesExactly(["Alice", "Bob", "Eve"]);
```

**3. TypeScript 5.4 - NoInfer Utility Type**
```typescript
// ✅ Prevent inference in specific positions
function createStreetLight<C extends string>(
  colors: C[],
  defaultColor?: NoInfer<C>
): void {}

createStreetLight(["red", "yellow", "green"], "blue"); // Error: "blue" not in union
```

**4. TypeScript 5.8 - Granular Return Type Checking**
```typescript
// ✅ Better error detection in conditional returns
function getUrlObject(urlString: string): URL {
  return untypedCache.has(urlString) ?
    untypedCache.get(urlString) : // Error if this returns wrong type
    new URL(urlString); // ✅ Correct
}
```

## TypeScript 5.x Features

### TypeScript 5.0 Key Features

**1. Decorators (Standard)**
```typescript
// ✅ Method decorator
function bound(target: any, context: ClassMethodDecoratorContext) {
  if (context.private) {
    throw new Error(`'bound' cannot decorate private properties`);
  }
  context.addInitializer(function () {
    this[context.name] = this[context.name].bind(this);
  });
}

class Person {
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  @bound
  greet() {
    console.log(`Hello, my name is ${this.name}`);
  }
}
```

**2. Multiple Configuration Files in extends**
```json
// tsconfig.json
{
  "extends": ["@tsconfig/strictest/tsconfig.json", "./tsconfig.base.json"],
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

**3. --moduleResolution bundler**
```json
// For modern bundlers (Vite, esbuild, Webpack, etc.)
{
  "compilerOptions": {
    "target": "esnext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

### TypeScript 5.8 Key Features

**1. --erasableSyntaxOnly Flag**
```json
// For Node.js --experimental-strip-types compatibility
{
  "compilerOptions": {
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}
```

**2. require() of ESM in --module nodenext**
```typescript
// ✅ Now allowed in Node.js 22+ with --module nodenext
const esmModule = require('./esm-module.mjs');
```

**3. --module node18**
```json
// Stable reference point for Node.js 18
{
  "compilerOptions": {
    "module": "node18",
    "moduleResolution": "node18"
  }
}
```

## ESM and Module Best Practices

### File Extensions in ESM

**1. Always Use .js Extensions in Imports**
```typescript
// ❌ Avoid - missing file extension
import { utils } from "./utils";

// ✅ Correct - include .js extension (even for .ts files)
import { utils } from "./utils.js";

// ✅ For relative imports in ESM
import { helper } from "../helpers/helper.js";
```

**2. Package.json Configuration**
```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"]
}
```

### Module Resolution Strategies

**1. For Libraries (Publishing to npm)**
```json
// Use node16/nodenext for strict Node.js compatibility
{
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "target": "es2020",
    "verbatimModuleSyntax": true
  }
}
```

**2. For Applications (Using Bundlers)**
```json
// Use bundler for modern build tools
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "esnext",
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

**3. For Node.js Applications**
```json
// Use nodenext for latest Node.js features
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "es2022"
  }
}
```

### Import/Export Best Practices

**1. Prefer Named Exports (Biome Enforced)**
```typescript
// ✅ Named exports - better for tree shaking (single quotes enforced)
export const createUser = (name: string) => ({ name });
export const deleteUser = (id: string) => { /* ... */ };

// ❌ Avoid default exports for utilities
export default { createUser, deleteUser };
```

**2. Use Type-Only Imports When Appropriate (Biome Enforced)**
```typescript
// ✅ Type-only imports (single quotes enforced)
import type { User, UserConfig } from './types.js';
import { createUser } from './user-service.js';

// ✅ Mixed imports
import { type User, createUser } from './user-service.js';
```

**3. Re-exports with Type Safety (Biome Enforced)**
```typescript
// ✅ Re-export with type information (single quotes enforced)
export type { User, UserConfig } from './types.js';
export { createUser, deleteUser } from './user-service.js';

// ✅ Namespace re-export
export type * as UserTypes from './user-types.js';
```

### Dynamic Imports

**1. Conditional Loading (Biome Enforced)**
```typescript
// ✅ Dynamic imports for code splitting (single quotes enforced)
async function loadFeature(featureName: string) {
  switch (featureName) {
    case 'advanced':
      const { AdvancedFeature } = await import('./advanced-feature.js');
      return new AdvancedFeature();
    default:
      throw new Error(`Unknown feature: ${featureName}`);
  }
}
```

**2. JSON Imports (Biome Enforced)**
```typescript
// ✅ JSON imports with type safety (single quotes enforced)
import config from './config.json' with { type: 'json' };

// ✅ Dynamic JSON import
const config = await import('./config.json', { with: { type: 'json' } });
```

### Module Augmentation

**1. Extending Third-Party Types (Biome Enforced)**
```typescript
// ✅ Module augmentation (single quotes enforced)
declare module 'express' {
  interface Request {
    user?: User;
  }
}

// ✅ Global augmentation
declare global {
  interface Window {
    myApp: MyAppInterface;
  }
}
```

## Strict Mode and Type Safety

### Essential Strict Mode Configuration

**1. Recommended tsconfig.json**
```json
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "noUncheckedIndexedAccess": true, // Prevent undefined array access
    "exactOptionalPropertyTypes": true, // Strict optional properties
    "noImplicitReturns": true,        // All code paths must return
    "noFallthroughCasesInSwitch": true, // Prevent switch fallthrough
    "noImplicitOverride": true,       // Explicit override keyword
    "noPropertyAccessFromIndexSignature": true, // Strict object access
    "allowUnusedLabels": false,       // Prevent unused labels
    "allowUnreachableCode": false     // Prevent unreachable code
  }
}
```

**2. Individual Strict Flags**
```json
{
  "compilerOptions": {
    "noImplicitAny": true,           // No implicit any types
    "strictNullChecks": true,        // Null/undefined checking
    "strictFunctionTypes": true,     // Strict function type checking
    "strictBindCallApply": true,     // Strict bind/call/apply
    "strictPropertyInitialization": true, // Class property initialization
    "noImplicitThis": true,          // No implicit this
    "alwaysStrict": true            // Always emit "use strict"
  }
}
```

### Type Safety Best Practices

**1. Avoid any - Use Proper Types (Biome: noExplicitAny)**
```typescript
// ❌ Biome ERROR: noExplicitAny
function processData(data: any): any {
  return data.someProperty;
}

// ✅ Use proper types (Biome compliant)
interface DataInput {
  someProperty: string;
  optionalProp?: number;
}

function processData(data: DataInput): string {
  return data.someProperty;
}

// ✅ Use unknown for truly unknown data (Biome compliant)
function processUnknownData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return String((data as { someProperty: unknown }).someProperty);
  }
  throw new Error('Invalid data structure');
}
```

**2. Proper Null/Undefined Handling (Biome: useOptionalChain, noNonNullAssertion)**
```typescript
// ❌ Biome ERROR: noNonNullAssertion
const value = user.profile!.name!;

// ✅ Explicit null checks (Biome compliant)
function getUserName(user: User | null): string {
  if (user === null) {
    return 'Anonymous';
  }
  return user.name;
}

// ✅ Optional chaining (Biome enforced: useOptionalChain)
const userName = user?.profile?.name ?? 'Anonymous';

// ✅ Nullish coalescing (Biome compliant)
const config = userConfig ?? defaultConfig;
```

**3. Type Guards and Narrowing**
```typescript
// ✅ Type guard functions
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' &&
         obj !== null &&
         'name' in obj &&
         'email' in obj;
}

// ✅ Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.data; // TypeScript knows this is the success case
  }
  throw new Error(result.error); // TypeScript knows this is the error case
}
```

**4. Assertion Functions**
```typescript
// ✅ Assertion functions for runtime validation
function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(`Expected number, got ${typeof value}`);
  }
}

function processValue(input: unknown) {
  assertIsNumber(input);
  // TypeScript now knows input is a number
  return input * 2;
}
```

### Advanced Type Safety Patterns

**1. Branded Types**
```typescript
// ✅ Branded types for type safety
type UserId = string & { readonly brand: unique symbol };
type Email = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  // Validation logic here
  return id as UserId;
}

function createEmail(email: string): Email {
  if (!email.includes('@')) {
    throw new Error('Invalid email');
  }
  return email as Email;
}

// Now these can't be mixed up
function getUser(id: UserId): User { /* ... */ }
function sendEmail(to: Email): void { /* ... */ }
```

**2. Const Assertions**
```typescript
// ✅ Const assertions for literal types
const themes = ['light', 'dark', 'auto'] as const;
type Theme = typeof themes[number]; // 'light' | 'dark' | 'auto'

const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
} as const;
// All properties become readonly and literal types
```

## Advanced Type Patterns

### Utility Types and Transformations

**1. Built-in Utility Types**
```typescript
// ✅ Essential utility types
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

// Partial - make all properties optional
type PartialUser = Partial<User>;

// Required - make all properties required
type RequiredUser = Required<User>;

// Pick - select specific properties
type UserIdentity = Pick<User, 'id' | 'name'>;

// Omit - exclude specific properties
type UserWithoutId = Omit<User, 'id'>;

// Record - create object type with specific keys
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;
```

**2. Advanced Utility Types**
```typescript
// ✅ Custom utility types
type NonNullable<T> = T extends null | undefined ? never : T;

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Extract function return type
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Extract function parameters
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
```

### Conditional Types

**1. Basic Conditional Types**
```typescript
// ✅ Conditional type patterns
type IsArray<T> = T extends any[] ? true : false;

type ArrayElement<T> = T extends (infer U)[] ? U : never;

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;
```

**2. Distributive Conditional Types**
```typescript
// ✅ Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;

// For union types: string | number becomes string[] | number[]
type Example = ToArray<string | number>;

// Exclude null/undefined from union
type NonNullable<T> = T extends null | undefined ? never : T;
```

### Mapped Types

**1. Basic Mapped Types**
```typescript
// ✅ Mapped type patterns
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Optional<T> = {
  [P in keyof T]?: T[P];
};

type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};
```

**2. Advanced Mapped Types**
```typescript
// ✅ Key remapping in mapped types
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

// Template literal types
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (value: T[K]) => void;
};

interface User {
  name: string;
  age: number;
}

// Results in: { getName: () => string; getAge: () => number; }
type UserGetters = Getters<User>;
```

### Template Literal Types

**1. String Manipulation**
```typescript
// ✅ Template literal type patterns
type Uppercase<S extends string> = intrinsic;
type Lowercase<S extends string> = intrinsic;
type Capitalize<S extends string> = intrinsic;
type Uncapitalize<S extends string> = intrinsic;

// Custom string patterns
type EmailDomain<T extends string> = T extends `${string}@${infer Domain}`
  ? Domain
  : never;

type FileName<T extends string> = T extends `${infer Name}.${string}`
  ? Name
  : never;

// API endpoint types
type ApiEndpoint<T extends string> = `/api/v1/${T}`;
type UserEndpoints = ApiEndpoint<'users' | 'profiles' | 'settings'>;
```

**2. Path and Route Types**
```typescript
// ✅ Type-safe routing
type Route =
  | '/home'
  | '/about'
  | `/users/${string}`
  | `/posts/${string}/comments`;

type ExtractRouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractRouteParams<Rest>
    : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : {};

// Usage
type UserRouteParams = ExtractRouteParams<'/users/:id/posts/:postId'>;
// Result: { id: string; postId: string; }
```

### Generic Constraints and Inference

**1. Generic Constraints**
```typescript
// ✅ Generic constraints
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

// Keyof constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Multiple constraints
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}
```

**2. Conditional Type Inference**
```typescript
// ✅ Infer keyword patterns
type GetArrayType<T> = T extends (infer U)[] ? U : never;

type GetPromiseType<T> = T extends Promise<infer U> ? U : never;

type GetFunctionArgs<T> = T extends (...args: infer P) => any ? P : never;

type GetConstructorArgs<T> = T extends new (...args: infer P) => any ? P : never;

// Recursive inference
type Flatten<T> = T extends any[]
  ? T extends (infer U)[]
    ? Flatten<U>
    : never
  : T;

type Example = Flatten<string[][]>; // string
```

## Performance and Optimization

### Compilation Performance

**1. Project References**
```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/ui" }
  ]
}

// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**2. Incremental Compilation**
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

**3. Skip Library Checks**
```json
{
  "compilerOptions": {
    "skipLibCheck": true,        // Skip type checking of declaration files
    "skipDefaultLibCheck": true  // Skip type checking of default library files
  }
}
```

### Type-Level Performance

**1. Avoid Deep Recursion**
```typescript
// ❌ Avoid deep recursive types
type DeepFlatten<T> = T extends any[]
  ? T extends (infer U)[]
    ? DeepFlatten<U>  // Can cause stack overflow
    : never
  : T;

// ✅ Use iteration limits
type DeepFlatten<T, Depth extends number = 5> = Depth extends 0
  ? T
  : T extends any[]
  ? T extends (infer U)[]
    ? DeepFlatten<U, Prev<Depth>>
    : never
  : T;

type Prev<T extends number> = T extends 0 ? 0 : T extends 1 ? 0 : T extends 2 ? 1 : T extends 3 ? 2 : T extends 4 ? 3 : T extends 5 ? 4 : never;
```

**2. Optimize Union Types**
```typescript
// ❌ Large unions can be slow
type LargeUnion = 'a' | 'b' | 'c' | /* ... 100+ more */ | 'z';

// ✅ Use string patterns when possible
type LetterPattern = `${string}`;

// ✅ Or use enums for better performance
enum Letters {
  A = 'a',
  B = 'b',
  // ...
}
```

### Runtime Performance

**1. Prefer Interfaces over Type Aliases**
```typescript
// ✅ Interfaces are generally faster for object types
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Type aliases can be slower for complex object types
type User = {
  id: string;
  name: string;
  email: string;
};
```

**2. Use Const Assertions for Static Data**
```typescript
// ✅ Const assertions prevent unnecessary type widening
const API_ENDPOINTS = {
  users: '/api/users',
  posts: '/api/posts',
  comments: '/api/comments'
} as const;

// ✅ Readonly arrays
const SUPPORTED_FORMATS = ['json', 'xml', 'csv'] as const;
```

## Developer Cheatsheet

### Quick Reference

**1. Essential Type Syntax**
```typescript
// Basic types
let name: string = "John";
let age: number = 30;
let isActive: boolean = true;
let items: string[] = ["a", "b", "c"];
let tuple: [string, number] = ["John", 30];

// Union and intersection
type StringOrNumber = string | number;
type UserWithTimestamp = User & { timestamp: Date };

// Function types
type Handler = (event: Event) => void;
type AsyncHandler = (data: unknown) => Promise<void>;

// Object types
type Config = {
  readonly apiUrl: string;
  timeout?: number;
  retries: number;
};
```

**2. Common Patterns**
```typescript
// Optional chaining and nullish coalescing
const value = obj?.prop?.nested ?? defaultValue;

// Type guards
const isString = (x: unknown): x is string => typeof x === 'string';

// Assertion functions
const assertIsNumber = (x: unknown): asserts x is number => {
  if (typeof x !== 'number') throw new Error('Not a number');
};

// Discriminated unions
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**3. Utility Types Quick Reference**
```typescript
// Transform existing types
Partial<T>          // Make all properties optional
Required<T>         // Make all properties required
Readonly<T>         // Make all properties readonly
Pick<T, K>          // Select specific properties
Omit<T, K>          // Exclude specific properties
Record<K, T>        // Create object type with specific keys
Exclude<T, U>       // Remove types from union
Extract<T, U>       // Extract types from union
NonNullable<T>      // Remove null/undefined
ReturnType<T>       // Get function return type
Parameters<T>       // Get function parameter types
```

### VSCode Tips

**1. Essential Extensions**
- TypeScript Importer
- TypeScript Hero
- Error Lens
- Auto Import - ES6, TS, JSX, TSX

**2. Useful Shortcuts**
- `Ctrl+Space`: Trigger IntelliSense
- `F12`: Go to definition
- `Shift+F12`: Find all references
- `Ctrl+Shift+O`: Go to symbol
- `Ctrl+T`: Go to symbol in workspace

**3. Settings**
```json
{
  "typescript.preferences.quoteStyle": "single",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

## Common Pitfalls and Solutions

### Type-Related Pitfalls

**1. any Escape Hatches**
```typescript
// ❌ Avoid any
function processData(data: any) {
  return data.someProperty; // No type safety
}

// ✅ Use proper types or unknown
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: unknown }).someProperty;
  }
  throw new Error('Invalid data');
}
```

**2. Implicit any in Arrays**
```typescript
// ❌ Implicit any array
const items = []; // any[]
items.push("string");
items.push(123);

// ✅ Explicit typing
const items: (string | number)[] = [];
// or
const items = [] as (string | number)[];
```

**3. Object Property Access**
```typescript
// ❌ Unsafe property access
function getValue(obj: Record<string, unknown>, key: string) {
  return obj[key]; // Could be undefined
}

// ✅ Safe property access
function getValue(obj: Record<string, unknown>, key: string) {
  return key in obj ? obj[key] : undefined;
}
```

### Module-Related Pitfalls

**1. Missing File Extensions**
```typescript
// ❌ Missing .js extension in ESM
import { utils } from "./utils"; // Error in Node.js ESM

// ✅ Include .js extension
import { utils } from "./utils.js";
```

**2. Mixed Import Styles**
```typescript
// ❌ Mixing import styles
import * as fs from "fs";
import { readFile } from "fs"; // Inconsistent

// ✅ Consistent import style
import { readFile, writeFile } from "fs";
```

### Configuration Pitfalls

**1. Loose Type Checking**
```json
// ❌ Too permissive
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}

// ✅ Strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**2. Wrong Module Settings**
```json
// ❌ Mismatched module settings
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020" // Inconsistent with module
  }
}

// ✅ Consistent settings
{
  "compilerOptions": {
    "module": "es2020",
    "target": "es2020"
  }
}
```

---

## Summary

This guide covers the essential TypeScript best practices for modern development:

1. **Migration**: Understand breaking changes between versions
2. **Features**: Leverage new TypeScript 5.x capabilities
3. **Modules**: Use proper ESM practices with correct file extensions
4. **Safety**: Enable strict mode and use proper type safety patterns
5. **Advanced**: Master utility types, conditional types, and template literals
6. **Performance**: Optimize compilation and runtime performance
7. **Productivity**: Use developer tools and avoid common pitfalls

Remember to always prioritize type safety, use strict mode, and leverage TypeScript's powerful type system to catch errors at compile time rather than runtime.

## TypeScript 5.8 Configuration Best Practices

### Recommended tsconfig.json for TypeScript 5.8

**1. Base Configuration (All Projects)**
```json
{
  "compilerOptions": {
    // Base Options
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    // Strictness (Essential)
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,

    // TypeScript 5.8 Specific Options
    "libReplacement": true,  // Enable lib replacement (default: true)

    // For Node.js --experimental-strip-types compatibility
    "erasableSyntaxOnly": false  // Set to true if using Node.js type stripping
  }
}
```

**2. For Libraries (Publishing to npm)**
```json
{
  "extends": "@tsconfig/strictest/tsconfig.json",
  "compilerOptions": {
    // Module Configuration
    "module": "node16",
    "moduleResolution": "node16",
    "target": "es2020",
    "verbatimModuleSyntax": true,

    // Declaration Generation
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // Monorepo Support
    "composite": true,
    "incremental": true,

    // Output
    "outDir": "./dist",
    "rootDir": "./src",

    // Library Specific
    "lib": ["es2020"]
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

**3. For Applications (Using Bundlers)**
```json
{
  "compilerOptions": {
    // Modern Bundler Configuration
    "module": "preserve",  // TypeScript 5.8+ for bundlers
    "moduleResolution": "bundler",
    "target": "esnext",
    "allowImportingTsExtensions": true,
    "noEmit": true,

    // Bundler-Specific Features
    "allowArbitraryExtensions": true,
    "resolvePackageJsonExports": true,
    "resolvePackageJsonImports": true,

    // DOM Support
    "lib": ["esnext", "dom", "dom.iterable"],

    // Development
    "sourceMap": true
  }
}
```

**4. For Node.js Applications**
```json
{
  "compilerOptions": {
    // Node.js Configuration
    "module": "nodenext",  // Latest Node.js features
    "moduleResolution": "nodenext",
    "target": "es2022",

    // Node.js Specific
    "lib": ["es2022"],
    "types": ["node"],

    // Output
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### TypeScript 4.8 to 5.8 Migration Checklist

#### 1. Update Dependencies
```bash
# Update TypeScript
npm install typescript@^5.8.0 --save-dev

# Update @types/node if using Node.js
npm install @types/node@latest --save-dev

# Update other type packages
npm update @types/*
```

#### 2. Configuration Updates Required

**Remove Deprecated Options (Breaking Changes) - ✅ APPLIED TO PROJECT**
```json
{
  "compilerOptions": {
    // ❌ These deprecated options have been REMOVED from tsconfig.base.json
    // "target": "ES3",                    // Deprecated in 5.0
    // "out": "./output.js",               // Deprecated in 5.0
    // "noImplicitUseStrict": false,       // Deprecated in 5.0
    // "keyofStringsOnly": false,          // Deprecated in 5.0
    // "suppressExcessPropertyErrors": false, // Deprecated in 5.0
    // "suppressImplicitAnyIndexErrors": false, // Deprecated in 5.0
    // "noStrictGenericChecks": false,     // Deprecated in 5.0
    // "charset": "utf8",                  // Deprecated in 5.0
    // "importsNotUsedAsValues": "remove", // ✅ REMOVED - deprecated in 5.0
    // "preserveValueImports": false,      // ✅ REMOVED - deprecated in 5.0

    // ✅ Current configuration uses these instead
    "target": "es2022",                   // Modern target
    "verbatimModuleSyntax": true          // Replaces deprecated import/preserve options
  }
}
```

**Project Configuration Status:**
- ✅ **tsconfig.base.json**: Deprecated options removed, aligned with TypeScript 5.8
- ✅ **biome.json**: Strict linting rules enforced
- ⚠️ **Codebase**: 199 Biome violations need fixing (mainly `noExplicitAny`, `noUnusedVariables`)
- ⚠️ **TypeScript**: 783 type errors need resolution

**Update Module Resolution**
```json
{
  "compilerOptions": {
    // ❌ Old module resolution
    // "module": "commonjs",
    // "moduleResolution": "node",

    // ✅ New module resolution options
    "module": "node18",           // For Node.js 18 (stable)
    "moduleResolution": "node18", // Or "nodenext" for latest

    // Or for bundlers:
    "module": "preserve",         // TypeScript 5.8+
    "moduleResolution": "bundler"
  }
}
```

#### 3. Code Changes Required

**1. Enum Usage Updates**
```typescript
// ❌ No longer allowed in 5.x
enum SomeEvenDigit {
  Zero = 0,
  Two = 2,
  Four = 4
}
let m: SomeEvenDigit = 1; // Error in 5.x

// ✅ Correct usage
let m: SomeEvenDigit = SomeEvenDigit.Zero;
```

**2. Catch Variable Types (4.4+)**
```typescript
// ❌ Old catch handling
try {
  // some code
} catch (error) {
  console.log(error.message); // error is any
}

// ✅ New catch handling
try {
  // some code
} catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  }
}
```

**3. Import Assertions to Import Attributes**
```typescript
// ❌ Deprecated import assertions (Node.js 22+)
import data from "./data.json" assert { type: "json" };

// ✅ Use import attributes
import data from "./data.json" with { type: "json" };
```

#### 4. New Features to Adopt

**1. TypeScript 5.8 - erasableSyntaxOnly**
```json
{
  "compilerOptions": {
    // For Node.js --experimental-strip-types compatibility
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true
  }
}
```

**2. TypeScript 5.8 - libReplacement Control**
```json
{
  "compilerOptions": {
    // Control lib replacement behavior
    "libReplacement": false  // Disable if not using @typescript/lib-* packages
  }
}
```

**3. TypeScript 5.0+ - New Decorators**
```typescript
// ✅ Use standard decorators (no --experimentalDecorators needed)
function logged(target: any, context: ClassMethodDecoratorContext) {
  return function (this: any, ...args: any[]) {
    console.log(`Calling ${String(context.name)}`);
    return target.call(this, ...args);
  };
}

class MyClass {
  @logged
  method() {
    return "result";
  }
}
```

#### 5. Performance Optimizations

**Enable New Performance Features**
```json
{
  "compilerOptions": {
    // Performance improvements
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,

    // TypeScript 5.8 optimizations
    "libReplacement": false  // If not using lib replacements
  }
}
```

#### 6. Validation Steps

**1. Check for Deprecated Usage**
```bash
# Run TypeScript compiler to check for deprecation warnings
npx tsc --noEmit

# Look for warnings about deprecated options
```

**2. Test Module Resolution**
```typescript
// Test ESM imports work correctly
import { something } from "./module.js";  // Note .js extension

// Test dynamic imports
const module = await import("./dynamic-module.js");
```

**3. Verify Strict Mode**
```typescript
// Ensure strict mode catches issues
function test(param: unknown) {
  // Should error without proper type checking
  return param.someProperty; // Error: Object is of type 'unknown'
}
```

#### 7. Common Migration Issues

**1. Module Resolution Errors**
```typescript
// ❌ Missing file extensions in ESM
import { utils } from "./utils";

// ✅ Include .js extensions
import { utils } from "./utils.js";
```

**2. Type-Only Import Issues**
```typescript
// ❌ Mixed imports that may cause issues
import { type User, createUser, type Config } from "./module.js";

// ✅ Separate type and value imports
import type { User, Config } from "./module.js";
import { createUser } from "./module.js";
```

**3. Enum Comparison Errors**
```typescript
// ❌ Invalid enum comparisons
enum Status { Active = 1, Inactive = 0 }
const status: Status = Status.Active;
if (status === 2) {} // Error in 5.x

// ✅ Valid enum usage
if (status === Status.Active) {}
```

This migration checklist ensures a smooth transition from TypeScript 4.8 to 5.8 while adopting the latest best practices and performance improvements.

## Project-Specific Lint Rules and Guidelines

### Biome Configuration for OpenSCAD-Babylon Project

This section provides project-specific guidelines for fixing common lint issues in the OpenSCAD-Babylon project using Biome v2.

#### 1. Handling `noExplicitAny`

**Problem**: Using `any` type defeats TypeScript's type safety.

**Solutions by Context**:

```typescript
// ❌ Avoid any
function processData(data: any): any {
  return data.someProperty;
}

// ✅ Use proper types for OpenSCAD AST nodes
interface OpenSCADNode {
  type: string;
  children?: OpenSCADNode[];
  parameters?: Record<string, unknown>;
}

function processNode(node: OpenSCADNode): ProcessedNode {
  return {
    type: node.type,
    processed: true
  };
}

// ✅ For CSG2 operations with unknown structure
function processCSG2Operation(operation: unknown): CSG2Result {
  if (typeof operation === 'object' && operation !== null) {
    return processValidOperation(operation as Record<string, unknown>);
  }
  throw new Error('Invalid CSG2 operation');
}

// ✅ For Babylon.js mesh properties
interface BabylonMeshData {
  position?: Vector3;
  rotation?: Vector3;
  scaling?: Vector3;
  material?: Material;
}

function updateMesh(mesh: Mesh, data: BabylonMeshData): void {
  if (data.position) mesh.position = data.position;
  if (data.rotation) mesh.rotation = data.rotation;
  // ... etc
}
```

#### 2. Handling `noUnusedVariables`

**Problem**: Variables defined but never used.

**Solutions**:

```typescript
// ❌ Unused imports
import { Mesh, MeshBasicMaterial, Color } from 'three';
import { SphereNode, CubeNode, CylinderNode } from './types.js';

// ✅ Remove unused imports or prefix with underscore
import { Mesh } from 'three';
import type { SphereNode } from './types.js'; // Use type-only import if only for typing

// ✅ For intentionally unused parameters
function processNode(_unusedParam: string, usedParam: number): number {
  return usedParam * 2;
}

// ✅ For destructuring with unused properties
const { used, _unused } = someObject;
```

#### 3. Handling `noExtraNonNullAssertion`

**Problem**: Non-null assertions (`!`) can cause runtime errors.

**Solutions**:

```typescript
// ❌ Dangerous non-null assertion
const value = node.children![0]!.parameters!.value;

// ✅ Safe property access with validation
function getNodeValue(node: OpenSCADNode): unknown {
  if (!node.children || node.children.length === 0) {
    throw new Error('Node has no children');
  }

  const firstChild = node.children[0];
  if (!firstChild.parameters) {
    throw new Error('Child node has no parameters');
  }

  return firstChild.parameters.value;
}

// ✅ Using optional chaining
const value = node.children?.[0]?.parameters?.value;
if (value === undefined) {
  throw new Error('Required value not found');
}

// ✅ Type guards for better safety
function hasRequiredStructure(node: unknown): node is RequiredNode {
  return typeof node === 'object' &&
         node !== null &&
         'children' in node &&
         Array.isArray((node as any).children);
}
```

#### 4. Handling `noMisusedPromises`

**Problem**: Promises that aren't properly handled.

**Solutions**:

```typescript
// ❌ Floating promise
processOpenSCADFile(content);

// ✅ Properly handle async operations
try {
  await processOpenSCADFile(content);
} catch (error) {
  console.error('Failed to process OpenSCAD file:', error);
}

// ✅ For fire-and-forget operations
void processOpenSCADFile(content).catch(error => {
  console.error('Background processing failed:', error);
});

// ✅ In React components
const handleProcess = useCallback(async () => {
  try {
    await processOpenSCADFile(content);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Unknown error');
  }
}, [content]);
```

#### 5. Handling `noImplicitToString`

**Problem**: Objects being stringified without proper toString method.

**Solutions**:

```typescript
// ❌ Object stringification
console.log(`Processing: ${someObject}`);

// ✅ Proper stringification for OpenSCAD nodes
function nodeToString(node: OpenSCADNode): string {
  return `${node.type}(${Object.keys(node.parameters || {}).join(', ')})`;
}

console.log(`Processing: ${nodeToString(node)}`);

// ✅ For error objects
function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}

// ✅ For complex objects
function formatCSG2Result(result: CSG2Result): string {
  return JSON.stringify(result, null, 2);
}
```

#### 6. Handling `no-duplicate-imports`

**Problem**: Multiple import statements from the same module.

**Solutions**:

```typescript
// ❌ Duplicate imports
import { Vector3 } from 'three';
import { Mesh, Scene } from 'three';
import type { Material } from 'three';

// ✅ Consolidated imports
import { Vector3, Mesh, Scene } from 'three';
import type { Material } from 'three';

// ✅ Or combine type and value imports
import { Vector3, Mesh, Scene, type Material } from 'three';
```

#### 7. Handling `useOptionalChain`

**Problem**: Using `||` instead of `??` for null/undefined checks.

**Solutions**:

```typescript
// ❌ Logical OR can have unexpected behavior
const value = config.timeout || 5000; // 0 would become 5000

// ✅ Nullish coalescing for null/undefined only
const value = config.timeout ?? 5000; // 0 stays 0, only null/undefined becomes 5000

// ✅ For OpenSCAD parameter defaults
function getParameter(params: Record<string, unknown>, key: string, defaultValue: unknown): unknown {
  return params[key] ?? defaultValue;
}
```

#### 8. Handling `useOptionalChain`

**Problem**: Verbose null/undefined checking.

**Solutions**:

```typescript
// ❌ Verbose checking
if (node && node.children && node.children.length > 0) {
  // process children
}

// ✅ Optional chaining
if (node?.children?.length) {
  // process children
}

// ✅ For method calls
node?.children?.[0]?.process?.();
```

### Project-Specific Type Definitions

#### OpenSCAD AST Types

```typescript
// Base types for OpenSCAD AST
interface BaseOpenSCADNode {
  readonly type: string;
  readonly children?: readonly OpenSCADNode[];
  readonly parameters?: Readonly<Record<string, unknown>>;
  readonly location?: SourceLocation;
}

// Specific node types
interface PrimitiveNode extends BaseOpenSCADNode {
  readonly type: 'cube' | 'sphere' | 'cylinder';
  readonly parameters: Readonly<{
    size?: Vector3Like;
    radius?: number;
    height?: number;
    center?: boolean;
  }>;
}

interface TransformNode extends BaseOpenSCADNode {
  readonly type: 'translate' | 'rotate' | 'scale';
  readonly parameters: Readonly<{
    v?: Vector3Like;
    a?: Vector3Like;
  }>;
  readonly children: readonly [OpenSCADNode];
}
```

#### CSG2 Integration Types

```typescript
// Result types for CSG2 operations
type CSG2Result<T = unknown> =
  | { readonly success: true; readonly data: T; readonly method: string }
  | { readonly success: false; readonly error: string; readonly method: string };

// Conversion context
interface ConversionContext {
  readonly scene: Scene;
  readonly materials: Map<string, Material>;
  readonly meshes: Map<string, Mesh>;
  readonly logger: Logger;
}
```

### Testing Guidelines

#### Test Structure

```typescript
// ✅ Proper test structure
describe('PrimitiveConverter', () => {
  let converter: PrimitiveConverter;
  let mockScene: Scene;

  beforeEach(() => {
    mockScene = new Scene(new NullEngine());
    converter = new PrimitiveConverter();
  });

  afterEach(() => {
    mockScene.dispose();
  });

  describe('convertCube', () => {
    it('should create cube mesh with correct dimensions', () => {
      // Test implementation
    });

    it('should handle missing size parameter', () => {
      // Test implementation
    });
  });
});
```

#### Avoiding Test Lint Issues

```typescript
// ✅ Use underscore prefix for intentionally unused test variables
it('should handle error case', () => {
  const _unusedResult = converter.convert(invalidNode);
  expect(() => converter.validate()).toThrow();
});

// ✅ Proper async test handling
it('should process async operations', async () => {
  await expect(converter.processAsync(node)).resolves.toBeDefined();
});
```

## React Component TypeScript Patterns ⭐ **NEW**

**Date Added:** June 24, 2025
**Context:** GridLayout component implementation with TDD methodology

### Component Props Interface Patterns

#### ✅ Readonly Props with Optional Properties
```typescript
// GridLayout component props pattern
interface GridLayoutProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
}

// ✅ Benefits:
// - Immutable props prevent accidental mutations
// - Optional properties with sensible defaults
// - Accessibility attributes included by design
// - Test-friendly with data-testid support
```

#### ✅ Centralized Type Definitions
```typescript
// types.ts - Centralized layout types
export interface GridLayoutProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
}

// grid-layout.tsx - Import from centralized location
import type { GridLayoutProps } from '../types';

// ✅ Benefits:
// - Single source of truth for types
// - Easier refactoring and maintenance
// - Consistent type definitions across components
// - Better IDE support and autocomplete
```

### Component Implementation Patterns

#### ✅ Functional Component with Default Parameters
```typescript
export const GridLayout: React.FC<GridLayoutProps> = ({
  className = '',
  'data-testid': dataTestId = 'grid-layout-container',
  'aria-label': ariaLabel = '12-Column Grid Layout'
}) => {
  // Component implementation
};

// ✅ Benefits:
// - Default values prevent undefined props
// - Destructuring with renaming for special attributes
// - Clear parameter names for better readability
// - Type safety with React.FC<T> pattern
```

#### ✅ SRP-Compliant Component Structure
```typescript
// Single responsibility: Grid layout only
export const GridLayout: React.FC<GridLayoutProps> = (props) => {
  console.log('[INIT] Rendering GridLayout component');

  return (
    <div
      data-testid={props['data-testid']}
      role="main"
      aria-label={props['aria-label']}
      className={`grid grid-cols-12 gap-0 w-full h-full ${props.className}`}
    >
      {/* Grid sections */}
    </div>
  );
};

// ✅ Benefits:
// - Single responsibility principle
// - Predictable logging patterns
// - Semantic HTML with proper roles
// - Tailwind CSS class composition
```

### Testing TypeScript Patterns

#### ✅ Co-located Test Files with Proper Typing
```typescript
// grid-layout.test.tsx - Co-located with implementation
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GridLayout } from './grid-layout';

describe('[INIT] GridLayout Component - TDD Implementation', () => {
  beforeEach(() => {
    console.log('[DEBUG] Setting up GridLayout test');
  });

  it('should render with 12-column grid container', () => {
    render(<GridLayout />);

    const container = screen.getByTestId('grid-layout-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('grid', 'grid-cols-12');
  });
});

// ✅ Benefits:
// - Co-located tests improve maintainability
// - Consistent logging patterns for debugging
// - Type-safe test implementations
// - Descriptive test names following TDD principles
```

#### ✅ Type-Safe Test Data
```typescript
// Test data with proper typing
const mockProps: GridLayoutProps = {
  className: 'test-class',
  'data-testid': 'test-grid-layout',
  'aria-label': 'Test Grid Layout'
};

it('should accept custom props', () => {
  render(<GridLayout {...mockProps} />);

  const container = screen.getByTestId('test-grid-layout');
  expect(container).toHaveAttribute('aria-label', 'Test Grid Layout');
  expect(container).toHaveClass('test-class');
});

// ✅ Benefits:
// - Type safety prevents test data errors
// - Reusable test data objects
// - Clear prop validation in tests
// - Consistent test patterns
```

### Import/Export Patterns

#### ✅ Clean Export Structure
```typescript
// index.ts - Clean exports
export { GridLayout } from './grid-layout';
export type { GridLayoutProps } from '../types';
export { default } from './grid-layout';

// ✅ Benefits:
// - Clean import paths for consumers
// - Type and implementation exports separated
// - Default export for convenience
// - Consistent export patterns
```

#### ✅ Avoiding Import/Export Issues
```typescript
// ❌ Problematic pattern that caused issues
export interface GridLayoutProps { /* ... */ }
export const GridLayout: React.FC<GridLayoutProps> = () => { /* ... */ };

// ✅ Correct pattern - types in separate file
// types.ts
export interface GridLayoutProps { /* ... */ }

// grid-layout.tsx
import type { GridLayoutProps } from '../types';
export const GridLayout: React.FC<GridLayoutProps> = () => { /* ... */ };

// ✅ Benefits:
// - Avoids circular dependency issues
// - Cleaner separation of concerns
// - Better TypeScript compilation
// - Easier to maintain and refactor
```

### Lessons Learned from GridLayout Implementation

#### ✅ Successful Patterns
1. **TDD Methodology**: Write failing tests first, implement minimal solution
2. **SRP Implementation**: Single responsibility makes components easier to test
3. **Co-located Tests**: Tests next to implementation improve maintainability
4. **Centralized Types**: Types in separate files prevent import issues
5. **Incremental Development**: Build components in phases for stability

#### ⚠️ Patterns to Avoid
1. **Complex Props Interfaces**: Keep props simple and focused
2. **Mixed Responsibilities**: Avoid components that do too many things
3. **Inline Type Definitions**: Use centralized type files instead
4. **Missing Default Values**: Always provide sensible defaults
5. **Poor Test Organization**: Avoid `__tests__` folders, use co-location

#### 🔮 Future Improvements
1. **Enhanced Type Safety**: Use branded types for domain-specific values
2. **Better Error Handling**: Implement Result<T, E> patterns for error-prone operations
3. **Performance Optimization**: Use React.memo and useMemo for expensive operations
4. **Accessibility Enhancement**: Add more comprehensive ARIA support

**These patterns represent battle-tested approaches from successful GridLayout implementation following TDD methodology and SRP principles.**
