# @minisylar/express-typed-router

A strongly-typed Express router with Zod validation and automatic type inference for params, body, query, and middleware.

## Features

- 🚀 **Full TypeScript support** with automatic type inference for route parameters
- 🛡️ **Zod validation** for request body, query parameters, and route params
- 🔗 **Express.js compatibility** - works with Express 4 and Express 5
- 🤝 **Mix with existing Express routes** - seamlessly integrates with your current codebase
- 📝 **JSDoc documentation** with comprehensive examples
- 📦 **ES Modules** and CommonJS support
- 🎯 **Zero runtime overhead** for type checking

## Installation

```bash
npm install @minisylar/express-typed-router
# or
pnpm add @minisylar/express-typed-router
# or
yarn add @minisylar/express-typed-router
```

> **Note:** This package requires Express 4.18.0+ or Express 5.0.0+

## Quick Start

```javascript
import express from "express";
import { z } from "zod";
import { createTypedRouter } from "@minisylar/express-typed-router";

const app = express();
app.use(express.json());

// Create a typed router
const router = createTypedRouter();

// Define routes - parameters are automatically typed!
router.get("/users/:userId", (req, res) => {
  // req.params.userId is automatically inferred as string
  res.json({ userId: req.params.userId });
});

// Add validation with Zod schemas
router.post(
  "/users",
  {
    bodySchema: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  },
  (req, res) => {
    // req.body is validated and typed automatically
    const { name, email } = req.body;
    res.json({ id: "123", name, email });
  }
);

const expressRouter = router.getRouter();
app.use("/api", expressRouter);
app.listen(3000);
```

That's it! Your routes now have full type safety and validation.

## Works with Existing Express Routes

The typed router seamlessly integrates with your existing Express application - no need to rewrite everything!

```javascript
import express from "express";
import { createTypedRouter } from "@minisylar/express-typed-router";

const app = express();
app.use(express.json());

// Your existing Express routes continue to work
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Existing Express router
const legacyRouter = express.Router();
legacyRouter.get("/legacy/:id", (req, res) => {
  res.json({ id: req.params.id });
});

// New typed router with full type safety
const typedRouter = createTypedRouter();
typedRouter.get("/users/:userId", (req, res) => {
  // req.params.userId is automatically typed as string
  res.json({ userId: req.params.userId });
});

// Extract the Express router before using it
const typedExpressRouter = typedRouter.getRouter();

// Mix them all together
app.use("/api/legacy", legacyRouter);
app.use("/api/v2", typedExpressRouter);

// Gradually migrate your routes to get type safety where you need it!
app.listen(3000);
```

## The Main API: `createTypedRouter()`

`createTypedRouter()` is the primary and most flexible way to create typed routers. It supports:

- ✅ **Global middleware** with automatic type merging
- ✅ **Per-route middleware** with type inference
- ✅ **Zod validation** for params, body, and query
- ✅ **Express 4 & 5 compatibility** with full route pattern support
- ✅ **Chainable API** for easy configuration

### Global Middleware

