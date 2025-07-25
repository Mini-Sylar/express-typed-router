/**
 * @packageDocumentation
 * @module @minisylar/express-typed-router
 *
 * @title @minisylar/express-typed-router
 *
 * A strongly-typed Express router with Zod validation and automatic type inference for params, body, query, and middleware.
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

// Import from versioned subpaths as recommended by Zod docs
import * as z3 from "zod/v3";
import * as z4 from "zod/v4/core";

// Compatibility layer for Zod v3/v4 following official recommendations
export type AnyZodType = z3.ZodTypeAny | z4.$ZodType;

// Type guard to detect Zod 4 schemas at runtime
export function isZod4Schema(schema: AnyZodType): schema is z4.$ZodType {
  return "_zod" in schema;
}

// Helper type to extract output type from Zod v3, v4, drizzle-zod, or fallback to unknown
export type InferOutput<T> = T extends z4.$ZodType
  ? z4.output<T>
  : T extends z3.ZodTypeAny
  ? z3.output<T>
  : T extends { _output: infer O }
  ? O
  : T extends { _type: infer O }
  ? O
  : unknown;

// Helper type to extract input type from Zod v3, v4, drizzle-zod, or fallback to unknown
export type InferInput<T> = T extends z4.$ZodType
  ? z4.input<T>
  : T extends z3.ZodTypeAny
  ? z3.input<T>
  : T extends { _input: infer I }
  ? I
  : T extends { _type: infer I }
  ? I
  : unknown;

// Unified parsing functions that work with both Zod 3 and 4
export function parseSchema<T extends AnyZodType>(
  schema: T,
  data: unknown
): InferOutput<T> {
  if (isZod4Schema(schema)) {
    return z4.parse(schema, data) as InferOutput<T>;
  } else {
    return (schema as z3.ZodTypeAny).parse(data) as InferOutput<T>;
  }
}

// Safe parse result type that works with both versions
export type SafeParseResult<T extends AnyZodType> = T extends z4.$ZodType
  ? ReturnType<typeof z4.safeParse<T>>
  : T extends z3.ZodTypeAny
  ? z3.SafeParseReturnType<z3.input<T>, z3.output<T>>
  : never;

export function safeParseSchema<T extends AnyZodType>(
  schema: T,
  data: unknown
): SafeParseResult<T> {
  if (isZod4Schema(schema)) {
    return z4.safeParse(schema, data) as SafeParseResult<T>;
  } else {
    return (schema as z3.ZodTypeAny).safeParse(data) as SafeParseResult<T>;
  }
}

// Error detection helper
export function isZodError(error: unknown): error is z3.ZodError {
  return (
    error instanceof z3.ZodError ||
    (error !== null &&
      typeof error === "object" &&
      "issues" in error &&
      Array.isArray((error as any).issues))
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
 * - Regex constraints: /user/:id(\\d+) → { id: string }
 * - Optional parameters: /posts/:year/:month? → { year: string; month?: string }
 * - Wildcard parameters: /files/* → { "0": string }
 * - Multiple wildcards: /a/star/b/star → { "0": string; "1": string }
 */
export type ExtractRouteParams<Path extends string> = string extends Path
  ? Record<string, string>
  : ExtractParams<Path>;

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
  // Handle optional parameter patterns like /:param
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
  Count extends string = "0"
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
  TLocals extends Record<string, any> = {}
