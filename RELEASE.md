# Release Process

This document describes how to create a new release of Spytial Sterling.

## Quick Release (Recommended)

The easiest way to create a release:

```bash
# 1. Update version in package.json
npm version patch  # or minor, or major

# 2. Use the utility script (it will prompt for confirmation)
./util/pushreleasetag

# Or test first with dry-run
./util/pushreleasetag --dry-run
```

The script will:
- Read the version from `package.json`
- Create a tag (e.g., `v2.0.1`)
- Push it to GitHub
- Trigger the automated release workflow

## Automated Release via GitHub Actions

The project uses GitHub Actions to automatically build and publish releases. There are two ways to trigger a release:

### 1. Push a Git Tag (Recommended)

This is the standard way to create a release:

```bash
# Update version in package.json first
npm version patch  # or minor, or major

# Push the tag to GitHub
git push origin v2.0.1  # or whatever version you set

# Alternatively, push all tags
git push --tags
```

The GitHub Actions workflow will:
1. Detect the new tag
2. Run tests
3. Build both Alloy and Forge distributions
4. Create a GitHub release with the tag name
5. Upload `sterling-alloy.zip` and `sterling-forge.zip` as release assets

### 2. Manual Workflow Dispatch

You can also trigger a release manually from the GitHub Actions UI:

1. Go to the [Actions tab](../../actions)
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter the tag name (e.g., `v2.0.1`)
5. Click "Run workflow"

## Release Assets

Each release includes two zip files:

- **sterling-alloy.zip**: Webpack build configured for Alloy Analyzer
- **sterling-forge.zip**: Webpack build configured for Forge

Both contain:
- Bundled JavaScript files
- HTML entry point
- All necessary assets (CSS, fonts, etc.)

## Version Numbering

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Incompatible API changes
- **MINOR** version: Add functionality in a backward compatible manner  
- **PATCH** version: Backward compatible bug fixes

Update the version in `package.json` before creating a release tag.

## Manual Release (if needed)

If you need to create a release manually without using GitHub Actions:

```bash
# Build both distributions
yarn build:alloy
cd dist && zip -r ../sterling-alloy.zip . && cd ..

yarn build:forge
cd dist && zip -r ../sterling-forge.zip . && cd ..

# Create release via GitHub UI or gh CLI
gh release create v2.0.1 \
  sterling-alloy.zip \
  sterling-forge.zip \
  --title "Release v2.0.1" \
  --notes "Release notes here"
```

## Continuous Integration

Every push and pull request triggers the CI workflow which:
- Runs tests
- Builds both Alloy and Forge distributions
- Uploads build artifacts (available for 7 days)

You can download these artifacts from the Actions tab to test builds before creating a release.
