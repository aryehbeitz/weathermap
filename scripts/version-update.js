const fs = require('fs');
const path = require('path');

// Get the version update type (patch, minor, major)
const versionType = process.argv[2] || 'patch';

// Path to version.json
const versionPath = path.join(__dirname, '../public/version.json');

// Read current version
const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
let [major, minor, patch] = versionData.version.split('.').map(Number);

// Update version based on the type
switch (versionType) {
  case 'major':
    major += 1;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor += 1;
    patch = 0;
    break;
  case 'patch':
  default:
    patch += 1;
}

// Create new version string
const newVersion = `${major}.${minor}.${patch}`;

// Update version.json
const newVersionData = { version: newVersion };
fs.writeFileSync(versionPath, JSON.stringify(newVersionData, null, 2) + '\n');

console.log(`Version updated to: ${newVersion}`);

// Update package.json version if it exists
try {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.version) {
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('Updated package.json version');
  }
} catch (error) {
  console.error('Error updating package.json version:', error.message);
}
