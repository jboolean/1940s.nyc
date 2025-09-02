#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

function analyzeServerlessConfig() {
  console.log('⚙️  Serverless Configuration Analysis\n');

  try {
    const serverlessYml = fs.readFileSync('serverless.yml', 'utf8');
    const config = yaml.load(serverlessYml);

    console.log('📦 Package Configuration:');
    console.log(
      `- Individual packaging: ${config.package?.individually || false}`
    );
    console.log(
      `- Include patterns: ${JSON.stringify(config.package?.patterns || [])}`
    );

    console.log('\n🔌 Plugin Configuration:');
    if (config.plugins) {
      config.plugins.forEach((plugin) => console.log(`- ${plugin}`));
    }

    console.log('\n⚡ Functions:');
    if (config.functions) {
      Object.entries(config.functions).forEach(([name, func]) => {
        console.log(`- ${name}:`);
        console.log(`  Handler: ${func.handler}`);
        console.log(`  Memory: ${func.memorySize || 'default (1024MB)'}`);
        console.log(`  Timeout: ${func.timeout || 'default (6s)'}`);
        if (func.layers) {
          console.log(`  Layers: ${func.layers.length}`);
        }
      });
    }

    console.log('\n🚫 Webpack Exclusions:');
    if (config.custom?.webpack?.includeModules?.forceExclude) {
      config.custom.webpack.includeModules.forceExclude.forEach((exclude) => {
        console.log(`- ${exclude}`);
      });
    }

    console.log('\n📊 Lambda Size Limits:');
    console.log('- Deployment package (zipped): 50 MB');
    console.log('- Deployment package (unzipped): 250 MB');
    console.log('- Layers (zipped): 50 MB per layer');
    console.log('- Total layers per function: 5');
  } catch (error) {
    console.error('Error reading serverless.yml:', error.message);
  }
}

analyzeServerlessConfig();
