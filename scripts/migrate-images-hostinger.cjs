/**
 * Hostinger Persistent Storage Image Migration Script
 * 
 * Hardened, idempotent, resumable migrator from Supabase Storage.
 * 
 * Safety Rules:
 * 1. Source files in Supabase are NEVER moved, modified, or deleted (Strict read-only download).
 * 2. Remote destinations have NO default assumptions; must be explicitly verified and provided.
 * 3. Shell interpolation is strictly avoided: paths are validated against a character whitelist
 *    and escaped using POSIX single-quote escaping; child processes are invoked with argument arrays.
 * 4. Resumption checks verify the actual remote file's SHA-256 via SSH before skipping.
 *    If missing or mismatching, the file is re-transferred.
 * 5. Remote verification requires remote SHA-256 computation before atomic rename (`.tmp_*` -> final).
 * 6. Dry-run mode never downloads, writes, touches disk, manifests, or remote servers.
 * 7. Path containment strictly rejects absolute paths or any segment with `..`.
 * 8. Manifest writing is atomic (`.tmp` write + rename) to prevent corruption.
 * 9. Storage listing handles pagination and fails fast on any Supabase error.
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

// Load environment configurations
const envLocal = loadEnvFile(path.resolve(process.cwd(), '.env.local'));
const envExample = loadEnvFile(path.resolve(process.cwd(), '.env.hostinger.example'));

const supabaseUrl = envLocal.NEXT_PUBLIC_SUPABASE_URL || envExample.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envLocal.SUPABASE_SERVICE_ROLE_KEY || envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY || envExample.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[FATAL] Missing Supabase configuration.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isPendingOnly = args.includes('--pending-only');

const limitArgIdx = args.indexOf('--limit');
const limit = limitArgIdx !== -1 ? parseInt(args[limitArgIdx + 1], 10) : null;

const stagingDirArgIdx = args.indexOf('--staging-dir');
const stagingBaseDir = stagingDirArgIdx !== -1 
  ? path.resolve(args[stagingDirArgIdx + 1]) 
  : path.resolve(process.cwd(), 'storage-export/public-assets');

const matchPatternIdx = args.indexOf('--match');
const matchPattern = matchPatternIdx !== -1 ? args[matchPatternIdx + 1] : null;

const exactFilesIdx = args.indexOf('--exact-files');
const exactFiles = exactFilesIdx !== -1 
  ? args[exactFilesIdx + 1].split(',').map(s => s.trim()).filter(Boolean) 
  : null;

const transportModeIdx = args.indexOf('--transport');
const transportMode = transportModeIdx !== -1 ? args[transportModeIdx + 1].toLowerCase() : 'staging';

const remoteDirArgIdx = args.indexOf('--remote-dir');
const hostingerRemoteDir = remoteDirArgIdx !== -1 
  ? args[remoteDirArgIdx + 1] 
  : (process.env.HOSTINGER_PERSISTENT_DIR || envLocal.HOSTINGER_PERSISTENT_DIR || '');

const hostingerHost = process.env.HOSTINGER_SSH_HOST || envLocal.HOSTINGER_SSH_HOST || '187.124.245.115';
const hostingerPort = String(process.env.HOSTINGER_SSH_PORT || envLocal.HOSTINGER_SSH_PORT || '65002');
const hostingerUser = process.env.HOSTINGER_SSH_USER || envLocal.HOSTINGER_SSH_USER || '';

const sshKeyArgIdx = args.indexOf('--ssh-key');
const defaultKeyPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.ssh', 'id_ed25519_hostinger');
const hostingerSshKey = sshKeyArgIdx !== -1
  ? args[sshKeyArgIdx + 1]
  : (process.env.HOSTINGER_SSH_KEY || (fs.existsSync(defaultKeyPath) ? defaultKeyPath : ''));

const batchArgIdx = args.indexOf('--batch');
const batchNumber = batchArgIdx !== -1 ? parseInt(args[batchArgIdx + 1], 10) : null;

const prefixesArgIdx = args.indexOf('--prefixes');
const prefixesFilter = prefixesArgIdx !== -1 
  ? args[prefixesArgIdx + 1].split(',').map(s => s.trim()).filter(Boolean) 
  : null;

// Fail-fast and retry controls
const isFailFast = args.includes('--fail-fast') || args.includes('--single-attempt') || args.includes('--stop-on-error');
const retriesArgIdx = args.indexOf('--retries');
const concurrencyArgIdx = args.indexOf('--concurrency');
const sshTimeoutArgIdx = args.indexOf('--ssh-timeout');
const configuredSshTimeoutSec = sshTimeoutArgIdx !== -1 
  ? parseInt(args[sshTimeoutArgIdx + 1], 10) 
  : (process.env.HOSTINGER_SSH_TIMEOUT ? parseInt(process.env.HOSTINGER_SSH_TIMEOUT, 10) : 30);
const sshTimeoutMs = (isNaN(configuredSshTimeoutSec) || configuredSshTimeoutSec <= 0 ? 30 : configuredSshTimeoutSec) * 1000;

const connectTimeoutArgIdx = args.indexOf('--connect-timeout');
const configuredConnectTimeoutSec = connectTimeoutArgIdx !== -1 
  ? parseInt(args[connectTimeoutArgIdx + 1], 10) 
  : (process.env.HOSTINGER_SSH_CONNECT_TIMEOUT ? parseInt(process.env.HOSTINGER_SSH_CONNECT_TIMEOUT, 10) : 15);
const connectTimeoutSec = (isNaN(configuredConnectTimeoutSec) || configuredConnectTimeoutSec <= 0 ? 15 : configuredConnectTimeoutSec);

if (isFailFast) {
  if (concurrencyArgIdx !== -1 && parseInt(args[concurrencyArgIdx + 1], 10) !== 1) {
    console.error(`[FATAL CONFIG ERROR] --fail-fast requires concurrency=1, but --concurrency ${args[concurrencyArgIdx + 1]} was specified.`);
    process.exit(1);
  }
  if (retriesArgIdx !== -1 && parseInt(args[retriesArgIdx + 1], 10) !== 1) {
    console.error(`[FATAL CONFIG ERROR] --fail-fast requires retries=1, but --retries ${args[retriesArgIdx + 1]} was specified.`);
    process.exit(1);
  }
}

const concurrency = isFailFast ? 1 : (concurrencyArgIdx !== -1 ? parseInt(args[concurrencyArgIdx + 1], 10) : 4);
const configuredRetries = isFailFast ? 1 : (retriesArgIdx !== -1 ? parseInt(args[retriesArgIdx + 1], 10) : 3);
const maxConsecutiveFailures = isFailFast ? 1 : (args.indexOf('--max-failures') !== -1 ? parseInt(args[args.indexOf('--max-failures') + 1], 10) : 3);

// Validate transport mode strictly
const ALLOWED_TRANSPORTS = ['staging', 'scp'];
if (!ALLOWED_TRANSPORTS.includes(transportMode)) {
  if (transportMode === 'sftp') {
    console.error(`[ERROR] Transport mode 'sftp' is not implemented. Supported modes are 'staging' (local staging) and 'scp' (SSH/SCP with remote SHA-256 verification).`);
  } else {
    console.error(`[ERROR] Invalid transport mode '${transportMode}'. Allowed modes: ${ALLOWED_TRANSPORTS.join(', ')}.`);
  }
  process.exit(1);
}

const ALLOWED_REMOTE_BASE = '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets';

function validateRemoteDirStrict(targetDir) {
  if (typeof targetDir !== 'string' || !targetDir.trim()) {
    throw new Error(`[REMOTE_DIR_INVALID] Remote directory cannot be empty.`);
  }
  const clean = targetDir.trim().replace(/\\/g, '/');
  if (!clean.startsWith('/')) {
    throw new Error(`[REMOTE_DIR_INVALID] Remote directory must be an absolute POSIX path starting with '/': "${clean}"`);
  }

  // 1. Strict pre-normalization check: reject any segment containing '.' or '..' explicitly
  const rawSegments = clean.split('/');
  for (const seg of rawSegments) {
    if (seg === '.' || seg === '..') {
      throw new Error(`[REMOTE_DIR_INVALID] Remote directory contains explicit dot or dot-dot traversal segments before normalization: "${clean}"`);
    }
  }

  // 2. Normalize POSIX path
  const normalized = path.posix.normalize(clean);
  const normalizedSegments = normalized.split('/').filter(Boolean);
  if (normalizedSegments.some(seg => seg === '..' || seg === '.')) {
    throw new Error(`[REMOTE_DIR_INVALID] Remote directory contains traversal segments after normalization: "${clean}"`);
  }
  // This source bucket contains a legitimate proposals/uploads asset directory.
  // Allow only that exact directory inside our isolated root, never shared uploads.
  const proposalAssetUploads = `${ALLOWED_REMOTE_BASE}/ob-brokers-team/proposals/uploads`;
  if (normalizedSegments.includes('uploads') && normalized !== proposalAssetUploads) {
    throw new Error(`[FATAL ISOLATION VIOLATION] Remote directory contains prohibited folder 'uploads': "${clean}"`);
  }

  // 3. Strict containment check against ALLOWED_REMOTE_BASE
  const rel = path.posix.relative(ALLOWED_REMOTE_BASE, normalized);
  if (rel !== '' && (rel.startsWith('..') || path.posix.isAbsolute(rel))) {
    throw new Error(`[FATAL ISOLATION VIOLATION] Destination '${normalized}' is not within the exclusive persistent storage root '${ALLOWED_REMOTE_BASE}'.`);
  }
  return normalized;
}

// Validate remote configuration if SCP is chosen
if (transportMode === 'scp') {
  if (!hostingerUser) {
    console.error(`[ERROR] Transport mode 'scp' requires HOSTINGER_SSH_USER (account username in Hostinger).`);
    process.exit(1);
  }
  if (!hostingerRemoteDir) {
    console.error(`[ERROR] Transport mode 'scp' requires explicit --remote-dir or HOSTINGER_PERSISTENT_DIR.`);
    console.error(`        Do not guess paths. Confirm the real persistent path outside the deployment root in Hostinger.`);
    process.exit(1);
  }
  try {
    validateRemoteDirStrict(hostingerRemoteDir);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

const manifestPath = path.join(path.dirname(stagingBaseDir), 'migration-manifest.json');

function loadManifest() {
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      return { created_at: new Date().toISOString(), files: {} };
    }
  }
  return { created_at: new Date().toISOString(), files: {} };
}

function saveManifestAtomic(manifest, targetPath = manifestPath) {
  if (isDryRun) return;
  manifest.updated_at = new Date().toISOString();
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${targetPath}.tmp_${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
  fs.renameSync(tmpPath, targetPath);
}

function calculateSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Hardened containment validation.
 * Rejects absolute paths, '..' segments, and verifies containment via path.relative.
 */
