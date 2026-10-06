/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const canaRockRepo = process.env.CANA_ROCK_REPO;

if (!canaRockRepo) {
  throw new Error("CANA_ROCK_REPO is required");
}

const publicRoot = path.join(canaRockRepo, "public");
const projectNames = ["star", "universe", "galaxy", "stelar", "terra", "w2m", "homefest"];
const sourceCommit = process.env.CANA_ROCK_COMMIT || null;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function inferProject(relativePath) {
  const normalized = relativePath.toLowerCase();
  return projectNames.find((name) => normalized.includes(name)) || "shared";
}

const assets = walk(publicRoot)
  .sort((left, right) => left.localeCompare(right))
  .map((filePath) => {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(publicRoot, filePath).replaceAll("\\", "/");
    return {
      path: relativePath,
      project_hint: inferProject(relativePath),
      extension: path.extname(filePath).toLowerCase() || null,
      bytes: stats.size,
      sha256: sha256(filePath),
    };
  });

const duplicates = Object.values(
  assets.reduce((groups, asset) => {
    groups[asset.sha256] ||= [];
    groups[asset.sha256].push(asset.path);
    return groups;
  }, {}),
).filter((paths) => paths.length > 1);

const summaryOnly = process.argv.includes("--summary");
const summary = {
  generated_at: new Date().toISOString(),
  source_commit: sourceCommit,
  root: "public",
  file_count: assets.length,
  total_bytes: assets.reduce((total, asset) => total + asset.bytes, 0),
  duplicate_groups: duplicates,
};

process.stdout.write(
  `${JSON.stringify(
    summaryOnly ? summary : { ...summary, assets },
    null,
    2,
  )}\n`,
);
