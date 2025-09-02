#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(currentPath) {
    try {
      const stats = fs.statSync(currentPath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        files.forEach((file) => {
          calculateSize(path.join(currentPath, file));
        });
      } else {
        totalSize += stats.size;
      }
    } catch (err) {
      // Ignore permission errors or missing files
    }
  }

  try {
    calculateSize(dirPath);
  } catch (err) {
    return 0;
  }

  return totalSize;
}

function analyzeDependencies() {
  console.log('📦 Dependency Analysis Report\n');

  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  console.log(`Total dependencies: ${Object.keys(allDeps).length}`);
  console.log(
    `Production dependencies: ${
      Object.keys(packageJson.dependencies || {}).length
    }`
  );
  console.log(
    `Dev dependencies: ${
      Object.keys(packageJson.devDependencies || {}).length
    }\n`
  );

  // Analyze node_modules sizes
  const nodeModulesPath = './node_modules';
  if (fs.existsSync(nodeModulesPath)) {
    const depSizes = [];

    Object.keys(allDeps).forEach((depName) => {
      const depPath = path.join(nodeModulesPath, depName);
      if (fs.existsSync(depPath)) {
        const size = getDirectorySize(depPath);
        const isProduction =
          packageJson.dependencies && packageJson.dependencies[depName];
        depSizes.push({ name: depName, size, isProduction });
      }
    });

    // Sort by size
    depSizes.sort((a, b) => b.size - a.size);

    console.log('🔍 Top 15 largest dependencies by disk usage:');
    console.log('Name'.padEnd(35) + 'Size'.padEnd(12) + 'Type');
    console.log('-'.repeat(60));

    depSizes.slice(0, 15).forEach((dep) => {
      const type = dep.isProduction ? 'production' : 'dev';
      console.log(
        dep.name.padEnd(35) + formatBytes(dep.size).padEnd(12) + type
      );
    });

    console.log('\n🚨 Large production dependencies (>1MB):');
    const largeProdDeps = depSizes.filter(
      (dep) => dep.isProduction && dep.size > 1024 * 1024
    );
    if (largeProdDeps.length > 0) {
      largeProdDeps.forEach((dep) => {
        console.log(`- ${dep.name}: ${formatBytes(dep.size)}`);
      });
    } else {
      console.log('None found');
    }
  }

  // Check bundle sizes if .serverless exists
  const serverlessPath = './.serverless';
  if (fs.existsSync(serverlessPath)) {
    console.log('\n📦 Lambda Bundle Sizes:');
    const zipFiles = fs
      .readdirSync(serverlessPath)
      .filter((f) => f.endsWith('.zip'));

    if (zipFiles.length > 0) {
      zipFiles.forEach((file) => {
        const filePath = path.join(serverlessPath, file);
        const size = fs.statSync(filePath).size;
        console.log(`${file}: ${formatBytes(size)}`);

        // Warn about large bundles
        if (size > 50 * 1024 * 1024) {
          // 50MB
          console.log(
            `⚠️  WARNING: ${file} is very large (${formatBytes(size)})`
          );
        }
      });
    } else {
      console.log('No zip files found in .serverless directory');
    }
  }

  // Check for common bundle bloaters
  console.log('\n🔍 Checking for common bundle bloaters:');
  const commonBloaters = [
    'aws-sdk',
    'sharp',
    '@sparticuz/chromium',
    'puppeteer-core',
    'typescript',
    'webpack',
    '@swc/core',
    'moment',
    'lodash',
  ];

  commonBloaters.forEach((bloater) => {
    if (allDeps[bloater]) {
      const isProduction =
        packageJson.dependencies && packageJson.dependencies[bloater];
      const status = isProduction ? '❌ PRODUCTION' : '✅ DEV-ONLY';
      console.log(`${bloater}: ${status}`);
    }
  });
}

try {
  analyzeDependencies();
} catch (error) {
  console.error('Error analyzing dependencies:', error.message);
  process.exit(1);
}
