/**
 * @packageDocumentation
 * @module @minisylar/express-typed-router
 *
 * @title @minisylar/express-typed-router
 *
 * A strongly-typed Express router with Standard Schema validation and automatic type inference for params, body, query, and middleware.
 *
 * @example
 * // Example 1: Basic usage with router-level middleware
 * const router = createTypedRouter()
 *   .useMiddleware(timestampMiddleware)
 *   .useMiddleware(requestIdMiddleware)
 *
 * router.get('/posts/:postId', (req, res) => {
 *   const { postId } = req.params // Typed as { postId: string }
 *   const { timestamp, requestId } = req // Both properties are now typed correctly!
 *   res.json({ postId, timestamp, requestId })
 * })
 *
 * @example
 * // Example 2: Per-route middleware with automatic type inference
 * router.post(
 *   '/posts',
 *   {
 *     bodySchema: CreatePostSchema,
 *     middleware: [timestampMiddleware, requestIdMiddleware] as const
 *   },
 *   (req, res) => {
 *     const { title, content, tags } = req.body // From schema validation
 *     const { timestamp, requestId } = req // From middleware - should be automatically typed!
 *     res.json({ title, content, tags, timestamp, requestId })
 *   }
 * )
 *
 * @example
 * // Example 3: Mixed middleware
 * const router = createTypedRouter().useMiddleware(requestIdMiddleware)
 * router.get(
 *   '/posts/:postId',
 *   {
 *     middleware: [authMiddleware] as const
 *   },
 *   (req, res) => {
 *     const { postId } = req.params
 *     const { requestId } = req // From router-level middleware
 *     const { userId, hasPermission } = req // From per-route middleware
 *     res.json({ postId, requestId, userId, hasPermission })
 *   }
 * )
 *
 * @example
 * // Example 4: Using factory with pre-configured middleware
 * const router = createTypedRouterWithMiddleware(timestampMiddleware, requestIdMiddleware)
 * router.get('/simple/:id', (req, res) => {
 *   const { id } = req.params
 *   const { timestamp, requestId } = req // Already available from factory setup!
 *   res.json({ id, timestamp, requestId })
 * })
 *
 * @example
 * // Example 5: Demonstrating all HTTP methods
 * const router = createTypedRouter().useMiddleware(requestIdMiddleware)
 *
 * // GET with query validation
 * router.get('/posts', { querySchema: QuerySchema }, (req, res) => {
 *   const { limit, offset } = req.query // Typed from schema
 *   const { requestId } = req // From router middleware
 *   res.json({ posts: [], limit, offset, requestId })
 * })
 *
 * // POST with body validation and middleware
 * router.post(
 *   '/posts',
 *   {
 *     bodySchema: CreatePostSchema,
 *     middleware: [timestampMiddleware] as const
 *   },
 *   (req, res) => {
 *     const { title, content } = req.body // From body schema
 *     const { requestId, timestamp } = req // From middleware
 *     res.json({ id: 'new-post', title, content, requestId, timestamp })
 *   }
 * )
 *
 * // PUT for full updates
 * router.put(
 *   '/posts/:postId',
 *   {
 *     bodySchema: CreatePostSchema,
 *     middleware: [authMiddleware] as const
 *   },
 *   (req, res) => {
 *     const { postId } = req.params
 *     const { title, content } = req.body
 *     const { requestId, userId, hasPermission } = req
 *     res.json({ postId, title, content, requestId, userId, hasPermission })
 *   }
 * )
 *
 * // PATCH for partial updates
 * router.patch('/posts/:postId', { bodySchema: UpdatePostSchema }, (req, res) => {
 *   const { postId } = req.params
 *   const updates = req.body // Partial update object
 *   const { requestId } = req
 *   res.json({ postId, updates, requestId })
 * })
 *
 * // DELETE
 * router.delete('/posts/:postId', (req, res) => {
 *   const { postId } = req.params
 *   const { requestId } = req
 *   res.json({ deleted: postId, requestId })
 * })
 *
 * // OPTIONS for CORS preflight
 * router.options('/posts/*', (req, res) => {
 *   res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE')
 *   res.header('Access-Control-Allow-Headers', 'Content-Type')
 *   res.status(200).end()
 * })
 *
 * // HEAD for metadata only
 * router.head('/posts/:postId', (req, res) => {
 *   const { postId } = req.params
 *   res.header('X-Post-ID', postId)
 *   res.status(200).end()
 * })
 *
 * // ALL method for catch-all routes
 * router.all('/debug/*', (req, res) => {
 *   const { requestId } = req
 *   res.json({
 *     method: req.method,
 *     path: req.path,
 *     requestId
 *   })
 * })
 */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

// Use the official Standard Schema types and utils so consumers can pass
// zod/joi/valibot schemas directly (they already implement the spec).
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { SchemaError } from "@standard-schema/utils";

// Any schema compatible with the Standard Schema v1 spec
export type AnyStandardSchema = StandardSchemaV1<any, any>;

// Schema shapes accepted as bodySchema/querySchema, matching what
// safeParseSchema actually validates at runtime (Standard Schema first,
// then Zod-like safeParse/parse, then a generic validate() fallback).
// Constraining to this catches passing a non-schema value (e.g. a raw
// field map instead of a compiled schema) at the call site instead of
// validation silently failing at runtime.
export type SchemaLike =
  | AnyStandardSchema
  | { safeParse: (...args: any[]) => any }
  | { parse: (...args: any[]) => any }
  | { validate: (...args: any[]) => any };

// The router expects consumers to pass runtime objects that implement the
// Standard Schema v1 interface (i.e. expose `schema['~standard'].validate`).
// We do not add runtime shims or adapters here — upstream libraries should
// implement the Standard Schema runtime shape themselves (see vee-validate
// for the minimal `isStandardSchema` check used in the ecosystem).

// We'll remove this alias after all occurrences are replaced with `AnyStandardSchema`.

// Helper type to extract output/input types from a Standard Schema
export type InferOutput<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : unknown;
export type InferInput<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T>
  : unknown;

// Try to infer output from Zod-like `safeParse` / `parse` shapes
// Prefer `safeParse` (Zod) then `parse` (Zod parse). Produce `never` when not present.
type InferFromSafeParse<T> = T extends {
  safeParse: (...args: any[]) => infer R;
}
  ? R extends { success: true; data: infer O }
    ? O
    : R extends Promise<infer PR>
      ? PR extends { success: true; data: infer O }
        ? O
        : never
      : never
  : T extends { parse: (...args: any[]) => infer R }
    ? R
    : never;

// Canonical inference used by the router: prefer Standard Schema inference,
// otherwise fall back to Zod-like (`safeParse`/`parse`). We deliberately
// do NOT attempt structural inference from `validate()` return shapes (Joi)
// because many libraries (notably Joi) do not provide reliable TS inference.
export type InferSchemaOutput<T> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T>
  : InferFromSafeParse<T>;

// Canonical inference used by the router: prefer Standard Schema inference,
// otherwise fall back to `validate`-based structural inference.
// (kept expanded InferSchemaOutput defined later)

// Parse using the Standard Schema `~standard.validate()` API.
// This helper is synchronous and will throw on validation failures.
export function parseSchema<T>(schema: T, data: unknown): InferSchemaOutput<T> {
  const anySchema: any = schema;

  if (
    anySchema &&
    anySchema["~standard"] &&
    typeof anySchema["~standard"].validate === "function"
  ) {
    const result = anySchema["~standard"].validate(data);
    if (result instanceof Promise) {
      throw new TypeError(
        "Async schema validation is not supported by parseSchema",
      );
    }
    if (result.issues) {
      throw new SchemaError(result.issues as any);
    }
    return result.value as InferSchemaOutput<T>;
  }

  throw new TypeError("Unsupported schema shape for parseSchema");
}

// Safe parse returns a union covering common validator shapes (Standard Schema, Zod, Joi/valibot)
export type SafeParseResult<T> =
  | StandardSchemaV1.Result<InferSchemaOutput<T>>
  | { value: InferSchemaOutput<T> }
  | { issues: any[] }
  | Promise<
      | StandardSchemaV1.Result<InferSchemaOutput<T>>
      | { value: InferSchemaOutput<T> }
      | { issues: any[] }
    >;

export function safeParseSchema<T>(
  schema: T,
  data: unknown,
): SafeParseResult<T> {
  // At runtime we only accept Standard Schema-compatible objects that expose
  // `schema['~standard'].validate`. This keeps runtime behavior strict and
  // predictable; type-level inference still attempts to extract types from
  // common schema shapes (safeParse/parse/validate) for developer ergonomics.
  const anySchema: any = schema;
  if (
    anySchema &&
    anySchema["~standard"] &&
    typeof anySchema["~standard"].validate === "function"
  ) {
    return anySchema["~standard"].validate(data) as SafeParseResult<T>;
  }

  // Fallbacks below are kept for broader type compatibility in TS inference,
  // but they are not a substitute for a runtime `~standard` implementation.
  if (anySchema && typeof anySchema.safeParse === "function") {
    return anySchema.safeParse(data) as any;
  }
  if (anySchema && typeof anySchema.parse === "function") {
    try {
      const v = anySchema.parse(data);
      return { value: v } as any;
    } catch (err: any) {
      return { issues: [{ message: err?.message ?? String(err) }] } as any;
    }
  }
  if (anySchema && typeof anySchema.validate === "function") {
    const r = anySchema.validate(data);
    if (r && r.then && typeof r.then === "function") {
      return r.then((res: any) => {
        if (res.error) return { issues: [{ message: res.error.message }] };
        if (res.issues) return { issues: res.issues };
        return { value: res.value ?? res };
      });
    }
    if (r && r.error) return { issues: [{ message: r.error.message }] } as any;
    if (r && r.issues) return { issues: r.issues } as any;
    return { value: r.value ?? r } as any;
  }
  return { issues: [{ message: "Unsupported schema shape" }] } as any;
}

// Error detection helper
export function isSchemaError(error: unknown): error is { issues: any[] } {
  // Standard Schema failure objects expose an `issues` array. Accept that shape.
  return (
    error !== null &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray((error as any).issues)
  );
}

/**
 * Extract route parameters from Express.js route patterns.
 *
 * Supports all Express.js routing patterns:
 * - Named parameters: /users/:userId → { userId: string }
 * - Multiple parameters: /users/:userId/books/:bookId → { userId: string; bookId: string }
 * - Parameters with separators: /flights/:from-:to → { from: string; to: string }
 * - Dot notation: /plantae/:genus.:species → { genus: string; species: string }
 * - Regex constraints: /user/:id(\d+) → { id: string }
 * - Optional parameters: /posts/:year/:month? → { year: string; month?: string }
 * - Wildcard parameters: /files/* → { "0": string }
 * - Multiple wildcards: /a/star/b/star → { "0": string; "1": string }
 *
 * A path containing a named regex capture group — `(?<id>...)` — is treated
 * as a raw regex pattern instead: /^\/legacy\/(?<id>\d+)$/ → { id: string }.
 * This syntax never appears in Express's own path syntax, so detecting it is
 * unambiguous; registerRoute converts the string to a real RegExp at
 * runtime so Express matches it as one.
 */
export type ExtractRouteParams<Path extends string> = string extends Path
  ? Record<string, string>
  : Path extends `${infer _Before}(?<${infer _Name}>${infer _Rest}`
    ? ExtractRegexGroupParams<Path>
    : ExtractParams<Path>;