**Important**: Unlike Express, middleware must be applied using method chaining or capturing returned routers. See the [FAQ section](#faq-and-common-patterns) for details.

```typescript
// Method chaining pattern (recommended)
const router = createTypedRouter()
  .useMiddleware(authMiddleware)
  .useMiddleware(loggingMiddleware)
  .useMiddleware(timestampMiddleware);

// All routes automatically get types from all middleware
router.get("/protected", (req, res) => {
  // req.userId, req.requestId, req.timestamp all available and typed
});

// Alternative: capturing returned router
const baseRouter = createTypedRouter();
const routerWithMiddleware = baseRouter
  .useMiddleware(authMiddleware)
  .useMiddleware(loggingMiddleware);

// Use the router with middleware applied
routerWithMiddleware.get("/users", handler);
```

### Per-Route Middleware

```typescript
router.get(
  "/admin/:userId",
  {
    middleware: [adminMiddleware, auditMiddleware],
  },
  (req, res) => {
    // Types from both global AND per-route middleware are merged
    // req.userId (global), req.isAdmin (adminMiddleware), req.auditId (auditMiddleware)
  }
);
```

### Express 4 & 5 Route Pattern Support

Works with **all** Express routing patterns:

```typescript
// Named parameters
router.get("/users/:userId", handler); // { userId: string }

// Multiple parameters
router.get("/users/:userId/posts/:postId", handler); // { userId: string; postId: string }

// Consecutive parameters with separators
router.get("/flights/:from-:to", handler); // { from: string; to: string }
router.get("/files/:name.:ext", handler); // { name: string; ext: string }

// Optional parameters (Express 4)
router.get("/posts/:year/:month?", handler); // { year: string; month?: string }

// Repeating parameters (Express 5)
router.get("/files/:path+", handler); // { path: string[] }

// Optional repeating (Express 5)
router.get("/search/:terms*", handler); // { terms?: string[] }

// Optional segments (Express 5)
router.get("/api{/:version}/users", handler); // { version?: string }

// Regex constraints
router.get("/users/:id(\\d+)", handler); // { id: string }

// Wildcards
router.get("/static/*", handler); // { "0": string }
```

## Comprehensive Example

```javascript
import express from "express";
import { z } from "zod";
import { createTypedRouter } from "@minisylar/express-typed-router";

const app = express();
app.use(express.json());

// Create router and define middleware inline (automatically typed!)
const router = createTypedRouter()
  .useMiddleware((req, res, next) => {
    const token = req.headers.authorization;
    req.userId = "user123";
    req.isAdmin = token?.includes("admin") || false;
    next();
  })
  .useMiddleware((req, res, next) => {
    req.requestId = Math.random().toString(36);
    console.log(`[${req.requestId}] ${req.method} ${req.path}`);
    next();
  });

// Define schemas
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).optional(),
});

const UserQuerySchema = z.object({
  include: z.array(z.string()).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Routes with full type safety
router.get(
  "/users/:userId",
  {
    querySchema: UserQuerySchema,
  },
  (req, res) => {
    // All properties are automatically typed:
    const { userId } = req.params; // string (auto-inferred from route)
    const { include, limit } = req.query; // from schema validation
    const { userId: authUserId, isAdmin, requestId } = req; // from middleware

    res.json({
      id: userId,
      authUserId,
      isAdmin,
      requestId,
      include,
      limit,
    });
  }
);

router.post(
  "/users",
  {
    bodySchema: CreateUserSchema,
  },
  (req, res) => {
    const { name, email, role } = req.body; // Fully typed from schema
    const { userId, isAdmin, requestId } = req; // From middleware

    if (role === "admin" && !isAdmin) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    res.status(201).json({
      id: "new-user-id",
      name,
      email,
      role: role || "user",
      createdBy: userId,
      requestId,
    });
  }
);

// Per-route middleware can also be inline
router.delete(
  "/users/:userId",
  {
    middleware: [
      (req, res, next) => {
        if (!req.isAdmin) {
          return res.status(403).json({ error: "Admin required" });
        }
        req.hasAdminAccess = true;
        next();
      },
    ], // No need for 'as const' - middleware arrays are automatically typed
  },
  (req, res) => {
    // Types from BOTH global middleware AND per-route middleware
    const { userId } = req.params; // From route
    const { userId: authUserId, requestId } = req; // From global middleware
    const { hasAdminAccess } = req; // From per-route middleware

    res.json({
      deleted: userId,
      deletedBy: authUserId,
      requestId,
      hasAdminAccess,
    });
  }
);

app.use("/api", router.getRouter());
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### With Explicit TypeScript Types

For TypeScript users who prefer explicit typing, you can define middleware with generics:

```typescript
import { TypedMiddleware } from "@minisylar/express-typed-router";

// Define typed middleware explicitly
const authMiddleware: TypedMiddleware<{ userId: string; isAdmin: boolean }> = (
  req,
  res,
  next
) => {
  const token = req.headers.authorization;
  req.userId = "user123";
  req.isAdmin = token?.includes("admin") || false;
  next();
};

const loggingMiddleware: TypedMiddleware<{ requestId: string }> = (
  req,
  res,
  next
) => {
  req.requestId = Math.random().toString(36);
  console.log(`[${req.requestId}] ${req.method} ${req.path}`);
  next();
};

// Use the explicitly typed middleware
const router = createTypedRouter()
  .useMiddleware(authMiddleware)
  .useMiddleware(loggingMiddleware);

// Rest of the routes work the same way...
```

## TypeScript Features

For TypeScript users, the library provides advanced type safety features:

### Typed Middleware

Define middleware that extends the request object with typed properties:

```typescript
import { TypedMiddleware } from "@minisylar/express-typed-router";

const authMiddleware: TypedMiddleware<{ userId: string; isAdmin: boolean }> = (
  req,
  res,
  next
) => {
  req.userId = "user123";
  req.isAdmin = true;
  next();
};

// Add to router - types are automatically merged
router.useMiddleware(authMiddleware);

router.get("/protected", (req, res) => {
  // TypeScript knows about req.userId and req.isAdmin
  const { userId, isAdmin } = req;
  res.json({ userId, isAdmin });
});
```

### Per-Route Middleware with Type Merging

```typescript
const adminMiddleware: TypedMiddleware<{ hasAdminAccess: true }> = (
  req,
  res,
  next
) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: "Admin required" });
  }
  req.hasAdminAccess = true;
  next();
};

