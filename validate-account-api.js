#!/usr/bin/env node
/**
 * Quick validation script to ensure all account API endpoints are properly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Account API Implementation...\n');

const files = {
  userController: 'backend/src/controllers/userController.js',
  usersRoutes: 'backend/src/routes/users.js',
  routesIndex: 'backend/src/routes/index.js',
  userModel: 'backend/src/models/User.js'
};

let passed = 0;
let failed = 0;

// Check files exist
Object.entries(files).forEach(([name, file]) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${name}: ${file}`);
    passed++;
  } else {
    console.log(`❌ ${name}: ${file} NOT FOUND`);
    failed++;
  }
});

console.log('\n📋 Checking API Methods...\n');

// Check userController exports
const userCtrlPath = files.userController;
if (fs.existsSync(userCtrlPath)) {
  const content = fs.readFileSync(userCtrlPath, 'utf8');
  const methods = [
    { name: 'getMe', pattern: /exports\.getMe\s*=/ },
    { name: 'getUserById', pattern: /exports\.getUserById\s*=/ },
    { name: 'updateMe', pattern: /exports\.updateMe\s*=/ },
    { name: 'getSpecialistStats', pattern: /exports\.getSpecialistStats\s*=/ }
  ];

  methods.forEach(m => {
    if (m.pattern.test(content)) {
      console.log(`✅ userController.${m.name}`);
      passed++;
    } else {
      console.log(`❌ userController.${m.name} NOT FOUND`);
      failed++;
    }
  });
}

// Check routes
const routesPath = files.usersRoutes;
if (fs.existsSync(routesPath)) {
  const content = fs.readFileSync(routesPath, 'utf8');
  const routes = [
    { name: 'GET /users/me', pattern: /router\.get\('\/me'/ },
    { name: 'PUT /users/me', pattern: /router\.put\('\/me'/ },
    { name: 'GET /users/:id', pattern: /router\.get\('\/:\w+'/ },
    { name: 'GET /users/stats/:userId', pattern: /router\.get\('\/stats\// }
  ];

  routes.forEach(r => {
    if (r.pattern.test(content)) {
      console.log(`✅ Route: ${r.name}`);
      passed++;
    } else {
      console.log(`❌ Route: ${r.name} NOT FOUND`);
      failed++;
    }
  });
}

// Check User model has isAvailable field
const modelPath = files.userModel;
if (fs.existsSync(modelPath)) {
  const content = fs.readFileSync(modelPath, 'utf8');
  if (/isAvailable/.test(content)) {
    console.log(`✅ User model: isAvailable field`);
    passed++;
  } else {
    console.log(`❌ User model: isAvailable field NOT FOUND`);
    failed++;
  }
}

// Check routes/index.js includes users routes
const indexPath = files.routesIndex;
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  if (/usersRoutes|users/.test(content) && /\.use\(['"]\/users/.test(content)) {
    console.log(`✅ Routes index: users route registered`);
    passed++;
  } else {
    console.log(`❌ Routes index: users route NOT registered`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✨ Account API Implementation: ALL CHECKS PASSED!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.\n');
  process.exit(1);
}
