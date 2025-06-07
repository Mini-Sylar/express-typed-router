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
