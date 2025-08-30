## [1.6.2](https://github.com/Mini-Sylar/express-typed-router/compare/v1.6.1...v1.6.2) (2025-08-30)

### Bug Fixes

* **schema:** enhance ExtractParams to support optional wildcard patterns ([ae085bc](https://github.com/Mini-Sylar/express-typed-router/commit/ae085bc1e12edbe99022fe12de84deb7e218df54))

## [1.6.1](https://github.com/Mini-Sylar/express-typed-router/compare/v1.6.0...v1.6.1) (2025-08-30)

### Bug Fixes

* **schema:** enhance ExtractParams to support named wildcards and various delimiters ([a495d79](https://github.com/Mini-Sylar/express-typed-router/commit/a495d79c8ff39b747fa425607894f7cc443b13a8))

## [1.6.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.5.0...v1.6.0) (2025-08-24)

### Features

* **schema:** migrate router to Standard Schema runtime and generic schema adapters ([6bcdc94](https://github.com/Mini-Sylar/express-typed-router/commit/6bcdc9410c52470ba4eabb95f54f55097e4b2a87))

## [1.5.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.4.4...v1.5.0) (2025-08-10)

### ⚠ BREAKING CHANGES

* None - all changes are backward compatible enhancements

### Features

* enhance route handler return type support and upgrade build tooling ([e72c0a3](https://github.com/Mini-Sylar/express-typed-router/commit/e72c0a31d277168e0380d678e9cd63fcaa7bec3c))

## [1.4.4](https://github.com/Mini-Sylar/express-typed-router/compare/v1.4.3...v1.4.4) (2025-07-13)

### Bug Fixes

* Update zod compatibility with v3 and v4 stable ([5e71e1d](https://github.com/Mini-Sylar/express-typed-router/commit/5e71e1d3bd6cbf6d2bfb9c377702ea41cb6fe5a9))

## [1.4.3](https://github.com/Mini-Sylar/express-typed-router/compare/v1.4.2...v1.4.3) (2025-06-16)

### Bug Fixes

* support deep recursive types and remove type depth limits\n\n- Allow inference for deeply nested, Zod-like schemas (e.g. drizzle-zod)\n- Remove all artificial recursion depth limits from type helpers\n- Ensures compatibility with complex Zod-like schemas ([b16be27](https://github.com/Mini-Sylar/express-typed-router/commit/b16be276ed1615e4b02ab727abd18fe08661d60d))

## [1.4.2](https://github.com/Mini-Sylar/express-typed-router/compare/v1.4.1...v1.4.2) (2025-06-15)

### Bug Fixes

* add recursion depth limits for TypeScript 5.4+ compatibility ([6c4546a](https://github.com/Mini-Sylar/express-typed-router/commit/6c4546a83162787f3e43802591aa4625668f43a5))

## [1.4.1](https://github.com/Mini-Sylar/express-typed-router/compare/v1.4.0...v1.4.1) (2025-06-08)

### Bug Fixes

* ensure query property is read-only after validation ([42a87c1](https://github.com/Mini-Sylar/express-typed-router/commit/42a87c1731cf79d5f01ae78821991059f4b7ec51))

## [1.4.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.3.0...v1.4.0) (2025-06-07)

### Features

* add support for both Zod v3 and v4 ([26c4de0](https://github.com/Mini-Sylar/express-typed-router/commit/26c4de0a937be129178f5b4f0abc6b87374437d3))

## [1.3.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.2.0...v1.3.0) (2025-06-07)

### Features

* enhance Zod compatibility and update TypeScript configuration ([4765231](https://github.com/Mini-Sylar/express-typed-router/commit/476523183ba4a4a33e08877c161e1fa6a18d01b5))

## [1.2.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.1.0...v1.2.0) (2025-05-25)

### ⚠ BREAKING CHANGES

* useTypedMiddleware() has been renamed to useMiddleware() for
a cleaner, more Express-like API. Additionally, middleware behavior now
requires proper chaining for type safety - middleware must be chained with
route handlers to ensure proper

### Features

* simplify API and improve middleware type inference ([a2a4c6e](https://github.com/Mini-Sylar/express-typed-router/commit/a2a4c6eb249ceab09759148ca53b2c71fc31c731))

## [1.1.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.0.1...v1.1.0) (2025-05-25)

### Features

* add typed response locals support to middleware and routes ([1484b2f](https://github.com/Mini-Sylar/express-typed-router/commit/1484b2fc919943d342d6d342700ac223b5e1b6d8))

## [1.0.1](https://github.com/Mini-Sylar/express-typed-router/compare/v1.0.0...v1.0.1) (2025-05-24)

### Bug Fixes

* add Express version requirement note to installation section ([749240c](https://github.com/Mini-Sylar/express-typed-router/commit/749240ca0a370e79932344e20457949cbb65e7de))

## 1.0.0 (2025-05-24)

### Features

* initial release of express-typed-router ([e73da03](https://github.com/Mini-Sylar/express-typed-router/commit/e73da031bbf45ae219da5518b47e107677da6872))

### Bug Fixes

* update pnpm version to 10.11.0 in release workflow ([e6684cf](https://github.com/Mini-Sylar/express-typed-router/commit/e6684cfcb9bad33e47bf1131c52199652dc18b79))
* update version to 0.0.0 in package.json and enhance release configuration in .releaserc.json ([ad92f49](https://github.com/Mini-Sylar/express-typed-router/commit/ad92f4977e714fe6e5cd5f04e62aa94bee43bea2))