type ExtractRegexGroupParams<S extends string> =
  S extends `${infer _Before}(?<${infer Name}>${infer _Rest}`
    ? { [K in Name]: string } & ExtractRegexGroupParams<
        RemoveFirstRegexGroup<S>
      >
    : {};

type RemoveFirstRegexGroup<S extends string> =
  S extends `${infer _Before}(?<${infer _Name}>${infer After}`
    ? After extends `${infer _Inner})${infer Rest}`
      ? Rest
      : ""
    : "";

/**
 * Main parameter extraction logic - enhanced for Express 5 support with recursion depth limit
 */
type ExtractParams<Path extends string> =
  // Handle Express 5 braces for optional segments: {/:param} or {/path/:param}
  Path extends `${infer Before}{${infer OptionalContent}}${infer After}`
    ? ExtractOptionalSegment<OptionalContent> &
        ExtractParams<`${Before}${After}`>
    : // Handle named parameters :paramName
      Path extends `${infer _Before}:${infer Rest}`
      ? ExtractSingleParam<Rest> & ExtractParams<RemoveFirstParam<Path>>
      : // Handle wildcards *
        // Named wildcard like *splat (path-to-regexp v8) - capture name up to common delimiters
        Path extends `${infer _Before}*${infer Name}/${infer After}`
        ? Name extends ""
          ? {
              [K in CountWildcards<_Before, "0">]: string;
            } & ExtractParams<`/${After}`>
          : { [K in Name]: string[] } & ExtractParams<`/${After}`>
        : Path extends `${infer _Before}*${infer Name}-${infer After}`
          ? Name extends ""
            ? {
                [K in CountWildcards<_Before, "0">]: string;
              } & ExtractParams<`-${After}`>
            : { [K in Name]: string[] } & ExtractParams<`-${After}`>
          : Path extends `${infer _Before}*${infer Name}.${infer After}`
            ? Name extends ""
              ? {
                  [K in CountWildcards<_Before, "0">]: string;
                } & ExtractParams<`.${After}`>
              : { [K in Name]: string[] } & ExtractParams<`.${After}`>
            : Path extends `${infer _Before}*${infer Name}#${infer After}`
              ? Name extends ""
                ? {
                    [K in CountWildcards<_Before, "0">]: string;
                  } & ExtractParams<`#${After}`>
                : { [K in Name]: string[] } & ExtractParams<`#${After}`>
              : Path extends `${infer _Before}*${infer Name}:${infer After}`
                ? Name extends ""
                  ? {
                      [K in CountWildcards<_Before, "0">]: string;
                    } & ExtractParams<`:${After}`>
                  : { [K in Name]: string[] } & ExtractParams<`:${After}`>
                : Path extends `${infer _Before}*${infer Name}`
                  ? Name extends ""
                    ? {
                        [K in CountWildcards<_Before, "0">]: string;
                      } & ExtractParams<``>
                    : { [K in Name]: string[] } & ExtractParams<``>
                  : // Fallback anonymous wildcard (legacy Express 4 style) - numeric index
                    Path extends `${infer _Before}*${infer After}`
                    ? {
                        [K in CountWildcards<_Before, "0">]: string;
                      } & ExtractParams<After>
                    : // No more parameters
                      {};

/**
 * Extract parameters from Express 5 optional segments in braces
 * Handles patterns like {/:param}, {.:ext}, {/optional/:param}
 */
type ExtractOptionalSegment<Content extends string> =
  // Handle optional wildcard patterns inside braces like {*name} or {/*name}
  Content extends `*${infer Name}`
    ? Name extends ""
      ? {}
      : { [K in Name]?: string[] }
    : Content extends `/${infer Rest}`
      ? Rest extends `*${infer Name}`
        ? Name extends ""
          ? {}
          : { [K in Name]?: string[] }
        : Rest extends `:${infer R}`
          ? ExtractOptionalParam<R>
          : {}
      : // Handle optional parameter patterns like /:param or .:param or path:param
        Content extends `/:${infer Rest}`
        ? ExtractOptionalParam<Rest>
        : Content extends `.:${infer Rest}`
          ? ExtractOptionalParam<Rest>
          : Content extends `${infer _Path}:${infer Rest}`
            ? ExtractOptionalParam<Rest>
            : {};

/**
 * Extract a single optional parameter from brace content
 */
type ExtractOptionalParam<Rest extends string> =
  Rest extends `${infer ParamName}/${infer _After}`
    ? { [K in ParamName]?: string }
    : Rest extends `${infer ParamName}-${infer _After}`
      ? { [K in ParamName]?: string }
      : Rest extends `${infer ParamName}.${infer _After}`
        ? { [K in ParamName]?: string }
        : Rest extends `${infer ParamName}`
          ? { [K in ParamName]?: string }
          : {};

/**
 * Extract a single parameter name from the rest of the path
 * Enhanced to handle Express 5 patterns and optional parameters correctly
 * Special handling for consecutive parameters like :from-:to
 * Order matters: regex constraints must be handled before repeating parameters
 */
type ExtractSingleParam<Rest extends string> =
  // Handle regex constraints FIRST (before +, *, ?) to avoid conflicts
  Rest extends `${infer ParamName}(${infer _Constraint})${infer _After}`
    ? { [K in ParamName]: string } // Handle consecutive parameters with separators first: param-:nextParam
    : Rest extends `${infer ParamName}-:${infer _NextParam}`
      ? { [K in ParamName]: string }
      : Rest extends `${infer ParamName}.:${infer _NextParam}`
        ? { [K in ParamName]: string }
        : // Handle optional parameters followed by delimiters (before regular delimiters)
          Rest extends `${infer ParamName}?/${infer _After}`
          ? { [K in ParamName]?: string }
          : Rest extends `${infer ParamName}?-${infer _After}`
            ? { [K in ParamName]?: string }
            : Rest extends `${infer ParamName}?.${infer _After}`
              ? { [K in ParamName]?: string }
              : Rest extends `${infer ParamName}?#${infer _After}`
                ? { [K in ParamName]?: string }
                : Rest extends `${infer ParamName}?:${infer _After}`
                  ? { [K in ParamName]?: string }
                  : // Then handle regular delimiters (after optional parameter patterns)
                    Rest extends `${infer ParamName}/${infer _After}`
                    ? { [K in ParamName]: string }
                    : Rest extends `${infer ParamName}-${infer _After}`
                      ? { [K in ParamName]: string }
                      : Rest extends `${infer ParamName}.${infer _After}`
                        ? { [K in ParamName]: string }
                        : Rest extends `${infer ParamName}#${infer _After}`
                          ? { [K in ParamName]: string }
                          : Rest extends `${infer ParamName}:${infer _After}`
                            ? { [K in ParamName]: string }
                            : // Handle Express 5 repeating parameters (after regular delimiters)
                              Rest extends `${infer ParamName}+${infer _After}`
                              ? { [K in ParamName]: string[] }
                              : Rest extends `${infer ParamName}*${infer _After}`
                                ? { [K in ParamName]?: string[] }
                                : // Handle optional parameters with ? (Express 4) - only at the end of a segment
                                  Rest extends `${infer ParamName}?${infer _After}`
                                  ? { [K in ParamName]?: string } // Parameter at absolute end of string
                                  : Rest extends string
                                    ? Rest extends ""
                                      ? {}
                                      : Rest extends `${infer ParamName}?`
                                        ? { [K in ParamName]?: string } // ParamName here doesn't include the ?
                                        : Rest extends `${infer ParamName}+`
                                          ? { [K in ParamName]: string[] }
                                          : Rest extends `${infer ParamName}*`
                                            ? { [K in ParamName]?: string[] }
                                            : { [K in Rest]: string }
                                    : {};

/**
 * Remove the first parameter from path to continue parsing
 * Enhanced to handle Express 5 patterns and optional parameters
 * Handles patterns like :from-:to by removing just :from and keeping -:to
 * Order matters: regex constraints must be handled before repeating parameters
 */
type RemoveFirstParam<Path extends string> =
  Path extends `${infer Before}:${infer Rest}`
    ? // Handle regex constraints FIRST (before +, *, ?) to avoid conflicts
      Rest extends `${infer _ParamName}(${infer _Constraint})${infer After}`
      ? `${Before}${After}` // Handle consecutive parameters: :param-:nextParam -> -:nextParam
      : Rest extends `${infer _ParamName}-:${infer After}`
        ? `${Before}-:${After}`
        : Rest extends `${infer _ParamName}.:${infer After}`
          ? `${Before}.:${After}`
          : // Handle optional parameters followed by delimiters (before regular delimiters)
            Rest extends `${infer _ParamName}?/${infer After}`
            ? `${Before}/${After}`
            : Rest extends `${infer _ParamName}?-${infer After}`
              ? `${Before}${After}`
              : Rest extends `${infer _ParamName}?.${infer After}`
                ? `${Before}${After}`
                : Rest extends `${infer _ParamName}?#${infer After}`
                  ? `${Before}${After}`
                  : Rest extends `${infer _ParamName}?:${infer After}`
                    ? `${Before}:${After}`
                    : // Handle regular separators (after optional parameter patterns)
                      Rest extends `${infer _ParamName}/${infer After}`
                      ? `${Before}/${After}`
                      : Rest extends `${infer _ParamName}-${infer After}`
                        ? `${Before}${After}`
                        : Rest extends `${infer _ParamName}.${infer After}`
                          ? `${Before}${After}`
                          : Rest extends `${infer _ParamName}#${infer After}`
                            ? `${Before}${After}`
                            : Rest extends `${infer _ParamName}:${infer After}`
                              ? `${Before}:${After}`
                              : // Handle Express 5 repeating parameters (after regular separators)
                                Rest extends `${infer _ParamName}+${infer After}`
                                ? `${Before}${After}`
                                : Rest extends `${infer _ParamName}*${infer After}`
                                  ? `${Before}${After}`
                                  : // Handle optional parameters with ?
                                    Rest extends `${infer _ParamName}?${infer After}`
                                    ? `${Before}${After}`
                                    : Before
    : Path;

/**
 * Count wildcards to assign proper numeric indices with recursion depth limit
 */
type CountWildcards<
  Path extends string,
  Count extends string = "0",
> = Path extends `${infer _Before}*${infer Rest}`
  ? CountWildcards<Rest, IncrementWildcard<Count>>
  : Count;

/**
 * Helper type to increment wildcard count as string
 */
type IncrementWildcard<T extends string> = T extends "0"
  ? "1"
  : T extends "1"
    ? "2"
    : T extends "2"
      ? "3"
      : T extends "3"
        ? "4"
        : T extends "4"
          ? "5"
          : T extends "5"
            ? "6"
            : T extends "6"
              ? "7"
              : T extends "7"
                ? "8"
                : T extends "8"
                  ? "9"
                  : "10"; // Reasonable limit for wildcards

/**
 * Express middleware that adds custom properties to the request object and/or response locals.
 *
 * @template TReq - The shape of the properties added to the request object.
 * @template TLocals - The shape of the properties added to response.locals.
 * @param req - The Express request object, extended with TReq.
 * @param res - The Express response object with typed locals.
 * @param next - The next middleware function.
 */
export type TypedMiddleware<
  TReq extends Record<string, any> = {},
  TLocals extends Record<string, any> = {},
> = (
  req: Request & TReq,
  res: Response<any, TLocals>,
  next: NextFunction,
) => void | Promise<void>;

/**
 * Simplified TypedMiddleware for request-only extensions (backward compatibility)
 */
