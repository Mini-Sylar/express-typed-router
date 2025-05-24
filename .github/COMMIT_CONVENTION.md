# Conventional Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **perf**: A code change that improves performance (triggers patch version bump)
- **refactor**: A code change that neither fixes a bug nor adds a feature (triggers patch version bump)
- **docs**: Documentation only changes (no version bump)
- **style**: Changes that do not affect the meaning of the code (no version bump)
- **test**: Adding missing tests or correcting existing tests (no version bump)
- **build**: Changes that affect the build system or external dependencies (no version bump)
- **ci**: Changes to CI configuration files and scripts (no version bump)
- **chore**: Other changes that don't modify src or test files (no version bump)
- **revert**: Reverts a previous commit (triggers patch version bump)

## Breaking Changes

To trigger a major version bump, add `BREAKING CHANGE:` in the commit footer or use `!` after the type:

```
feat!: remove deprecated API
```

## Examples

```
feat: add support for Express 5 routing patterns
fix: resolve type inference for optional parameters
docs: update README with new examples
chore: update dependencies
feat!: remove legacy router creation methods

BREAKING CHANGE: The createLegacyRouter function has been removed. Use createTypedRouter instead.
```

## Scopes (Optional)

- **api**: Public API changes
- **types**: TypeScript type definitions
- **router**: Router-related changes
- **validation**: Validation logic
- **docs**: Documentation
- **build**: Build configuration
- **ci**: Continuous integration