function assertContainedPath(baseDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath) {
    throw new Error(`[SECURITY] Invalid path: empty or non-string`);
  }
  if (path.isAbsolute(relativePath)) {
    throw new Error(`[SECURITY] Absolute path not allowed: "${relativePath}"`);
  }
  const segments = relativePath.split(/[\\/]/);
  if (segments.some(seg => seg === '..')) {
    throw new Error(`[SECURITY] Path traversal segment '..' detected: "${relativePath}"`);
  }
  const resolved = path.resolve(baseDir, relativePath);
  const relToRoot = path.relative(baseDir, resolved);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    throw new Error(`[SECURITY] Path "${relativePath}" escapes root directory "${baseDir}"`);
  }
  return resolved;
}

/**
 * Validates storage path against a strict character whitelist.
 */
function validateStoragePath(relPath) {
  if (!/^[a-zA-Z0-9_\-\.\/ ]+$/.test(relPath)) {
    throw new Error(`[SECURITY] Path contains prohibited characters: "${relPath}"`);
  }
  const segments = relPath.split(/[\\/]/);
  if (segments.some(seg => seg === '..' || seg === '.')) {
    throw new Error(`[SECURITY] Path contains dot or dot-dot segments: "${relPath}"`);
  }
  return relPath;
}

/**
 * Safe POSIX shell argument escaping.
 */