export type RequestOnlyMiddleware<TReq extends Record<string, any>> =
  TypedMiddleware<TReq, {}>;

/**
 * Simplified TypedMiddleware for response locals-only extensions
 */
export type LocalsOnlyMiddleware<TLocals extends Record<string, any>> =
  TypedMiddleware<{}, TLocals>;

/**
 * Assigning a middleware array to a variable widens it to
 * TypedMiddleware<any, any>[], losing the per-middleware types that
 * InferSchemaHandler needs. The usual fix is `as const` on the array;
 * defineMiddleware does the same thing without it, since the `const` type
 * parameter keeps each argument's specific type instead of widening.
 *
 * @example
 * const middleware = defineMiddleware(auth, logging);
 * type Handler = InferSchemaHandler<{ middleware: typeof middleware }>;
 */
export function defineMiddleware<
  const M extends readonly TypedMiddleware<any, any>[],
>(...mw: M): [...M] {
  return mw as [...M];
}

// Utility type to infer props from middleware array (no recursion depth limit)
type InferMiddlewareProps<T extends readonly TypedMiddleware<any, any>[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends TypedMiddleware<infer FirstReq, any>
      ? Rest extends readonly TypedMiddleware<any, any>[]
        ? FirstReq & InferMiddlewareProps<Rest>
        : FirstReq
      : {}
    : {};

// Utility type to infer locals from middleware array (no recursion depth limit)
type InferMiddlewareLocals<T extends readonly TypedMiddleware<any, any>[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends TypedMiddleware<any, infer FirstLocals>
      ? Rest extends readonly TypedMiddleware<any, any>[]
        ? FirstLocals & InferMiddlewareLocals<Rest>
        : FirstLocals
      : {}
    : {};

// Enhanced Request type with proper inference. ParamsSchema is last (and
// defaulted) so existing 4-arg call sites don't need updating — only the
// overloads that actually accept a paramsSchema option pass a 5th argument.
export type SchemaRequest<
  Path extends string = string,
  BodySchema extends SchemaLike | undefined = undefined,
  QuerySchema extends SchemaLike | undefined = undefined,
  MiddlewareProps extends Record<string, any> = {},
  ParamsSchema extends SchemaLike | undefined = undefined,
  ParamsOverride extends Record<string, any> | undefined = undefined,
> = Omit<Request, "params" | "query" | "body"> & {
  params: ParamsOverride extends undefined
    ? ParamsSchema extends undefined
      ? ExtractRouteParams<Path>
      : InferSchemaOutput<ParamsSchema>
    : ParamsOverride;
  body: BodySchema extends undefined ? unknown : InferSchemaOutput<BodySchema>;
  query: QuerySchema extends undefined
    ? unknown
    : InferSchemaOutput<QuerySchema>;
} & MiddlewareProps;

// Route handler type
export type SchemaRouteHandler<
  Path extends string = string,
  BodySchema extends SchemaLike | undefined = undefined,
  QuerySchema extends SchemaLike | undefined = undefined,
  MiddlewareProps extends Record<string, any> = {},
  ResponseLocals extends Record<string, any> = {},
  ParamsSchema extends SchemaLike | undefined = undefined,
  ParamsOverride extends Record<string, any> | undefined = undefined,
> = (
  req: SchemaRequest<
    Path,
    BodySchema,
    QuerySchema,
    MiddlewareProps,
    ParamsSchema,
    ParamsOverride
  >,
  res: Response<any, ResponseLocals>,
  next?: NextFunction,
) =>
  | void
  | undefined
  | Promise<void | undefined>
  | Response
  | Promise<Response>
  | Promise<Response | undefined>;

/**
 * Options for defining a typed route, including schemas and middleware.
 *
 * @template BodySchema - Schema for request body validation.
 * @template QuerySchema - Schema for query parameter validation.
 * @template ParamsSchema - Schema for route param validation.
 * @property bodySchema - Optional schema for validating the request body.
 * @property querySchema - Optional schema for validating the query string.
 * @property paramsSchema - Optional schema for validating route params.
 * @property middleware - Optional array of TypedMiddleware for this route.
 */
/** Which validated part of the request failed. */
export type ValidationFailureSource = "body" | "query" | "params";

/** Passed to a validation failure hook when bodySchema/querySchema/paramsSchema rejects a request. */
export interface ValidationFailureInfo {
  source: ValidationFailureSource;
  error: string;
  details: any[];
  method: HttpMethod;
  path: string;
  req: Request;
}

/**
 * Called when validation fails, in addition to the 400 response that's
 * already sent. It's for logging or tracking, not for changing the response.
 * May be async (e.g. to log to an external service); the response is sent
 * without waiting for it either way. Both a synchronous throw and a rejected
 * promise are caught and ignored, so a broken hook can't take down request
 * handling or surface as an unhandled rejection.
 */
export type ValidationFailureHook = (
  info: ValidationFailureInfo,
) => void | Promise<void>;

// A Standard Schema failure normalizes to StandardSchemaV1.Issue regardless
// of which compliant library produced it (zod, valibot, arktype, ...), so
// this is as specific as `details` can get without picking one schema
// library over the others this router also supports (joi, effect, decoders,
// ..., accepted via SchemaLike's duck-typed `parse`/`safeParse`/`validate`
// branches, whose error shape isn't knowable at the type level).
type SchemaValidationDetails<S> = S extends AnyStandardSchema
  ? readonly StandardSchemaV1.Issue[]
  : any[];

/** Passed to a schema-specific validation failure hook. Same as {@link ValidationFailureInfo} minus `source`, since the hook's name already says which schema failed. */
export interface SchemaValidationFailureInfo<S extends SchemaLike | undefined> {
  error: string;
  details: SchemaValidationDetails<S>;
  method: HttpMethod;
  path: string;
  req: Request;
}

export type SchemaValidationFailureHook<S extends SchemaLike | undefined> = (
  info: SchemaValidationFailureInfo<S>,
) => void | Promise<void>;

// Calls a validation-failure hook without awaiting it (the response is never
// blocked on a hook), while still catching whatever it throws: a
// synchronous throw via try/catch, and a rejected promise (if the hook is
// async) via .catch(), since try/catch alone doesn't observe a rejection
// that happens after the synchronous part of the call returns.
function callHookSafely<T>(
  hook: ((info: T) => void | Promise<void>) | undefined,
  info: T,
): void {
  if (!hook) return;
  try {
    hook(info)?.catch?.(() => {});
  } catch {}
}

/**
 * Router-wide validation failure hook. Schema-specific hooks aren't
 * available here: a router spans many routes, each with its own (possibly
 * different) bodySchema/querySchema/paramsSchema, so there's no single
 * schema to type this against.
 */
export interface RouterHooks {
  /** Runs for every route on this router, after any per-route hooks below. */
  onValidationFailure?: ValidationFailureHook;
}

/**
 * Per-route lifecycle hooks, grouped under one `hooks` option so adding a
 * future hook doesn't grow the flat option list. `onBodyValidationFailure`/
 * `onQueryValidationFailure`/`onParamsValidationFailure` are typed to that
 * route's own schema; `onValidationFailure` covers all three sources with
 * `details: any[]`, for narrowing on `source` yourself instead.
 */
export interface RouteHooks<
  BodySchema extends SchemaLike | undefined = undefined,
  QuerySchema extends SchemaLike | undefined = undefined,
  ParamsSchema extends SchemaLike | undefined = undefined,
> {
  /** Runs for a failure from any of the three schemas below. Fires after them, before the router's global hook. */
  onValidationFailure?: ValidationFailureHook;
  /** Runs only when bodySchema rejects the request, before onValidationFailure and the global hook. `details` is typed to bodySchema's own issue shape. */
  onBodyValidationFailure?: SchemaValidationFailureHook<BodySchema>;
  /** Runs only when querySchema rejects the request, before onValidationFailure and the global hook. `details` is typed to querySchema's own issue shape. */
  onQueryValidationFailure?: SchemaValidationFailureHook<QuerySchema>;
  /** Runs only when paramsSchema rejects the request, before onValidationFailure and the global hook. `details` is typed to paramsSchema's own issue shape. */
  onParamsValidationFailure?: SchemaValidationFailureHook<ParamsSchema>;
}

export interface RouteOptions<
  BodySchema extends SchemaLike | undefined = undefined,
  QuerySchema extends SchemaLike | undefined = undefined,
  ParamsSchema extends SchemaLike | undefined = undefined,
> {
  bodySchema?: BodySchema;
  /**
   * Every value here arrives as a string, never a real boolean/number —
   * `z.coerce.boolean()` treats `"false"` as truthy. Use a text-aware parser
   * like `z.stringbool()` for boolean fields.
   * @see https://github.com/Mini-Sylar/express-typed-router#gotchas
   */
  querySchema?: QuerySchema;
  /**
   * Overrides the inferred `req.params` type with this schema's output —
   * useful for coercing a numeric-looking param (`z.coerce.number()`) since
   * Express never converts params from strings on its own. Same
   * string-arrival caveat as `querySchema` applies; see its docs above.
   */
  paramsSchema?: ParamsSchema;
  /** hooks.onValidationFailure runs in addition to the router's global hook (set via createTypedRouterWithConfig or router.onValidationFailure()), if both are set. */
  hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
  middleware?: TypedMiddleware<any, any>[];
  tags?: string[];
  description?: string;
  summary?: string;
  deprecated?: boolean;
  responseSchema?: AnyStandardSchema;
  /** Exclude this route from the generated OpenAPI spec entirely. */
  hidden?: boolean;
  /**
   * Only used when `path` is a `RegExp`. A readable stand-in path (e.g.
   * `/legacy/:id`) for the OpenAPI doc, since one can't be derived from a
   * `RegExp` value. Defaults to `regex.toString()`. Doc-only — `req.params`
   * types as `Record<string, string>` for RegExp routes unless overridden
   * by `paramsSchema`.
   */
  pathExample?: string;
}

/**
 * The route options accepted by {@link InferSchemaHandler}.
 *
 * This is derived from {@link RouteOptions}, so adding a route option keeps
 * this helper's accepted shape in sync automatically. Middleware may be
 * written as a single middleware type for reusable handlers, or as the tuple
 * passed to a route.
 */
export type InferSchemaHandlerOptions = Partial<
  Omit<RouteOptions<any, any, any>, "middleware">
> & {
  middleware?: TypedMiddleware<any, any> | readonly TypedMiddleware<any, any>[];
};

type NormalizeHandlerMiddleware<Middleware> =
  Middleware extends TypedMiddleware<any, any>
    ? readonly [Middleware]
    : Middleware extends readonly TypedMiddleware<any, any>[]
      ? Middleware
      : readonly [];

type InferHandlerOption<
  Options extends InferSchemaHandlerOptions,
  Key extends "bodySchema" | "querySchema" | "paramsSchema" | "middleware",
> = Key extends keyof Options ? Options[Key] : undefined;

/**
 * Infer a reusable route handler from the same options passed to a route.
 *
 * The path is intentionally `string` because the handler can be registered
 * for multiple paths. Use `paramsSchema` when those paths share a validated
 * params shape that should be reflected in the handler type.
 *
 * @example
 * type ListenHandler = InferSchemaHandler<{
 *   bodySchema: typeof ListenSchema;
 *   middleware: typeof auth;
 * }>;
 */
export type InferSchemaHandler<Options extends InferSchemaHandlerOptions = {}> =
  SchemaRouteHandler<
    string,
    InferHandlerOption<Options, "bodySchema">,
    InferHandlerOption<Options, "querySchema">,
    InferMiddlewareProps<
      NormalizeHandlerMiddleware<InferHandlerOption<Options, "middleware">>
    >,
    InferMiddlewareLocals<
      NormalizeHandlerMiddleware<InferHandlerOption<Options, "middleware">>
    >,
    InferHandlerOption<Options, "paramsSchema">,
    Record<string, string | string[] | undefined>
  >;

type RouteHandlerFromOptions<
  Path extends string,
  BodySchema extends SchemaLike | undefined,
  QuerySchema extends SchemaLike | undefined,
  ParamsSchema extends SchemaLike | undefined,
  RouterReq extends Record<string, any>,
  RouterLocals extends Record<string, any>,
  M extends TypedMiddleware<any, any>[],
> = SchemaRouteHandler<
  Path,
  NoInfer<BodySchema>,
  NoInfer<QuerySchema>,
  RouterReq & InferMiddlewareProps<readonly [...M]>,
  RouterLocals & InferMiddlewareLocals<readonly [...M]>,
  NoInfer<ParamsSchema>
>;

// Doc-only fields extracted from RouteOptions — merged into typed middleware
// overloads so users can pass tags/summary/etc. alongside middleware: [...M]
// without TypeScript's excess-property checking dropping the typed overload.
type DocMeta = Pick<
  RouteOptions,
  | "tags"
  | "summary"
  | "description"
  | "deprecated"
  | "responseSchema"
  | "hidden"
  | "pathExample"
>;

// HTTP methods
export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head"
  | "all";

// ─── OpenAPI / Docs ──────────────────────────────────────────────────────────

export interface DocsOptions {
  title?: string;
  version?: string;
  description?: string;
  servers?: Array<{ url: string; description?: string }>;
  /**
   * Override the Scalar CDN URL. Use this to pin a specific version or
   * self-host the Scalar bundle to avoid the external CDN dependency.
   * @default "https://cdn.jsdelivr.net/npm/@scalar/api-reference"
   */
  cdnUrl?: string;
  /**
   * File path to write the OpenAPI spec to whenever it is generated.
   * Enables `openapi-typescript --watch` in development — the tool watches
   * the file and regenerates your client types automatically as routes change.
   *
   * The file is written once at startup, so it contains route **schemas only**
   * — never captured response examples. This keeps real response data (which
   * may include PII) out of any file you might commit or share.
   *
   * @example
   * // docs options
   * { specOutputPath: './openapi.json' }
   *
   * // then in a separate terminal (or via concurrently in package.json):
   * // npx openapi-typescript ./openapi.json -o ./src/client.d.ts --watch
   */
  specOutputPath?: string;
  /**
   * Learn response shapes from live traffic and add them to the docs. The
   * library observes real responses and **infers a JSON Schema** from them
   * (field names, types, nullability, required vs optional) — so the docs and
   * generated client types reflect what your API actually returns.
   *
   * Modes:
   * - `true` (default) — **redacted**: infer the schema only. Real values are
   *   discarded at capture time, so no user data is ever stored or shown. Safe
   *   to expose.
   * - `"live"` — infer the schema **and** attach a real captured response as an
   *   example. ⚠️ Examples contain actual data (emails, tokens, IDs). Only use
   *   for trusted/internal docs.
   * - `false` — don't observe responses at all.
   *
   * Use the per-route `hidden: true` option to exclude individual sensitive
   * routes regardless of mode.
   *
   * @default true
   */
  sampleResponses?: boolean | "live";
}

interface RouteMetadata {
  method: HttpMethod;
  path: string | RegExp;
  /** Doc-only path override for RegExp routes — see RouteOptions.pathExample. */
  pathExample?: string | undefined;
  bodySchema?: AnyStandardSchema | undefined;
  querySchema?: AnyStandardSchema | undefined;
  paramsSchema?: AnyStandardSchema | undefined;
  tags?: string[] | undefined;
  description?: string | undefined;
  summary?: string | undefined;
  deprecated?: boolean | undefined;
  responseSchema?: AnyStandardSchema | undefined;
  hidden?: boolean | undefined;
  // Per status code: a JSON Schema inferred (and merged) from observed
  // responses, plus an optional real example (only in "live" mode).
  responseSamples: Map<
    number,
    { schema: Record<string, any>; example?: unknown }
  >;
}

// Routes all dynamic imports through new Function to keep the source free of
// import() expressions (avoids a rolldown-plugin-dts bug) and to prevent
// bundlers from statically analysing and inlining optional peer deps.
// `m` is ALWAYS one of our own hardcoded module names — never user input —
// so there is no eval-like injection risk here despite what SAST tools may flag.
const _load = new Function("m", "return import(m)") as (
  m: string,
) => Promise<any>;

// Cached after first use — built-in modules never change
let _nodeModule: any;
let _nodeUrl: any;

// Resolves optional peer deps (zod, valibot, etc.) from the user's own
// node_modules tree rather than looking relative to this library file's own
// installed location — pnpm's isolated node_modules mode means peer deps
// aren't necessarily reachable from there. process.cwd() alone isn't
// reliable either: it's wherever the process happened to be launched from
// (a monorepo root, a Docker WORKDIR, a process manager's configured cwd),
// which often differs from the directory holding the app's own
// node_modules. process.argv[1] — the actual entry script Node was told to
// run — reliably points there regardless of launch cwd, so it's tried first;
// cwd remains a fallback for contexts where argv[1] isn't meaningful (e.g.
// a REPL).
async function importDynamic(mod: string): Promise<any> {
  _nodeModule ??= await _load("module");
  _nodeUrl ??= await _load("url");

  const bases: string[] = [];
  const argv1: string | undefined = (globalThis as any).process?.argv?.[1];
  if (argv1) bases.push(_nodeUrl.pathToFileURL(argv1).href);
  const cwd: string = (globalThis as any).process?.cwd?.() ?? "";
  if (cwd) bases.push(_nodeUrl.pathToFileURL(cwd + "/").href);

  for (const base of bases) {
    try {
      const req = _nodeModule.createRequire(base);
      const resolved: string = req.resolve(mod);
      return await _load(_nodeUrl.pathToFileURL(resolved).href);
    } catch {
      // Try the next resolution base.
    }
  }
  return _load(mod);
}

// Schemas are immutable objects — cache conversion results by identity
const _schemaJsonCache = new WeakMap<object, Record<string, any>>();

// A string path containing a named regex capture group — (?<id>...) — isn't
// Express path syntax; Express's own string parser doesn't understand it.
// Convert it to a real RegExp before Express ever sees it. This syntax never
// appears in legitimate Express paths, so detecting it is unambiguous.
const NAMED_REGEX_GROUP = /\(\?<[^>]+>/;

function toExpressPath(path: string | RegExp): string | RegExp {
  return typeof path === "string" && NAMED_REGEX_GROUP.test(path)
    ? new RegExp(path)
    : path;
}

// Resolves any route's path into an Express-style string — :name and
// (?<name>...) tokens alike — so callers can feed it straight into
// expressPathToOpenApi/extractPathParamNames/autoTag/autoSummary without a
// separate RegExp code path. A RegExp with no pathExample is synthesized
// from its source: unnamed capturing groups become positional :0, :1, ...
// matching how Express itself numbers them in req.params, so the doc always
// reflects what a request actually gets — never route.toString()'s raw dump.
function resolveDocPath(route: {
  path: string | RegExp;
  pathExample?: string | undefined;
}): string {
  if (typeof route.path === "string") return route.path;
  if (route.pathExample) return route.pathExample;
  let index = 0;
  return route.path.source
    .replace(/\\\//g, "/")
    .replace(/\((?!\?)[^()]*\)/g, () => `:${index++}`);
}

// Split only on alternation operators that are outside nested groups and
// character classes. This deliberately handles the useful route-shaped regex
// subset without pretending to be a general-purpose regular-expression parser.
function splitRegexAlternatives(source: string): string[] {
  const alternatives: string[] = [];
  let start = 0;
  let depth = 0;
  let inClass = false;
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "[") {
      inClass = true;
      continue;
    }
    if (char === "]") {
      inClass = false;
      continue;
    }
    if (inClass) continue;
    if (char === "(") depth++;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (char === "|" && depth === 0) {
      alternatives.push(source.slice(start, i));
      start = i + 1;
    }
  }

  alternatives.push(source.slice(start));
  return alternatives.length > 1 ? alternatives : [source];
}

function unwrapRegexGroup(source: string): string {
  if (!source.startsWith("(") || !source.endsWith(")")) return source;
  let depth = 0;
  let inClass = false;
  let escaped = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (!inClass && char === "(") depth++;
    else if (!inClass && char === ")") {
      depth--;
      if (depth === 0 && i !== source.length - 1) return source;
    }
  }
  return source.slice(1, -1).replace(/^\?:/, "");
}

function regexAlternativeToDocPath(source: string): string {
  let index = 0;
  return (
    unwrapRegexGroup(source)
      .replace(/^\^|\$$/g, "")
      // A route regex commonly escapes slashes because it is written as a
      // literal. They are ordinary path separators in OpenAPI.
      .replace(/\\\//g, "/")
      // An arbitrary suffix is represented by one readable path parameter.
      .replace(/\.\*|\.\+/g, "/:path")
      // A trailing slash marker does not need a separate OpenAPI path.
      .replace(/\/?\?$/, "")
      // Preserve named captures and give unnamed captures stable positional
      // names, matching Express's req.params convention.
      .replace(/\(\?<([A-Za-z0-9_]+)>[^()]*\)/g, ":$1")
      .replace(/\((?!\?)[^()]*\)/g, () => `:${index++}`)
  );
}

function resolveDocPaths(route: {
  path: string | RegExp;
  pathExample?: string | undefined;
}): string[] {
  if (typeof route.path === "string" || route.pathExample) {
    return [resolveDocPath(route)];
  }

  const alternatives = splitRegexAlternatives(route.path.source);
  if (alternatives.length === 1) return [resolveDocPath(route)];
  return alternatives.map(regexAlternativeToDocPath);
}

function expressPathToOpenApi(path: string): string {
  const withNamedTokens = path
    // Express 5 optional-segment braces: `{/:id}` / `{/seg}` → keep contents.
    .replace(/\{([^{}]*)\}/g, "$1")
    // `:name`, optionally with a regex constraint `(...)` and a `?`/`+`/`*`
    // modifier → OpenAPI `{name}`.
    .replace(/:([A-Za-z0-9_]+)(?:\([^)]*\))?[?+*]?/g, "{$1}")
    // Named regex capture group `(?<name>...)` → OpenAPI `{name}`.
    .replace(/\(\?<([A-Za-z0-9_]+)>[^)]*\)/g, "{$1}")
    // Named wildcard `*name` (Express 5) → OpenAPI `{name}`.
    .replace(/\*([A-Za-z0-9_]+)/g, "{$1}")
    // Regex anchors have no meaning in an OpenAPI path.
    .replace(/^\^|\$$/g, "");
  // A bare `*` left over is an unnamed wildcard (legacy Express 4 syntax);
  // number them positionally to match req.params["0"], ["1"], ...
  let wildcardIndex = 0;
  return withNamedTokens
    .replace(/\*/g, () => `{${wildcardIndex++}}`)
    // Brace removal can leave `//` (e.g. `/x{/:id}` → `/x//...`); collapse it.
    .replace(/\/{2,}/g, "/");
}