router.get(
  "/admin/:userId",
  {
    middleware: [adminMiddleware], // No need for 'as const' - arrays are automatically typed
  },
  (req, res) => {
    // Types from BOTH global and per-route middleware are available
    const { userId } = req.params; // From route params
    const { userId: authUserId } = req; // From global middleware
    const { hasAdminAccess } = req; // From per-route middleware

    res.json({ userId, authUserId, hasAdminAccess });
  }
);
```

### Advanced Route Parameter Types

The library automatically infers complex Express route patterns:

```typescript
// Express 5 repeating parameters
router.get("/files/:path+", (req, res) => {
  const { path } = req.params; // string[] - automatically inferred!
});

// Optional parameters
router.get("/posts/:year/:month?", (req, res) => {
  const { year, month } = req.params; // { year: string; month?: string }
});

// Complex patterns with separators
router.get("/flights/:from-:to", (req, res) => {
  const { from, to } = req.params; // { from: string; to: string }
});
```

## Alternative API Styles

<details>
<summary><strong>🎯 createTypedRouterWithMiddleware(...middleware)</strong> - Pre-configured with middleware</summary>

For developers who prefer setting up all middleware upfront:

```typescript
import {
  createTypedRouterWithMiddleware,
  TypedMiddleware,
} from "@minisylar/express-typed-router";

const authMiddleware: TypedMiddleware<{ userId: string; isAdmin: boolean }> = (
  req,
  res,
  next
) => {
  req.userId = "user123";
  req.isAdmin = true;
  next();
};

const timestampMiddleware: TypedMiddleware<{ timestamp: Date }> = (
  req,
  res,
  next
) => {
  req.timestamp = new Date();
  next();
};

// Create router with middleware - types are automatically merged
const router = createTypedRouterWithMiddleware(
  authMiddleware,
  timestampMiddleware
);

router.get("/protected", (req, res) => {
  // req.userId, req.isAdmin, and req.timestamp are all typed correctly!
  res.json({
    userId: req.userId, // string
    isAdmin: req.isAdmin, // boolean
    timestamp: req.timestamp, // Date
  });
});
```

</details>

<details>
<summary><strong>⚙️ createTypedRouterWithConfig(config)</strong> - Custom configuration</summary>

For applications that need custom error handling or configuration:

```typescript
import { createTypedRouterWithConfig } from "@minisylar/express-typed-router";

const router = createTypedRouterWithConfig({
  errorHandler: (error, req, res, next) => {
    if (error.name === "ZodError") {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    } else {
      next(error);
    }
  },
});

// Use normally
router.get("/users/:id", (req, res) => {
  // Custom error handling is automatically applied
  const { id } = req.params;
  res.json({ id });
});
```

</details>

## Express 4 & 5 Route Pattern Support

This library provides **complete TypeScript inference** for all Express.js routing patterns across both Express 4 and 5:

### Basic Patterns (Express 4 & 5)

```typescript
// Named parameters
router.get("/users/:userId", handler);
// → { userId: string }

