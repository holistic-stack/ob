/**
 * Functional Programming Types
 * 
 * Advanced type definitions for functional programming patterns,
 * higher-order functions, and composition utilities.
 */

import type { Result, AsyncResult } from './result.types';

/**
 * Function composition types
 */
export type UnaryFunction<T, U> = (arg: T) => U;
export type BinaryFunction<T, U, V> = (arg1: T, arg2: U) => V;
export type TernaryFunction<T, U, V, W> = (arg1: T, arg2: U, arg3: V) => W;

/**
 * Pipe function types for composition
 */
export interface Pipe {
  <T, U>(fn1: UnaryFunction<T, U>): UnaryFunction<T, U>;
  <T, U, V>(fn1: UnaryFunction<T, U>, fn2: UnaryFunction<U, V>): UnaryFunction<T, V>;
  <T, U, V, W>(
    fn1: UnaryFunction<T, U>,
    fn2: UnaryFunction<U, V>,
    fn3: UnaryFunction<V, W>
  ): UnaryFunction<T, W>;
  <T, U, V, W, X>(
    fn1: UnaryFunction<T, U>,
    fn2: UnaryFunction<U, V>,
    fn3: UnaryFunction<V, W>,
    fn4: UnaryFunction<W, X>
  ): UnaryFunction<T, X>;
  <T, U, V, W, X, Y>(
    fn1: UnaryFunction<T, U>,
    fn2: UnaryFunction<U, V>,
    fn3: UnaryFunction<V, W>,
    fn4: UnaryFunction<W, X>,
    fn5: UnaryFunction<X, Y>
  ): UnaryFunction<T, Y>;
}

/**
 * Predicate types
 */
export type Predicate<T> = (value: T) => boolean;
export type AsyncPredicate<T> = (value: T) => Promise<boolean>;

/**
 * Comparator types
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Mapper types
 */
export type Mapper<T, U> = (value: T) => U;
export type AsyncMapper<T, U> = (value: T) => Promise<U>;

/**
 * Reducer types
 */
export type Reducer<T, U> = (accumulator: U, current: T) => U;
export type AsyncReducer<T, U> = (accumulator: U, current: T) => Promise<U>;

/**
 * Fold types (functional reduce)
 */
export type Fold<T, U> = (initial: U, array: ReadonlyArray<T>, fn: Reducer<T, U>) => U;

/**
 * Lens types for immutable updates
 */
export interface Lens<S, A> {
  readonly get: (source: S) => A;
  readonly set: (value: A) => (source: S) => S;
}

/**
 * Optics types
 */
export type Getter<S, A> = (source: S) => A;
export type Setter<S, A> = (value: A) => (source: S) => S;
export type Updater<S, A> = (fn: (value: A) => A) => (source: S) => S;

/**
 * Maybe/Option monad types
 */
export interface Maybe<T> {
  readonly map: <U>(fn: (value: T) => U) => Maybe<U>;
  readonly flatMap: <U>(fn: (value: T) => Maybe<U>) => Maybe<U>;
  readonly filter: (predicate: Predicate<T>) => Maybe<T>;
  readonly getOrElse: (defaultValue: T) => T;
  readonly isSome: () => boolean;
  readonly isNone: () => boolean;
}

/**
 * Either monad types (similar to Result but more functional)
 */
export interface Either<L, R> {
  readonly map: <U>(fn: (value: R) => U) => Either<L, U>;
  readonly mapLeft: <U>(fn: (value: L) => U) => Either<U, R>;
  readonly flatMap: <U>(fn: (value: R) => Either<L, U>) => Either<L, U>;
  readonly fold: <U>(leftFn: (left: L) => U, rightFn: (right: R) => U) => U;
  readonly isLeft: () => boolean;
  readonly isRight: () => boolean;
}

/**
 * IO monad types for side effects
 */
export interface IO<T> {
  readonly run: () => T;
  readonly map: <U>(fn: (value: T) => U) => IO<U>;
  readonly flatMap: <U>(fn: (value: T) => IO<U>) => IO<U>;
}

