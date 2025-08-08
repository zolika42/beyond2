const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./deploy.config.js');
const TEMPLATE_MAIN = path.join(config.paths.templateDir, '/landing.template.html');
const args = process.argv.slice(2);
const flags = new Set();
const flagMap = {};
let highlight, chalk, inquirer;

function handleCLI() {
  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      const [flag, value] = arg.includes('=') ? arg.split('=') : [arg, true];
      flags.add(flag);
      flagMap[flag] = value;
    }
  });
}

function handleCLIHelp() {
  if (!flags.has('--help')) {
    return;
  }
  console.log(`
📄 Landing Page Generator CLI Help

🗣️ Usage:
  node landing-page-generator.js [options]

🛠️ Options:
  --prefix=CustomPrefix   Use a custom prefix for data-i18n keys
  --dry-run               Do not write output file, just show result
  --no-deploy             Skip the deploy.js step
  --help                  Show this help message

📂 Output:
  Creates an .html file in the current directory using selected sections
🚀 Then optionally runs deploy.js on it
    `);
  process.exit(0);
}

function handleCLIList() {
  if (!flags.has('--list')) {
    return;
  }
  console.log('📄 Existing HTML pages:\n');

  const files = fs
    .readdirSync(config.paths.landingDir)
    .filter((file) => file.endsWith('.html'))
    .map((file) => {
      const { size, birthtime } = fs.statSync(config.paths.landingDir + '/' + file);
      return {
        name: file,
        size: (size / 1024).toFixed(1) + ' KB',
        created: birthtime.toLocaleString()
      };
    });

  if (files.length === 0) {
    console.log('⚠️  No HTML files found in the project root.');
  } else {
    // 📋 Calculate max lengths for columns
    const namePad = Math.max(...files.map((f) => f.name.length)) + 2;
    const sizePad = Math.max(...files.map((f) => f.size.length)) + 2;
    const createdPad = Math.max(...files.map((f) => f.created.length)) + 2;

    // 🪄 Print header
    console.log(
      '│ ' +
        'File Name'.padEnd(namePad) +
        '│ Size'.padEnd(sizePad) +
        '│ Created'.padEnd(createdPad) +
        '│'
    );
    console.log('├' + '─'.repeat(namePad + sizePad + createdPad + 6) + '┤');

    // 🖨️ Print rows
    files.forEach((file) => {
      console.log(
        '│ ' +
          file.name.padEnd(namePad) +
          '│ ' +
          file.size.padEnd(sizePad - 1) +
          '│ ' +
          file.created.padEnd(createdPad - 1) +
          '│'
      );
    });
  }

  console.log(); // extra newline
  process.exit(0);
}

// 🔤 Converts a string to PascalCase
function toPascalCase(str) {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\s+./g, (m) => m.trim().charAt(1).toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase());
}

// 🏷️ Adds prefix to all data-i18n keys (if not already prefixed)
function prefixDataI18nAttributes(html, prefix) {
  return html.replace(/data-i18n=["']([^"']+)["']/g, (match, key) => {
    if (key.startsWith(`${prefix}_`)) return match; // skip if already prefixed
    return `data-i18n="${prefix}_${key}"`;
  });
}

function injectMetaTags(html, { seoTitle, metaDescription, ogTitle, ogDescription }) {
  // Remove existing <title> tag
  html = html.replace(/<title[^>]*>.*?<\/title>/gis, '');

  // Remove any existing meta name="description"
  html = html.replace(/<meta[^>]*name=["']description["'][^>]*>/gi, '');

  // Remove existing meta OG tags
  html = html.replace(/<meta[^>]*property=["']og:title["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property=["']og:description["'][^>]*>/gi, '');

  // Build new meta tags block
  let tags = '';
  if (seoTitle) tags += `  <title>${seoTitle}</title>\n`;
  if (metaDescription) tags += `  <meta name="description" content="${metaDescription}">\n`;
  if (ogTitle) tags += `  <meta property="og:title" content="${ogTitle}">\n`;
  if (ogDescription) tags += `  <meta property="og:description" content="${ogDescription}">\n`;

  // Insert before </head>
  return html.replace('</head>', `${tags}</head>`);
}

async function main() {
  console.log('📄 BeyondStart Landing Generator');

  handleCLI();
  handleCLIHelp();
  handleCLIList();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'pageName',
      message: 'What should the page name be? (e.g. digital-transformation)'
    },
    {
      type: 'input',
      name: 'seoTitle',
      message: 'Page <title>? (Leave empty to skip)'
    },
    {
      type: 'input',
      name: 'metaDescription',
      message: 'Meta description? (Leave empty to skip)'
    },
    {
      type: 'input',
      name: 'ogTitle',
      message: 'OG Title? (Leave empty to skip)'
    },
    {
      type: 'input',
      name: 'ogDescription',
      message: 'OG Description? (Leave empty to skip)'
    }
  ]);

  const customPrefix = flagMap['--prefix'] || toPascalCase(answers.pageName.trim());
  const dryRun = flags.has('--dry-run');
  const skipDeploy = flags.has('--no-deploy');

  const filename = `${answers.pageName.trim()}.html`;
  const selectedSections = answers.sections;

  // 📥 Load base template (index.template.html)
  const baseTemplate = fs.readFileSync(TEMPLATE_MAIN, 'utf-8');
  let finalHTML = prefixDataI18nAttributes(baseTemplate, customPrefix); // also prefix base template i18n keys
  finalHTML = injectMetaTags(finalHTML, answers);

  // 💾 Write to output file
  const outputPath = path.join(config.paths.landingDir, filename);
  if (dryRun) {
    console.log(chalk.yellow('\n🔍 Dry-run enabled. Final HTML output:\n'));
    console.log(highlight(finalHTML, { language: 'html', ignoreIllegals: true }));
  } else {
    fs.writeFileSync(outputPath, finalHTML, 'utf-8');
    console.log(`✅ Created: ${outputPath}`);
  }

  // 🚀 Run deploy.js (adds header + footer, etc.)
  if (!skipDeploy && !dryRun) {
    try {
      console.log('🚀 Running deploy.js...');
      execSync('node deploy.js', { stdio: 'inherit' });
    } catch (err) {
      console.error('❌ deploy.js error.');
    }
  } else if (skipDeploy) {
    console.log('⏩ deploy.js skipped (--no-deploy)');
  }
}

(async () => {
  ({ highlight } = await import('cli-highlight'));
  chalk = (await import('chalk')).default;
  inquirer = (await import('inquirer')).default;

  await main();
})();
