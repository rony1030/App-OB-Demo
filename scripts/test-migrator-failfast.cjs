/**
 * Comprehensive Automated Test Suite for Migrator Safe Mode, Confinement & Concurrency
 * 
 * Verifies:
 * 1. Strict Pre-normalization and Containment Validation (validateRemoteDirStrict):
 *    - Positive: Exact match of ALLOWED_REMOTE_BASE is accepted.
 *    - Positive: Valid subdirectories under ALLOWED_REMOTE_BASE are accepted.
 *    - Negative: Explicit '..' traversal segments before normalization (e.g. root/sub/../file) are rejected.
 *    - Negative: Traversal segments escaping root (e.g. root/../../..) are rejected.
 *    - Negative: Prohibited '/uploads' paths are rejected.
 *    - Negative: Sibling/other domain paths (solemareig.com, aguamarrd.com, osvaldobello.com) are rejected.
 *    - Negative: Relative paths without leading '/' or empty values are rejected.
 * 2. Accurate ln Error Classification:
 *    - "File exists" / "EEXIST" -> categorized as [DESTINATION_RACE_OR_EXISTS].
 *    - Non-EEXIST errors (Permission denied, I/O) -> categorized as [REMOTE_INSTALL_FAILED].
 *    - Both preserve temporary .tmp files and destination untouched.
 * 3. Tri-state remote destination checking:
 *    - Destination exists and SHA-256 + size match -> marks REMOTE_VERIFIED without re-uploading.
 *    - Destination exists with differing SHA-256 or size -> throws [CONFLICT], preserves remote, aborts batch.
 *    - Destination check encounters SSH error/timeout/unparseable output -> fails closed [REMOTE_CHECK_FAIL_CLOSED].
 *    - Destination is a symlink (-L / -h, regular or dangling) -> throws [REMOTE_CHECK_ERROR] and refuses overwrite.
 *    - Destination confirmed MISSING -> proceeds with upload.
 * 4. Atomic non-overwriting installation with POSIX hard link:
 *    - Destination missing -> hard link succeeds, temp file unlinked.
 * 5. Concurrency & Circuit Breaker Verification:
 *    - Normal mode: preserves and exercises configured concurrency (e.g. concurrency = 4 running up to 4 concurrent workers).
 *    - Fail-fast mode: enforces strictly concurrency 1, retries 1, and halts immediately upon 1st error.
 *    - Accurate reporting: successful files prior to circuit breaker failure are accurately preserved and counted.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const migrator = require('./migrate-images-hostinger.cjs');

console.log('===========================================================');
console.log('   TEST SUITE: REAL ENGINE HARDENED SAFE MODE & CONCURRENCY');
console.log('===========================================================\n');

const testBaseDir = path.resolve(process.cwd(), 'tmp/test-migrator-hardened');
const testStagingDir = path.join(testBaseDir, 'staging');
const testManifestPath = path.join(testBaseDir, 'migration-manifest.json');

fs.rmSync(testBaseDir, { recursive: true, force: true });
fs.mkdirSync(testStagingDir, { recursive: true });

function calculateSha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

let total = 0;
let passed = 0;

async function runTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

(async () => {
  const dummySshBaseArgs = ['-p', '65002', '-o', 'BatchMode=yes', 'u868879774@187.124.245.115'];

  // -------------------------------------------------------------
  // Test Group 1: Strict Remote Directory Confinement Validation
  // -------------------------------------------------------------
  await runTest('Remote Confinement: Exact persistent storage root is accepted', async () => {
    const validRoot = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets';
    const result = migrator.validateRemoteDirStrict(validRoot);
    assert.strictEqual(result, validRoot);
  });

  await runTest('Remote Confinement: Valid subdirectories under persistent root are accepted', async () => {
    const validSubdir = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/bello-valdez-enterprise/projects/cana-rock-star';
    const result = migrator.validateRemoteDirStrict(validSubdir);
    assert.strictEqual(result, validSubdir);
  });

  await runTest('Remote Confinement: Exact isolated proposal asset uploads directory is accepted', async () => {
    const dir = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/ob-brokers-team/proposals/uploads';
    assert.strictEqual(migrator.validateRemoteDirStrict(dir), dir);
  });

  await runTest('Remote Confinement (Negative): Pre-normalization traversal segments (root/sub/../file) are rejected', async () => {
    const traversalInPath = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/sub/../file';
    assert.throws(() => migrator.validateRemoteDirStrict(traversalInPath), /traversal segments before normalization/i);
  });

  await runTest('Remote Confinement (Negative): Traversal segments escaping root (../../..) are rejected', async () => {
    const escapingDirs = [
      '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/../../..',
      '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/../other-dir',
      '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/sub/../../uploads'
    ];
    for (const dir of escapingDirs) {
      assert.throws(() => migrator.validateRemoteDirStrict(dir), /traversal|isolation/i);
    }
  });

  await runTest('Remote Confinement (Negative): Prohibited /uploads folder is rejected', async () => {
    const invalidUploads = [
      '/home/u868879774/uploads',
      '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/uploads',
      '/home/u868879774/domains/brokers.osvaldobello.com/public_html/uploads'
    ];
    for (const dir of invalidUploads) {
      assert.throws(() => migrator.validateRemoteDirStrict(dir), /uploads/i);
    }
  });

  await runTest('Remote Confinement (Negative): Sibling and other domain paths are rejected', async () => {
    const siblingDirs = [
      '/home/u868879774/domains/solemareig.com/storage/public-assets',
      '/home/u868879774/domains/aguamarrd.com/storage/public-assets',
      '/home/u868879774/domains/osvaldobello.com/storage/public-assets',
      '/home/u868879774/domains/brokers.osvaldobello.com/public_html',
      '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets-extra'
    ];
    for (const dir of siblingDirs) {
      assert.throws(() => migrator.validateRemoteDirStrict(dir), /FATAL ISOLATION VIOLATION/i);
    }
  });

  await runTest('Remote Confinement (Negative): Relative paths and empty values are rejected', async () => {
    const invalidFormats = [
      '',
      '   ',
      'storage/public-assets',
      './domains/brokers.osvaldobello.com/storage/public-assets'
    ];
    for (const dir of invalidFormats) {
      assert.throws(() => migrator.validateRemoteDirStrict(dir), /REMOTE_DIR_INVALID/i);
    }
  });

  // -------------------------------------------------------------
  // Test Group 2: ln Error Classification
  // -------------------------------------------------------------
  await runTest('ln Error Classification: EEXIST / File exists classified as DESTINATION_RACE_OR_EXISTS', async () => {
    migrator.setExecFileOverride(async (cmd, args) => {
      throw new Error('ln: failed to create hard link: File exists');
    });

    let caughtErr = null;
    try {
      await migrator.installRemoteFileNoOverwrite(dummySshBaseArgs, '/dir/.tmp_123', '/dir/final.jpg');
    } catch (err) {
      caughtErr = err;
    }
    assert.ok(caughtErr, 'Must throw error on ln failure');
    assert.ok(caughtErr.message.includes('[DESTINATION_RACE_OR_EXISTS]'));
    assert.ok(caughtErr.message.includes('already exists on remote filesystem'));
  });

  await runTest('ln Error Classification: Non-EEXIST (e.g. Permission denied, I/O) classified as REMOTE_INSTALL_FAILED', async () => {
    migrator.setExecFileOverride(async (cmd, args) => {
      throw new Error('ln: failed to create hard link: Permission denied');
    });

    let caughtErr = null;
    try {
      await migrator.installRemoteFileNoOverwrite(dummySshBaseArgs, '/dir/.tmp_123', '/dir/final.jpg');
    } catch (err) {
      caughtErr = err;
    }
    assert.ok(caughtErr, 'Must throw error on ln failure');
    assert.ok(caughtErr.message.includes('[REMOTE_INSTALL_FAILED]'));
    assert.ok(caughtErr.message.includes('Permission denied'));
    assert.ok(!caughtErr.message.includes('[DESTINATION_RACE_OR_EXISTS]'));
  });

  // -------------------------------------------------------------
  // Test Group 3: Tri-state and Symlink detection
  // -------------------------------------------------------------
  await runTest('Tri-state check: Confirms MISSING when remote file is absent', async () => {
    migrator.setExecFileOverride(async (cmd, args) => {
      assert.strictEqual(cmd, 'ssh.exe');
      return { stdout: 'MISSING\n', stderr: '' };
    });

    const status = await migrator.checkRemoteDestinationStatus(dummySshBaseArgs, '/path/to/missing.jpg');
    assert.deepStrictEqual(status, { status: 'MISSING' });
  });

  await runTest('Tri-state check: Confirms EXISTS with valid size and SHA-256', async () => {
    const fakeSha = 'a'.repeat(64);
    migrator.setExecFileOverride(async (cmd, args) => {
      return { stdout: `EXISTS:12345:${fakeSha}\n`, stderr: '' };
    });

    const status = await migrator.checkRemoteDestinationStatus(dummySshBaseArgs, '/path/to/existing.jpg');
    assert.deepStrictEqual(status, { status: 'EXISTS', size: 12345, sha256: fakeSha });
  });

  await runTest('Tri-state check: Rejects symlink (or dangling symlink) and fails closed', async () => {
    migrator.setExecFileOverride(async (cmd, args) => {
      return { stdout: 'EXISTS_SYMLINK\n', stderr: '' };
    });

    let threw = false;
    try {
      await migrator.checkRemoteDestinationStatus(dummySshBaseArgs, '/path/to/symlink.jpg');
    } catch (err) {
      if (err.message.includes('symbolic link (or dangling symlink)')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Must reject symlinks');
  });

  await runTest('Tri-state check: Fails closed on SSH error/timeout', async () => {
    migrator.setExecFileOverride(async (cmd, args) => {
      throw new Error('SSH connection timeout');
    });

    let threw = false;
    try {
      await migrator.checkRemoteDestinationStatus(dummySshBaseArgs, '/path/to/timeout.jpg');
    } catch (err) {
      if (err.message.includes('[REMOTE_CHECK_FAIL_CLOSED]')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Must fail closed on timeout');
  });

  // -------------------------------------------------------------
  // Test Group 4: Atomic Non-overwriting Installation via hard link
  // -------------------------------------------------------------
  await runTest('Safe Installation: Uses atomic hard link and cleans up temp source on success', async () => {
    let executedCmd = null;
    migrator.setExecFileOverride(async (cmd, args) => {
      executedCmd = args[args.length - 1];
      return { stdout: '', stderr: '' };
    });

    await migrator.installRemoteFileNoOverwrite(dummySshBaseArgs, '/dir/.tmp_123', '/dir/final.jpg');
    assert.ok(executedCmd.startsWith('ln '));
    assert.ok(executedCmd.includes('&& rm -f '));
  });

  // -------------------------------------------------------------
  // Test Group 5: CLI Flag validation & Mode Concurrency
  // -------------------------------------------------------------
  await runTest('CLI Flag validation: Incompatible concurrency or retries with --fail-fast are rejected', async () => {
    let caughtConcurrencyError = false;
    try {
      execFileSync(process.execPath, [
        path.resolve(process.cwd(), 'scripts/migrate-images-hostinger.cjs'),
        '--fail-fast',
        '--concurrency', '4',
        '--batch', '5'
      ], { stdio: 'pipe' });
    } catch (err) {
      if (err.stderr.toString().includes('[FATAL CONFIG ERROR] --fail-fast requires concurrency=1')) {
        caughtConcurrencyError = true;
      }
    }
    assert.strictEqual(caughtConcurrencyError, true, 'Must reject --concurrency > 1 with --fail-fast');

    let caughtRetriesError = false;
    try {
      execFileSync(process.cwd() ? process.execPath : 'node', [
        path.resolve(process.cwd(), 'scripts/migrate-images-hostinger.cjs'),
        '--fail-fast',
        '--retries', '3',
        '--batch', '5'
      ], { stdio: 'pipe' });
    } catch (err) {
      if (err.stderr.toString().includes('[FATAL CONFIG ERROR] --fail-fast requires retries=1')) {
        caughtRetriesError = true;
      }
    }
    assert.strictEqual(caughtRetriesError, true, 'Must reject --retries > 1 with --fail-fast');
  });

  // -------------------------------------------------------------
  // Test Group 6: Concurrency Execution (Normal vs Fail-Fast)
  // -------------------------------------------------------------
  const testPayload = Buffer.from('REAL_ENGINE_PAYLOAD_TEST_DATA');
  const testSha = calculateSha256(testPayload);

  await runTest('Concurrency Mode: Normal execution exercises concurrency 4', async () => {
    let activeWorkers = 0;
    let peakConcurrency = 0;

    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const results = await migrator.runBatch(items, 4, async (item) => {
      activeWorkers++;
      if (activeWorkers > peakConcurrency) {
        peakConcurrency = activeWorkers;
      }
      await new Promise(r => setTimeout(r, 20));
      activeWorkers--;
      return item * 10;
    });

    assert.strictEqual(results.length, 8);
    assert.strictEqual(peakConcurrency, 4, 'Peak concurrency must reach 4 when concurrency=4');
  });

  await runTest('Concurrency Mode: Fail-fast enforces strictly concurrency 1 and halts on 1st error', async () => {
    const testManifest = { created_at: new Date().toISOString(), files: {} };
    let fileAttemptCount = 0;
    let activeWorkers = 0;
    let peakConcurrency = 0;

    const testBatchFiles = [
      { bucket: 'public-assets', fullPath: 'cana/img-1.jpg', size: testPayload.length, mimetype: 'image/jpeg' },
      { bucket: 'public-assets', fullPath: 'cana/img-2.jpg', size: testPayload.length, mimetype: 'image/jpeg' },
      { bucket: 'public-assets', fullPath: 'cana/img-3.jpg', size: testPayload.length, mimetype: 'image/jpeg' }
    ];

    migrator.setExecFileOverride(async (cmd, args) => {
      activeWorkers++;
      if (activeWorkers > peakConcurrency) peakConcurrency = activeWorkers;

      const last = args[args.length - 1];
      let res = { stdout: '', stderr: '' };

      if (cmd === 'ssh.exe' && last.includes('EXISTS:')) {
        res = { stdout: 'MISSING\n', stderr: '' };
      } else if (cmd === 'ssh.exe' && last.includes('mkdir -p')) {
        res = { stdout: '', stderr: '' };
      } else if (cmd === 'scp.exe') {
        res = { stdout: '', stderr: '' };
      } else if (cmd === 'ssh.exe' && last.includes('sha256sum')) {
        res = { stdout: `${testSha} /tmp_file\n`, stderr: '' };
      } else if (cmd === 'ssh.exe' && last.includes('ln ')) {
        fileAttemptCount++;
        if (fileAttemptCount === 1) {
          res = { stdout: '', stderr: '' };
        } else {
          activeWorkers--;
          throw new Error('ln: failed to create hard link: File exists');
        }
      }
      activeWorkers--;
      return res;
    });

    let results = [];
    let circuitBreakerFired = false;
    try {
      results = await migrator.executeMigrationBatch(testBatchFiles, {
        concurrency: 1,
        maxConsecutiveFailures: 1,
        configuredRetries: 1,
        transportMode: 'scp',
        stagingBaseDir: testStagingDir,
        hostingerRemoteDir: '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets',
        hostingerUser: 'u868879774',
        hostingerHost: '187.124.245.115',
        hostingerPort: '65002',
        downloadFn: async () => testPayload,
        manifest: testManifest,
        manifestPath: testManifestPath,
        isDryRun: false
      });
    } catch (err) {
      if (err.results) {
        results = err.results;
      }
      if (err.message.includes('[CIRCUIT_BREAKER]')) {
        circuitBreakerFired = true;
      } else {
        throw err;
      }
    }

    assert.strictEqual(circuitBreakerFired, true, 'Batch must abort on race error in fail-fast mode');
    assert.strictEqual(peakConcurrency, 1, 'Peak concurrency in fail-fast must be strictly 1');
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].status, 'SUCCESS');
    assert.strictEqual(results[1].status, 'ERROR');

    assert.ok(fs.existsSync(testManifestPath));
    const saved = JSON.parse(fs.readFileSync(testManifestPath, 'utf-8'));
    assert.strictEqual(saved.files['public-assets/cana/img-1.jpg'].status, 'REMOTE_VERIFIED');
    assert.strictEqual(saved.files['public-assets/cana/img-2.jpg'].status, 'FAILED');
    assert.ok(saved.files['public-assets/cana/img-2.jpg'].error.includes('[DESTINATION_RACE_OR_EXISTS]'));
    // Ensure img-3 was never touched
    assert.strictEqual(saved.files['public-assets/cana/img-3.jpg'], undefined);
  });

  await runTest('Resumption Error Handling: Timeout on REMOTE_VERIFIED file preserves status, triggers fail-fast, touches 0 later files, performs 0 downloads/SCPs', async () => {
    const verifiedFileKey = 'public-assets/cana/already-verified.jpg';
    const pendingFileKey = 'public-assets/cana/subsequent.jpg';
    const initialSha = 'c'.repeat(64);
    const initialSize = 12345;

    const testManifest = {
      created_at: new Date().toISOString(),
      files: {
        [verifiedFileKey]: {
          status: 'REMOTE_VERIFIED',
          fullPath: 'cana/already-verified.jpg',
          sizeBytes: initialSize,
          sha256: initialSha,
          transport: 'scp'
        }
      }
    };

    let downloadCount = 0;
    let scpCount = 0;

    migrator.setExecFileOverride(async (cmd, args) => {
      if (cmd === 'ssh.exe') {
        // Simulate SSH timeout during checkRemoteDestinationStatus for already-verified file
        throw new Error('Command failed: ssh.exe: Connection timed out');
      }
      if (cmd === 'scp.exe') {
        scpCount++;
        return { stdout: '', stderr: '' };
      }
      throw new Error(`Unexpected command: ${cmd}`);
    });

    const testFiles = [
      { bucket: 'public-assets', fullPath: 'cana/already-verified.jpg', size: initialSize, mimetype: 'image/jpeg' },
      { bucket: 'public-assets', fullPath: 'cana/subsequent.jpg', size: initialSize, mimetype: 'image/jpeg' }
    ];

    let results = [];
    let batchAborted = false;
    let caughtError = null;
    try {
      results = await migrator.executeMigrationBatch(testFiles, {
        concurrency: 1,
        maxConsecutiveFailures: 1,
        configuredRetries: 1,
        transportMode: 'scp',
        stagingBaseDir: testStagingDir,
        hostingerRemoteDir: '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets',
        hostingerUser: 'u868879774',
        hostingerHost: '187.124.245.115',
        hostingerPort: '65002',
        downloadFn: async () => {
          downloadCount++;
          return testPayload;
        },
        manifest: testManifest,
        manifestPath: testManifestPath,
        isDryRun: false
      });
    } catch (err) {
      caughtError = err;
      if (err.results) {
        results = err.results;
      }
      if (err.message.includes('[BATCH_REMOTE_CHECK_FAILED]') || err.message.includes('[CIRCUIT_BREAKER]') || err.message.includes('[SSH_CONNECT_TIMEOUT]')) {
        batchAborted = true;
      }
    }

    assert.strictEqual(batchAborted, true, 'Must abort batch on resumption timeout');

    // Zero Supabase downloads and zero SCP writes must have occurred
    assert.strictEqual(downloadCount, 0, 'Must NOT download from Supabase when resumption check fails');
    assert.strictEqual(scpCount, 0, 'Must NOT execute SCP when resumption check fails');

    // Ensure manifest file was persisted with REMOTE_VERIFIED intact
    assert.ok(fs.existsSync(testManifestPath));
    const saved = JSON.parse(fs.readFileSync(testManifestPath, 'utf-8'));
    assert.strictEqual(saved.files[verifiedFileKey].status, 'REMOTE_VERIFIED', 'Must preserve REMOTE_VERIFIED status in manifest');
    assert.strictEqual(saved.files[verifiedFileKey].sha256, initialSha, 'Must preserve original SHA-256');
    assert.strictEqual(saved.files[verifiedFileKey].sizeBytes, initialSize, 'Must preserve original size');
    assert.ok(saved.files[verifiedFileKey].last_verification_error.includes('Connection timed out'));
    assert.strictEqual(saved.files[pendingFileKey], undefined, 'Subsequent file must not be processed');
  });

  await runTest('Destination Check Failure (Unverified File): Timeout on checkRemoteDestinationStatus stops batch with 0 downloads and 0 SCPs', async () => {
    const unverifiedFileKey = 'public-assets/cana/new-unverified.jpg';
    const pendingFileKey = 'public-assets/cana/second-file.jpg';
    const fileSize = 54321;

    const testManifest = {
      created_at: new Date().toISOString(),
      files: {}
    };

    let downloadCount = 0;
    let scpCount = 0;
    let sshCalls = 0;

    migrator.setExecFileOverride(async (cmd, args, opts) => {
      if (cmd === 'ssh.exe') {
        sshCalls++;
        // Simulate SSH timeout during destination check before download
        throw new Error('Command failed: ssh.exe: Connection timed out after 30000ms');
      }
      if (cmd === 'scp.exe') {
        scpCount++;
        return { stdout: '', stderr: '' };
      }
      throw new Error(`Unexpected command: ${cmd}`);
    });

    const testFiles = [
      { bucket: 'public-assets', fullPath: 'cana/new-unverified.jpg', size: fileSize, mimetype: 'image/jpeg' },
      { bucket: 'public-assets', fullPath: 'cana/second-file.jpg', size: fileSize, mimetype: 'image/jpeg' }
    ];

    let results = [];
    let circuitBreakerFired = false;
    try {
      results = await migrator.executeMigrationBatch(testFiles, {
        concurrency: 1,
        maxConsecutiveFailures: 1,
        configuredRetries: 1,
        transportMode: 'scp',
        stagingBaseDir: testStagingDir,
        hostingerRemoteDir: '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets',
        hostingerUser: 'u868879774',
        hostingerHost: '187.124.245.115',
        hostingerPort: '65002',
        downloadFn: async () => {
          downloadCount++;
          return testPayload;
        },
        manifest: testManifest,
        manifestPath: testManifestPath,
        isDryRun: false
      });
    } catch (err) {
      if (err.results) {
        results = err.results;
      }
      if (err.message.includes('[CIRCUIT_BREAKER]')) {
        circuitBreakerFired = true;
      }
    }

    assert.strictEqual(circuitBreakerFired, true, 'Must trigger circuit breaker when destination check fails');
    assert.strictEqual(results.length, 1, 'Only 1 file attempted');
    assert.strictEqual(results[0].status, 'ERROR');
    assert.ok(results[0].error.includes('[REMOTE_CHECK_FAIL_CLOSED]'));

    // Critical: Zero Supabase downloads and zero SCP transfers performed
    assert.strictEqual(downloadCount, 0, 'Must NOT download from Supabase when destination check fails closed');
    assert.strictEqual(scpCount, 0, 'Must NOT execute SCP when destination check fails closed');
    assert.strictEqual(sshCalls, 1, 'Exactly 1 SSH destination check attempted');

    // Ensure manifest file was persisted with FAILED status for file 1 and file 2 untouched
    assert.ok(fs.existsSync(testManifestPath));
    const saved = JSON.parse(fs.readFileSync(testManifestPath, 'utf-8'));
    assert.strictEqual(saved.files[unverifiedFileKey].status, 'FAILED');
    assert.ok(saved.files[unverifiedFileKey].error.includes('[REMOTE_CHECK_FAIL_CLOSED]'));
    assert.strictEqual(saved.files[pendingFileKey], undefined, 'Subsequent file must not be processed');
  });

  await runTest('Configurable SSH Timeout: Custom timeout option is forwarded to execFilePromise', async () => {
    let capturedTimeout = null;

    migrator.setExecFileOverride(async (cmd, args, opts) => {
      capturedTimeout = opts?.timeout;
      return { stdout: 'MISSING\n', stderr: '' };
    });

    await migrator.checkRemoteDestinationStatus(dummySshBaseArgs, '/dir/test.jpg', { timeout: 60000 });
    assert.strictEqual(capturedTimeout, 60000, 'Must forward 60000ms timeout to execFilePromise');
  });

  // -------------------------------------------------------------
  // Test Group 7: SSH Error Classification (Connect vs Exec Timeout)
  // -------------------------------------------------------------
  await runTest('SSH Error Classification: Connection/handshake failures classified as SSH_CONNECT_TIMEOUT', async () => {
    const connErr = migrator.classifySshError(new Error('Command failed: ssh.exe'), 'ssh: connect to host 187.124.245.115 port 65002: Connection timed out', 15, 90000);
    assert.ok(connErr.message.includes('[SSH_CONNECT_TIMEOUT]'));
    assert.ok(connErr.message.includes('within 15s'));

    const refusedErr = migrator.classifySshError(new Error('Command failed: ssh.exe'), 'ssh: connect to host 187.124.245.115 port 65002: Connection refused', 15, 90000);
    assert.ok(refusedErr.message.includes('[SSH_CONNECT_TIMEOUT]'));
  });

  await runTest('SSH Error Classification: Process runtime expiration classified as SSH_EXEC_TIMEOUT', async () => {
    const execErr = migrator.classifySshError({ message: 'Command failed: timed out', killed: true, signal: 'SIGTERM' }, '', 15, 90000);
    assert.ok(execErr.message.includes('[SSH_EXEC_TIMEOUT]'));
    assert.ok(execErr.message.includes('90s'));
  });

  // -------------------------------------------------------------
  // Test Group 8: Single-Session Batch Prevalidation
  // -------------------------------------------------------------
  await runTest('Batch Prevalidation (Positive): Revalidates multiple remote files in 1 single SSH call', async () => {
    const path1 = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/file1.jpg';
    const path2 = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/file2.jpg';
    const sha1 = '1'.repeat(64);
    const sha2 = '2'.repeat(64);

    let sshCallCount = 0;
    migrator.setExecFileOverride(async (cmd, args, opts) => {
      sshCallCount++;
      assert.strictEqual(cmd, 'ssh.exe');
      const fakeOutput = [
        `---REC_START---|${path1}`,
        `TYPE:EXISTS:1000:${sha1}`,
        `---REC_END---|${path1}`,
        `---REC_START---|${path2}`,
        `TYPE:EXISTS:2000:${sha2}`,
        `---REC_END---|${path2}`
      ].join('\n');
      return { stdout: fakeOutput, stderr: '' };
    });

    const results = await migrator.batchCheckRemoteFiles(dummySshBaseArgs, [path1, path2]);
    assert.strictEqual(sshCallCount, 1, 'Must execute exactly 1 SSH call for all files');
    assert.strictEqual(results.size, 2);
    assert.deepStrictEqual(results.get(path1), { status: 'EXISTS', size: 1000, sha256: sha1 });
    assert.deepStrictEqual(results.get(path2), { status: 'EXISTS', size: 2000, sha256: sha2 });
  });

  await runTest('Batch Prevalidation (Negative): Fails closed on incomplete batch response', async () => {
    const path1 = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/file1.jpg';
    const path2 = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/file2.jpg';

    migrator.setExecFileOverride(async (cmd, args, opts) => {
      // Incomplete output missing path2
      const truncatedOutput = [
        `---REC_START---|${path1}`,
        `TYPE:EXISTS:1000:${'1'.repeat(64)}`,
        `---REC_END---|${path1}`
      ].join('\n');
      return { stdout: truncatedOutput, stderr: '' };
    });

    let threw = false;
    try {
      await migrator.batchCheckRemoteFiles(dummySshBaseArgs, [path1, path2]);
    } catch (err) {
      if (err.message.includes('[BATCH_REMOTE_CHECK_INCOMPLETE]')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Must throw on incomplete batch response');
  });

  await runTest('Batch Prevalidation (Negative): Fails closed on invalid/corrupted hash format', async () => {
    const path1 = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/file1.jpg';

    migrator.setExecFileOverride(async (cmd, args, opts) => {
      const corruptOutput = [
        `---REC_START---|${path1}`,
        `TYPE:EXISTS:1000:invalid_sha`,
        `---REC_END---|${path1}`
      ].join('\n');
      return { stdout: corruptOutput, stderr: '' };
    });

    let threw = false;
    try {
      await migrator.batchCheckRemoteFiles(dummySshBaseArgs, [path1]);
    } catch (err) {
      if (err.message.includes('[BATCH_REMOTE_CHECK_PARSE_ERROR]')) {
        threw = true;
      }
    }
    assert.strictEqual(threw, true, 'Must throw on invalid hash in batch record');
  });

  await runTest('Integrated Batch Prevalidation: Single SSH revalidation skips verified files with 0 downloads', async () => {
    const v1Key = 'public-assets/cana/v1.jpg';
    const v2Key = 'public-assets/cana/v2.jpg';
    const u1Key = 'public-assets/cana/unverified1.jpg';
    const sha1 = '1'.repeat(64);
    const sha2 = '2'.repeat(64);

    const testManifest = {
      created_at: new Date().toISOString(),
      files: {
        [v1Key]: { status: 'REMOTE_VERIFIED', fullPath: 'cana/v1.jpg', sizeBytes: 100, sha256: sha1, transport: 'scp' },
        [v2Key]: { status: 'REMOTE_VERIFIED', fullPath: 'cana/v2.jpg', sizeBytes: 200, sha256: sha2, transport: 'scp' }
      }
    };

    let downloadCount = 0;
    let sshCount = 0;
    let scpCount = 0;

    migrator.setExecFileOverride(async (cmd, args, opts) => {
      const last = args[args.length - 1];
      if (cmd === 'ssh.exe') {
        sshCount++;
        if (last.includes('---REC_START---|')) {
          // Batch check call for v1 and v2
          return {
            stdout: [
              `---REC_START---|/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/cana/v1.jpg`,
              `TYPE:EXISTS:100:${sha1}`,
              `---REC_END---|/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/cana/v1.jpg`,
              `---REC_START---|/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/cana/v2.jpg`,
              `TYPE:EXISTS:200:${sha2}`,
              `---REC_END---|/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/cana/v2.jpg`
            ].join('\n'),
            stderr: ''
          };
        } else if (last.includes('EXISTS:')) {
          // Individual destination check for unverified1
          return { stdout: 'MISSING\n', stderr: '' };
        } else if (last.includes('mkdir -p')) {
          return { stdout: '', stderr: '' };
        } else if (last.includes('sha256sum')) {
          return { stdout: `${testSha} /tmp_file\n`, stderr: '' };
        } else if (last.includes('ln ')) {
          return { stdout: '', stderr: '' };
        }
      }
      if (cmd === 'scp.exe') {
        scpCount++;
        return { stdout: '', stderr: '' };
      }
      throw new Error(`Unexpected command: ${cmd}`);
    });

    const testFiles = [
      { bucket: 'public-assets', fullPath: 'cana/v1.jpg', size: 100, mimetype: 'image/jpeg' },
      { bucket: 'public-assets', fullPath: 'cana/v2.jpg', size: 200, mimetype: 'image/jpeg' },
      { bucket: 'public-assets', fullPath: 'cana/unverified1.jpg', size: testPayload.length, mimetype: 'image/jpeg' }
    ];

    const results = await migrator.executeMigrationBatch(testFiles, {
      concurrency: 1,
      maxConsecutiveFailures: 1,
      configuredRetries: 1,
      transportMode: 'scp',
      stagingBaseDir: testStagingDir,
      hostingerRemoteDir: '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets',
      hostingerUser: 'u868879774',
      hostingerHost: '187.124.245.115',
      hostingerPort: '65002',
      downloadFn: async () => {
        downloadCount++;
        return testPayload;
      },
      manifest: testManifest,
      manifestPath: testManifestPath,
      isDryRun: false
    });

    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].status, 'SKIPPED_ALREADY_VERIFIED');
    assert.strictEqual(results[1].status, 'SKIPPED_ALREADY_VERIFIED');
    assert.strictEqual(results[2].status, 'SUCCESS');
    assert.strictEqual(downloadCount, 1, 'Only the 1 unverified file was downloaded from Supabase');
    assert.strictEqual(scpCount, 1, 'Only the 1 unverified file was transferred via SCP');
  });

  await runTest('Integrated Batch Prevalidation (Conflict): Halts batch without overwrite if remote hash differs', async () => {
    const v1Key = 'public-assets/cana/v1.jpg';
    const shaManifest = '1'.repeat(64);
    const shaRemoteDifferent = '9'.repeat(64);

    const testManifest = {
      created_at: new Date().toISOString(),
      files: {
        [v1Key]: { status: 'REMOTE_VERIFIED', fullPath: 'cana/v1.jpg', sizeBytes: 100, sha256: shaManifest, transport: 'scp' }
      }
    };

    let downloadCount = 0;
    migrator.setExecFileOverride(async (cmd, args, opts) => {
      return {
        stdout: [
          `---REC_START---|/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/cana/v1.jpg`,
          `TYPE:EXISTS:100:${shaRemoteDifferent}`,
          `---REC_END---|/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets/cana/v1.jpg`
        ].join('\n'),
        stderr: ''
      };
    });

    const testFiles = [
      { bucket: 'public-assets', fullPath: 'cana/v1.jpg', size: 100, mimetype: 'image/jpeg' },
      { bucket: 'public-assets', fullPath: 'cana/pending.jpg', size: 100, mimetype: 'image/jpeg' }
    ];

    let threwConflict = false;
    try {
      await migrator.executeMigrationBatch(testFiles, {
        concurrency: 1,
        maxConsecutiveFailures: 1,
        configuredRetries: 1,
        transportMode: 'scp',
        stagingBaseDir: testStagingDir,
        hostingerRemoteDir: '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets',
        hostingerUser: 'u868879774',
        hostingerHost: '187.124.245.115',
        hostingerPort: '65002',
        downloadFn: async () => {
          downloadCount++;
          return testPayload;
        },
        manifest: testManifest,
        manifestPath: testManifestPath,
        isDryRun: false
      });
    } catch (err) {
      if (err.message.includes('[CONFLICT]')) {
        threwConflict = true;
      }
    }

    assert.strictEqual(threwConflict, true, 'Must throw CONFLICT on differing hash during prevalidation');
    assert.strictEqual(downloadCount, 0, 'Must NOT download from Supabase when prevalidation finds conflict');
  });

  // Clean up
  fs.rmSync(testBaseDir, { recursive: true, force: true });

  console.log('\n-----------------------------------------------------------');
  console.log(`Results: ${passed} of ${total} tests passed.`);
  console.log('-----------------------------------------------------------\n');

  if (passed !== total) {
    process.exitCode = 1;
  }
})();
