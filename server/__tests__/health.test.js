// Basic server test
const assert = require('assert');

// Test that required modules can be loaded
try {
  require('express');
  require('helmet');
  require('express-rate-limit');
  require('express-validator');
  require('cors');
  require('morgan');
  require('winston');
  require('node-cache');
  require('multer');
  console.log('All server dependencies loaded successfully');
} catch (error) {
  console.error('Missing dependency:', error.message);
  process.exit(1);
}

// Test validation module
const { validateRegister, validateLogin } = require('../middleware/validate');
assert(Array.isArray(validateRegister), 'validateRegister should be an array');
assert(Array.isArray(validateLogin), 'validateLogin should be an array');
console.log('Validation middleware loaded successfully');

// Test cache module
const { cache, cacheMiddleware, invalidateCache } = require('../middleware/cache');
assert(typeof cacheMiddleware === 'function', 'cacheMiddleware should be a function');
assert(typeof invalidateCache === 'function', 'invalidateCache should be a function');
console.log('Cache middleware loaded successfully');

// Test logger module
const logger = require('../middleware/logger');
assert(typeof logger.info === 'function', 'logger should have info method');
assert(typeof logger.error === 'function', 'logger should have error method');
console.log('Logger loaded successfully');

console.log('All tests passed!');
