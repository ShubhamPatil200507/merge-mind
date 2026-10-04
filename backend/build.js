const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let frontendDir = '.';
if (fs.existsSync('frontend')) {
  frontendDir = 'frontend';
} else if (fs.existsSync('../frontend')) {
  frontendDir = '../frontend';
} else if (fs.existsSync('src') && fs.existsSync('index.html')) {
  frontendDir = '.';
}

console.log(`[MergeMind Build] Resolved frontend directory: ${path.resolve(frontendDir)}`);
console.log('[MergeMind Build] Installing frontend dependencies...');
execSync('npm install --include=dev', { cwd: frontendDir, stdio: 'inherit' });

console.log('[MergeMind Build] Compiling Vite bundle...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('[MergeMind Build] Frontend build succeeded.');
