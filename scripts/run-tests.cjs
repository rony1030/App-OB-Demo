const { spawnSync } = require('node:child_process');
const path = require('node:path');
const tests = ['test-simulator.ts', 'test-multi-tenant-isolation.ts', 'test-analytics-privacy.ts', 'test-review-access.ts', 'test-public-proposal-events.cjs', 'test-document-translations.cjs', 'test-pwa-launch.cjs', 'test-interface-translations.cjs', 'test-availability-report.cjs', 'test-investor-account.ts'];
for (const test of tests) {
  const options = test.endsWith('.ts') ? ['-r', path.join(__dirname, 'register-typescript.cjs')] : [];
  const result = spawnSync(process.execPath, [...options, path.join(__dirname, test)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`${tests.length} test suites passed.`);
