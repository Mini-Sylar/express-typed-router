# @minisylar/express-typed-router

A strongly typed Express router with **Standard Schema** validation, automatic type inference, and ✨ OpenAPI docs.

Define routes once, infer `params` / `body` / `query`, and generate a clean API spec for docs or client generation.

---

![Scalar UI showing typed routes with request body schemas, enum values, and live response examples](https://raw.githubusercontent.com/Mini-Sylar/express-typed-router/main/docs/docsScreenshot.png)

## Documentation generated from your codebase

## What you get

- **Typed route handlers** — `req.params`, `req.body`, `req.query` inferred from your route + schema
- **Typed middleware** — middleware can extend `req` and `res.locals`
- **✨ OpenAPI docs** — generated from routes, schemas, and captured responses
- **Schema-agnostic** — any Standard Schema-compatible validator (Zod, Yup, Valibot, Arktype, Joi...)
- **Express 4 & 5** — common patterns supported
- **Client-friendly output** — generate `api.types.ts` and build any client wrapper

---

## Install

```bash
npm install @minisylar/express-typed-router
pnpm add @minisylar/express-typed-router
```

Requires Express 4.18+ or Express 5.

---

## Quick start

```ts
import express from "express";
import { z } from "zod";
import { createTypedRouter } from "@minisylar/express-typed-router";

const app = express();
app.use(express.json());

const router = createTypedRouter();

router.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id }); // params.id: string
});

router.post(
  "/users",
  { bodySchema: z.object({ name: z.string() }) },
  (req, res) => {
    res.json({ name: req.body.name }); // body.name: string
  },
);

app.use("/api", router.getRouter());
app.use("/docs", router.docs({ title: "My API", version: "1.0.0" }));

app.listen(3000);
// http://localhost:3000/docs → interactive API docs
```

---

## Route typing

Path params are inferred from the route string. No extra types needed.

```ts
router.get("/users/:id", (req, res) => {
  req.params.id; // string
});

router.get("/flights/:from-:to", (req, res) => {
  req.params.from; // string
  req.params.to; // string
});

router.get("/posts/:year/:month?", (req, res) => {
  req.params.year; // string
  req.params.month; // string | undefined
});
```

Schema options infer body and query:

```ts
router.get(
  "/search",
  { querySchema: z.object({ q: z.string() }) },
  (req, res) => {
    req.query.q; // string — validated at runtime, typed at compile time
  },
);

router.post(
  "/users",
  { bodySchema: z.object({ name: z.string(), email: z.string().email() }) },
  (req, res) => {
    req.body.name; // string
    req.body.email; // string
  },
);
```

<details>
<summary><strong>All supported route patterns</strong></summary>

```ts
router.get("/users/:id", handler); // { id: string }
router.get("/flights/:from-:to", handler); // { from: string; to: string }
router.get("/files/:name.:ext", handler); // { name: string; ext: string }
router.get("/posts/:year/:month?", handler); // { year: string; month?: string }
router.get("/files/:path+", handler); // { path: string[] }
router.get("/search/:terms*", handler); // { terms?: string[] }
router.get("/api{/:version}/users", handler); // { version?: string }
router.get("/users/:id(\\d+)", handler); // { id: string }
router.get("/static/*", handler); // { "0": string }
```

</details>

---

## Middleware typing

Declare what a middleware adds to `req`, and that type flows into every handler that uses it.

```ts
import type { TypedMiddleware } from "@minisylar/express-typed-router";

const requireAuth: TypedMiddleware<{ userId: string; email: string }> = (
  req,
  res,
  next,
) => {
  const payload = jwt.verify(
    req.headers.authorization!,
    process.env.JWT_SECRET!,
  );
  req.userId = payload.userId;
  req.email = payload.email;
  next();
};
```

**Global middleware** — applied to all routes on the router:

```ts
const router = createTypedRouter()
  .useMiddleware(requireAuth)
  .useMiddleware(loggingMiddleware);

router.get("/profile", (req, res) => {
  req.userId; // string — from requireAuth
  req.requestId; // string — from loggingMiddleware
});
```

**Per-route middleware** — scoped to one route, types still merge:

```ts
router.get("/admin", { middleware: [requireAdmin] }, (req, res) => {
  req.userId; // from global middleware
  req.isAdmin; // from requireAdmin
});
```

> **Note:** `useMiddleware` returns a new router instance. Use method chaining or capture the return value — see [Common Patterns](#common-patterns).

---

## ✨ OpenAPI and docs

Mount the docs endpoint and get a Scalar-based interactive UI plus raw OpenAPI JSON — all generated automatically from your routes.

```ts
app.use(
  "/docs",
  router.docs({
    title: "My API",
    version: "1.0.0",
    description: "Public API docs",
    specOutputPath: "./openapi.json", // write spec to disk (enables watch mode)
  }),
);
// GET /docs              → Scalar UI
// GET /docs/openapi.json → raw OpenAPI 3.1 spec
```

**What's generated automatically:**

- route paths, methods, and path parameters
- query and body schemas (from `querySchema` / `bodySchema`)
- **response schemas** — inferred from real traffic (see [Response schemas](#response-schemas-from-live-traffic) below)
- tags and summaries — inferred from route paths, or set manually

**Custom route metadata:**

```ts
router.post(
  "/users",
  {
    bodySchema: CreateUserSchema,
    responseSchema: UserSchema, // typed responses in the spec
    tags: ["Users"],
    summary: "Create a user",
    description: "Creates a new account and returns the created user.",
  },
  handler,
);
```

**Multi-router docs** — one `.docs()` call covers everything:

```ts
const api = createTypedRouter()
  .use("/users", usersRouter)
  .use("/auth", authRouter);

app.use("/docs", api.docs({ title: "My API", version: "1.0.0" }));
// Discovers all sub-routers and merges routes with correct prefixes
```

### Response schemas from live traffic

You don't have to declare what your routes return. The library **observes real responses** (`res.json` / `res.send`), **infers a JSON Schema** from them, and **merges across samples** — so it learns field types, which fields are nullable, and which are optional. This drives both the docs UI and `openapi-typescript` (real response types instead of `unknown`).

By default this runs in **redacted** mode: only the shape is kept, never the values — so no real user data is ever stored or shown.

```ts
// A few responses like { id: 1, email: "a@b.com", nickname: "Al" } and
// { id: 2, email: null } are observed and merged into:
{
  type: "object",
  properties: {
    id:       { type: "integer" },
    email:    { type: ["string", "null"] },  // nullable — seen as null sometimes
    nickname: { type: "string" }             // optional — missing in some responses
  },
  required: ["id", "email"]                   // nickname excluded
}
```

Control it with `sampleResponses`:

| Value | Behavior |
|---|---|
| `true` _(default)_ | **Redacted** — infer schema only. Real values discarded at capture time. Safe to expose. |
| `"live"` | Infer schema **and** attach one real captured response as an example. ⚠️ Examples contain actual data — use only for trusted/internal docs. |
| `false` | Don't observe responses at all. |

```ts
// Safe default — schema only, no real data
app.use("/docs", api.docs({ title: "My API", version: "1.0.0" }));

// Show real example payloads (internal docs only)
app.use("/docs", api.docs({ title: "My API", version: "1.0.0", sampleResponses: "live" }));

// Disable entirely
app.use("/docs", api.docs({ title: "My API", version: "1.0.0", sampleResponses: false }));
```

> Exclude an individual sensitive route from docs with `hidden: true` in its route options — works in any mode.

> **Note:** observed schemas live in memory and fill in as traffic flows (they reset on server restart). The live `/docs/openapi.json` endpoint always reflects the latest — so to get inferred **response** types in your generated client, point `openapi-typescript` at the running URL after exercising your routes. The `specOutputPath` file is written once at startup (before traffic), so it carries request schemas only.

### Schema library support for docs

All validators work for **request validation**. For **OpenAPI schema generation** (showing field names and types in the spec), some libraries need an extra converter package installed in your project. This library auto-detects them at runtime — install the one you need and it just works, no config required.

| Library                          | Validation | Docs schema | Extra install                                     |
| -------------------------------- | ---------- | ----------- | ------------------------------------------------- |
| Zod 4                            | ✅         | ✅          | none — built-in                                   |
| Zod 3                            | ✅         | ✅          | `zod-to-json-schema`                              |
| Valibot                          | ✅         | ✅          | `@valibot/to-json-schema`                         |
| ArkType                          | ✅         | ✅          | none — built-in                                   |
| Effect                           | ✅         | ✅          | none — built-in                                   |
| Yup                              | ✅         | ⚠️          | not supported — no official JSON Schema converter |
| Joi                              | ✅         | ⚠️          | not supported — no official JSON Schema converter |
| Decoders / ts.data.json / unhoax | ✅         | ⚠️          | not supported — no schema introspection           |

> **⚠️ Partial docs** means routes still appear in the spec with paths, methods, and inferred response schemas — only the request body/query field shapes are missing.

---

## Client types

Set `specOutputPath` in your docs options and the library writes `openapi.json` to disk automatically every time the server starts. That file is a standard OpenAPI 3.1 spec — use it with any OpenAPI-compatible tool: code generators, client SDKs, linters, mocking tools, and more.

For TypeScript projects, [openapi-typescript](https://github.com/openapi-ts/openapi-typescript) is a great option — it generates a `.d.ts` file from the spec that you can use with any HTTP client.

### Setup

**1. Enable spec output:**

```ts
app.use(
  "/docs",
  router.docs({
    title: "My API",
    version: "1.0.0",
    specOutputPath: "./openapi.json", // written automatically on every server start
  }),
);
```

**2. Add the scripts to your `package.json`:**

```json
{
  "scripts": {
    "dev": "run-p dev:server dev:types",
    "dev:server": "node --watch src/server.ts",
    "dev:types": "nodemon -L --watch openapi.json --exec \"openapi-typescript ./openapi.json -o ./api.types.ts\""
  },
  "devDependencies": {
    "openapi-typescript": "^7.0.0",
    "nodemon": "^3.0.0",
    "npm-run-all2": "^7.0.0"
  }
}
```

**3. Run it:**

```bash
npm run dev
```

That's it — one command runs everything in parallel:

- `dev:server` — runs your server with `node --watch` (Node 18.11+; no `tsx` needed on Node 23.6+). On every save the server restarts and the library **rewrites `openapi.json` automatically**.
- `dev:types` — `nodemon` watches `openapi.json` and regenerates `api.types.ts` whenever it changes.

Edit a route, save, and your client types update on their own.

> **Why `nodemon -L`?** On Windows, native file watchers miss in-place file writes — the `-L` flag forces polling so the regen reliably fires. On macOS/Linux you can drop it.

> Add `openapi.json` and `api.types.ts` to `.gitignore` — both are generated.

**Prefer to keep it manual?** Skip `nodemon` and `npm-run-all2` entirely — just run the server with `node --watch src/server.ts` and regenerate types on demand with `openapi-typescript ./openapi.json -o ./api.types.ts` whenever you change your API.

### Use with `openapi-fetch`

```ts
import createClient from "openapi-fetch";
import type { paths } from "./api.types";

const client = createClient<paths>({ baseUrl: "http://localhost:3000/api" });

// Path, params, body, and response all typed from the spec
const { data } = await client.GET("/users/{id}", {
  params: { path: { id: "123" } },
});

const { data: user } = await client.POST("/users", {
  body: { name: "Alice", email: "alice@example.com" },
});
```

### Roll your own client

If you prefer not to add `openapi-fetch`, use the generated types directly with standard `fetch`:

```ts
import type { paths } from "./api.types";

type Body<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends {
  requestBody?: { content: { "application/json": infer B } };
}
  ? B
  : never;

type Res<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": infer R } } };
}
  ? R
  : unknown;

async function apiFetch<P extends keyof paths, M extends keyof paths[P]>(
  path: P,
  options: {
    method: M;
    data?: Body<P, M>;
    params?: {
      path?: Record<string, string | number>;
      query?: Record<string, string | number | boolean>;
    };
  },
): Promise<Res<P, M>> {
  const url = new URL(
    String(path).replace(/\{([^}]+)\}/g, (_, key) =>
      encodeURIComponent(String(options.params?.path?.[key] ?? "")),
    ),
    "/api",
  );

  for (const [k, v] of Object.entries(options.params?.query ?? {})) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    method: String(options.method).toUpperCase(),
    headers: options.data ? { "Content-Type": "application/json" } : undefined,
    body: options.data ? JSON.stringify(options.data) : undefined,
  });

  return res.json();
}

// Path, method, body, and params all typed from the spec
await apiFetch("/users/{id}", {
  method: "get",
  params: { path: { id: "123" } },
});
await apiFetch("/users", {
  method: "post",
  data: { name: "Alice", email: "alice@example.com" },
});
await apiFetch("/search", { method: "get", params: { query: { q: "hello" } } });
```

The same type utilities work with axios — swap `fetch` for `axios.request`.

---

## Common patterns

### Migrate an existing Express app

No rewrite required. Add typed routes alongside existing ones.

```diff
  const app = express();

+ const typedRouter = createTypedRouter();
+ typedRouter.get("/users/:id", (req, res) => {
+   res.json({ id: req.params.id }); // typed
+ });

  app.get("/health", (_req, res) => res.json({ ok: true })); // untouched

+ app.use("/api", typedRouter.getRouter());
+ app.use("/docs", typedRouter.docs());
```

### Middleware on a group of routes

```ts
// All admin routes share auth middleware and its types
const adminRouter = createTypedRouter()
  .useMiddleware(requireAuth)
  .get("/users", listUsersHandler)
  .delete("/users/:id", deleteUserHandler);

app.use("/admin", adminRouter.getRouter());
```

### Per-feature routers, one doc endpoint

```ts
import {usersRouter} from "./v1/usersRouter"
....

const api = createTypedRouter()
  .use("/users", usersRouter)
  .use("/orders", ordersRouter)
  .use("/auth", authRouter);

app.use("/api/v1", api.getRouter());
app.use("/docs", api.docs({ title: "My API", version: "1.0.0" }));
```

---

## API surface

|                                          |                                                  |
| ---------------------------------------- | ------------------------------------------------ |
| `createTypedRouter()`                    | Create a router                                  |
| `createTypedRouterWithMiddleware(...mw)` | Create a router pre-configured with middleware   |
| `createTypedRouterWithConfig(config)`    | Create a router with custom error handling       |
| `router.useMiddleware(mw)`               | Add typed global middleware (returns new router) |
| `router.use(prefix, subRouter)`          | Mount a sub-router                               |
| `router.getRouter()`                     | Get the underlying Express router                |
| `router.docs(options)`                   | Get the docs + OpenAPI spec router               |
| `TypedMiddleware<T>`                     | Type helper for middleware that extends `req`    |

---

## Development

```bash
pnpm install
pnpm build
pnpm type-check
pnpm build:watch
```

---

## License

ISC
