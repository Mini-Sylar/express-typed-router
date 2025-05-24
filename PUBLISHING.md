# Publishing Guide

## Setup (One-time)

### 1. NPM Account Setup

```bash
# Create NPM account at https://www.npmjs.com/signup
# Login to NPM
npm login
```

### 2. GitHub Secrets Setup

Go to your GitHub repository settings → Secrets and variables → Actions, and add:

- `NPM_TOKEN`: Your NPM access token (generate at https://www.npmjs.com/settings/tokens)

### 3. Repository Setup

```bash
# Update package.json repository URLs to your actual GitHub repo
# Update author information
```

## Automated Publishing (Recommended)

### Using Semantic Release (No manual version bumping needed!)

1. **Make your changes**
2. **Commit using conventional commits:**
   ```bash
   git add .
   git commit -m "feat: add new router method"
   # or
   git commit -m "fix: resolve type inference issue"
   # or
   git commit -m "docs: update README examples"
   ```
3. **Push to main branch:**
   ```bash
   git push origin main
   ```
4. **GitHub Actions automatically:**
   - Runs tests and type checking
   - Determines version bump based on commit messages
   - Generates changelog
   - Creates GitHub release
   - Publishes to NPM

## Manual Publishing (Not recommended)

If you need to publish manually:

```bash
# 1. Update version in package.json
npm version patch  # or minor, major

# 2. Build the package
pnpm run build

# 3. Publish to NPM
npm publish

# 4. Push the version tag
git push --follow-tags
```

## Commit Message Impact on Versioning

- `feat:` → **Minor** version bump (1.0.0 → 1.1.0)
- `fix:` → **Patch** version bump (1.0.0 → 1.0.1)
- `feat!:` or `BREAKING CHANGE:` → **Major** version bump (1.0.0 → 2.0.0)
- `docs:`, `chore:`, `style:` → **No version bump**

## Examples

```bash
# New feature (minor bump)
git commit -m "feat: add middleware support for typed routes"

# Bug fix (patch bump)
git commit -m "fix: resolve parameter extraction for nested routes"

# Breaking change (major bump)
git commit -m "feat!: change router API to improve type safety"

# Documentation (no bump)
git commit -m "docs: add examples for custom validation"
```

## Testing Releases

Test your release process without publishing:

```bash
pnpm run release:dry
```

## Release Branches

- **main**: Stable releases
- **beta**: Beta releases (add `--prerelease beta` to semantic-release)
- **alpha**: Alpha releases (add `--prerelease alpha` to semantic-release)

## Troubleshooting

### NPM Publish Errors

- Check if package name is available
- Verify NPM token has publish permissions
- Ensure you're a member of the organization (for scoped packages)

### GitHub Actions Failures

- Check secrets are properly set
- Verify conventional commit format
- Ensure tests pass locally first
