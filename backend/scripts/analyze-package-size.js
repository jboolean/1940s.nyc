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

function analyzePackageContents() {
  console.log('📦 Serverless Package Analysis\n');

  // Check if .serverless directory exists
  const serverlessDir = './.serverless';
  if (!fs.existsSync(serverlessDir)) {
    console.log('❌ No .serverless directory found. Run packaging first.');
    return;
  }

  console.log('🔍 Analyzing package contents...\n');

  // List all files in .serverless directory
  const files = fs.readdirSync(serverlessDir);
  const zipFiles = files.filter((f) => f.endsWith('.zip'));
  const otherFiles = files.filter((f) => !f.endsWith('.zip'));

  console.log('📁 Package Directory Contents:');
  files.forEach((file) => {
    const filePath = path.join(serverlessDir, file);
    const stats = fs.statSync(filePath);
    const size = formatBytes(stats.size);
    const type = stats.isDirectory() ? 'DIR' : 'FILE';
    console.log(`${type.padEnd(4)} ${file.padEnd(30)} ${size}`);
  });

  if (zipFiles.length > 0) {
    console.log('\n🗜️  ZIP File Analysis:');
    zipFiles.forEach((zipFile) => {
      const zipPath = path.join(serverlessDir, zipFile);
      const zipSize = fs.statSync(zipPath).size;
      console.log(`\n📦 ${zipFile} (${formatBytes(zipSize)}):`);

      // Extract and analyze ZIP contents
      try {
        const tempDir = path.join(serverlessDir, `temp-${Date.now()}`);
        fs.mkdirSync(tempDir);

        // Extract ZIP
        execSync(`cd "${tempDir}" && unzip -q "../${zipFile}"`);

        // Get directory sizes using du
        try {
          const duOutput = execSync(`du -sh "${tempDir}"/*`, {
            encoding: 'utf8',
          });
          console.log('  Contents by size:');
          duOutput
            .split('\n')
            .filter((line) => line.trim())
            .forEach((line) => {
              const [size, filePath] = line.split('\t');
              const fileName = path.basename(filePath);
              console.log(`    ${size.padEnd(8)} ${fileName}`);
            });
        } catch (duError) {
          // Fallback to basic file listing
          const extractedFiles = fs.readdirSync(tempDir);
          console.log('  Contents:');
          extractedFiles.forEach((file) => {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              console.log(`    DIR      ${file}/`);
            } else {
              console.log(`    ${formatBytes(stats.size).padEnd(8)} ${file}`);
            }
          });
        }

        // Check for large files
        console.log('\n  🔍 Large files (>1MB):');
        const findLargeFiles = (dir, prefix = '') => {
          const items = fs.readdirSync(dir);
          items.forEach((item) => {
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
              findLargeFiles(itemPath, prefix + item + '/');
            } else if (stats.size > 1024 * 1024) {
              console.log(
                `    ${formatBytes(stats.size).padEnd(8)} ${prefix}${item}`
              );
            }
          });
        };
        findLargeFiles(tempDir);

        // Clean up
        execSync(`rm -rf "${tempDir}"`);
      } catch (error) {
        console.log(`  ❌ Could not analyze ZIP contents: ${error.message}`);
      }
    });
  }

  // Check against Lambda limits
  console.log('\n📊 Lambda Size Limits Check:');
  zipFiles.forEach((zipFile) => {
    const zipPath = path.join(serverlessDir, zipFile);
    const zipSize = fs.statSync(zipPath).size;
    const sizeMB = zipSize / (1024 * 1024);

    console.log(`${zipFile}:`);
    console.log(`  Size: ${formatBytes(zipSize)} (${sizeMB.toFixed(2)} MB)`);

    if (sizeMB > 50) {
      console.log(`  ❌ EXCEEDS 50MB limit! (${sizeMB.toFixed(2)} MB)`);
    } else if (sizeMB > 40) {
      console.log(`  ⚠️  Close to 50MB limit (${sizeMB.toFixed(2)} MB)`);
    } else {
      console.log(`  ✅ Within 50MB limit`);
    }
  });

  console.log('\n💡 To create package without deploying:');
  console.log('   serverless package --stage local');
}

analyzePackageContents();