function extractPathParamNames(path: string): string[] {
  const stripped = path
    .replace(/\{([^{}]*)\}/g, "$1")
    .replace(/^\^|\$$/g, "");
  const named = [
    ...stripped.matchAll(/:([A-Za-z0-9_]+)/g),
    ...stripped.matchAll(/\(\?<([A-Za-z0-9_]+)>/g),
    ...stripped.matchAll(/\*([A-Za-z0-9_]+)/g),
  ].map((m) => m[1]!);
  // Bare `*` left after removing named wildcards is unnamed (legacy Express
  // 4 syntax); number them positionally, same as expressPathToOpenApi does.
  const unnamedCount = (
    stripped.replace(/\*[A-Za-z0-9_]+/g, "").match(/\*/g) ?? []
  ).length;
  for (let i = 0; i < unnamedCount; i++) named.push(String(i));
  return named;
}

function isParamSegment(s: string): boolean {
  return (
    s.startsWith(":") ||
    s.includes("*") ||
    s.includes("(?<")
  );
}

function autoTag(path: string): string {
  const first = path
    .replace(/^\^|\$$/g, "")
    .replace(/[{}]/g, "")
    .split("/")
    .filter(Boolean)
    .find((s) => !isParamSegment(s));
  return first ?? "default";
}

function autoSummary(method: string, path: string): string {
  const segments = path
    .replace(/^\^|\$$/g, "")
    .replace(/[{}]/g, "")
    .split("/")
    .filter((s) => s && !isParamSegment(s));
  const resource = segments[segments.length - 1] ?? "resource";
  const prefix: Record<string, string> = {
    get: "Get",
    post: "Create",
    put: "Update",
    patch: "Patch",
    delete: "Delete",
    head: "Head",
    options: "Options",
  };
  return `${prefix[method] ?? method} ${resource}`;
}

async function trySchemaToJsonSchema(
  schema: AnyStandardSchema,
): Promise<Record<string, any>> {
  const cached = _schemaJsonCache.get(schema as object);
  if (cached) return cached;
  const result = await _resolveSchemaToJsonSchema(schema);
  _schemaJsonCache.set(schema as object, result);
  return result;
}

async function _resolveSchemaToJsonSchema(
  schema: AnyStandardSchema,
): Promise<Record<string, any>> {
  // ArkType exposes toJsonSchema() directly on the type object
  if (typeof (schema as any).toJsonSchema === "function") {
    try {
      return (schema as any).toJsonSchema() as Record<string, any>;
    } catch {}
  }

  const vendor: unknown = (schema as any)["~standard"]?.vendor;

  if (vendor === "zod") {
    // Zod 4 has a built-in toJSONSchema export
    try {
      const mod = await importDynamic("zod");
      if (typeof mod.toJSONSchema === "function")
        return mod.toJSONSchema(schema) as Record<string, any>;
    } catch {}
    // Zod 3 needs the optional peer dep zod-to-json-schema
    try {
      const mod = await importDynamic("zod-to-json-schema");
      const fn = mod.zodToJsonSchema ?? mod.default?.zodToJsonSchema;
      if (typeof fn === "function") return fn(schema) as Record<string, any>;
    } catch {}
  }

  if (vendor === "valibot") {
    try {
      const mod = await importDynamic("@valibot/to-json-schema");
      const fn = mod.toJsonSchema ?? mod.default?.toJsonSchema;
      if (typeof fn === "function") return fn(schema) as Record<string, any>;
    } catch {}
  }

  if (vendor === "effect") {
    // Effect ships JSONSchema.make() in the effect package itself — no extra install needed
    try {
      const mod = await importDynamic("effect");
      const make = mod.JSONSchema?.make ?? mod.default?.JSONSchema?.make;
      if (typeof make === "function")
        return make(schema) as Record<string, any>;
    } catch {}
  }

  return {};
}

// ─── Response schema inference ───────────────────────────────────────────────
// We learn response shapes from observed bodies without ever keeping the real
// values (in redacted mode). Each observation is turned into a JSON Schema and
// merged with what we've seen before, so optional/nullable fields surface once
// enough traffic has been seen.

// Walk only a prefix of large arrays — enough to detect unions/nullable items
// without paying O(n) merges per response on the hot path.
const ARRAY_SAMPLE_LIMIT = 20;
// Cap recursion so pathological nesting can never blow the stack.
const INFER_MAX_DEPTH = 12;

export function inferJsonSchema(value: unknown): Record<string, any> {
  return inferSchema(value, 0, new WeakSet());
}

function inferSchema(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): Record<string, any> {
  if (value === null || value === undefined) return { type: "null" };
  if (depth >= INFER_MAX_DEPTH) return {};

  // Match what res.json actually sends over the wire: JSON.stringify calls
  // toJSON() (Date, Mongoose docs, Decimal, …), so infer from that form.
  if (value instanceof Date) return { type: "string", format: "date-time" };
  if (typeof value === "bigint") return { type: "integer" };
  if (
    typeof value === "object" &&
    typeof (value as any).toJSON === "function"
  ) {
    return inferSchema((value as any).toJSON(), depth, seen);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array", items: {} };
    if (seen.has(value)) return { type: "array", items: {} };
    seen.add(value);
    const n = Math.min(value.length, ARRAY_SAMPLE_LIMIT);
    let items: Record<string, any> = inferSchema(value[0], depth + 1, seen);
    for (let i = 1; i < n; i++) {
      items = mergeJsonSchema(items, inferSchema(value[i], depth + 1, seen));
    }
    seen.delete(value);
    return { type: "array", items };
  }

  switch (typeof value) {
    case "string":
      return { type: "string" };
    case "boolean":
      return { type: "boolean" };
    case "number":
      return Number.isFinite(value)
        ? { type: Number.isInteger(value) ? "integer" : "number" }
        : { type: "null" }; // NaN/Infinity serialize to null
    case "object": {
      if (seen.has(value as object)) return { type: "object" }; // cycle guard
      seen.add(value as object);
      const properties: Record<string, any> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (typeof v === "function" || typeof v === "undefined") continue; // dropped by JSON
        properties[k] = inferSchema(v, depth + 1, seen);
        required.push(k);
      }
      seen.delete(value as object);
      const out: Record<string, any> = { type: "object", properties };
      if (required.length) out.required = required;
      return out;
    }
    default:
      return {};
  }
}

