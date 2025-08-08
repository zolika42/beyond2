const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prettierGlob = 'dist/**/*.html';
const cssFile = 'style.css';

function runPrettierOnHTML() {
  console.log('✨ Running Prettier on generated HTML files...');
  try {
    execSync(`npx prettier --write "${prettierGlob}"`, { stdio: 'inherit' });
    console.log('✅ HTML formatting completed.\n');
  } catch (e) {
    console.error('❌ Failed to format HTML with Prettier:', e.message);
  }
}

function runStylelintOnCSS() {
  if (!fs.existsSync(cssFile)) {
    console.warn('⚠️ No style.css found. Skipping CSS linting.\n');
    return;
  }

  console.log('🎨 Running Stylelint on style.css...');
  try {
    execSync(`npx stylelint "${cssFile}" --fix`, { stdio: 'inherit' });
    console.log('✅ CSS lint & fix completed.\n');
  } catch (e) {
    console.error('❌ Failed to lint/fix CSS:', e.message);
  }
}

function main() {
  runPrettierOnHTML();
  runStylelintOnCSS();
}

main();
