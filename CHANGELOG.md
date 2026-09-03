## [1.9.9](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.8...v1.9.9) (2026-09-03)

### Bug Fixes

* add validation failure hooks ([#15](https://github.com/Mini-Sylar/express-typed-router/issues/15)) ([074b5c6](https://github.com/Mini-Sylar/express-typed-router/commit/074b5c6b257fd15aa8fe3a9c0766ca5b8b746557))
* let validation-failure hooks control the response ([b61eaec](https://github.com/Mini-Sylar/express-typed-router/commit/b61eaecf4b38ab12058615b47fbfbd5840c96df3))
* **router:** expand regex alternatives in OpenAPI docs ([27bfc5c](https://github.com/Mini-Sylar/express-typed-router/commit/27bfc5c3a133e46def8920697763de58f3a295e4)), closes [#16](https://github.com/Mini-Sylar/express-typed-router/issues/16)

## [1.9.8](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.7...v1.9.8) (2026-08-26)

### Bug Fixes

* add defineMiddleware to keep narrow tuple typing when reused ([#8](https://github.com/Mini-Sylar/express-typed-router/issues/8)) ([7a326bf](https://github.com/Mini-Sylar/express-typed-router/commit/7a326bf83bb2b12f83255a61eded40fecc748917))
* add generateOpenApiSpec for build-time spec generation ([#13](https://github.com/Mini-Sylar/express-typed-router/issues/13)) ([49982ee](https://github.com/Mini-Sylar/express-typed-router/commit/49982ee47e84745918880ba596de59ae22e3db20))

### Documentation

* add shareable gotchas heading ([07fa2b8](https://github.com/Mini-Sylar/express-typed-router/commit/07fa2b827b124ae7faad2acf6c147504cc3aee0f))
* document middleware tuple inference ([a1bb2cd](https://github.com/Mini-Sylar/express-typed-router/commit/a1bb2cd722507474bd4a1f97a6438441ef5f8bc7))

## [1.9.7](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.6...v1.9.7) (2026-08-25)

### Bug Fixes

* **types:** prevent schema inference from reusable handlers ([7497157](https://github.com/Mini-Sylar/express-typed-router/commit/7497157aa296aaa79f399e84188ec7578fb54c48))

## [1.9.6](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.5...v1.9.6) (2026-08-25)

### Bug Fixes

* **router:** expand regex alternatives in OpenAPI docs ([fd11d99](https://github.com/Mini-Sylar/express-typed-router/commit/fd11d991cb5a53244924ab7723ae00216f04c129))
* **types:** improve reusable handlers and regex docs ([a1824fd](https://github.com/Mini-Sylar/express-typed-router/commit/a1824fdd97975702766c89c1af853c34edff4ce4))

## [1.9.5](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.4...v1.9.5) (2026-08-24)

### Bug Fixes

* accept RegExp route paths ([#6](https://github.com/Mini-Sylar/express-typed-router/issues/6)) ([3d2c6f5](https://github.com/Mini-Sylar/express-typed-router/commit/3d2c6f5642860a952b65c4fee786861efdc9cf39))
* add paramsSchema for validating and typing route params ([569cb32](https://github.com/Mini-Sylar/express-typed-router/commit/569cb32ca029240608c3016850ae42bb588406ba))
* resolve optional peer deps relative to entry script, not just cwd ([3769fa8](https://github.com/Mini-Sylar/express-typed-router/commit/3769fa8f81c304a150a492be864c096e4bf1bea3))

## [1.9.4](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.3...v1.9.4) (2026-08-23)

### Bug Fixes

* consolidate get() overloads to fix middleware+schema type inference ([b7f6011](https://github.com/Mini-Sylar/express-typed-router/commit/b7f6011b91a2c2f371265979f04ac107f97323f5)), closes [#1](https://github.com/Mini-Sylar/express-typed-router/issues/1)
* enforce real schemas for bodySchema/querySchema and consolidate all HTTP method overloads ([b44b8dd](https://github.com/Mini-Sylar/express-typed-router/commit/b44b8dd90336d6d027d5ebd4f1cd8a4d1b1645f8)), closes [#1](https://github.com/Mini-Sylar/express-typed-router/issues/1)
* move get() schema-only overload to the end so it doesn't shadow middleware overloads ([fa5123d](https://github.com/Mini-Sylar/express-typed-router/commit/fa5123d94228202d35a7e147ccb16dacf835d465)), closes [#1](https://github.com/Mini-Sylar/express-typed-router/issues/1)
* revert conventional-changelog-conventionalcommits to 9.3.1 ([97702ad](https://github.com/Mini-Sylar/express-typed-router/commit/97702ad8bdaf25573fb52cff3028cf59e27ba260))

### Documentation

* add GitHub Sponsors badge and FUNDING.yml ([da55327](https://github.com/Mini-Sylar/express-typed-router/commit/da5532755e66c496447299e1f1266804dca39909))

## [1.9.3](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.2...v1.9.3) (2026-06-01)

### Bug Fixes

* auto-create specOutputPath directory and harden response inference ([65c418d](https://github.com/Mini-Sylar/express-typed-router/commit/65c418df14b2dc65b4ddb5560b727b1c23ca8bd7))

## [1.9.2](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.1...v1.9.2) (2026-06-01)

### Bug Fixes

* persist inferred response schemas across restarts and emit declared responseSchema ([39eecc6](https://github.com/Mini-Sylar/express-typed-router/commit/39eecc644a8c204dfd4693a1b966c40d7c32ee0a))

## [1.9.1](https://github.com/Mini-Sylar/express-typed-router/compare/v1.9.0...v1.9.1) (2026-05-31)

### Bug Fixes

* normalize Express 5 optional-segment paths in OpenAPI output ([ac4c9bb](https://github.com/Mini-Sylar/express-typed-router/commit/ac4c9bbee568999448ca7d7582b06855c354f440))

## [1.9.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.8.2...v1.9.0) (2026-05-31)

### Features

* infer redacted response schemas from live traffic instead of storing raw examples ([0074944](https://github.com/Mini-Sylar/express-typed-router/commit/007494435c0cc8435c7a2cf389a641985a7a4e91))

## [1.8.2](https://github.com/Mini-Sylar/express-typed-router/compare/v1.8.1...v1.8.2) (2026-05-31)

### Bug Fixes

* capture response examples from res.send(), not just res.json() ([2617f84](https://github.com/Mini-Sylar/express-typed-router/commit/2617f842328a966dbb1ab1e82bdeaaf71200a3b6))

## [1.8.1](https://github.com/Mini-Sylar/express-typed-router/compare/v1.8.0...v1.8.1) (2026-05-31)

### Bug Fixes

* update README image for npm ([b2bd74b](https://github.com/Mini-Sylar/express-typed-router/commit/b2bd74b92ec879ad17d43cccf8145dd9f8aa0b27))

## [1.8.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.7.1...v1.8.0) (2026-05-31)

### Features

* add response sampling and documentation generation improvements ([b26fda2](https://github.com/Mini-Sylar/express-typed-router/commit/b26fda282a0ca3ec4ba09eb62a26bc95a5eb28fe))

### Bug Fixes

* trigger release ([8bfa9a0](https://github.com/Mini-Sylar/express-typed-router/commit/8bfa9a0ad8b18a9793dea37ac7c49416f4387563))
* trigger release ([dc7b7e6](https://github.com/Mini-Sylar/express-typed-router/commit/dc7b7e66c821cf9265a055456b2bc67af52fccf3))

## [1.8.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.7.1...v1.8.0) (2026-05-31)

### Features

* add response sampling and documentation generation improvements ([b26fda2](https://github.com/Mini-Sylar/express-typed-router/commit/b26fda282a0ca3ec4ba09eb62a26bc95a5eb28fe))

### Bug Fixes

* trigger release ([dc7b7e6](https://github.com/Mini-Sylar/express-typed-router/commit/dc7b7e66c821cf9265a055456b2bc67af52fccf3))

## [1.8.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.7.1...v1.8.0) (2026-05-31)

### Features

* add response sampling and documentation generation improvements ([b26fda2](https://github.com/Mini-Sylar/express-typed-router/commit/b26fda282a0ca3ec4ba09eb62a26bc95a5eb28fe))

## [1.7.1](https://github.com/Mini-Sylar/express-typed-router/compare/v1.7.0...v1.7.1) (2026-05-31)

### Bug Fixes

* improve .use() to accept TypedRouter instances directly ([fdae9e1](https://github.com/Mini-Sylar/express-typed-router/commit/fdae9e12d626ce885feee828177e3a3f4b697296))

## [1.7.0](https://github.com/Mini-Sylar/express-typed-router/compare/v1.6.2...v1.7.0) (2026-05-31)

### Features

* add OpenAPI docs generation, client type support, and schema coverage ([3f1a4c5](https://github.com/Mini-Sylar/express-typed-router/commit/3f1a4c55a76013cea2112a999c2cdfa7028ef920))

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