// Multiple parameters
router.get("/users/:userId/posts/:postId", handler);
// → { userId: string; postId: string }

// Parameters with separators
router.get("/flights/:from-:to", handler);
// → { from: string; to: string }

router.get("/files/:name.:ext", handler);
// → { name: string; ext: string }
```

### Advanced Patterns (Express 4)

```typescript
// Optional parameters
router.get("/posts/:year/:month?", handler);
// → { year: string; month?: string }

// Regex constraints
router.get("/users/:id(\\d+)", handler);
// → { id: string }

// Wildcards
router.get("/files/*", handler);
// → { "0": string }

router.get("/api/*/files/*", handler);
// → { "0": string; "1": string }
```

### Express 5 Enhanced Patterns

```typescript
// Repeating parameters (one or more)
router.get("/files/:path+", handler);
// → { path: string[] }

// Optional repeating (zero or more)
router.get("/search/:terms*", handler);
// → { terms?: string[] }

// Optional segments with braces
router.get("/api{/:version}/users", handler);
// → { version?: string }

router.get("/files{/:category}/:filename", handler);
// → { category?: string; filename: string }
```

### Real-World Examples

```typescript
// E-commerce routes
router.get("/products/:category/:subcategory?", handler);
// → { category: string; subcategory?: string }

// File serving with optional versioning
router.get("/assets{/:version}/:filename.:ext", handler);
// → { version?: string; filename: string; ext: string }

// API versioning with wildcards
router.get("/api/v:version/*", handler);
// → { version: string; "0": string }

// Multi-segment paths (Express 5)
router.get("/docs/:sections+", handler);
// → { sections: string[] }
```

All patterns work seamlessly with Zod validation and middleware type inference!

## API Reference

### `createTypedRouter()` - Main API

Creates a typed router instance with full flexibility for middleware and validation.

```typescript
const router = createTypedRouter();

// Add global middleware (chainable)
router.useMiddleware(middleware1)
      .useMiddleware(middleware2);

// All HTTP methods supported
router.get(path, options?, handler)
router.post(path, options?, handler)
router.put(path, options?, handler)
router.patch(path, options?, handler)
router.delete(path, options?, handler)
router.options(path, options?, handler)
router.head(path, options?, handler)
router.all(path, options?, handler)
```

**Route Options:**

- `bodySchema`: Zod schema for request body validation
- `querySchema`: Zod schema for query parameter validation
- `paramsSchema`: Zod schema for route parameter validation (optional - auto-inferred from path)
- `middleware`: Array of typed middleware functions for this specific route

**Examples:**

```typescript
// Simple route with auto-inferred params
router.get("/users/:id", (req, res) => {
  const { id } = req.params; // string
});

// With body validation
router.post(
  "/users",
  {
    bodySchema: z.object({ name: z.string() }),
  },
  (req, res) => {
    const { name } = req.body; // string
  }
);

// With per-route middleware
router.get(
  "/admin",
  {
    middleware: [authMiddleware, adminMiddleware] as const,
  },
  (req, res) => {
    // Types from both middleware are available
  }
);
```

### `TypedMiddleware<T>`

Type for middleware functions that extend the request object.

```typescript
const authMiddleware: TypedMiddleware<{ userId: string }> = (
  req,
  res,
  next
) => {
  req.userId = "123";
  next();
};
```

<details>
<summary><strong>Alternative APIs</strong></summary>

### `createTypedRouterWithConfig(config)`

```typescript
const router = createTypedRouterWithConfig({
  errorHandler: (error, req, res, next) => {
    // Custom error handling
  },
});
```

### `createTypedRouterWithMiddleware(...middleware)`

```typescript
const router = createTypedRouterWithMiddleware(middleware1, middleware2);
```

</details>

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run type checking
pnpm type-check

# Build in watch mode
pnpm build:watch
```

## License

ISC

## FAQ and Common Patterns

### Middleware Behavior Differences from Express

#### IMPORTANT: Router Middleware and Route Registration

When using middleware with `express-typed-router`, there's an important difference from standard Express behavior:

**In Express**, middleware added with `router.use()` applies to all routes registered _after_ it:

