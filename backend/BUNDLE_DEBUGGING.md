# Bundle Size Debugging Guide

This guide explains how to debug and analyze large bundle sizes in the fourtiesnyc backend.

## Quick Commands

Run these commands from the `backend/` directory:

```bash
# Analyze dependencies and find heavy packages
npm run check-dependencies

# Check serverless configuration
npm run check-serverless

# Create bundle with analysis (without deploying)
npm run analyze-bundle

# Check bundle sizes after building
npm run bundle-size
```

## GitHub Actions Integration

The deployment workflow now includes automatic bundle analysis:

1. **Dependency Analysis**: Shows top 15 largest dependencies and warns about large production dependencies
2. **Serverless Config Check**: Displays configuration affecting bundle size
3. **Bundle Analysis**: Creates webpack bundle analyzer reports
4. **Size Reports**: Shows final bundle sizes for each Lambda function
5. **Artifacts**: Uploads bundle analysis reports for download

## Analysis Tools

### 1. Dependency Analysis (`npm run check-dependencies`)

- Shows disk usage of all dependencies
- Identifies large production dependencies (>1MB)
- Checks for common bundle bloaters
- Reports total dependency counts

### 2. Bundle Analysis (`npm run analyze-bundle`)

- Creates visual bundle analyzer report (`bundle-report.html`)
- Generates detailed stats (`bundle-stats.json`)
- Shows what's actually included in the bundle
- Identifies duplicate dependencies

### 3. Serverless Config Check (`npm run check-serverless`)

- Shows packaging configuration
- Lists excluded modules
- Displays function configurations
- Shows Lambda size limits

## Common Bundle Bloaters

These dependencies are often large and should be externalized:

- `aws-sdk` / `@aws-sdk/*` - Already externalized ✅
- `sharp` - Already externalized ✅
- `@sparticuz/chromium` - Already externalized ✅
- `puppeteer-core` - Already externalized ✅
- `typescript` - Already externalized ✅
- `webpack` - Already externalized ✅

## Bundle Size Limits

- **Lambda deployment package (zipped)**: 50 MB
- **Lambda deployment package (unzipped)**: 250 MB
- **Lambda layers (zipped)**: 50 MB per layer
- **Maximum layers per function**: 5

## Optimization Strategies

### 1. Externalize Heavy Dependencies

Add to `serverless.yml` under `custom.webpack.includeModules.forceExclude`:

```yaml
forceExclude:
  - 'heavy-dependency'
```

### 2. Use Lambda Layers

Move large, shared dependencies to Lambda layers:

```yaml
layers:
  myLayer:
    path: layer
    name: my-layer
```

### 3. Tree Shaking

Ensure imports are specific:

```javascript
// ✅ Good - tree-shakeable
import { specific } from 'lodash';

// ❌ Bad - imports entire library
import _ from 'lodash';
```

### 4. Dynamic Imports

Use dynamic imports for code that's not always needed:

```javascript
const heavyModule = await import('heavy-module');
```

### 5. Webpack Optimization

The webpack config already includes:

- Production mode minification
- External dependencies
- Tree shaking

## Troubleshooting

### Bundle Too Large Error

1. Run `npm run check-dependencies` to identify heavy dependencies
2. Run `npm run analyze-bundle` to see what's included
3. Check if large dependencies can be externalized
4. Consider moving to Lambda layers

### Unexpected Dependencies

1. Use bundle analyzer to trace import chains
2. Check for accidental imports from dev dependencies
3. Look for duplicate dependencies with different versions

### GitHub Actions Artifacts

Download the bundle analysis artifacts from GitHub Actions to:

- View the interactive bundle analyzer report
- Examine detailed webpack stats
- See exact file sizes in the deployment package

## Manual Analysis

For deeper investigation:

```bash
# Install dependencies
npm ci

# Generate bundle with analysis
ANALYZE_BUNDLE=true npm run deploy:dry

# View the generated report
open bundle-report.html
```

The bundle analyzer report shows:

- Interactive treemap of bundle contents
- Size of each module and dependency
- Import chains and relationships
- Duplicate code detection