function typeSet(schema: Record<string, any> | undefined): Set<string> {
  if (!schema || schema.type === undefined) return new Set();
  return new Set(Array.isArray(schema.type) ? schema.type : [schema.type]);
}

function collapseTypes(types: Set<string>): string | string[] | undefined {
  // integer is a subset of number — prefer number when both appear.
  if (types.has("integer") && types.has("number")) types.delete("integer");
  const arr = [...types];
  if (arr.length === 0) return undefined;
  return arr.length === 1 ? arr[0]! : arr;
}

function mergeJsonSchema(
  a: Record<string, any> | undefined,
  b: Record<string, any> | undefined,
): Record<string, any> {
  if (!a || Object.keys(a).length === 0) return b ?? {};
  if (!b || Object.keys(b).length === 0) return a ?? {};

  const types = new Set([...typeSet(a), ...typeSet(b)]);
  const merged: Record<string, any> = {};
  const t = collapseTypes(types);
  if (t !== undefined) merged.type = t;

  if (types.has("object") && (a.properties || b.properties)) {
    const aProps: Record<string, any> = a.properties ?? {};
    const bProps: Record<string, any> = b.properties ?? {};
    const props: Record<string, any> = {};
    for (const key of new Set([
      ...Object.keys(aProps),
      ...Object.keys(bProps),
    ])) {
      props[key] = mergeJsonSchema(aProps[key], bProps[key]);
    }
    merged.properties = props;
    // A field is required only if it was required in every observation.
    const aReq: string[] = a.required ?? [];
    const bReq: string[] = b.required ?? [];
    const required = aReq.filter((k) => bReq.includes(k));
    if (required.length) merged.required = required;
  }

  if (types.has("array")) {
    const items = mergeJsonSchema(a.items, b.items);
    if (items && Object.keys(items).length) merged.items = items;
  }

  return merged;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DEFAULT_SCALAR_CDN = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";

function scalarHtml(title: string, specUrl: string, cdnUrl: string): string {
  return `<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="${escapeHtml(specUrl)}"></script>
    <script src="${escapeHtml(cdnUrl)}"></script>
  </body>
</html>`;
}

async function buildOpenApiSpec(
  routes: RouteMetadata[],
  options: DocsOptions,
): Promise<Record<string, any>> {
  const paths: Record<string, any> = Object.create(null);

  for (const route of routes) {
    if (route.method === "all" || route.hidden) continue;

    for (const docPath of resolveDocPaths(route)) {
      const openApiPath = expressPathToOpenApi(docPath);
      if (!paths[openApiPath]) paths[openApiPath] = {};

      let parameters: any[];
      if (route.paramsSchema) {
        const ps = await trySchemaToJsonSchema(route.paramsSchema);
        const props: Record<string, any> = ps.properties ?? {};
        const required: string[] = ps.required ?? [];
        parameters = Object.entries(props).map(([name, propSchema]) => ({
          name,
          in: "path",
          required: required.includes(name),
          schema: propSchema,
        }));
      } else {
        parameters = extractPathParamNames(docPath).map((name) => ({
          name,
          in: "path",
          required: true,
          schema: { type: "string" },
        }));
      }

      if (route.querySchema) {
        const qs = await trySchemaToJsonSchema(route.querySchema);
        const props: Record<string, any> = qs.properties ?? {};
        const required: string[] = qs.required ?? [];
        for (const [name, propSchema] of Object.entries(props)) {
          parameters.push({
            name,
            in: "query",
            required: required.includes(name),
            schema: propSchema,
          });
        }
      }

      const operation: Record<string, any> = {
        summary: route.summary ?? autoSummary(route.method, docPath),
        tags: route.tags ?? [autoTag(docPath)],
        parameters,
      };

      if (route.description) operation.description = route.description;
      if (route.deprecated) operation.deprecated = true;

      if (route.bodySchema) {
        const bs = await trySchemaToJsonSchema(route.bodySchema);
        operation.requestBody = {
          required: true,
          content: { "application/json": { schema: bs } },
        };
      }

      const responses: Record<string, any> = {};
      // Inferred-from-traffic schemas (best-effort, may be stale).
      for (const [status, sample] of route.responseSamples) {
        const json: Record<string, any> = { schema: sample.schema };
        if (sample.example !== undefined) json.example = sample.example;
        responses[String(status)] = {
          description: status < 400 ? "Success" : "Error",
          content: { "application/json": json },
        };
      }
      // A declared responseSchema is the source of truth — it wins over inference
      // for the success response (no staleness, reflects current code exactly).
      if (route.responseSchema) {
        const declared = await trySchemaToJsonSchema(route.responseSchema);
        if (declared && Object.keys(declared).length) {
          let successStatus = "200";
          for (const code of route.responseSamples.keys()) {
            if (code >= 200 && code < 300) {
              successStatus = String(code);
              break;
            }
          }
          responses[successStatus] = {
            description: "Success",
            content: { "application/json": { schema: declared } },
          };
        }
      }
      if (Object.keys(responses).length === 0) {
        responses["200"] = { description: "Success" };
      }
      operation.responses = responses;

      paths[openApiPath][route.method] = operation;
    }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: options.title ?? "API",
      version: options.version ?? "1.0.0",
      ...(options.description ? { description: options.description } : {}),
    },
    ...(options.servers ? { servers: options.servers } : {}),
    paths,
  };
}