/**
 * Task monad types for async operations
 */
export interface Task<T> {
  readonly run: () => Promise<T>;
  readonly map: <U>(fn: (value: T) => U) => Task<U>;
  readonly flatMap: <U>(fn: (value: T) => Task<U>) => Task<U>;
}

/**
 * State monad types
 */
export interface State<S, A> {
  readonly run: (state: S) => readonly [A, S];
  readonly map: <B>(fn: (value: A) => B) => State<S, B>;
  readonly flatMap: <B>(fn: (value: A) => State<S, B>) => State<S, B>;
}

/**
 * Reader monad types for dependency injection
 */
export interface Reader<R, A> {
  readonly run: (context: R) => A;
  readonly map: <B>(fn: (value: A) => B) => Reader<R, B>;
  readonly flatMap: <B>(fn: (value: A) => Reader<R, B>) => Reader<R, B>;
}

/**
 * Validation types with accumulating errors
 */
export interface Validation<E, A> {
  readonly map: <B>(fn: (value: A) => B) => Validation<E, B>;
  readonly mapError: <F>(fn: (error: E) => F) => Validation<F, A>;
  readonly flatMap: <B>(fn: (value: A) => Validation<E, B>) => Validation<E, B>;
  readonly fold: <B>(errorFn: (errors: ReadonlyArray<E>) => B, successFn: (value: A) => B) => B;
  readonly isValid: () => boolean;
  readonly isInvalid: () => boolean;
}

/**
 * Currying types
 */
export type Curry2<T, U, V> = (arg1: T) => (arg2: U) => V;
export type Curry3<T, U, V, W> = (arg1: T) => (arg2: U) => (arg3: V) => W;
export type Curry4<T, U, V, W, X> = (arg1: T) => (arg2: U) => (arg3: V) => (arg4: W) => X;

/**
 * Partial application types
 */
export type Partial1<T, U, V> = (arg1: T) => (arg2: U) => V;
export type Partial2<T, U, V, W> = (arg1: T, arg2: U) => (arg3: V) => W;

/**
 * Function constraint types
 */
export type PureFunction<TArgs extends readonly unknown[], TReturn> = 
  (...args: TArgs) => TReturn;

export type ImpureFunction<TArgs extends readonly unknown[], TReturn> = 
  (...args: TArgs) => TReturn;

/**
 * Immutability helper types
 */
export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<Immutable<U>>
    : T[P] extends object
    ? Immutable<T[P]>
    : T[P];
};

/**
 * Functional array operations types
 */
export interface FunctionalArray<T> {
  readonly map: <U>(fn: Mapper<T, U>) => FunctionalArray<U>;
  readonly filter: (predicate: Predicate<T>) => FunctionalArray<T>;
  readonly reduce: <U>(fn: Reducer<T, U>, initial: U) => U;
  readonly find: (predicate: Predicate<T>) => Maybe<T>;
  readonly some: (predicate: Predicate<T>) => boolean;
  readonly every: (predicate: Predicate<T>) => boolean;
  readonly sort: (comparator: Comparator<T>) => FunctionalArray<T>;
  readonly reverse: () => FunctionalArray<T>;
  readonly take: (count: number) => FunctionalArray<T>;
  readonly drop: (count: number) => FunctionalArray<T>;
  readonly toArray: () => ReadonlyArray<T>;
}

/**
 * Functional object operations types
 */
export interface FunctionalObject<T> {
  readonly map: <U>(fn: (value: T) => U) => FunctionalObject<U>;
  readonly filter: (predicate: (value: T) => boolean) => FunctionalObject<T>;
  readonly keys: () => ReadonlyArray<string>;
  readonly values: () => ReadonlyArray<T>;
  readonly entries: () => ReadonlyArray<readonly [string, T]>;
  readonly toObject: () => Record<string, T>;
}

/**
 * Type-level programming utilities
 */
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
export type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer Rest] ? Rest : never;
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
export type Init<T extends readonly unknown[]> = T extends readonly [...infer Rest, unknown] ? Rest : never;
