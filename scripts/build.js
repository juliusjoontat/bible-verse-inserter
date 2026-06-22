/**
 * Build Script - Builds extension for different browsers
 * Usage: node scripts/build.js --browser chrome [--dev]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const browserArg = args[args.indexOf('--browser') + 1] || 'chrome';
const isDev = args.includes('--dev');

const browsers = ['chrome', 'firefox', 'edge', 'opera'];
const srcDir = path.join(__dirname, '..', 'src');
const distDir = path.join(__dirname, '..', 'dist', browserArg);

console.log(`🔨 Building for ${browserArg}${isDev ? ' (dev mode)' : ''}...`);

// Create dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

/**
 * Copy files from src to dist
 */
function copyFiles() {
  console.log('📋 Copying files...');
  
  const files = fs.readdirSync(srcDir);
  
  for (const file of files) {
    const srcFile = path.join(srcDir, file);
    const distFile = path.join(distDir, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      // Create directories
      if (!fs.existsSync(distFile)) {
        fs.mkdirSync(distFile, { recursive: true });
      }
      // Copy directory contents
      const subFiles = fs.readdirSync(srcFile);
      for (const subFile of subFiles) {
        fs.copyFileSync(path.join(srcFile, subFile), path.join(distFile, subFile));
      }
    } else {
      fs.copyFileSync(srcFile, distFile);
    }
  }
}

/**
 * Download WebExtension polyfill
 */
function downloadPolyfill() {
  console.log('⬇️  Downloading WebExtension polyfill...');
  
  const polyfillPath = path.join(distDir, 'browser-polyfill.js');
  
  // Check if polyfill already exists
  if (fs.existsSync(polyfillPath)) {
    console.log('✓ Polyfill already downloaded');
    return;
  }
  
  try {
    // Try to use npm's polyfill if installed
    const polyfillSrc = path.join(__dirname, '..', 'node_modules', 'webextension-polyfill', 'dist', 'browser-polyfill.js');
    
    if (fs.existsSync(polyfillSrc)) {
      fs.copyFileSync(polyfillSrc, polyfillPath);
      console.log('✓ Polyfill copied from node_modules');
    } else {
      // Download from CDN
      const fetch = require('node-fetch');
      const url = 'https://unpkg.com/webextension-polyfill@0.10.0/dist/browser-polyfill.js';
      
      fetch(url)
        .then(res => res.text())
        .then(text => {
          fs.writeFileSync(polyfillPath, text);
          console.log('✓ Polyfill downloaded from CDN');
        })
        .catch(err => {
          console.error('✗ Failed to download polyfill:', err.message);
          process.exit(1);
        });
    }
  } catch (error) {
    console.error('✗ Error downloading polyfill:', error.message);
    // Create a minimal polyfill stub
    const stubPolyfill = `
// Polyfill stub - using chrome API
if (typeof browser === 'undefined') {
  window.browser = chrome;
}
    `.trim();
    fs.writeFileSync(polyfillPath, stubPolyfill);
    console.log('⚠️  Using polyfill stub');
  }
}

/**
 * Modify manifest for browser-specific needs
 */
function updateManifest() {
  console.log('🔧 Updating manifest for ' + browserArg + '...');
  
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Browser-specific modifications
  switch (browserArg) {
    case 'firefox':
      // Firefox specific settings
      manifest.browser_specific_settings = manifest.browser_specific_settings || {};
      manifest.browser_specific_settings.gecko = {
        id: 'bible-verse-inserter@example.com',
        strict_min_version: '109.0'
      };
      break;
      
    case 'edge':
      // Edge specific settings
      manifest.author = 'Bible Extension';
      break;
      
    case 'opera':
      // Opera specific settings
      manifest.author = 'Bible Extension';
      break;
  }
  
  // Add development flag if in dev mode
  if (isDev) {
    manifest.version = manifest.version + '.dev';
  }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✓ Manifest updated');
}

/**
 * Validate the build
 */
function validate() {
  console.log('✓ Validating build...');
  
  const requiredFiles = ['manifest.json', 'popup.html', 'popup.js', 'content.js', 'background.js', 'config.js'];
  
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      console.error('✗ Missing required file:', file);
      process.exit(1);
    }
  }
  
  console.log('✓ All required files present');
}

/**
 * Main build process
 */
async function build() {
  try {
    copyFiles();
    await new Promise(resolve => {
      downloadPolyfill();
      setTimeout(resolve, 1000);
    });
    updateManifest();
    validate();
    
    console.log(`\n✅ Build complete for ${browserArg}!`);
    console.log(`📁 Output: ${distDir}\n`);
  } catch (error) {
    console.error('✗ Build failed:', error.message);
    process.exit(1);
  }
}

build();
