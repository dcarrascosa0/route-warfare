#!/usr/bin/env node

/**
 * Production build script with optimization checks and validation
 */

import { execSync } from 'child_process';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

// Performance budgets (in bytes)
const PERFORMANCE_BUDGETS = {
  MAIN_BUNDLE: 200 * 1024, // 200KB gzipped
  VENDOR_BUNDLE: 300 * 1024, // 300KB gzipped
  CHUNK_SIZE: 100 * 1024, // 100KB gzipped per chunk
  TOTAL_INITIAL: 500 * 1024, // 500KB gzipped total
  CSS_SIZE: 50 * 1024, // 50KB gzipped
};

// Required files for production
const REQUIRED_FILES = [
  'index.html',
  'manifest.json',
  'sw.js',
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    return statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get gzipped file size
 */
function getGzippedSize(filePath) {
  try {
    const content = readFileSync(filePath);
    return gzipSync(content).length;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file exceeds budget
 */
function checkBudget(size, budget, name) {
  const withinBudget = size <= budget;
  const percentage = ((size / budget) * 100).toFixed(1);
  
  if (withinBudget) {
    logSuccess(`${name}: ${formatBytes(size)} (${percentage}% of budget)`);
  } else {
    logError(`${name}: ${formatBytes(size)} exceeds budget of ${formatBytes(budget)} (${percentage}%)`);
  }
  
  return withinBudget;
}

/**
 * Analyze bundle sizes
 */
function analyzeBundleSizes(distPath) {
  logInfo('Analyzing bundle sizes...');
  
  const assetsPath = join(distPath, 'assets');
  let totalSize = 0;
  let budgetsPassed = true;
  
  try {
    const files = readdirSync(assetsPath);
    
    // Analyze JavaScript bundles
    const jsFiles = files.filter(file => extname(file) === '.js');
    const cssFiles = files.filter(file => extname(file) === '.css');
    
    // Check main bundle
    const mainBundle = jsFiles.find(file => file.includes('index-'));
    if (mainBundle) {
      const size = getGzippedSize(join(assetsPath, mainBundle));
      totalSize += size;
      budgetsPassed &= checkBudget(size, PERFORMANCE_BUDGETS.MAIN_BUNDLE, 'Main bundle');
    }
    
    // Check vendor bundle
    const vendorBundle = jsFiles.find(file => file.includes('vendor-'));
    if (vendorBundle) {
      const size = getGzippedSize(join(assetsPath, vendorBundle));
      totalSize += size;
      budgetsPassed &= checkBudget(size, PERFORMANCE_BUDGETS.VENDOR_BUNDLE, 'Vendor bundle');
    }
    
    // Check other chunks
    const otherChunks = jsFiles.filter(file => 
      !file.includes('index-') && 
      !file.includes('vendor-')
    );
    
    otherChunks.forEach(chunk => {
      const size = getGzippedSize(join(assetsPath, chunk));
      totalSize += size;
      budgetsPassed &= checkBudget(size, PERFORMANCE_BUDGETS.CHUNK_SIZE, `Chunk ${chunk}`);
    });
    
    // Check CSS files
    let totalCssSize = 0;
    cssFiles.forEach(cssFile => {
      const size = getGzippedSize(join(assetsPath, cssFile));
      totalCssSize += size;
    });
    
    if (totalCssSize > 0) {
      budgetsPassed &= checkBudget(totalCssSize, PERFORMANCE_BUDGETS.CSS_SIZE, 'Total CSS');
    }
    
    // Check total initial load size
    budgetsPassed &= checkBudget(totalSize, PERFORMANCE_BUDGETS.TOTAL_INITIAL, 'Total initial load');
    
    return budgetsPassed;
  } catch (error) {
    logError(`Failed to analyze bundle sizes: ${error.message}`);
    return false;
  }
}

/**
 * Validate required files exist
 */
function validateRequiredFiles(distPath) {
  logInfo('Validating required files...');
  
  let allFilesExist = true;
  
  REQUIRED_FILES.forEach(file => {
    const filePath = join(distPath, file);
    const exists = getFileSize(filePath) > 0;
    
    if (exists) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} is missing or empty`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  logInfo('Checking environment variables...');
  
  const requiredEnvVars = [
    'VITE_API_URL',
    'VITE_WS_URL',
  ];
  
  let allVarsSet = true;
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is set`);
    } else {
      logError(`${envVar} is not set`);
      allVarsSet = false;
    }
  });
  
  return allVarsSet;
}

