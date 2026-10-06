import assert from 'node:assert/strict';
import {
  generateOtpCode,
  hashValue,
  checkDemoAccessCode,
  isValidEmail,
  normalizeEmail,
} from '../lib/investor/auth';

console.log('--- TEST SUITE: Investor OTP, Sessions & Isolation ---');

// 1. Validar generación de OTP
console.log('1. Testing OTP code generation and character safety...');
const code1 = generateOtpCode(6);
const code2 = generateOtpCode(6);
assert.equal(code1.length, 6, 'OTP must be 6 characters');
assert.match(code1, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/, 'OTP should only contain unambiguous chars');
assert.notEqual(code1, code2, 'Random OTP codes must have sufficient entropy');
console.log('   ✓ OTP generation verified.');

// 2. Validar hashing
console.log('2. Testing SHA-256 hash idempotency & security...');
const hashA = hashValue(code1);
const hashB = hashValue(code1);
const hashC = hashValue(code2);
assert.equal(hashA, hashB, 'Hashes of identical inputs must match');
assert.notEqual(hashA, hashC, 'Hashes of different inputs must not match');
assert.equal(hashA.length, 64, 'SHA-256 hash must be 64 hex characters');
console.log('   ✓ Hashing verified.');

// 3. Validar email helpers
console.log('3. Testing email normalization and validation...');
assert.equal(normalizeEmail('  Test.User@OsvaldoBello.Com '), 'test.user@osvaldobello.com');
assert.equal(isValidEmail('cliente@example.com'), true);
assert.equal(isValidEmail('invalido-sin-arroba'), false);
assert.equal(isValidEmail(''), false);
console.log('   ✓ Email helpers verified.');

// 4. Validar código demo aislado
console.log('4. Testing demo access code protection...');
// Si no hay env var configurado en el runner, el default es DEMO2026
const correctDemo = process.env.INVESTOR_DEMO_ACCESS_CODE || 'DEMO2026';
assert.equal(checkDemoAccessCode(correctDemo), true, 'Correct demo code must be accepted');
assert.equal(checkDemoAccessCode('CODIGO_INCORRECTO'), false, 'Wrong code must be rejected');
assert.equal(checkDemoAccessCode(''), false, 'Empty code must be rejected');
console.log('   ✓ Demo gate validation verified.');

console.log('\nALL INVESTOR AUTH TESTS PASSED SUCCESSFULLY! ✓\n');
