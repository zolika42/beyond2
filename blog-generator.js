const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const config = require('./deploy.config.js');
const BLOG_INDEX_PATH = config.paths.rootBlogHtml;
const BLOG_DIR = config.paths.blogDir;
const TEMPLATE_DIR = config.paths.templateDir;
const BLOG_INDEX_TEMPLATE = config.paths.blogIndexTemplate;
const BLOG_LIST_SELECTOR = config.paths.blogListSelector;
const args = process.argv.slice(2);
const flags = new Set();
const flagMap = {};
let highlight, chalk, inquirer;
const isDryRun = process.argv.includes('--dry-run');
const skipIndex = process.argv.includes('--no-index');
const skipDeploy = process.argv.includes('--no-deploy');

/**
 * Handles terminal input.
 */
function handleCLI() {
  args.forEach((arg) => {
    if (arg.startsWith('--')) {
      const [flag, value] = arg.includes('=') ? arg.split('=') : [arg, true];
      flags.add(flag);
      flagMap[flag] = value;
    }
  });
}

/**
 * Handles CLI help text.
 */
function handleCLIHelp() {
  if (!process.argv.includes('--help')) {
    return;
  }

  console.log(`
📝 Blog Generator CLI Help

🗣️ Usage:
  node blog-generator.js <slug> "<Title>" [--flags]

📌 Required:
  <slug>       Friendly URL (e.g. 'hello-world')
  "<Title>"    Human-readable title (e.g. "Hello World - My First Blog Post")

🛠️ What it does:
  1. Creates a new blog post in /blog/<slug>.html
  2. Inserts the title and current datetime
  3. Prefixes all data-i18n keys with 'blog_<slug>_...'
  4. Replaces the <main id="main"> block in index.template.html
  5. Adds the blog post to blog.html (unless skipped)
  6. Runs deploy.js automatically (unless skipped)

⚙️ Optional flags:
  --dry-run       Show the generated output, but do not write any files
  --no-index      Skip updating blog.html (the blog index list)
  --no-deploy     Skip running deploy.js after generation
  --list          Display a list of existing blog posts
  --help          Show this help message

📂 Files used:
  - templates/blog.template.html
  - templates/index.template.html
  - templates/blog-index.template.html

⚠️ Notes:
  - Will not overwrite existing blog posts
  - Requires deploy.config.js for path resolution
  - Translation keys are auto-prefixed uniquely

📣 Example:
  node blog-generator.js hello-world "Hello World - My First Blog Post"
    `);

  process.exit(0);
}

/**
 * Handles list of existing blogs in the CLI.
 */