function escapePosixShell(arg) {
  return `'` + String(arg).replace(/'/g, `'\\''`) + `'`;
}

let customExecFilePromise = null;

function setExecFileOverride(fn) {
  customExecFilePromise = fn;
}

function classifySshError(error, stderr, connectTimeoutSec, totalTimeoutMs) {
  const errText = `${error.message || ''}\n${stderr || ''}`.toLowerCase();
  
  // 1. Connection / Handshake timeout or connection failure
  if (
    errText.includes('connection timed out') || 
    errText.includes('connecttimeout') || 
    errText.includes('operation timed out') ||
    errText.includes('connection refused') ||
    errText.includes('host unreachable') ||
    errText.includes('network is unreachable') ||
    errText.includes('port 65002: connection timed out')
  ) {
    return new Error(`[SSH_CONNECT_TIMEOUT] SSH connection/handshake failed within ${connectTimeoutSec}s: ${error.message}\nStderr: ${stderr}`);
  }
  
  // 2. Process / Execution timeout (node killed process at total timeout limit)
  if (
    error.killed || 
    error.signal === 'SIGTERM' || 
    error.code === 'ETIMEDOUT' || 
    errText.includes('timed out')
  ) {
    return new Error(`[SSH_EXEC_TIMEOUT] Process execution exceeded total timeout of ${(totalTimeoutMs / 1000).toFixed(0)}s: ${error.message}\nStderr: ${stderr}`);
  }
  
  return new Error(`[SSH_COMMAND_ERROR] ${error.message}\nStderr: ${stderr}`);
}

function buildSshBaseArgs(options = {}) {
  const effectivePort = options.hostingerPort || hostingerPort;
  const effectiveKey = options.hostingerSshKey !== undefined ? options.hostingerSshKey : hostingerSshKey;
  const effectiveUser = options.hostingerUser || hostingerUser;
  const effectiveHost = options.hostingerHost || hostingerHost;
  const effectiveConnectTimeoutSec = options.connectTimeoutSec !== undefined ? options.connectTimeoutSec : connectTimeoutSec;

  const sshTarget = `${effectiveUser}@${effectiveHost}`;
  const keyArgs = effectiveKey ? ['-i', effectiveKey] : [];
  return [
    '-p', effectivePort,
    ...keyArgs,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', `ConnectTimeout=${effectiveConnectTimeoutSec}`,
    '-o', 'ServerAliveInterval=15',
    '-o', 'ServerAliveCountMax=3',
    sshTarget
  ];
}

function execFilePromise(command, fileArgs, options = {}) {
  if (customExecFilePromise) {
    return customExecFilePromise(command, fileArgs, options);
  }
  const timeout = options.timeout !== undefined ? options.timeout : sshTimeoutMs;
  const effectiveConnectTimeoutSec = options.connectTimeoutSec !== undefined ? options.connectTimeoutSec : connectTimeoutSec;
  return new Promise((resolve, reject) => {
    execFile(command, fileArgs, { encoding: 'utf-8', timeout }, (error, stdout, stderr) => {
      if (error) {
        if (command.includes('ssh') || command.includes('scp')) {
          reject(classifySshError(error, stderr, effectiveConnectTimeoutSec, timeout));
        } else {
          reject(new Error(`${error.message}\nStderr: ${stderr}`));
        }
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Check multiple remote file destinations in ONE single SSH session.
 * Used to revalidate files that are already marked REMOTE_VERIFIED.
 * 
 * Returns a Map of remotePath -> { status: 'EXISTS' | 'MISSING' | 'SYMLINK' | 'NOT_REGULAR', size?, sha256? }
 * Fails closed (throws Error) if output is incomplete, invalid, or SSH times out / fails.
 */
async function batchCheckRemoteFiles(sshBaseArgs, remoteFilePaths, options = {}) {
  if (!remoteFilePaths || remoteFilePaths.length === 0) {
    return new Map();
  }

  // Validate each path and ensure containment
  for (const p of remoteFilePaths) {
    validateRemoteDirStrict(path.posix.dirname(p));
  }

  // Construct batch inspection script with unambiguous delimiters
  const escapedPaths = remoteFilePaths.map(p => escapePosixShell(p)).join(' ');
  const batchScript = `for p in ${escapedPaths}; do
  echo "---REC_START---|$p"
  if [ -L "$p" ] || [ -h "$p" ]; then
    echo "TYPE:SYMLINK"
  elif [ -f "$p" ]; then
    SIZE=$(wc -c < "$p" | tr -d '[:space:]')
    SHA=$(sha256sum "$p" 2>/dev/null | awk '{print $1}')
    echo "TYPE:EXISTS:$SIZE:$SHA"
  elif [ -e "$p" ]; then
    echo "TYPE:NOT_REGULAR"
  else
    echo "TYPE:MISSING"
  fi
  echo "---REC_END---|$p"
done`;

  let res;
  try {
    res = await execFilePromise('ssh.exe', [...sshBaseArgs, batchScript], options);
  } catch (err) {
    throw new Error(`[BATCH_REMOTE_CHECK_FAILED] SSH batch verification failed: ${err.message}`);
  }

  const output = res.stdout || '';
  const lines = output.split(/\r?\n/);
  const results = new Map();

  let currentPath = null;
  let currentRecord = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('---REC_START---|')) {
      currentPath = trimmed.slice('---REC_START---|'.length);
      currentRecord = null;
    } else if (trimmed.startsWith('---REC_END---|')) {
      const endPath = trimmed.slice('---REC_END---|'.length);
      if (currentPath && endPath === currentPath && currentRecord) {
        results.set(currentPath, currentRecord);
      }
      currentPath = null;
      currentRecord = null;
    } else if (currentPath && trimmed.startsWith('TYPE:')) {
      const parts = trimmed.split(':');
      const type = parts[1];
      if (type === 'EXISTS') {
        const size = parseInt(parts[2], 10);
        const sha256 = (parts[3] || '').toLowerCase().trim();
        if (isNaN(size) || !/^[a-f0-9]{64}$/.test(sha256)) {
          throw new Error(`[BATCH_REMOTE_CHECK_PARSE_ERROR] Corrupted or invalid EXISTS record for "${currentPath}": "${trimmed}"`);
        }
        currentRecord = { status: 'EXISTS', size, sha256 };
      } else if (type === 'MISSING') {
        currentRecord = { status: 'MISSING' };
      } else if (type === 'SYMLINK') {
        currentRecord = { status: 'SYMLINK' };
      } else if (type === 'NOT_REGULAR') {
        currentRecord = { status: 'NOT_REGULAR' };
      } else {
        throw new Error(`[BATCH_REMOTE_CHECK_PARSE_ERROR] Unknown type "${type}" for "${currentPath}"`);
      }
    }
  }

  // Strict completeness verification: Ensure every requested path has a valid record
  for (const expectedPath of remoteFilePaths) {
    if (!results.has(expectedPath)) {
      throw new Error(`[BATCH_REMOTE_CHECK_INCOMPLETE] Incomplete batch response: missing verification record for "${expectedPath}"`);
    }
  }

  return results;
}

/**
 * Robust Supabase storage listing with pagination and strict error propagation.
 */
async function listAllStorageFiles(bucket, prefix = '') {
  const allFiles = [];
  
  async function recurse(currentPrefix) {
    let offset = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.storage.from(bucket).list(currentPrefix, {
        limit: pageSize,
        offset: offset,
        sortBy: { column: 'name', order: 'asc' }
      });

      if (error) {
        throw new Error(`[STORAGE_ERROR] Failed to list bucket '${bucket}' at prefix '${currentPrefix}': ${error.message}`);
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of data) {
        const itemPath = currentPrefix ? `${currentPrefix}/${item.name}` : item.name;
        if (item.id === null || !item.metadata) {
          await recurse(itemPath);
        } else {
          allFiles.push({
            bucket,
            name: item.name,
            fullPath: itemPath,
            size: item.metadata?.size || 0,
            mimetype: item.metadata?.mimetype || 'unknown',
            created_at: item.created_at,
            updated_at: item.updated_at
          });
        }
      }

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }
    }
  }

  await recurse(prefix);
  return allFiles;
}

/**
 * Check remote file status with strict tri-state discrimination and symlink detection:
 * Returns:
 *  - { status: 'EXISTS', size: number, sha256: string }
 *  - { status: 'MISSING' }
 * Fails closed (throws Error) if SSH fails, timeouts occur, remote is a symlink (including dangling),
 * or output is unparseable.
 */
async function checkRemoteDestinationStatus(sshBaseArgs, remotePath, options = {}) {
  const p = escapePosixShell(remotePath);
  const checkCmd = `if [ -L ${p} ] || [ -h ${p} ]; then echo "EXISTS_SYMLINK"; elif [ -f ${p} ]; then SIZE=$(wc -c < ${p} | tr -d '[:space:]'); SHA=$(sha256sum ${p} 2>/dev/null | awk '{print $1}'); echo "EXISTS:$SIZE:$SHA"; elif [ -e ${p} ]; then echo "EXISTS_NOT_REGULAR"; else echo "MISSING"; fi`;

  try {
    const res = await execFilePromise('ssh.exe', [...sshBaseArgs, checkCmd], options);
    const out = (res.stdout || '').trim();

    if (out.startsWith('EXISTS:')) {
      const parts = out.split(':');
      const size = parseInt(parts[1], 10);
      const sha256 = (parts[2] || '').toLowerCase().trim();
      if (isNaN(size) || !/^[a-f0-9]{64}$/.test(sha256)) {
        throw new Error(`[REMOTE_CHECK_ERROR] Unparseable EXISTS output from remote for '${remotePath}': "${out}"`);
      }
      return { status: 'EXISTS', size, sha256 };
    }

    if (out === 'MISSING') {
      return { status: 'MISSING' };
    }

    if (out === 'EXISTS_SYMLINK') {
      throw new Error(`[REMOTE_CHECK_ERROR] Remote destination '${remotePath}' is a symbolic link (or dangling symlink). Refusing to treat as missing or overwrite.`);
    }

    if (out === 'EXISTS_NOT_REGULAR') {
      throw new Error(`[REMOTE_CHECK_ERROR] Remote destination '${remotePath}' exists but is not a regular file (e.g. directory, pipe, device).`);
    }

    throw new Error(`[REMOTE_CHECK_ERROR] Unexpected remote response for '${remotePath}': "${out}"`);
  } catch (err) {
    throw new Error(`[REMOTE_CHECK_FAIL_CLOSED] Failed to safely check remote destination '${remotePath}': ${err.message}`);
  }
}

async function checkRemoteDestinationStatusResilient(sshBaseArgs, remotePath, options = {}) {
  const maxAttempts = 1 + (options.readOnlyRetries || 0);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await checkRemoteDestinationStatus(sshBaseArgs, remotePath, options);
    } catch (error) {
      const transient = /\[SSH_(?:CONNECT|EXEC)_TIMEOUT\]/.test(error.message);
      if (!transient || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

/**
 * Atomically install remote file to destination ONLY if destination does not exist.
 * Uses atomic POSIX hard link `ln src dest` (which fails with EEXIST if dest already exists,
 * without replacing destination or following symlinks) followed by `rm -f src`.
 * 
 * Accurately categorizes errors:
 *  - EEXIST / "File exists" / "failed to create hard link: File exists" -> [DESTINATION_RACE_OR_EXISTS]
 *  - Any other error (permission, filesystem limit, connection drop) -> [REMOTE_INSTALL_FAILED]
 * In both cases, halts and strictly preserves both remoteTmpPath and remoteFinalPath intact.
 */
async function installRemoteFileNoOverwrite(sshBaseArgs, remoteTmpPath, remoteFinalPath, options = {}) {
  const tmp = escapePosixShell(remoteTmpPath);
  const final = escapePosixShell(remoteFinalPath);
  
  // ln fails atomically if final exists (even if final is a symlink or regular file or directory).
  // Only after ln succeeds, rm tmp cleans up the source hard link.
  const installCmd = `ln ${tmp} ${final} && rm -f ${tmp}`;
  
  try {
    await execFilePromise('ssh.exe', [...sshBaseArgs, installCmd], options);
  } catch (err) {
    const errText = (err.message || '').toLowerCase();
    if (errText.includes('file exists') || errText.includes('eexist')) {
      throw new Error(`[DESTINATION_RACE_OR_EXISTS] Destination '${remoteFinalPath}' already exists on remote filesystem. Preserved temporary file '${remoteTmpPath}' and intact destination for inspection.`);
    }
    throw new Error(`[REMOTE_INSTALL_FAILED] Atomic installation failed for '${remoteFinalPath}': ${err.message}. Temporary file '${remoteTmpPath}' preserved.`);
  }
}

/**
 * Migrate single file with validation, staging, and optional remote transfer.
 */
async function migrateFile(file, manifest, options = {}) {
  const validatedRelPath = validateStoragePath(file.fullPath.replace(/\\/g, '/'));
  const fileKey = `${file.bucket}/${validatedRelPath}`;
  const effectiveStagingDir = options.stagingBaseDir || stagingBaseDir;
  const stagingFilePath = assertContainedPath(effectiveStagingDir, validatedRelPath.replace(/\//g, path.sep));
  const effectiveTransportMode = options.transportMode || transportMode;
  const effectiveIsDryRun = options.isDryRun !== undefined ? options.isDryRun : isDryRun;
  const effectiveRemoteDir = options.hostingerRemoteDir !== undefined ? options.hostingerRemoteDir : hostingerRemoteDir;
  const effectiveRetries = options.configuredRetries !== undefined ? options.configuredRetries : configuredRetries;

  // In dry-run mode, exit early before ANY SSH or filesystem check, respecting manifest status
  if (effectiveIsDryRun) {
    if (manifest.files[fileKey]?.status === 'REMOTE_VERIFIED') {
      return {
        status: 'SKIPPED_ALREADY_VERIFIED',
        file: file.fullPath,
        size: file.size,
        sha256: manifest.files[fileKey].sha256,
        transport: effectiveTransportMode
      };
    }
    return {
      status: 'DRY_RUN_PLANNED',
      file: file.fullPath,
      stagingPath: stagingFilePath,
      remotePath: effectiveRemoteDir ? `${effectiveRemoteDir}/${validatedRelPath}` : '(Not specified)',
      size: file.size,
      mimetype: file.mimetype,
      transport: effectiveTransportMode
    };
  }

  const effectiveUser = options.hostingerUser || hostingerUser;
  const effectiveHost = options.hostingerHost || hostingerHost;
  const effectivePort = options.hostingerPort || hostingerPort;
  const effectiveKey = options.hostingerSshKey !== undefined ? options.hostingerSshKey : hostingerSshKey;
  const effectiveSshTimeoutMs = options.sshTimeoutMs !== undefined 
    ? options.sshTimeoutMs 
    : (options.sshTimeoutSec !== undefined ? options.sshTimeoutSec * 1000 : sshTimeoutMs);
  const effectiveConnectTimeoutSec = options.connectTimeoutSec !== undefined 
    ? options.connectTimeoutSec 
    : connectTimeoutSec;
  const execOptions = options.execOptions || { timeout: effectiveSshTimeoutMs, connectTimeoutSec: effectiveConnectTimeoutSec };
  const sshBaseArgs = options.sshBaseArgs || buildSshBaseArgs(options);
  const sshTarget = `${effectiveUser}@${effectiveHost}`;
  const keyArgs = effectiveKey ? ['-i', effectiveKey] : [];

  // 0. Pre-flight batch verification check for REMOTE_VERIFIED files
  if (options.prevalidatedMap && options.prevalidatedMap.has(fileKey)) {
    const pre = options.prevalidatedMap.get(fileKey);
    if (pre.verified) {
      return {
        status: 'SKIPPED_ALREADY_VERIFIED',
        file: file.fullPath,
        size: file.size,
        sha256: pre.sha256,
        transport: 'scp'
      };
    }
  }

  // 1. Resumption check for REMOTE_VERIFIED: verify the remote file on Hostinger
  if (manifest.files[fileKey] && manifest.files[fileKey].status === 'REMOTE_VERIFIED' && effectiveTransportMode === 'scp') {
    const remoteFinalPath = `${effectiveRemoteDir}/${validatedRelPath}`;
    try {
      const remoteCheck = await checkRemoteDestinationStatusResilient(sshBaseArgs, remoteFinalPath, execOptions);
      if (remoteCheck.status === 'EXISTS' && remoteCheck.sha256 === manifest.files[fileKey].sha256 && (remoteCheck.size === manifest.files[fileKey].sizeBytes || file.size === remoteCheck.size)) {
        return {
          status: 'SKIPPED_ALREADY_VERIFIED',
          file: file.fullPath,
          size: file.size,
          sha256: remoteCheck.sha256,
          transport: 'scp'
        };
      } else if (remoteCheck.status === 'EXISTS') {
        throw new Error(`[CONFLICT] Destination '${remoteFinalPath}' exists remotely with differing SHA-256 (${remoteCheck.sha256} vs expected ${manifest.files[fileKey].sha256}) or size. Preserving remote file.`);
      }
      // If remoteCheck explicitly determined file is MISSING or has differing hash, proceed to re-transfer
      console.log(`[RE-TRANSFER] Remote check indicated file missing for ${file.fullPath}. Retrying transfer.`);
    } catch (checkErr) {
      // Timeout, SSH error, or unparseable output during resumption check:
      // FAIL CLOSED: Do not downgrade manifest status, do not download from Supabase, do not run SCP.
      // Record verification attempt timestamp and error details on entry while keeping status REMOTE_VERIFIED.
      manifest.files[fileKey].last_verification_error = checkErr.message;
      manifest.files[fileKey].last_verification_attempt = new Date().toISOString();

      return {
        status: 'ERROR',
        file: file.fullPath,
        error: `[RESUMPTION_CHECK_FAILED] Could not verify remote state of previously verified file: ${checkErr.message}`
      };
    }
  } else if (manifest.files[fileKey] && manifest.files[fileKey].status === 'LOCAL_STAGED_VERIFIED' && effectiveTransportMode === 'staging') {
    if (fs.existsSync(stagingFilePath)) {
      const localBuf = fs.readFileSync(stagingFilePath);
      const localSha = calculateSha256(localBuf);
      if (localSha === manifest.files[fileKey].sha256 && localBuf.length === file.size) {
        return {
          status: 'SKIPPED_ALREADY_VERIFIED',
          file: file.fullPath,
          size: file.size,
          sha256: localSha,
          transport: 'staging'
        };
      }
    }
  }

  let retries = effectiveRetries;
  let lastError = null;

  while (retries > 0) {
    try {
      const remoteFinalPath = `${effectiveRemoteDir}/${validatedRelPath}`;
      const remoteParentDir = path.posix.dirname(remoteFinalPath);

      // In SCP mode: check remote destination status BEFORE downloading from Supabase
      let destStatus = null;
      if (effectiveTransportMode === 'scp') {
        destStatus = await checkRemoteDestinationStatusResilient(sshBaseArgs, remoteFinalPath, execOptions);
      }

      // 1. Download file from Supabase (Strict read-only)
      let buffer;
      if (options.downloadFn) {
        buffer = await options.downloadFn(file.bucket, file.fullPath);
      } else {
        const { data, error } = await supabase.storage.from(file.bucket).download(file.fullPath);
        if (error) throw new Error(`Supabase download failed: ${error.message}`);
        const arrayBuffer = await data.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }

      if (file.size > 0 && buffer.length !== file.size) {
        throw new Error(`Size mismatch: expected ${file.size} bytes, got ${buffer.length} bytes`);
      }

      const localSha256 = calculateSha256(buffer);

      // 2. Save to local staging
      fs.mkdirSync(path.dirname(stagingFilePath), { recursive: true });
      fs.writeFileSync(stagingFilePath, buffer);

      const writtenBuf = fs.readFileSync(stagingFilePath);
      const writtenSha = calculateSha256(writtenBuf);
      if (writtenSha !== localSha256 || writtenBuf.length !== buffer.length) {
        throw new Error(`Local staging verification failed for ${file.fullPath}`);
      }

      // 3. Remote transfer if mode is SCP
      if (effectiveTransportMode === 'scp') {
        const remoteTmpPath = `${remoteParentDir}/.tmp_${localSha256.slice(0, 8)}_${path.posix.basename(remoteFinalPath)}`;

        if (destStatus.status === 'EXISTS') {
          if (destStatus.sha256 === localSha256 && (destStatus.size === buffer.length || file.size === destStatus.size)) {
            // Identical file already exists on remote destination: mark verified without re-upload
            manifest.files[fileKey] = {
              status: 'REMOTE_VERIFIED',
              fullPath: file.fullPath,
              stagingPath: path.relative(process.cwd(), stagingFilePath).replace(/\\/g, '/'),
              remotePath: remoteFinalPath,
              sizeBytes: buffer.length,
              sha256: localSha256,
              mimetype: file.mimetype,
              transport: 'scp',
              migrated_at: new Date().toISOString()
            };

            return {
              status: 'SKIPPED_ALREADY_VERIFIED_REMOTE',
              file: file.fullPath,
              size: buffer.length,
              sha256: localSha256,
              transport: 'scp'
            };
          } else {
            // Dest exists with differing size or SHA-256: abort immediately without overwriting
            throw new Error(`[CONFLICT] Destination '${remoteFinalPath}' exists remotely with differing SHA-256 (${destStatus.sha256} vs expected ${localSha256}) or size (${destStatus.size} vs ${buffer.length}). Preserving remote file and aborting without overwrite.`);
          }
        }

        // A verified file in the same parent directory proves the directory exists.
        // Avoid another SSH handshake for every remaining file in that directory.
        if (!options.remoteParentPreconfirmed?.has(remoteParentDir)) {
          await execFilePromise('ssh.exe', [...sshBaseArgs, `mkdir -p ${escapePosixShell(remoteParentDir)}`], execOptions);
          options.remoteParentPreconfirmed?.add(remoteParentDir);
        }

        // Upload to temp remote path using clean validated destination
        const scpArgs = [
          '-P', effectivePort,
          ...keyArgs,
          '-o', 'BatchMode=yes',
          '-o', 'StrictHostKeyChecking=accept-new',
          stagingFilePath,
          `${sshTarget}:${remoteTmpPath}`
        ];
        await execFilePromise('scp.exe', scpArgs, execOptions);

        // Compute remote SHA-256 on temporary file
        const hashCheck = await execFilePromise('ssh.exe', [
          ...sshBaseArgs,
          `sha256sum ${escapePosixShell(remoteTmpPath)} 2>/dev/null`
        ], execOptions);
        const remoteHashMatch = (hashCheck.stdout || '').match(/^[a-fA-F0-9]{64}/);
        const remoteHash = remoteHashMatch ? remoteHashMatch[0].toLowerCase() : null;

        if (!remoteHash || remoteHash !== localSha256) {
          // Do not delete remote temp file on error; preserve for diagnostics
          throw new Error(`Remote SHA-256 mismatch or unavailable on temporary file. Local: ${localSha256}, Remote: ${remoteHash || 'N/A'}`);
        }

        // Install remote file with non-overwriting atomic move (fails closed if destination exists)
        try {
          await installRemoteFileNoOverwrite(sshBaseArgs, remoteTmpPath, remoteFinalPath, execOptions);
        } catch (installError) {
          // An SSH timeout can happen after the server has completed ln && rm.
          // Confirm the final file before deciding whether installation failed.
          if (!installError.message.includes('[REMOTE_INSTALL_FAILED]')) throw installError;
          const installed = await checkRemoteDestinationStatusResilient(sshBaseArgs, remoteFinalPath, execOptions);
          if (installed.status !== 'EXISTS' || installed.size !== buffer.length || installed.sha256 !== localSha256) {
            throw installError;
          }
          console.log(`[RECOVERED] Atomic installation completed despite lost SSH response: ${file.fullPath}`);
        }

        manifest.files[fileKey] = {
          status: 'REMOTE_VERIFIED',
          fullPath: file.fullPath,
          stagingPath: path.relative(process.cwd(), stagingFilePath).replace(/\\/g, '/'),
          remotePath: remoteFinalPath,
          sizeBytes: buffer.length,
          sha256: localSha256,
          mimetype: file.mimetype,
          transport: 'scp',
          migrated_at: new Date().toISOString()
        };

        return {
          status: 'SUCCESS',
          file: file.fullPath,
          size: buffer.length,
          sha256: localSha256,
          transport: 'scp'
        };
      }

      // Mode staging
      manifest.files[fileKey] = {
        status: 'LOCAL_STAGED_VERIFIED',
        fullPath: file.fullPath,
        stagingPath: path.relative(process.cwd(), stagingFilePath).replace(/\\/g, '/'),
        sizeBytes: buffer.length,
        sha256: localSha256,
        mimetype: file.mimetype,
        transport: 'staging',
        migrated_at: new Date().toISOString()
      };

      return {
        status: 'SUCCESS',
        file: file.fullPath,
        size: buffer.length,
        sha256: localSha256,
        transport: 'staging'
      };
    } catch (err) {
      lastError = err;
      retries--;
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  manifest.files[fileKey] = {
    status: 'FAILED',
    fullPath: file.fullPath,
    error: lastError?.message || 'Unknown error',
    transport: effectiveTransportMode,
    attempted_at: new Date().toISOString()
  };

  return {
    status: 'ERROR',
    file: file.fullPath,
    error: lastError?.message || 'Unknown error'
  };
}

async function runBatch(items, concurrencyLimit, workerFn) {
  const results = [];
  
  if (concurrencyLimit <= 1) {
    for (const item of items) {
      const res = await workerFn(item);
      results.push(res);
    }
    return results;
  }

  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => workerFn(item));
    results.push(p);

    if (concurrencyLimit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= concurrencyLimit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

async function executeMigrationBatch(selectedFiles, options = {}) {
  const effectiveConcurrency = options.concurrency !== undefined ? options.concurrency : concurrency;
  const effectiveMaxConsecutiveFailures = options.maxConsecutiveFailures !== undefined ? options.maxConsecutiveFailures : maxConsecutiveFailures;
  const effectiveIsDryRun = options.isDryRun !== undefined ? options.isDryRun : isDryRun;
  const effectiveTransportMode = options.transportMode || transportMode;
  const effectiveRemoteDir = options.hostingerRemoteDir !== undefined ? options.hostingerRemoteDir : hostingerRemoteDir;
  const effectiveSshTimeoutMs = options.sshTimeoutMs !== undefined 
    ? options.sshTimeoutMs 
    : (options.sshTimeoutSec !== undefined ? options.sshTimeoutSec * 1000 : sshTimeoutMs);
  const effectiveConnectTimeoutSec = options.connectTimeoutSec !== undefined 
    ? options.connectTimeoutSec 
    : connectTimeoutSec;
  const execOptions = {
    timeout: effectiveSshTimeoutMs,
    connectTimeoutSec: effectiveConnectTimeoutSec,
    readOnlyRetries: options.readOnlyRetries !== undefined ? options.readOnlyRetries : 2
  };
  const sshBaseArgs = buildSshBaseArgs(options);

  const manifest = options.manifest || loadManifest();
  const manifestTarget = options.manifestPath || manifestPath;

  // 1. Batch Revalidation for REMOTE_VERIFIED files in 1 single SSH session
  const prevalidatedMap = new Map();
  const remoteParentPreconfirmed = new Set();

  // When resuming pending files only, a verified manifest entry in the same
  // directory lets SCP fail safely if the directory has since disappeared.
  // This avoids a redundant mkdir SSH session for every pending file.
  if (options.pendingOnly && effectiveTransportMode === 'scp') {
    for (const entry of Object.values(manifest.files)) {
      if (entry.status === 'REMOTE_VERIFIED' && entry.remotePath) {
        remoteParentPreconfirmed.add(path.posix.dirname(entry.remotePath));
      }
    }
  }

  if (effectiveTransportMode === 'scp' && !effectiveIsDryRun) {
    const verifiedFilesToInspect = [];
    for (const file of selectedFiles) {
      const validatedRelPath = validateStoragePath(file.fullPath.replace(/\\/g, '/'));
      const fileKey = `${file.bucket}/${validatedRelPath}`;
      if (manifest.files[fileKey]?.status === 'REMOTE_VERIFIED') {
        const remoteFinalPath = `${effectiveRemoteDir}/${validatedRelPath}`;
        verifiedFilesToInspect.push({ file, fileKey, remoteFinalPath });
      }
    }

    if (verifiedFilesToInspect.length > 0) {
      const pathsToCheck = verifiedFilesToInspect.map(v => v.remoteFinalPath);

      try {
        const batchResults = await batchCheckRemoteFiles(sshBaseArgs, pathsToCheck, execOptions);

        for (const item of verifiedFilesToInspect) {
          const res = batchResults.get(item.remoteFinalPath);
          const manifestEntry = manifest.files[item.fileKey];

          if (res.status === 'EXISTS') {
            if (res.sha256 === manifestEntry.sha256 && (res.size === manifestEntry.sizeBytes || item.file.size === res.size)) {
              prevalidatedMap.set(item.fileKey, { verified: true, sha256: res.sha256, size: res.size });
              remoteParentPreconfirmed.add(path.posix.dirname(item.remoteFinalPath));
            } else {
              // Remote file exists with differing SHA-256 or size: CONFLICT!
              throw new Error(`[CONFLICT] Destination '${item.remoteFinalPath}' exists remotely with differing SHA-256 (${res.sha256} vs expected ${manifestEntry.sha256}) or size (${res.size} vs ${manifestEntry.sizeBytes}). Preserving remote file and aborting batch without overwrite.`);
            }
          } else if (res.status === 'MISSING') {
            prevalidatedMap.set(item.fileKey, { verified: false, retransfer: true });
          } else if (res.status === 'SYMLINK') {
            throw new Error(`[REMOTE_CHECK_ERROR] Remote destination '${item.remoteFinalPath}' is a symbolic link. Refusing to treat as missing or overwrite.`);
          } else if (res.status === 'NOT_REGULAR') {
            throw new Error(`[REMOTE_CHECK_ERROR] Remote destination '${item.remoteFinalPath}' exists but is not a regular file.`);
          }
        }
      } catch (err) {
        // Record verification error on all inspected verified files without mutating status
        for (const item of verifiedFilesToInspect) {
          manifest.files[item.fileKey].last_verification_error = err.message;
          manifest.files[item.fileKey].last_verification_attempt = new Date().toISOString();
        }
        if (!effectiveIsDryRun) saveManifestAtomic(manifest, manifestTarget);
        throw err;
      }
    }

    // Give the shared SSH host a short breather after hashing verified files
    // before opening the first per-file connection for new transfers.
    if (verifiedFilesToInspect.length > 0 && selectedFiles.length > verifiedFilesToInspect.length) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  const batchExecutionOptions = {
    ...options,
    prevalidatedMap,
    remoteParentPreconfirmed,
    sshBaseArgs,
    execOptions,
    hostingerRemoteDir: effectiveRemoteDir,
    transportMode: effectiveTransportMode
  };

  let processed = 0;
  let consecutiveFailures = 0;
  const results = [];
  let isCircuitBroken = false;

  try {
    await runBatch(selectedFiles, effectiveConcurrency, async (file) => {
      if (isCircuitBroken || consecutiveFailures >= effectiveMaxConsecutiveFailures) {
        throw new Error(`[CIRCUIT_BREAKER] ${effectiveMaxConsecutiveFailures} consecutive error(s) reached. Aborting run immediately.`);
      }

      const res = await migrateFile(file, manifest, batchExecutionOptions);
      results.push(res);
      processed++;
      const progress = `[${processed}/${selectedFiles.length}]`;

      if (res.status === 'SUCCESS') {
        consecutiveFailures = 0;
        console.log(`${progress} OK: ${res.file} (${(res.size / 1024).toFixed(1)} KB) [${res.transport}] - SHA256: ${res.sha256.slice(0, 12)}...`);
      } else if (res.status === 'SKIPPED_ALREADY_VERIFIED') {
        consecutiveFailures = 0;
        console.log(`${progress} SKIP: ${res.file} (Already verified) [${res.transport}]`);
      } else if (res.status === 'SKIPPED_ALREADY_VERIFIED_REMOTE') {
        consecutiveFailures = 0;
        console.log(`${progress} SKIP (EXISTS & VERIFIED): ${res.file} (${(res.size / 1024).toFixed(1)} KB) [${res.transport}] - SHA256: ${res.sha256.slice(0, 12)}...`);
      } else if (res.status === 'DRY_RUN_PLANNED') {
        console.log(`${progress} PLAN: ${res.file} -> ${res.size} bytes (${res.mimetype})`);
        if (res.remotePath !== '(Not specified)') {
          console.log(`        Target: ${res.remotePath}`);
        }
      } else {
        consecutiveFailures++;
        if (!effectiveIsDryRun) saveManifestAtomic(manifest, manifestTarget);
        console.error(`${progress} FAIL: ${res.file} - Reason: ${res.error} (Consecutive errors: ${consecutiveFailures}/${effectiveMaxConsecutiveFailures})`);
        if (consecutiveFailures >= effectiveMaxConsecutiveFailures) {
          isCircuitBroken = true;
          const cbErr = new Error(`[CIRCUIT_BREAKER] ${effectiveMaxConsecutiveFailures} consecutive failure(s) reached on ${res.file}. Aborting run immediately.`);
          cbErr.results = results;
          throw cbErr;
        }
      }

      if (!effectiveIsDryRun && processed % 5 === 0) saveManifestAtomic(manifest, manifestTarget);
      return res;
    });
  } catch (err) {
    if (!err.results) {
      err.results = results;
    }
    if (!effectiveIsDryRun) saveManifestAtomic(manifest, manifestTarget);
    throw err;
  }

  if (!effectiveIsDryRun) saveManifestAtomic(manifest, manifestTarget);
  return results;
}

async function main() {
  console.log('====================================================');
  console.log('   HOSTINGER PERSISTENT STORAGE MIGRATION TOOL');
  console.log('====================================================\n');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Strict Simulation - No files/manifest written)' : 'LIVE EXECUTION'}`);
  console.log(`Transport Engine: ${transportMode.toUpperCase()}`);
  console.log(`Staging Directory: ${stagingBaseDir}`);
  if (transportMode === 'scp') {
    console.log(`Hostinger Remote Target: ${hostingerUser}@${hostingerHost}:${hostingerPort}:${hostingerRemoteDir}`);
  }
  console.log(`Concurrency: ${concurrency}`);
  if (limit) console.log(`Limit: ${limit} items`);
  if (matchPattern) console.log(`Pattern match: "${matchPattern}"`);
  console.log('\n[1/3] Scanning source storage (Supabase public-assets) with strict error handling...');

  let allFiles = [];
  try {
    const scopedSources = {
      5: { prefixes: ['bello-valdez-enterprise/projects/cana-rock-star'], expected: 94 },
      6: { prefixes: ['bello-valdez-enterprise/projects/cana-rock-galaxy', 'bello-valdez-enterprise/projects/cana-rock-stelar'], expected: 52 },
      7: { prefixes: ['bello-valdez-enterprise/projects/uve-residences', 'bello-valdez-enterprise/projects/elements', 'ob-brokers-team/projects/uve-residences', 'ob-brokers-team/projects/elements'], expected: 97 },
      8: { prefixes: ['presentations/slides', 'ob-brokers-team/proposals', 'cana-rock-osvaldo-bello/marketing'], expected: 27 }
    };
    const scoped = scopedSources[batchNumber];
    if (scoped) {
      for (const prefix of scoped.prefixes) {
        allFiles.push(...await listAllStorageFiles('public-assets', prefix));
      }
      if (allFiles.length !== scoped.expected) {
        throw new Error(`[SOURCE_INVENTORY_CHANGED] Expected ${scoped.expected} files for batch ${batchNumber}, found ${allFiles.length}. Review source inventory before migrating.`);
      }
    } else {
      allFiles = await listAllStorageFiles('public-assets');
    }
    console.log(`[SUCCESS] Verified complete count: ${allFiles.length} files in bucket 'public-assets'${scoped ? ` for batch ${batchNumber}` : ''}.`);
  } catch (err) {
    console.error(`[FATAL] Storage scan failed:`, err.message);
    process.exit(1);
  }

  const PILOT_ASSETS_SET = new Set([
    'cana-rock/galaxy/logo.png',
    'cana-rock/stelar/logo.png',
    'cana-rock/star/logo.png',
  ]);

  let selectedFiles = null;

  if (batchNumber !== null) {
    if (batchNumber === 1) {
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('ob-brokers-team/brand/') || f.fullPath.startsWith('logos/')
      );
    } else if (batchNumber === 2) {
      // Batch 2: Cana Rock previews and heroes, explicitly excluding the 3 pilot logos
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('cana-rock/') && !PILOT_ASSETS_SET.has(f.fullPath)
      );
    } else if (batchNumber === 3) {
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('ob-brokers-team/projects/cipres-residences/') ||
        f.fullPath.startsWith('ob-brokers-team/projects/luma-towers/') ||
        f.fullPath.startsWith('ob-brokers-team/projects/mar-azul-residences/') ||
        f.fullPath.startsWith('ob-brokers-team/projects/distrito-coral/')
      );
    } else if (batchNumber === 4) {
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('bello-valdez-enterprise/projects/palm-view/')
      );
    } else if (batchNumber === 5) {
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('bello-valdez-enterprise/projects/cana-rock-star/')
      );
    } else if (batchNumber === 6) {
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('bello-valdez-enterprise/projects/cana-rock-galaxy/') ||
        f.fullPath.startsWith('bello-valdez-enterprise/projects/cana-rock-stelar/')
      );
    } else if (batchNumber === 7) {
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('bello-valdez-enterprise/projects/uve-residences/') ||
        f.fullPath.startsWith('bello-valdez-enterprise/projects/elements/') ||
        f.fullPath.startsWith('ob-brokers-team/projects/uve-residences/') ||
        f.fullPath.startsWith('ob-brokers-team/projects/elements/')
      );
    } else if (batchNumber === 8) {
      selectedFiles = allFiles.filter(f => 
        f.fullPath.startsWith('presentations/slides/') ||
        f.fullPath.startsWith('ob-brokers-team/proposals/') ||
        f.fullPath.startsWith('cana-rock-osvaldo-bello/marketing/')
      );
    } else {
      console.error(`[FATAL] Unknown batch number '${batchNumber}'. Allowed batches are 1 to 8.`);
      process.exit(1);
    }
  } else if (prefixesFilter && prefixesFilter.length > 0) {
    selectedFiles = allFiles.filter(f => 
      prefixesFilter.some(pfx => f.fullPath.startsWith(pfx))
    );
  } else if (exactFiles && exactFiles.length > 0) {
    selectedFiles = allFiles.filter(f => exactFiles.includes(f.fullPath.replace(/\\/g, '/')));
    if (selectedFiles.length !== exactFiles.length) {
      const missing = exactFiles.filter(p => !selectedFiles.some(f => f.fullPath.replace(/\\/g, '/') === p));
      console.error(`[FATAL] Some requested exact files were NOT found in Supabase:`, missing);
      process.exit(1);
    }
  } else if (matchPattern) {
    selectedFiles = allFiles.filter(f => f.fullPath.toLowerCase().includes(matchPattern.toLowerCase()));
  } else {
    // If no filter or batch is supplied, fail closed unless explicit --all flag is passed
    if (!args.includes('--all')) {
      console.error(`[FATAL] No batch, prefix, exact-files, or match filter specified.`);
      console.error(`        To prevent accidental execution over the entire bucket, specify --batch <1-8>, --prefixes <list>, or --all.`);
      process.exit(1);
    }
    selectedFiles = allFiles;
  }

  if (limit && limit > 0) {
    selectedFiles = selectedFiles.slice(0, limit);
  }

  const manifest = loadManifest();

  if (isPendingOnly) {
    selectedFiles = selectedFiles.filter(file =>
      manifest.files[`${file.bucket}/${file.fullPath.replace(/\\/g, '/')}`]?.status !== 'REMOTE_VERIFIED'
    );
  }

  console.log(`Selected ${selectedFiles.length} files for this run${isPendingOnly ? ' (pending only)' : ''}.\n`);

  console.log('[2/3] Processing files...');
  const startTime = Date.now();

  let results = [];
  try {
    results = await executeMigrationBatch(selectedFiles, {
      concurrency,
      maxConsecutiveFailures,
      isDryRun,
      pendingOnly: isPendingOnly,
      manifest,
      manifestPath
    });
  } catch (err) {
    if (err.results) {
      results = err.results;
    }
    if (err.message && err.message.includes('[CIRCUIT_BREAKER]')) {
      console.error(`\n[FATAL HALT] ${err.message}`);
    } else {
      console.error(`\n[FATAL UNEXPECTED ERROR]`, err);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n[3/3] Summary Report');
  const successCount = results.filter(r => r.status === 'SUCCESS' || r.status === 'SKIPPED_ALREADY_VERIFIED' || r.status === 'SKIPPED_ALREADY_VERIFIED_REMOTE').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  const totalBytesMigrated = results.filter(r => r.status === 'SUCCESS').reduce((acc, r) => acc + (r.size || 0), 0);

  console.log('----------------------------------------------------');
  console.log(`Execution Time: ${durationSec}s`);
  console.log(`Total Processed: ${results.length}`);
  console.log(`Successful / Verified: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  if (!isDryRun) {
    console.log(`Transferred Volume: ${(totalBytesMigrated / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Manifest Location: ${manifestPath}`);
  }
  console.log('----------------------------------------------------\n');

  if (errorCount > 0 || results.length < selectedFiles.length) {
    console.warn('[WARNING] Some files failed or run was halted early. Check manifest for failure reasons.');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
}

module.exports = {
  batchCheckRemoteFiles,
  buildSshBaseArgs,
  classifySshError,
  checkRemoteDestinationStatus,
  installRemoteFileNoOverwrite,
  migrateFile,
  executeMigrationBatch,
  runBatch,
  loadManifest,
  saveManifestAtomic,
  calculateSha256,
  assertContainedPath,
  validateStoragePath,
  validateRemoteDirStrict,
  ALLOWED_REMOTE_BASE,
  setExecFileOverride
};
