const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine frontend directory location relative to current working directory
let frontendDir = '.';
if (fs.existsSync('frontend')) {
  frontendDir = 'frontend';
} else if (fs.existsSync('../frontend')) {
  frontendDir = '../frontend';
} else if (fs.existsSync('src') && fs.existsSync('index.html')) {
  frontendDir = '.';
}

console.log(`[MergeMind Build] Resolved frontend directory: ${path.resolve(frontendDir)}`);

// 1. Install frontend dependencies including dev tooling (vite, typescript)
console.log('[MergeMind Build] Installing frontend dependencies...');
execSync('npm install --include=dev', { cwd: frontendDir, stdio: 'inherit' });

// 2. Build production assets
console.log('[MergeMind Build] Compiling Vite bundle...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('[MergeMind Build] Frontend build succeeded.');
