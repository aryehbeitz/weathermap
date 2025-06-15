const fs = require("fs");
const path = require("path");

// Get the repository root directory
const repoRoot = process.cwd();

// Read current version
const versionPath = path.join(repoRoot, "public", "version.json");
const currentVersion = require(versionPath).version;

// Increment patch version
const [major, minor, patch] = currentVersion.split(".").map(Number);
const newVersion = [major, minor, patch + 1].join(".");

// Update version.json
fs.writeFileSync(versionPath, JSON.stringify({ version: newVersion }, null, 2));

// Create a tag for the new version
const { execSync } = require("child_process");
execSync(`git tag -a "v${newVersion}" -m "Release version ${newVersion}"`);

console.log(`Version updated to ${newVersion}`);