```javascript
// Express middleware behavior
const router = express.Router();
router.use(authMiddleware); // Apply middleware
router.get("/route1", handler1); // Has authMiddleware
router.use(logMiddleware); // Apply another middleware
router.get("/route2", handler2); // Has BOTH auth and log middleware
```

**In express-typed-router**, `useMiddleware()` returns a _new router instance_ for type safety:

```typescript
// ❌ WON'T WORK - middleware not applied to route
const router = createTypedRouter();
router.useMiddleware(authMiddleware); // Returns new router that isn't captured
router.get("/route", handler); // Original router without middleware!

// ✅ CORRECT - chain methods (recommended)
const router = createTypedRouter()
  .useMiddleware(authMiddleware)
  .get("/route", handler);

// ✅ CORRECT - chain directly from middleware call
const router = createTypedRouter();
router.useMiddleware(authMiddleware).get("/route", handler);

// ✅ ALSO CORRECT - use per-route middleware
const router = createTypedRouter();
router.get("/route", { middleware: [authMiddleware] }, handler);
```

This design is necessary for full type safety but requires a different pattern than standard Express.

### Common Express Patterns vs express-typed-router

Here are common Express patterns and how to achieve them with express-typed-router:

#### Pattern 1: Adding middleware to specific routes

**Express:**

```javascript
const router = express.Router();
router.get("/public", publicHandler);
router.use(authMiddleware); // Only affects routes below
router.get("/private", privateHandler); // Has authMiddleware
```

**express-typed-router:**

```typescript
// Option 1: Separate routers
const publicRouter = createTypedRouter();
publicRouter.get("/public", publicHandler);

const privateRouter = createTypedRouter().useMiddleware(authMiddleware);
privateRouter.get("/private", privateHandler);

// Combine in Express
app.use(publicRouter.getRouter());
app.use(privateRouter.getRouter());

// Option 2: Per-route middleware
const router = createTypedRouter();
router.get("/public", publicHandler);
router.get("/private", { middleware: [authMiddleware] }, privateHandler);
```

#### Pattern 2: Adding middleware for a group of routes

**Express:**

```javascript
const router = express.Router();
router.get("/public", handler);

// Only admin routes have auth middleware
const adminRouter = express.Router();
adminRouter.use(authMiddleware);
adminRouter.get("/users", adminHandler1);
adminRouter.get("/settings", adminHandler2);

router.use("/admin", adminRouter);
```

**express-typed-router:**

```typescript
const publicRouter = createTypedRouter();
publicRouter.get("/public", handler);

// Admin router with middleware
const adminRouter = createTypedRouter().useMiddleware(authMiddleware);
adminRouter.get("/users", adminHandler1);
adminRouter.get("/settings", adminHandler2);

// Combine with Express
app.use(publicRouter.getRouter());
app.use("/admin", adminRouter.getRouter());
```

#### Pattern 3: Middleware with dynamically added routes

**Express:**

```javascript
const router = express.Router();
router.use(middleware);

// Later, routes are added dynamically
function addRoute(path, handler) {
  router.get(path, handler); // Has middleware
}
```

**express-typed-router:**

```typescript
// Option 1: Pass the router to the function
const router = createTypedRouter().useMiddleware(middleware);

function addRoute(router, path, handler) {
  router.get(path, handler);
}

// Option 2: Factory function
function createRouteAdder(middleware) {
  const router = createTypedRouter().useMiddleware(middleware);

  return {
    addRoute: (path, handler) => router.get(path, handler),
    getRouter: () => router.getRouter(),
  };
}

const routeAdder = createRouteAdder(middleware);
routeAdder.addRoute("/path", handler);
app.use(routeAdder.getRouter());
```

### Using express-typed-router in JavaScript

JavaScript users don't need to worry about TypeScript types but should still follow the middleware chaining pattern:

```javascript
// JavaScript usage
const { createTypedRouter } = require("@minisylar/express-typed-router");

const router = createTypedRouter().useMiddleware((req, res, next) => {
  req.user = { id: "user123" };
  next();
});

router.get("/users", (req, res) => {
  // req.user is available but not typed (JavaScript doesn't have types)
  res.json({ userId: req.user.id });
});

module.exports = router.getRouter();
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
