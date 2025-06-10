# TypeScript Guidelines and Best Practices

This document provides comprehensive guidelines for TypeScript development, covering version migration best practices, modern features, and developer best practices.

## Table of Contents

1. [Version Migration Guide](#version-migration-guide)
2. [TypeScript 5.x Features](#typescript-5x-features)
3. [ESM and Module Best Practices](#esm-and-module-best-practices)
4. [Strict Mode and Type Safety](#strict-mode-and-type-safety)
5. [Advanced Type Patterns](#advanced-type-patterns)
6. [Performance and Optimization](#performance-and-optimization)
7. [Developer Cheatsheet](#developer-cheatsheet)
8. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

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

**1. Prefer Named Exports**
```typescript
// ✅ Named exports - better for tree shaking
export const createUser = (name: string) => ({ name });
export const deleteUser = (id: string) => { /* ... */ };

// ❌ Avoid default exports for utilities
export default { createUser, deleteUser };
```

**2. Use Type-Only Imports When Appropriate**
```typescript
// ✅ Type-only imports
import type { User, UserConfig } from "./types.js";
import { createUser } from "./user-service.js";

// ✅ Mixed imports
import { type User, createUser } from "./user-service.js";
```

**3. Re-exports with Type Safety**
```typescript
// ✅ Re-export with type information
export type { User, UserConfig } from "./types.js";
export { createUser, deleteUser } from "./user-service.js";

// ✅ Namespace re-export
export type * as UserTypes from "./user-types.js";
```

### Dynamic Imports

**1. Conditional Loading**
```typescript
// ✅ Dynamic imports for code splitting
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

**2. JSON Imports**
```typescript
// ✅ JSON imports with type safety
import config from "./config.json" with { type: "json" };

// ✅ Dynamic JSON import
const config = await import("./config.json", { with: { type: "json" } });
```

### Module Augmentation

**1. Extending Third-Party Types**
```typescript
// ✅ Module augmentation
declare module "express" {
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

**1. Avoid any - Use Proper Types**
```typescript
// ❌ Avoid any
function processData(data: any): any {
  return data.someProperty;
}

// ✅ Use proper types
interface DataInput {
  someProperty: string;
  optionalProp?: number;
}

function processData(data: DataInput): string {
  return data.someProperty;
}

// ✅ Use unknown for truly unknown data
function processUnknownData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return String((data as { someProperty: unknown }).someProperty);
  }
  throw new Error('Invalid data structure');
}
```

**2. Proper Null/Undefined Handling**
```typescript
// ✅ Explicit null checks
function getUserName(user: User | null): string {
  if (user === null) {
    return 'Anonymous';
  }
  return user.name;
}

// ✅ Optional chaining
const userName = user?.profile?.name ?? 'Anonymous';

// ✅ Nullish coalescing
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

**Remove Deprecated Options (Breaking Changes)**
```json
{
  "compilerOptions": {
    // ❌ Remove these deprecated options
    // "target": "ES3",                    // Deprecated in 5.0
    // "out": "./output.js",               // Deprecated in 5.0
    // "noImplicitUseStrict": false,       // Deprecated in 5.0
    // "keyofStringsOnly": false,          // Deprecated in 5.0
    // "suppressExcessPropertyErrors": false, // Deprecated in 5.0
    // "suppressImplicitAnyIndexErrors": false, // Deprecated in 5.0
    // "noStrictGenericChecks": false,     // Deprecated in 5.0
    // "charset": "utf8",                  // Deprecated in 5.0
    // "importsNotUsedAsValues": "remove", // Deprecated in 5.0
    // "preserveValueImports": false,      // Deprecated in 5.0

    // ✅ Use these instead
    "target": "es2020",                   // Minimum supported
    "verbatimModuleSyntax": true          // Replaces import/preserve options
  }
}
```

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