/**
 * Run security audit
 */
function runSecurityAudit() {
  logInfo('Running security audit...');
  
  try {
    execSync('npm audit --audit-level=moderate', { stdio: 'pipe' });
    logSuccess('Security audit passed');
    return true;
  } catch (error) {
    logWarning('Security vulnerabilities found. Run "npm audit fix" to resolve.');
    return false;
  }
}

/**
 * Run build process
 */
function runBuild() {
  logInfo('Building application...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Build completed successfully');
    return true;
  } catch (error) {
    logError('Build failed');
    return false;
  }
}

/**
 * Generate build report
 */
function generateBuildReport(distPath, results) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    results: results,
    bundleSizes: {},
    recommendations: [],
  };
  
  // Add bundle size information
  try {
    const assetsPath = join(distPath, 'assets');
    const files = readdirSync(assetsPath);
    
    files.forEach(file => {
      const filePath = join(assetsPath, file);
      const size = getFileSize(filePath);
      const gzippedSize = getGzippedSize(filePath);
      
      report.bundleSizes[file] = {
        size: size,
        gzippedSize: gzippedSize,
        sizeFormatted: formatBytes(size),
        gzippedSizeFormatted: formatBytes(gzippedSize),
      };
    });
  } catch (error) {
    logWarning(`Could not generate bundle size report: ${error.message}`);
  }
  
  // Add recommendations
  if (!results.bundleSizes) {
    report.recommendations.push('Consider implementing code splitting to reduce bundle sizes');
  }
  
  if (!results.securityAudit) {
    report.recommendations.push('Run "npm audit fix" to resolve security vulnerabilities');
  }
  
  // Write report to file
  try {
    const reportPath = join(distPath, 'build-report.json');
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logSuccess(`Build report generated: ${reportPath}`);
  } catch (error) {
    logWarning(`Could not write build report: ${error.message}`);
  }
}

/**
 * Main build process
 */
async function main() {
  log('🚀 Starting production build process...', 'cyan');
  
  const distPath = join(process.cwd(), 'dist');
  const results = {
    environmentVariables: false,
    securityAudit: false,
    build: false,
    requiredFiles: false,
    bundleSizes: false,
  };
  
  // Step 1: Check environment variables
  results.environmentVariables = checkEnvironmentVariables();
  
  // Step 2: Run security audit
  results.securityAudit = runSecurityAudit();
  
  // Step 3: Run build
  results.build = runBuild();
  
  if (!results.build) {
    logError('Build failed. Aborting...');
    process.exit(1);
  }
  
  // Step 4: Validate required files
  results.requiredFiles = validateRequiredFiles(distPath);
  
  // Step 5: Analyze bundle sizes
  results.bundleSizes = analyzeBundleSizes(distPath);
  
  // Step 6: Generate build report
  generateBuildReport(distPath, results);
  
  // Final summary
  log('\n📊 Build Summary:', 'cyan');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    logSuccess('All checks passed! 🎉');
    log('Your application is ready for production deployment.', 'green');
  } else {
    logWarning('Some checks failed. Please review the issues above.');
    
    const failedChecks = Object.entries(results)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check);
    
    log(`Failed checks: ${failedChecks.join(', ')}`, 'yellow');
  }
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the build process
main().catch(error => {
  logError(`Build process failed: ${error.message}`);
  process.exit(1);
});