> = (
  req: Request & TReq,
  res: Response<any, TLocals>,
  next: NextFunction
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

// Enhanced Request type with proper inference
export type ZodRequest<
  Path extends string = string,
  BodySchema extends AnyZodType | unknown = unknown,
  QuerySchema extends AnyZodType | unknown = unknown,
  MiddlewareProps extends Record<string, any> = {}
> = Omit<Request, "params" | "query" | "body"> & {
  params: ExtractRouteParams<Path>;
  body: BodySchema extends AnyZodType ? InferOutput<BodySchema> : unknown;
  query: QuerySchema extends AnyZodType ? InferOutput<QuerySchema> : unknown;
} & MiddlewareProps;

// Route handler type
export type ZodRouteHandler<
  Path extends string = string,
  BodySchema extends AnyZodType | unknown = unknown,
  QuerySchema extends AnyZodType | unknown = unknown,
  MiddlewareProps extends Record<string, any> = {},
  ResponseLocals extends Record<string, any> = {}
> = (
  req: ZodRequest<Path, BodySchema, QuerySchema, MiddlewareProps>,
  res: Response<any, ResponseLocals>,
  next?: NextFunction
) => void | Promise<void> | Response | Promise<Response>;

/**
 * Options for defining a typed route, including schemas and middleware.
 *
 * @template BodySchema - Zod schema for request body validation.
 * @template QuerySchema - Zod schema for query parameter validation.
 * @property bodySchema - Optional Zod schema for validating the request body.
 * @property querySchema - Optional Zod schema for validating the query string.
 * @property middleware - Optional array of TypedMiddleware for this route.
 */
export interface RouteOptions<
  BodySchema extends AnyZodType | unknown = unknown,
  QuerySchema extends AnyZodType | unknown = unknown
> {
  bodySchema?: BodySchema;
  querySchema?: QuerySchema;
  middleware?: TypedMiddleware<any, any>[];
}

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

// Main typed router class
class TypedRouter<
  RouterMiddlewareProps extends Record<string, any> = {},
  RouterLocals extends Record<string, any> = {}
> {
  private router: express.Router;

  constructor() {
    this.router = express.Router();
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
    TLocals extends Record<string, any> = {}
  >(
    middleware: TypedMiddleware<TReq, TLocals>
  ): TypedRouter<RouterMiddlewareProps & TReq, RouterLocals & TLocals> {
    this.router.use(middleware as any);
    return this as any;
  }
  /**
   * Get the underlying Express router
   */
  getRouter(): express.Router {
    return this.router;
  }
  // Method overloads for GET requests with automatic middleware type inference
  get<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  get<
    Path extends string,
    BodySchema extends AnyZodType | unknown,
    QuerySchema extends AnyZodType | unknown
  >(
    path: Path,
    options: RouteOptions<BodySchema, QuerySchema>,
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Special overload for middleware type inference
  get<
    Path extends string,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  // Combined overload for body/query schema + middleware
  get<
    Path extends string,
    BodySchema extends AnyZodType | unknown,
    QuerySchema extends AnyZodType | unknown,
    M extends TypedMiddleware<any, any>[] // Using array type for JS compatibility
  >(
    path: Path,
    options: RouteOptions<BodySchema, QuerySchema> & { middleware: [...M] }, // Using tuple spread pattern
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<readonly [...M]>, // Make it readonly for type inference
      RouterLocals & InferMiddlewareLocals<readonly [...M]>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  // Implementation
  get(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("get", path, optionsOrHandler, handler);
  } // Combined overload for body/query schema + middleware (most specific first)
  post<
    Path extends string,
    BodySchema extends AnyZodType,
    QuerySchema extends AnyZodType | unknown,
    M extends TypedMiddleware<any, any>[] // Using array type for JS compatibility
  >(
    path: Path,
    options: {
      bodySchema: BodySchema;
      querySchema?: QuerySchema;
      middleware: [...M]; // Using tuple spread pattern
    },
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<readonly [...M]>, // Make it readonly for type inference
      RouterLocals & InferMiddlewareLocals<readonly [...M]>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Body schema only + middleware
  post<
    Path extends string,
    BodySchema extends AnyZodType,
    M extends TypedMiddleware<any, any>[] // Using array type for JS compatibility
  >(
    path: Path,
    options: { bodySchema: BodySchema; middleware: [...M] }, // Using tuple spread pattern
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<readonly [...M]>, // Make it readonly for type inference
      RouterLocals & InferMiddlewareLocals<readonly [...M]>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Middleware only
  post<
    Path extends string,
    M extends TypedMiddleware<any, any>[] // Using array type for JS compatibility
  >(
    path: Path,
    options: { middleware: [...M] }, // Using tuple spread pattern
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<readonly [...M]>, // Make it readonly for type inference
      RouterLocals & InferMiddlewareLocals<readonly [...M]>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Body + Query schema without middleware
  post<
    Path extends string,
    BodySchema extends AnyZodType | unknown,
    QuerySchema extends AnyZodType | unknown
  >(
    path: Path,
    options: RouteOptions<BodySchema, QuerySchema>,
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Just handler, no options
  post<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  post(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("post", path, optionsOrHandler, handler);
  }
  // PUT method with all the same overloads as POST
  put<
    Path extends string,
    BodySchema extends AnyZodType,
    QuerySchema extends AnyZodType | unknown,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: {
      bodySchema: BodySchema;
      querySchema?: QuerySchema;
      middleware: Middleware;
    },
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  put<
    Path extends string,
    BodySchema extends AnyZodType,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { bodySchema: BodySchema; middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  put<
    Path extends string,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  put<
    Path extends string,
    BodySchema extends AnyZodType | unknown,
    QuerySchema extends AnyZodType | unknown
  >(
    path: Path,
    options: RouteOptions<BodySchema, QuerySchema>,
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  put<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  put(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("put", path, optionsOrHandler, handler);
  }
  // PATCH method with all the same overloads as POST
  patch<
    Path extends string,
    BodySchema extends AnyZodType,
    QuerySchema extends AnyZodType | unknown,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: {
      bodySchema: BodySchema;
      querySchema?: QuerySchema;
      middleware: Middleware;
    },
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  patch<
    Path extends string,
    BodySchema extends AnyZodType,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { bodySchema: BodySchema; middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  patch<
    Path extends string,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  patch<
    Path extends string,
    BodySchema extends AnyZodType | unknown,
    QuerySchema extends AnyZodType | unknown
  >(
    path: Path,
    options: RouteOptions<BodySchema, QuerySchema>,
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  patch<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  patch(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("patch", path, optionsOrHandler, handler);
  } // DELETE method (typically no body, but can have query params and middleware)
  // Most specific first: query schema + middleware
  delete<
    Path extends string,
    QuerySchema extends AnyZodType | unknown,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { querySchema: QuerySchema; middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Query schema only
  delete<Path extends string, QuerySchema extends AnyZodType | unknown>(
    path: Path,
    options: { querySchema: QuerySchema },
    handler: ZodRouteHandler<
      Path,
      unknown,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Middleware only
  delete<
    Path extends string,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Basic overload with no options
  delete<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  delete(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("delete", path, optionsOrHandler, handler);
  } // OPTIONS method (typically no body, used for CORS preflight)
  // Most specific first: query schema + middleware
  options<
    Path extends string,
    QuerySchema extends AnyZodType | unknown,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { querySchema: QuerySchema; middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Query schema only
  options<Path extends string, QuerySchema extends AnyZodType | unknown>(
    path: Path,
    options: { querySchema: QuerySchema },
    handler: ZodRouteHandler<
      Path,
      unknown,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Middleware only
  options<
    Path extends string,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Basic overload with no options
  options<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  options(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("options", path, optionsOrHandler, handler);
  } // HEAD method (like GET but only returns headers)
  // Most specific first: query schema + middleware
  head<
    Path extends string,
    QuerySchema extends AnyZodType | unknown,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { querySchema: QuerySchema; middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Query schema only
  head<Path extends string, QuerySchema extends AnyZodType | unknown>(
    path: Path,
    options: { querySchema: QuerySchema },
    handler: ZodRouteHandler<
      Path,
      unknown,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Middleware only
  head<
    Path extends string,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Basic overload with no options
  head<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  head(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("head", path, optionsOrHandler, handler);
  } // ALL method (matches all HTTP methods)
  // Most specific first: body + query + middleware
  all<
    Path extends string,
    BodySchema extends AnyZodType,
    QuerySchema extends AnyZodType | unknown,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: {
      bodySchema: BodySchema;
      querySchema?: QuerySchema;
      middleware: Middleware;
    },
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Body schema + middleware (no query)
  all<
    Path extends string,
    BodySchema extends AnyZodType,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { bodySchema: BodySchema; middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Query schema + middleware (no body)
  all<
    Path extends string,
    QuerySchema extends AnyZodType | unknown,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { querySchema: QuerySchema; middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      QuerySchema,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Body + query schemas (no middleware)
  all<
    Path extends string,
    BodySchema extends AnyZodType | unknown,
    QuerySchema extends AnyZodType | unknown
  >(
    path: Path,
    options: RouteOptions<BodySchema, QuerySchema>,
    handler: ZodRouteHandler<
      Path,
      BodySchema,
      QuerySchema,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Middleware only (no schemas)
  all<
    Path extends string,
    Middleware extends readonly TypedMiddleware<any, any>[]
  >(
    path: Path,
    options: { middleware: Middleware },
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps & InferMiddlewareProps<Middleware>,
      RouterLocals & InferMiddlewareLocals<Middleware>
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;

  // Basic overload with no options
  all<Path extends string>(
    path: Path,
    handler: ZodRouteHandler<
      Path,
      unknown,
      unknown,
      RouterMiddlewareProps,
      RouterLocals
    >
  ): TypedRouter<RouterMiddlewareProps, RouterLocals>;
  all(
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    return this.registerRoute("all", path, optionsOrHandler, handler);
  }
  // Helper method to register routes
  private registerRoute(
    method: HttpMethod,
    path: string,
    optionsOrHandler: any,
    handler?: any
  ): TypedRouter<RouterMiddlewareProps, RouterLocals> {
    const middlewares: any[] = [];

    if (typeof optionsOrHandler === "object") {
      const options = optionsOrHandler as RouteOptions<any, any>;

      // Add per-route middleware first
      if (options.middleware) {
        middlewares.push(...options.middleware);
      }

      // Add schema validation middleware
      if (options.bodySchema) {
        middlewares.push(
          this.createBodyValidationMiddleware(options.bodySchema)
        );
      }
      if (options.querySchema) {
        middlewares.push(
          this.createQueryValidationMiddleware(options.querySchema)
        );
      }

      // Add the main handler
      middlewares.push(handler);
    } else {
      // Direct handler without options
      middlewares.push(optionsOrHandler);
    }

    // Register with Express router
    (this.router as any)[method](path, ...middlewares);

    return this;
  }
  private createBodyValidationMiddleware(schema: AnyZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = parseSchema(schema, req.body);
        next();
      } catch (error) {
        // Check for ZodError using our unified helper
        if (isZodError(error)) {
          res.status(400).json({
            error: "Validation failed",
            details: (error as any).errors || (error as any).issues,
          });
        } else {
          next(error);
        }
      }
    };
  }
  private createQueryValidationMiddleware(schema: AnyZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedQuery = parseSchema(schema, req.query);
        // Use Object.defineProperty to properly set the read-only query property
        Object.defineProperty(req, "query", {
          value: validatedQuery,
          writable: false,
          enumerable: true,
          configurable: true,
        });
        next();
      } catch (error) {
        // Check for ZodError using our unified helper
        if (isZodError(error)) {
          res.status(400).json({
            error: "Validation failed",
            details: (error as any).errors || (error as any).issues,
          });
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
  RouterMiddlewareProps extends Record<string, any> = {},
  RouterLocals extends Record<string, any> = {}
>(): TypedRouter<RouterMiddlewareProps, RouterLocals> {
  return new TypedRouter<RouterMiddlewareProps, RouterLocals>();
}

// Option 2: Factory with optional configuration

/**
 * Configuration options for createTypedRouterWithConfig.
 *
 * @property validateInput - (Future) Whether to enable global input validation.
 * @property errorHandler - Optional global error handler middleware for the router.
 */
export interface RouterConfig {
  validateInput?: boolean;
  errorHandler?: (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void;
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
  RouterMiddlewareProps extends Record<string, any> = {},
  RouterLocals extends Record<string, any> = {}
>(config?: RouterConfig): TypedRouter<RouterMiddlewareProps, RouterLocals> {
  const router = new TypedRouter<RouterMiddlewareProps, RouterLocals>();
  if (config?.errorHandler) {
    router.getRouter().use(config.errorHandler);
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
