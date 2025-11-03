#!/usr/bin/env node

/**
 * Setup Verification Script
 * 
 * This script checks if all required dependencies and configurations
 * are properly set up for the Modelia AI Studio project.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`;
}

const checks = [];

function check(name, fn) {
  checks.push({ name, fn });
}

// Check Node.js version
check('Node.js version (>= 20.x)', () => {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  if (major >= 20) {
    return { success: true, message: `Found ${version}` };
  }
  return { success: false, message: `Found ${version}, need >= 20.x` };
});

// Check npm version
check('npm version (>= 9.x)', () => {
  try {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    const major = parseInt(version.split('.')[0]);
    if (major >= 9) {
      return { success: true, message: `Found ${version}` };
    }
    return { success: false, message: `Found ${version}, need >= 9.x` };
  } catch (error) {
    return { success: false, message: 'npm not found' };
  }
});

// Check project structure
check('Project structure', () => {
  const required = [
    'backend/package.json',
    'frontend/package.json',
    'backend/src/index.ts',
    'frontend/src/main.tsx',
    'package.json',
  ];

  const missing = required.filter((file) => !fs.existsSync(path.join(__dirname, file)));

  if (missing.length === 0) {
    return { success: true, message: 'All required files present' };
  }
  return { success: false, message: `Missing: ${missing.join(', ')}` };
});

// Check backend dependencies
check('Backend dependencies', () => {
  const nodeModules = path.join(__dirname, 'backend', 'node_modules');
  if (fs.existsSync(nodeModules)) {
    return { success: true, message: 'Installed' };
  }
  return { success: false, message: 'Run: cd backend && npm install' };
});

// Check frontend dependencies
check('Frontend dependencies', () => {
  const nodeModules = path.join(__dirname, 'frontend', 'node_modules');
  if (fs.existsSync(nodeModules)) {
    return { success: true, message: 'Installed' };
  }
  return { success: false, message: 'Run: cd frontend && npm install' };
});

// Check backend .env
check('Backend environment file', () => {
  const envPath = path.join(__dirname, 'backend', '.env');
  if (fs.existsSync(envPath)) {
    return { success: true, message: 'Found' };
  }
  return {
    success: false,
    message: 'Create backend/.env from backend/.env.example',
    warning: true,
  };
});

// Check TypeScript configuration
check('TypeScript configurations', () => {
  const configs = [
    'backend/tsconfig.json',
    'frontend/tsconfig.json',
  ];

  const missing = configs.filter((file) => !fs.existsSync(path.join(__dirname, file)));

  if (missing.length === 0) {
    return { success: true, message: 'All configs present' };
  }
  return { success: false, message: `Missing: ${missing.join(', ')}` };
});

// Check ESLint configuration
check('ESLint configurations', () => {
  const configs = [
    'backend/.eslintrc.js',
    'frontend/.eslintrc.cjs',
    '.eslintrc.js',
  ];

  const missing = configs.filter((file) => !fs.existsSync(path.join(__dirname, file)));

  if (missing.length === 0) {
    return { success: true, message: 'All configs present' };
  }
  return { success: false, message: `Missing: ${missing.join(', ')}` };
});

// Check test configurations
check('Test configurations', () => {
  const configs = [
    'backend/jest.config.js',
    'frontend/vitest.config.ts',
    'playwright.config.ts',
  ];

  const present = configs.filter((file) => fs.existsSync(path.join(__dirname, file)));

  if (present.length === configs.length) {
    return { success: true, message: 'All test configs present' };
  }
  return { success: true, message: `Found ${present.length}/${configs.length} configs`, warning: true };
});

// Check Docker setup
check('Docker setup', () => {
  const dockerCompose = path.join(__dirname, 'docker-compose.yml');
  const dockerfiles = [
    'backend/Dockerfile',
    'frontend/Dockerfile',
  ];

  const present = [dockerCompose, ...dockerfiles.map(f => path.join(__dirname, f))]
    .filter(f => fs.existsSync(f));

  if (present.length === 3) {
    return { success: true, message: 'Docker files present' };
  }
  return { success: true, message: 'Docker files incomplete', warning: true };
});

// Check CI/CD
check('CI/CD configuration', () => {
  const ci = path.join(__dirname, '.github', 'workflows', 'ci.yml');
  if (fs.existsSync(ci)) {
    return { success: true, message: 'GitHub Actions configured' };
  }
  return { success: true, message: 'CI/CD not configured', warning: true };
});

// Check documentation
check('Documentation files', () => {
  const docs = ['README.md', 'EVAL.md'];
  const present = docs.filter((file) => fs.existsSync(path.join(__dirname, file)));

  if (present.length === docs.length) {
    return { success: true, message: 'All docs present' };
  }
  return { success: false, message: `Missing: ${docs.filter(d => !present.includes(d)).join(', ')}` };
});

// Run all checks
async function runChecks() {
  log('\n' + '='.repeat(60), colors.blue);
  log('  Modelia AI Studio - Setup Verification', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const { name, fn } of checks) {
    try {
      const result = fn();
      const icon = result.warning ? warning() : (result.success ? checkmark() : crossmark());
      
      log(`${icon} ${name}`);
      if (result.message) {
        log(`   ${result.message}`, colors.reset);
      }

      if (result.warning) {
        warnings++;
      } else if (result.success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`${crossmark()} ${name}`);
      log(`   Error: ${error.message}`, colors.red);
      failed++;
    }
  }

  log('\n' + '-'.repeat(60));
  log(`Results: ${passed} passed, ${failed} failed, ${warnings} warnings\n`);

  if (failed === 0 && warnings === 0) {
    log('✨ All checks passed! Your setup is ready.', colors.green);
    log('\nNext steps:', colors.blue);
    log('  1. npm run dev          # Start development servers');
    log('  2. npm test             # Run tests');
    log('  3. npm run test:e2e     # Run E2E tests\n');
  } else if (failed === 0) {
    log('⚠  Setup is functional with some warnings.', colors.yellow);
    log('   Consider addressing warnings for best experience.\n');
  } else {
    log('❌ Setup incomplete. Please address the failed checks.', colors.red);
    log('\nQuick fixes:', colors.blue);
    log('  npm run install:all     # Install all dependencies');
    log('  cp backend/.env.example backend/.env  # Create env file\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runChecks().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});