// Maps each Express router instance back to the TypedRouter that owns it.
// Used by .use() to auto-detect sub-routers passed via .getRouter() and
// track them for docs without requiring any new API.
const _typedRouterRegistry = new WeakMap<object, TypedRouter<any, any>>();

/**
 * Extra properties that middleware has added to the Express `req` object.
 *
 * Starts as `{}` (nothing added yet) and widens automatically with every
 * `.useMiddleware()` call. After `router.useMiddleware(authMiddleware)` where
 * `authMiddleware` contributes `{ userId: string }`, this becomes `{ userId: string }`.
 *
 * You will see this type in router hover text — it is the accumulating "req additions" slot.
 */
export type AdditionalReqProps = {};

/**
 * Extra properties that middleware has added to `res.locals`.
 *
 * Starts as `{}` and widens automatically with every `.useMiddleware()` call,
 * mirroring the `TLocals` parameter of each `TypedMiddleware` you attach.
 */
export type AdditionalLocals = {};

/**
 * A strongly-typed Express router. The two generic params accumulate as
 * middleware is added via `.useMiddleware()`.
 *
 * @typeParam Req    - Extra properties on `req` contributed by middleware. Starts as {@link AdditionalReqProps}.
 * @typeParam Locals - Extra properties on `res.locals` contributed by middleware. Starts as {@link AdditionalLocals}.
 */
export class TypedRouter<
  Req extends Record<string, any> = AdditionalReqProps,
  Locals extends Record<string, any> = AdditionalLocals,