function handleCLIList() {
  if (!process.argv.includes('--list')) {
    return;
  }

  const blogFiles = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.html'))
    .map((file) => {
      const filePath = path.join(BLOG_DIR, file);
      const { size, birthtime } = fs.statSync(filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      let title = '–';
      try {
        const dom = new JSDOM(content);
        const h2 = dom.window.document.querySelector(
          'h2[data-i18n^="blog_"][data-i18n$="_blog_title"]'
        );
        if (h2) title = h2.textContent.trim();
      } catch (err) {
        title = '❌ Parsing error';
      }

      return {
        name: file,
        title,
        size: (size / 1024).toFixed(1) + ' KB',
        created: birthtime.toLocaleString()
      };
    });

  console.log('📝 Existing Blog Posts:\n');

  if (blogFiles.length === 0) {
    console.log('⚠️  No blog posts found in /blog directory.\n');
    process.exit(0);
  }

  // 📋 Column padding
  const namePad = Math.max(...blogFiles.map((f) => f.name.length)) + 2;
  const titlePad = Math.max(...blogFiles.map((f) => f.title.length), 12) + 2;
  const sizePad = Math.max(...blogFiles.map((f) => f.size.length)) + 2;
  const createdPad = Math.max(...blogFiles.map((f) => f.created.length)) + 2;

  // 🪄 Header
  console.log(
    '│ ' +
      'File'.padEnd(namePad) +
      '│ Title'.padEnd(titlePad) +
      '│ Size'.padEnd(sizePad) +
      '│ Created'.padEnd(createdPad) +
      '│'
  );
  console.log('├' + '─'.repeat(namePad + titlePad + sizePad + createdPad + 6) + '┤');

  // 🖨️ Rows
  blogFiles.forEach((file) => {
    console.log(
      '│ ' +
        file.name.padEnd(namePad) +
        '│ ' +
        file.title.padEnd(titlePad) +
        '│ ' +
        file.size.padEnd(sizePad - 1) +
        '│ ' +
        file.created.padEnd(createdPad - 1) +
        '│'
    );
  });

  console.log(); // newline
  process.exit(0);
}
/**
 * Prefix for translations, to make them unique for all blog posts.
 *
 * @param html
 *   The template's content.
 * @param prefix
 *   The prefix, blog_${slug}.
 * @returns {string}
 *   The unique data-i18n attribute.
 */
function prefixDataI18nAttributes(html, prefix) {
  return html.replace(/data-i18n=["']([\w\-]+)["']/g, (match, key) => {
    return `data-i18n="${prefix}_${key}"`;
  });
}

/**
 * Ensure blog.html exists, create from template if missing.
 */
function ensureBlogIndexExists() {
  if (!fs.existsSync(BLOG_INDEX_PATH)) {
    const template = fs.readFileSync(BLOG_INDEX_TEMPLATE, 'utf-8');
    fs.writeFileSync(BLOG_INDEX_PATH, template);
    console.log('✅ blog.html created');
  } else {
    console.log('✅ blog.html already exists');
  }
}

/**
 * Create a blog post.
 *
 * @param slug
 *   The slug, created from blog's title.
 * @param title
 *   The blog's title.
 */
function createBlogPost(slug, title) {
  const contentTemplatePath = path.join(TEMPLATE_DIR, 'blog.template.html');
  const layoutTemplatePath = path.join(TEMPLATE_DIR, 'index.template.html');
  const targetPath = path.join(BLOG_DIR, `${slug}.html`);

  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  The ${slug}.html already exists.`);
    return;
  }

  let content = fs.readFileSync(contentTemplatePath, 'utf-8');
  const prefix = `blog_${slug}`;
  content = prefixDataI18nAttributes(content, prefix);
  const dom = new JSDOM(content);
  const doc = dom.window.document;

  const h2 = doc.querySelector(`h2[data-i18n="${prefix}_blog_title"]`);
  if (h2) h2.textContent = title;

  const dateEl = doc.querySelector(`strong[data-i18n="${prefix}_blog_date"]`);
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now
      .toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(',', '');
  }

  content = dom.serialize();
  let layout = fs.readFileSync(layoutTemplatePath, 'utf-8');
  layout = layout.replace(/<main id="main">[\s\S]*?<\/main>/, `${content}`);

  if (isDryRun) {
    console.log(`💡 [DRY-RUN] Generated content for the blog/${slug}.html file:\n`);
    console.log(layout);
  } else {
    fs.writeFileSync(targetPath, layout);
    console.log(`✅ Blog post generated: blog/${slug}.html`);
  }
}

/**
 * Collect all the existing blog posts.
 *
 * @returns {Array<Object>} An array of blog post metadata.
 */
function readAllBlogPosts() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.html'));

  return files.map((filename, index) => {
    const filePath = path.join(BLOG_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(content);
    const document = dom.window.document;

    const h2 = document.querySelector('h2[data-i18n^="blog_"][data-i18n$="_blog_title"]');
    const title = h2 ? h2.textContent.trim() : `Post ${index + 1}`;

    const p = document.querySelector('p[data-i18n^="blog_"][data-i18n$="_blog_intro"]');
    const intro = p ? p.textContent.trim() : '';

    const slug = filename.replace('.html', '');

    return {
      slug,
      title,
      intro,
      titleKey: `blog_post_${index + 1}_title`,
      descKey: `blog_post_${index + 1}_desc`,
      href: `/blog/${filename}`
    };
  });
}

/**
 * Update the blog index, based on existing blog posts.
 *
 * @param posts
 *   List of posts.
 *
 * @see readAllBlogPosts().
 */
function updateBlogList(posts) {
  const content = fs.readFileSync(BLOG_INDEX_PATH, 'utf-8');
  const dom = new JSDOM(content);
  const document = dom.window.document;
  const list = document.querySelector(BLOG_LIST_SELECTOR);
  list.innerHTML = '';

  posts.forEach((post) => {
    const li = document.createElement('li');

    const a = document.createElement('a');
    a.href = post.href;
    a.setAttribute('data-i18n', post.titleKey);
    a.textContent = post.title;

    const p = document.createElement('p');
    p.setAttribute('data-i18n', post.descKey);
    p.textContent = post.intro;

    li.appendChild(a);
    li.appendChild(p);
    list.appendChild(li);
  });

  fs.writeFileSync(BLOG_INDEX_PATH, dom.serialize());
  console.log('✅ blog.html has updated.');
}

/**
 * Main function.
 */
async function main() {
  const slug = process.argv[2];
  const title = process.argv[3];

  handleCLI();
  handleCLIHelp();
  handleCLIList();

  if (!slug || !title) {
    console.error('❌ Usage: node blog-generator.js <slug> "<Title>"');
    process.exit(1);
  }

  ensureBlogIndexExists();
  createBlogPost(slug, title);
  if (!isDryRun && !skipIndex) {
    const posts = readAllBlogPosts();
    updateBlogList(posts);
  } else if (isDryRun) {
    console.log('\n💡 [DRY-RUN] blog.html has not updated (only post has generated).');
  } else if (skipIndex) {
    console.log('\n🚫 [NO-INDEX] blog.html has not updated.');
  }

  // --- DEPLOY ---
  if (!isDryRun && !skipDeploy) {
    console.log('\n🚀 Running deploy.js...\n');

    const { spawnSync } = require('child_process');
    const result = spawnSync('node', ['deploy.js'], { stdio: 'inherit' });

    if (result.error) {
      console.error(`❌ Failed to execute deploy.js:`, result.error.message);
    } else if (result.status !== 0) {
      console.error(`❌ deploy.js exited with code ${result.status}`);
    } else {
      console.log('✅ deploy.js finished successfully.');
    }
  } else if (isDryRun) {
    console.log('\n💡 [DRY-RUN] Skipped deploy.js (dry run mode).');
  } else if (skipDeploy) {
    console.log('\n🚫 [NO-DEPLOY] Skipped deploy.js (explicitly disabled).');
  }
}

(async () => {
  ({ highlight } = await import('cli-highlight'));
  chalk = (await import('chalk')).default;
  inquirer = (await import('inquirer')).default;

  await main();
})();