> {
  private router: express.Router;
  private routes: RouteMetadata[] = [];
  private mountedRouters: Array<{
    prefix: string;
    router: TypedRouter<any, any>;
  }> = [];
  // Response observation is off until .docs()/createDocs() turns it on, so apps
  // that never generate docs pay zero interceptor cost. "redacted" infers a
  // JSON Schema and keeps no real values; "live" also keeps one real example.
  // Read at request time, so routes registered before .docs() are covered too.
  private sampleMode: "off" | "redacted" | "live" = "off";
  // When specOutputPath is set, this debounced writer rewrites the spec file as
  // newly observed response schemas come in, so file-watch type-gen stays fresh.
  private scheduleSpecWrite?: (() => void) | undefined;
  // Set via createTypedRouterWithConfig; applies to every route registered
  // directly on this router. Does not propagate to separately-created
  // sub-routers mounted with .mount()/.use(). Pass the same hook to each
  // router's config if you want it shared across all of them.
  private globalValidationFailureHook?: ValidationFailureHook | undefined;

  constructor() {
    this.router = express.Router();
    _typedRouterRegistry.set(this.router, this);
  }
  /**
   * Set the global validation failure hook. Called for every route
   * registered directly on this router when bodySchema/querySchema/
   * paramsSchema rejects a request. Works the same whether the router came
   * from createTypedRouter() or createTypedRouterWithConfig({ onValidationFailure }),
   * so you're not locked into the config-taking factory just to add this later.
   *
   * @example
   * const router = createTypedRouter().onValidationFailure((info) => {
   *   logger.warn(info, 'request validation failed');
   * });
   */
  onValidationFailure(hook: ValidationFailureHook): TypedRouter<Req, Locals> {
    this.globalValidationFailureHook = hook;
    return this;
  }
  /**
   * Add typed middleware that extends the request with additional properties
   * and/or adds properties to response.locals
   */ /**
   * Add typed middleware to the router.
   * This middleware will apply to all routes defined after this call.
   *
   * @template TReq - Type extensions for the request object
   * @template TLocals - Type extensions for response.locals
   * @param middleware - The typed middleware function
   * @returns A new router instance with updated types
   */
  useMiddleware<
    TReq extends Record<string, any> = {},
    TLocals extends Record<string, any> = {},
  >(
    middleware: TypedMiddleware<TReq, TLocals>,
  ): TypedRouter<Req & TReq, Locals & TLocals> {
    this.router.use(middleware as any);
    return this as any;
  }
  /**
   * Get the underlying Express router, typed as a RequestHandler so it can be
   * passed directly to app.use() without a cast in Express 5.
   */
  getRouter(): express.Router & express.RequestHandler {
    return this.router as express.Router & express.RequestHandler;
  }

  /**
   * Mount middleware or a sub-router at an optional path prefix.
   *
   * When passed the result of another TypedRouter's .getRouter(), it is
   * automatically recognised and tracked for .docs() — no extra wiring needed.
   *
   * @example
   * // v1.routes.ts — pass TypedRouter instances directly, no .getRouter() needed
   * export const v1Routes = createTypedRouter()
   *
   * v1Routes.use('/products', productRoutes)   // tracked ✓
   * v1Routes.use('/profile',  profileRoutes)   // tracked ✓
   * v1Routes.use('/',         callbackRouter)  // plain Express, also works
   *
   * app.use('/v1', v1Routes.getRouter())
   * app.use('/docs', v1Routes.docs({ title: 'My API' }))    // just works
   */
  use(
    path: string,
    ...handlers: Array<
      express.RequestHandler | express.Router | TypedRouter<any, any>
    >
  ): TypedRouter<Req, Locals>;
  use(
    ...handlers: Array<
      express.RequestHandler | express.Router | TypedRouter<any, any>
    >
  ): TypedRouter<Req, Locals>;
  use(
    pathOrHandler:
      | string
      | express.RequestHandler
      | express.Router
      | TypedRouter<any, any>,
    ...rest: Array<
      express.RequestHandler | express.Router | TypedRouter<any, any>
    >
  ): TypedRouter<Req, Locals> {
    const isPath = typeof pathOrHandler === "string";
    const prefix = isPath ? (pathOrHandler as string) : "";
    const rawHandlers = isPath
      ? rest
      : [
          pathOrHandler as
            | express.RequestHandler
            | express.Router
            | TypedRouter<any, any>,
          ...rest,
        ];

    // Resolve TypedRouter instances to their underlying Express routers,
    // tracking them for .docs() along the way.
    const resolved = rawHandlers.map((h) => {
      if (h instanceof TypedRouter) {
        this.trackMounted(prefix, h);
        return h.getRouter();
      }
      const tracked = _typedRouterRegistry.get(h as object);
      if (tracked) {
        this.trackMounted(prefix, tracked);
      }
      return h as express.RequestHandler | express.Router;
    });

    if (isPath) {
      (this.router as any).use(pathOrHandler, ...resolved);
    } else {
      (this.router as any).use(...resolved);
    }

    return this;
  }

  /**
   * Mount a TypedRouter at a path prefix, registering it both on the Express
   * router and in the docs registry so .docs() picks it up automatically.
   *
   * @example
   * const v1 = createTypedRouter()
   *   .mount('/products', productRoutes)
   *   .mount('/profile',  profileRoutes)
   *   .mount('/supplier', supplierRoutes)
   *
   * app.use('/v1', v1.getRouter())
   * app.use('/docs', v1.docs({ title: 'My API' }))
   */
  mount(
    prefix: string,
    router: TypedRouter<any, any>,
  ): TypedRouter<Req, Locals>;
  mount(router: TypedRouter<any, any>): TypedRouter<Req, Locals>;
  mount(
    prefixOrRouter: string | TypedRouter<any, any>,
    maybeRouter?: TypedRouter<any, any>,
  ): TypedRouter<Req, Locals> {
    if (typeof prefixOrRouter === "string") {
      const sub = maybeRouter!;
      this.router.use(prefixOrRouter, sub.getRouter());
      this.trackMounted(prefixOrRouter, sub);
    } else {
      this.router.use(prefixOrRouter.getRouter());
      this.trackMounted("", prefixOrRouter);
    }
    return this;
  }

  /**
   * Returns the collected route metadata for this router, including all
   * sub-routers registered via .mount() with their prefixes applied.
   * Used internally by .docs() and by createDocs() for multi-router merging.
   */
  getRouteMetadata(): RouteMetadata[] {
    const mounted = this.mountedRouters.flatMap(({ prefix, router }) =>
      router.getRouteMetadata().map((meta) => ({
        ...meta,
        // Can't string-concat a prefix onto a RegExp; prefix pathExample instead.
        ...(typeof meta.path === "string"
          ? { path: prefix + meta.path }
          : { path: meta.path, pathExample: prefix + resolveDocPath(meta) }),
      })),
    );
    return [...this.routes, ...mounted];
  }

  /**
   * Turn on response observation for this router and every router mounted under
   * it. Called by .docs() and createDocs() so it happens only when docs are
   * actually generated. The visited set guards against mount cycles.
   * @internal Public only so createDocs() can reach it; not part of the API.
   */
  enableSampling(
    mode: "redacted" | "live" = "redacted",
    writer?: () => void,
    visited = new Set<TypedRouter<any, any>>(),
  ): void {
    if (visited.has(this)) return;
    visited.add(this);
    this.sampleMode = mode;
    this.scheduleSpecWrite = writer;
    for (const { router } of this.mountedRouters) {
      router.enableSampling(mode, writer, visited);
    }
  }

  /**
   * Record a sub-router for docs, de-duplicating identical (prefix, router)
   * pairs and propagating the sample mode if docs were already requested.
   */
  private trackMounted(prefix: string, router: TypedRouter<any, any>): void {
    if (
      this.mountedRouters.some(
        (m) => m.router === router && m.prefix === prefix,
      )
    ) {
      return;
    }
    this.mountedRouters.push({ prefix, router });
    if (this.sampleMode !== "off") {
      router.enableSampling(this.sampleMode, this.scheduleSpecWrite);
    }
  }

  /**
   * Seed in-memory response schemas from a previously written spec, so a server
   * restart doesn't reset the docs/spec file to empty. Only fills statuses we
   * haven't already observed this process, and never overwrites fresher data.
   * @internal
   */
  hydrateResponses(
    spec: any,
    prefix = "",
    visited = new Set<TypedRouter<any, any>>(),
  ): void {
    if (visited.has(this)) return;
    visited.add(this);
    const paths = spec?.paths ?? {};
    for (const route of this.routes) {
      for (const docPath of resolveDocPaths(route)) {
        const key = expressPathToOpenApi(prefix + docPath);
        const op = paths[key]?.[route.method];
        const responses = op?.responses;
        if (!responses) continue;
        for (const status of Object.keys(responses)) {
          const code = Number(status);
          if (Number.isNaN(code) || route.responseSamples.has(code)) continue;
          const json = responses[status]?.content?.["application/json"];
          if (!json?.schema) continue;
          route.responseSamples.set(
            code,
            json.example !== undefined
              ? { schema: json.schema, example: json.example }
              : { schema: json.schema },
          );
        }
      }
    }
    for (const { prefix: p, router } of this.mountedRouters) {
      router.hydrateResponses(spec, prefix + p, visited);
    }
  }

  /**
   * Returns an Express router that serves OpenAPI docs.
   * Mount it anywhere on your app — routes are auto-discovered.
   *
   * @example
   * app.use('/docs', router.docs({ title: 'My API', version: '1.0.0' }))
   * // GET /docs           → Scalar UI
   * // GET /docs/openapi.json → raw OpenAPI 3.1 spec
   */
  docs(options: DocsOptions = {}): express.Router & express.RequestHandler {
    const docsRouter = express.Router();

    // When specOutputPath is set, write the spec at startup and then re-write it
    // (debounced) whenever a newly observed response schema changes the spec —
    // so file-watch client type-gen picks up response shapes as traffic flows.
    let scheduleWrite: (() => void) | undefined;
    if (options.specOutputPath) {
      const outPath = options.specOutputPath;
      // Serialize writes so two overlapping calls can't interleave, and write
      // atomically (temp file + rename) so a file-watcher never reads a
      // half-written spec.
      let writing = false;
      let dirty = false;
      const writeSpec = async (): Promise<void> => {
        if (writing) {
          dirty = true;
          return;
        }
        writing = true;
        try {
          const spec = await buildOpenApiSpec(this.getRouteMetadata(), options);
          const fs = await _load("fs/promises");
          // Ensure the target directory exists so e.g. "./generated/openapi.json"
          // doesn't silently fail when the folder isn't there. Cross-platform.
          const dir = outPath.replace(/[/\\][^/\\]*$/, "");
          if (dir && dir !== outPath) {
            await fs.mkdir(dir, { recursive: true }).catch(() => {});
          }
          const pid = (globalThis as any).process?.pid ?? "0";
          const tmp = `${outPath}.${pid}.tmp`;
          await fs.writeFile(tmp, JSON.stringify(spec, null, 2), "utf8");
          await fs.rename(tmp, outPath);
        } catch {
        } finally {
          writing = false;
          if (dirty) {
            dirty = false;
            void writeSpec(); // flush the change that arrived mid-write
          }
        }
      };
      let timer: ReturnType<typeof setTimeout> | undefined;
      scheduleWrite = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(writeSpec, 300);
        timer.unref?.(); // don't keep short-lived processes alive
      };
      // On startup, reload schemas the previous run already learned, then write.
      // This stops a restart from clobbering the file with an empty spec before
      // traffic has re-populated it.
      setImmediate(async () => {
        try {
          const fs = await _load("fs/promises");
          const existing = await fs.readFile(outPath, "utf8").catch(() => null);
          if (existing) {
            try {
              this.hydrateResponses(JSON.parse(existing));
            } catch {}
          }
        } catch {}
        await writeSpec();
      });
    }

    // Observe responses to infer schemas, unless opted out. "live" also keeps a
    // real example; the default redacted mode keeps no real values.
    if (options.sampleResponses !== false) {
      this.enableSampling(
        options.sampleResponses === "live" ? "live" : "redacted",
        scheduleWrite,
      );
    }

    docsRouter.get("/openapi.json", async (_req, res) => {
      try {
        // Serve from memory only. The spec file (when specOutputPath is set) is
        // written once on startup above — no need to touch disk per request.
        const spec = await buildOpenApiSpec(this.getRouteMetadata(), options);
        res.json(spec);
      } catch (err) {
        res
          .status(500)
          .json({ error: "Failed to generate spec", details: String(err) });
      }
    });

    docsRouter.get("/", (req, res) => {
      const specUrl = `${req.baseUrl}/openapi.json`;
      const cdnUrl = options.cdnUrl ?? DEFAULT_SCALAR_CDN;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(scalarHtml(options.title ?? "API", specUrl, cdnUrl));
    });

    return docsRouter as express.Router & express.RequestHandler;
  }

  // Method overloads for GET requests with automatic middleware type inference
  get<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;

  // Body/query schema and middleware live as flat sibling properties (not
  // intersected with a separately-generic options type) so TS can infer
  // BodySchema, QuerySchema, and M from the same object literal in one pass.
  get<
    Path extends string,
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  // RegExp path — Express doesn't expose named params for a raw RegExp, so
  // params always type as Record<string, string>.
  get(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  get<
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  // Implementation
  get(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("get", path, optionsOrHandler, handler);
  } // Combined overload for body/query schema + middleware (most specific first)
  post<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  post<
    Path extends string,
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  post(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  post<
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  post(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("post", path, optionsOrHandler, handler);
  }

  // PUT method: same overload shape as POST
  put<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  put<
    Path extends string,
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  put(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  put<
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  put(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("put", path, optionsOrHandler, handler);
  }

  // PATCH method: same overload shape as POST
  patch<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  patch<
    Path extends string,
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  patch(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  patch<
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  patch(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("patch", path, optionsOrHandler, handler);
  }

  // DELETE method: no bodySchema (typically no body)
  delete<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  delete<
    Path extends string,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<undefined, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      undefined,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  delete(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  delete<
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<undefined, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      undefined,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  delete(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("delete", path, optionsOrHandler, handler);
  }

  // OPTIONS method: no bodySchema (typically used for CORS preflight)
  options<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  options<
    Path extends string,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<undefined, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      undefined,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  options(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  options<
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<undefined, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      undefined,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  options(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("options", path, optionsOrHandler, handler);
  }

  // HEAD method: no bodySchema (like GET but only returns headers)
  head<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  head<
    Path extends string,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<undefined, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      undefined,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  head(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  head<
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<undefined, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      undefined,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  head(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("head", path, optionsOrHandler, handler);
  }

  // ALL method: same overload shape as POST (matches every HTTP method)
  all<Path extends string>(
    path: Path,
    handler: SchemaRouteHandler<Path, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  all<
    Path extends string,
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: Path,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      Path,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  all(
    path: RegExp,
    handler: SchemaRouteHandler<string, undefined, undefined, Req, Locals>,
  ): TypedRouter<Req, Locals>;
  all<
    BodySchema extends SchemaLike | undefined = undefined,
    QuerySchema extends SchemaLike | undefined = undefined,
    ParamsSchema extends SchemaLike | undefined = undefined,
    M extends TypedMiddleware<any, any>[] = [],
  >(
    path: RegExp,
    options: DocMeta & {
      bodySchema?: BodySchema;
      querySchema?: QuerySchema;
      paramsSchema?: ParamsSchema;
      hooks?: RouteHooks<BodySchema, QuerySchema, ParamsSchema>;
      middleware?: [...M];
    },
    handler: RouteHandlerFromOptions<
      string,
      BodySchema,
      QuerySchema,
      ParamsSchema,
      Req,
      Locals,
      M
    >,
  ): TypedRouter<Req, Locals>;
  all(
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    return this.registerRoute("all", path, optionsOrHandler, handler);
  }
  // Helper method to register routes
  private registerRoute(
    method: HttpMethod,
    path: string | RegExp,
    optionsOrHandler: any,
    handler?: any,
  ): TypedRouter<Req, Locals> {
    const middlewares: any[] = [];
    const meta: RouteMetadata = { method, path, responseSamples: new Map() };
    this.routes.push(meta);

    if (typeof optionsOrHandler === "object") {
      const options = optionsOrHandler as RouteOptions<any, any, any>;

      meta.bodySchema = options.bodySchema as AnyStandardSchema | undefined;
      meta.querySchema = options.querySchema as AnyStandardSchema | undefined;
      meta.paramsSchema = options.paramsSchema as AnyStandardSchema | undefined;
      meta.tags = options.tags;
      meta.description = options.description;
      meta.summary = options.summary;
      meta.deprecated = options.deprecated;
      meta.responseSchema = options.responseSchema;
      meta.hidden = options.hidden;
      meta.pathExample = options.pathExample;

      if (options.middleware) {
        middlewares.push(...options.middleware);
      }
      const onValidationFailure = options.hooks?.onValidationFailure as
        | ValidationFailureHook
        | undefined;
      const onBodyValidationFailure = options.hooks?.onBodyValidationFailure as
        | SchemaValidationFailureHook<any>
        | undefined;
      const onQueryValidationFailure = options.hooks
        ?.onQueryValidationFailure as SchemaValidationFailureHook<any> | undefined;
      const onParamsValidationFailure = options.hooks
        ?.onParamsValidationFailure as
        | SchemaValidationFailureHook<any>
        | undefined;
      if (options.bodySchema) {
        middlewares.push(
          this.createBodyValidationMiddleware(
            options.bodySchema,
            method,
            path,
            options.pathExample,
            onValidationFailure,
            onBodyValidationFailure,
          ),
        );
      }
      if (options.querySchema) {
        middlewares.push(
          this.createQueryValidationMiddleware(
            options.querySchema,
            method,
            path,
            options.pathExample,
            onValidationFailure,
            onQueryValidationFailure,
          ),
        );
      }
      if (options.paramsSchema) {
        middlewares.push(
          this.createParamsValidationMiddleware(
            options.paramsSchema,
            method,
            path,
            options.pathExample,
            onValidationFailure,
            onParamsValidationFailure,
          ),
        );
      }
      middlewares.push(handler);
    } else {
      middlewares.push(optionsOrHandler);
    }

    // Intercept res.json AND res.send to capture the first response sample per
    // status code. We can't rely on res.send() delegating to res.json() — that
    // is standard Express behaviour, but middleware (Shopify, APMs, loggers)
    // routinely monkeypatch res.send so it no longer funnels through res.json.
    // Wrapping both means we capture however the body is emitted; the
    // `!has(statusCode)` guard makes the first writer win, so when send DOES
    // delegate to json we still only store one sample.
    //
    // After a short warmup we stop wrapping entirely so the steady-state hot
    // path is a single comparison + early return — no per-request allocation.
    // The cap is on total observations (not distinct statuses) because most
    // routes only ever emit 1-3 status codes, which would otherwise leave the
    // size-based bailout permanently unreached and re-wrap forever.
    let observed = 0;
    const capture = (res: Response, body: unknown) => {
      const status = res.statusCode;
      const schema = inferJsonSchema(body);
      const existing = meta.responseSamples.get(status);
      // Merge each observation so optional/nullable fields surface over time.
      const merged = existing
        ? mergeJsonSchema(existing.schema, schema)
        : schema;
      // Keep one real example only in "live" mode; redacted keeps no values.
      const example =
        this.sampleMode === "live" ? (existing?.example ?? body) : undefined;
      // Only rewrite the spec file when the inferred shape actually changed —
      // so the debounced writer goes quiet once schemas stabilize.
      const changed =
        !existing || JSON.stringify(existing.schema) !== JSON.stringify(merged);
      meta.responseSamples.set(status, { schema: merged, example });
      if (changed) this.scheduleSpecWrite?.();
    };
    const interceptor = (_req: Request, res: Response, next: NextFunction) => {
      if (
        this.sampleMode === "off" ||
        meta.hidden ||
        observed >= 50 ||
        meta.responseSamples.size >= 10
      ) {
        next();
        return;
      }
      observed++;

      const originalJson = res.json;
      res.json = function (body: any) {
        capture(res, body);
        return originalJson.call(this, body);
      };

      const originalSend = res.send;
      res.send = function (body: any) {
        // Only sample JSON-like object bodies; skip strings, Buffers, null.
        // (When send delegates to our wrapped json, json already captured it.)
        if (
          body !== null &&
          typeof body === "object" &&
          !Buffer.isBuffer(body)
        ) {
          capture(res, body);
        }
        return originalSend.call(this, body);
      };

      next();
    };

    (this.router as any)[method](
      toExpressPath(path),
      interceptor,
      ...middlewares,
    );

    return this;
  }
  // Fires the per-route hook (if given) and the router's global hook (if
  // set), in that order. Errors thrown by a hook are swallowed, since a broken
  // logging hook must never take down the 400 response it's observing.
  private notifyValidationFailure(
    source: ValidationFailureSource,
    error: string,
    details: any[],
    method: HttpMethod,
    path: string | RegExp,
    pathExample: string | undefined,
    req: Request,
    routeHook: ValidationFailureHook | undefined,
    schemaHook: SchemaValidationFailureHook<any> | undefined,
  ): void {
    if (!routeHook && !schemaHook && !this.globalValidationFailureHook) return;
    const info: ValidationFailureInfo = {
      source,
      error,
      details,
      method,
      // Same resolution docs use for a RegExp route: a readable pathExample
      // or a synthesized :name path, never route.toString()'s raw dump.
      path: resolveDocPath({ path, pathExample }),
      req,
    };
    callHookSafely(schemaHook, info);
    callHookSafely(routeHook, info);
    callHookSafely(this.globalValidationFailureHook, info);
  }
  private createBodyValidationMiddleware(
    schema: any,
    method: HttpMethod,
    path: string | RegExp,
    pathExample: string | undefined,
    onValidationFailure: ValidationFailureHook | undefined,
    onBodyValidationFailure: SchemaValidationFailureHook<any> | undefined,
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = safeParseSchema(schema, req.body) as any;
        const resolved =
          result && typeof (result as Promise<any>).then === "function"
            ? await result
            : result;
        if (resolved && "issues" in resolved && resolved.issues) {
          // Validation issues
          const details = resolved.errors || resolved.issues;
          this.notifyValidationFailure(
            "body",
            "Validation failed",
            details,
            method,
            path,
            pathExample,
            req,
            onValidationFailure,
            onBodyValidationFailure,
          );
          res.status(400).json({ error: "Validation failed", details });
          return;
        }
        req.body = resolved && "value" in resolved ? resolved.value : resolved;
        next();
      } catch (error) {
        if (isSchemaError(error)) {
          const details = (error as any).errors || (error as any).issues;
          this.notifyValidationFailure(
            "body",
            "Validation failed",
            details,
            method,
            path,
            pathExample,
            req,
            onValidationFailure,
            onBodyValidationFailure,
          );
          res.status(400).json({ error: "Validation failed", details });
        } else {
          next(error);
        }
      }
    };
  }
  private createParamsValidationMiddleware(
    schema: any,
    method: HttpMethod,
    path: string | RegExp,
    pathExample: string | undefined,
    onValidationFailure: ValidationFailureHook | undefined,
    onParamsValidationFailure: SchemaValidationFailureHook<any> | undefined,
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = safeParseSchema(schema, req.params) as any;
        const resolved =
          result && typeof (result as Promise<any>).then === "function"
            ? await result
            : result;
        if (resolved && "issues" in resolved && resolved.issues) {
          const details = resolved.errors || resolved.issues;
          this.notifyValidationFailure(
            "params",
            "Validation failed",
            details,
            method,
            path,
            pathExample,
            req,
            onValidationFailure,
            onParamsValidationFailure,
          );
          res.status(400).json({ error: "Validation failed", details });
          return;
        }
        // Unlike req.query, req.params is a plain writable own property in
        // Express 5 — no Object.defineProperty workaround needed here.
        req.params =
          resolved && "value" in resolved ? resolved.value : resolved;
        next();
      } catch (error) {
        if (isSchemaError(error)) {
          const details = (error as any).errors || (error as any).issues;
          this.notifyValidationFailure(
            "params",
            "Validation failed",
            details,
            method,
            path,
            pathExample,
            req,
            onValidationFailure,
            onParamsValidationFailure,
          );
          res.status(400).json({ error: "Validation failed", details });
        } else {
          next(error);
        }
      }
    };
  }
  private createQueryValidationMiddleware(
    schema: any,
    method: HttpMethod,
    path: string | RegExp,
    pathExample: string | undefined,
    onValidationFailure: ValidationFailureHook | undefined,
    onQueryValidationFailure: SchemaValidationFailureHook<any> | undefined,
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = safeParseSchema(schema, req.query) as any;
        const resolved =
          result && typeof (result as Promise<any>).then === "function"
            ? await result
            : result;
        if (resolved && "issues" in resolved && resolved.issues) {
          const details = resolved.errors || resolved.issues;
          this.notifyValidationFailure(
            "query",
            "Validation failed",
            details,
            method,
            path,
            pathExample,
            req,
            onValidationFailure,
            onQueryValidationFailure,
          );
          res.status(400).json({ error: "Validation failed", details });
          return;
        }
        const validatedQuery =
          resolved && "value" in resolved ? resolved.value : resolved;
        // Use Object.defineProperty to properly set the read-only query property
        Object.defineProperty(req, "query", {
          value: validatedQuery,
          writable: false,
          enumerable: true,
          configurable: true,
        });
        next();
      } catch (error) {
        if (isSchemaError(error)) {
          const details = (error as any).errors || (error as any).issues;
          this.notifyValidationFailure(
            "query",
            "Validation failed",
            details,
            method,
            path,
            pathExample,
            req,
            onValidationFailure,
            onQueryValidationFailure,
          );
          res.status(400).json({ error: "Validation failed", details });
        } else {
          next(error);
        }
      }
    };
  }
}

/**
 * Create a new strongly-typed Express router instance.
 *
 * This is the simplest way to get started with @minisylar/express-typed-router.
 *
 * @example
 * import { createTypedRouter } from '@minisylar/express-typed-router';
 *
 * // Create a router and add a typed GET route
 * const router = createTypedRouter();
 * router.get('/hello/:name', (req, res) => {
 *   // req.params.name is typed as string
 *   res.json({ message: `Hello, ${req.params.name}!` });
 * });
 *
 * // Use with Express
 * import express from 'express';
 * const app = express();
 * app.use('/api', router.getRouter());
 */
export function createTypedRouter<
  Req extends Record<string, any> = AdditionalReqProps,
  Locals extends Record<string, any> = AdditionalLocals,
>(): TypedRouter<Req, Locals> {
  return new TypedRouter<Req, Locals>();
}

// Option 2: Factory with optional configuration

/**
 * Configuration options for createTypedRouterWithConfig.
 *
 * @property validateInput - (Future) Whether to enable global input validation.
 * @property errorHandler - Optional global error handler middleware for the router.
 * @property hooks.onValidationFailure - Called for every validation failure on this router, in addition to any per-route hook.
 */
export interface RouterConfig {
  validateInput?: boolean;
  errorHandler?: (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void;
  hooks?: RouterHooks;
}

/**
 * Create a new typed router with optional configuration.
 *
 * Use this if you want to add a global error handler or future global options.
 *
 * @param config - Optional configuration for the router (e.g. error handler).
 * @returns A new TypedRouter instance.
 *
 * @example
 * import { createTypedRouterWithConfig } from '@minisylar/express-typed-router';
 *
 * const router = createTypedRouterWithConfig({
 *   errorHandler: (err, req, res, next) => {
 *     res.status(500).json({ error: 'Something went wrong', details: err });
 *   }
 * });
 */
export function createTypedRouterWithConfig<
  Req extends Record<string, any> = AdditionalReqProps,
  Locals extends Record<string, any> = AdditionalLocals,
>(config?: RouterConfig): TypedRouter<Req, Locals> {
  const router = new TypedRouter<Req, Locals>();
  if (config?.errorHandler) {
    router.getRouter().use(config.errorHandler);
  }
  if (config?.hooks?.onValidationFailure) {
    router.onValidationFailure(config.hooks.onValidationFailure);
  }
  return router;
}

// Option 3: Factory with pre-configured middleware

/**
 * Create a new typed router with pre-configured middleware.
 *
 * This is useful for setting up router-level middleware in a single call.
 *
 * @param middleware - One or more TypedMiddleware functions to apply to all routes.
 * @returns A new TypedRouter instance with the middleware applied.
 *
 * @example
 * import { createTypedRouterWithMiddleware } from '@minisylar/express-typed-router';
 *
 * const router = createTypedRouterWithMiddleware(authMiddleware, loggingMiddleware);
 */
export function createTypedRouterWithMiddleware<T extends Record<string, any>>(
  ...middleware: TypedMiddleware<any, any>[]
): TypedRouter<T> {
  let router = new TypedRouter() as any;
  for (const mw of middleware) {
    router = router.useMiddleware(mw);
  }
  return router;
}

/**
 * An entry for createDocs(). Either a bare TypedRouter (no prefix prepended)
 * or an object with an explicit prefix matching the mount point in app.use().
 *
 * @example
 * // Routes defined as /users/:id — mount prefix prepends /api
 * { prefix: '/api', router: usersRouter }
 *
 * // Routes already include the full path — no prefix needed
 * authRouter
 */
export type RouterDocEntry =
  | TypedRouter<any, any>
  | { prefix: string; router: TypedRouter<any, any> };

/**
 * Create a unified OpenAPI docs endpoint that merges routes from multiple
 * TypedRouter instances. Use this when routes are split across files.
 *
 * @example
 * // users.router.ts — routes like /users, /users/:id
 * export const usersRouter = createTypedRouter();
 *
 * // auth.router.ts — routes like /login, /logout
 * export const authRouter = createTypedRouter();
 *
 * // app.ts
 * app.use('/api', usersRouter.getRouter());
 * app.use('/api', authRouter.getRouter());
 * app.use('/docs', createDocs(
 *   [
 *     { prefix: '/api', router: usersRouter },
 *     { prefix: '/api', router: authRouter },
 *   ],
 *   { title: 'My API', version: '1.0.0' }
 * ));
 */
function mergeRouterMetadata(
  routers: RouterDocEntry | RouterDocEntry[],
): RouteMetadata[] {
  const entries = (Array.isArray(routers) ? routers : [routers]).map(
    (entry): { prefix: string; router: TypedRouter<any, any> } =>
      "prefix" in entry
        ? (entry as { prefix: string; router: TypedRouter<any, any> })
        : { prefix: "", router: entry as TypedRouter<any, any> },
  );
  return entries.flatMap(({ prefix, router }) =>
    router.getRouteMetadata().map((meta) => ({
      ...meta,
      ...(typeof meta.path === "string"
        ? { path: prefix + meta.path }
        : { path: meta.path, pathExample: prefix + resolveDocPath(meta) }),
    })),
  );
}

/**
 * Build the OpenAPI spec object directly, without mounting an Express router
 * or making an HTTP request. For generating openapi.json at build/CI time,
 * separately from running the app. Accepts the same router(s) shape as
 * createDocs.
 *
 * @example
 * const spec = await generateOpenApiSpec(router, { title: 'My API' });
 * await fs.writeFile('./openapi.json', JSON.stringify(spec, null, 2));
 */
export async function generateOpenApiSpec(
  routers: RouterDocEntry | RouterDocEntry[],
  options: DocsOptions = {},
): Promise<Record<string, any>> {
  return buildOpenApiSpec(mergeRouterMetadata(routers), options);
}

export function createDocs(
  routers: RouterDocEntry | RouterDocEntry[],
  options: DocsOptions = {},
): express.Router & express.RequestHandler {
  // Observe responses to infer schemas, unless opted out (privacy).
  if (options.sampleResponses !== false) {
    const mode = options.sampleResponses === "live" ? "live" : "redacted";
    const entries = Array.isArray(routers) ? routers : [routers];
    for (const entry of entries) {
      const router = "prefix" in entry ? entry.router : entry;
      router.enableSampling(mode);
    }
  }

  const docsRouter = express.Router();

  docsRouter.get("/openapi.json", async (_req, res) => {
    try {
      const spec = await generateOpenApiSpec(routers, options);
      res.json(spec);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to generate spec", details: String(err) });
    }
  });

  docsRouter.get("/", (req, res) => {
    const specUrl = `${req.baseUrl}/openapi.json`;
    const cdnUrl = options.cdnUrl ?? DEFAULT_SCALAR_CDN;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(scalarHtml(options.title ?? "API", specUrl, cdnUrl));
  });

  return docsRouter as express.Router & express.RequestHandler;
}
