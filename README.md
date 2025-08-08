# BeyondStart Solutions – Website

This repository contains the source code of the official [BeyondStart Solutions](https://beyondstart.solutions/) website.  
The goal is a responsive, SEO-friendly, and lightning-fast static business site powered by a JavaScript-based build pipeline.

## ❓ Why This Approach (No CMS, Static HTML)

We intentionally avoided using a traditional CMS (like WordPress or Drupal) for the BeyondStart Solutions website for the following reasons:

- ⚡ **Speed** – Static HTML is blazing fast. No database queries, no server-side processing, just instant rendering.
- 🔐 **Security** – No backend = zero attack surface for typical vulnerabilities (SQL injection, admin login brute force, etc.).
- 🧱 **Simplicity** – Everything is version-controlled in Git, deployed via a simple `node deploy.js`.
- 📦 **Lightweight** – No plugins, no bloat. Just pure HTML/CSS/JS – under 100KB per page even after translations.
- 🌐 **Perfect for Multilingual** – All languages are statically injected into clean separate files (`/hu/index.html`, `/en/index.html`, etc.).
- 🚀 **Excellent PageSpeed scores** – ~100/100 on mobile and desktop without any extra optimization or caching trickery.
- 🧠 **Fully Controlled SEO** – We can fine-tune meta tags, structured data, and OpenGraph tags per language and page.

This setup is ideal for business websites that prioritize speed, clarity, and SEO – without the overhead and complexity of a CMS.

If one day we need CMS features (e.g. blog, client-managed content), we can layer that in as a headless service or static JSON feed.

## 📁 Folder Structure

```
.
├── .ddev/                # Local dev environment (optional)  
├── dist/                 # Final static build output (HTML + CSS + assets)  
├── favicons/             # Generated favicons (copied to dist during deployment)  
├── images/               # Static images (logos, partners, etc.)  
├── locales/              # Language files (not actively used)  
├── node_modules/         # npm dependencies (excluded from repo)  
├── .htaccess             # Apache rewrite rules  
├── .htaccess.template    # Template version of .htaccess  
├── adatvedelem.html      # Privacy policy (HU)  
├── aszf.html             # Terms and conditions (HU)  
├── cookie.html           # Cookie policy (HU)  
├── deploy.js             # Node.js build + deploy + cleanup + translation manager  
├── impresszum.html       # Legal notice (HU)  
├── index.html            # Main homepage (default: HU)  
├── package.json          # npm dependencies  
├── package-lock.json     # npm lock file  
├── README.md             # This file  
├── script.js             # Core JS functionality  
├── script.min.js         # Minified version  
├── site.webmanifest      # PWA manifest  
├── style.css             # Main styling  
├── style.min.css         # Minified version  
├── translations.js       # All language content (flat key-value)  
├── translations.min.js   # Minified version  
├── translations.node.js  # Node.js importable version  
└── watch.js              # Development file-watcher (auto runs deploy.js)
```

## ⚙️ Requirements

- Node.js (v18+)

## 🚀 Usage

### Build the site

```bash
node deploy.js
```

The `deploy.js` script will automatically:

- Generate the `dist/` folder
- Merge and translate HTML files
- Inject language data from `translations.js`
- Detect and remove unused translation keys
- Validate and log any missing keys
- Copy favicons to root of `dist/`
- Prepare production-ready static assets

## 🧠 How It Works – Simple, Yet Powerful

- Full in-memory DOM parsing and injection
- SEO metadata injection by language
- Strict translation key usage analysis
- Cleans and simplifies output
- Translation-aware per-page export
- Includes optional future integration for auto-translating missing keys

## 🚀 What It Automates

- Per-language static build (`dist/hu/index.html`, `dist/en/index.html`, etc.)
- Favicon injection and placement
- HTML merging
- Translation injection
- Cleanup of unused keys
- Future-proof for AI-assisted translation fallback

## 🔄 Live Development – `watch.js`

Use this for rapid iteration.

### Start it:
```bash
node watch.js
```

### Features:

- Watches relevant source files (`*.html`, `translations.js`, etc.)
- Ignores `dist/`, `node_modules/`, `.min.js`, `.min.css`
- Triggers `deploy.js` automatically on change
- Prints logs on what changed and what got deployed
- Ideal for local development

## ⚙️ Apache Configuration – .htaccess and VirtualHost

### .htaccess (inside `dist/`)

```
RewriteEngine On  
RewriteCond %{REQUEST_FILENAME} !-f  
RewriteCond %{REQUEST_FILENAME} !-d  
RewriteRule ^([a-z]{2})/?$ /$1/index.html [L]  
RewriteRule ^([a-z]{2})/(.*)$ /$1/$2 [L]  
```

### Example VirtualHost

```
<VirtualHost *:443>  
    ServerName beyondstart.solutions  
    DocumentRoot /var/www/beyondstart/dist  

    SSLEngine on  
    SSLCertificateFile /etc/letsencrypt/live/beyondstart.solutions/fullchain.pem  
    SSLCertificateKeyFile /etc/letsencrypt/live/beyondstart.solutions/privkey.pem  

    <Directory /var/www/beyondstart/dist>  
        Options Indexes FollowSymLinks  
        AllowOverride All  
        Require all granted  
    </Directory>  
</VirtualHost>
```

## 🔄 Automatic Git Deployment (Staging & Production)

This project uses a Git `post-receive` hook on the server to automatically deploy updates whenever a push is made to a specific branch.

How it works:

- When you push to the `main` branch, the latest version is automatically deployed to:
  `/var/www/beyondsolutions`

- When you push to the `dev` branch, it gets deployed to:
  `/var/www/dev`

Commands to deploy:

```
git push deploy main   # → production
git push deploy dev    # → staging / dev
```

Server-side setup:

There is a **bare Git repository** at:
`/var/repo/beyondstart.git`

Inside that repo, the `hooks/post-receive` file looks like this:

```bash
#!/bin/bash
while read oldrev newrev ref
do
  branch=$(echo $ref | cut -d/ -f3)

  if [ "$branch" = "main" ]; then
    echo "==> Deploying to PRODUCTION"
    git --work-tree=/var/www/beyondsolutions --git-dir=/var/repo/beyondstart.git checkout -f main
  elif [ "$branch" = "dev" ]; then
    echo "==> Deploying to DEV"
    git --work-tree=/var/www/dev --git-dir=/var/repo/beyondstart.git checkout -f dev
  fi
done
```

Notes:

- You must have SSH access as `[The right user]@[server address]`, or update the path accordingly.
- Make sure the `post-receive` script is executable:  
  `chmod +x hooks/post-receive`


## 🌐 Multilingual Support

- `translations.js` stores all language strings.
- `deploy.js` injects only what is used and removes the rest.
- Minified versions generated automatically.

# ✨ BeyondStart Page Generator

This tool helps you quickly scaffold new responsive, SEO-friendly HTML pages based on modular sections from the `templates/` folder.

## 🗣️ Key Features

- 🔽 Interactive CLI for entering page name, sections, and SEO metadata
- 🧩 Section selection using arrow keys + space (checkbox interface)
- 🧠 Automatic `data-i18n` prefixing based on the page name
- ✍️ SEO meta fields (title, description, OG tags)
- 💡 `--dry-run` mode to preview the generated HTML without writing to disk
- 🎨 Terminal output highlighting (HTML code)
- 🔁 Automatically runs `deploy.js` after generation (can be commented out)
- 🌐 Full UTF-8 support, including emojis

---

## 🚀 Usage

```bash
node page-generator.js [--prefix=CustomPrefix] [--dry-run] [--list]
```

### Available Flags

| Flag         | Description                                            |
|--------------|--------------------------------------------------------|
| `--prefix`   | Manually define i18n prefix (defaults to page name)   |
| `--dry-run`  | Outputs HTML to console instead of writing to file     |
| `--list`     | Lists existing HTML pages in the project folder        |

---

## 🧪 CLI Prompts

1. **What should the page name be?**  
   → e.g. `digital-transformation` → creates `digital-transformation.html`

2. **Which sections do you want to include?**  
   → Multi-select list:
    - `hero`
    - `problem`
    - `services`
    - `references`
    - `testimonials`
    - `about`
    - `contact`
    - `cta-section`

3. **Optional SEO fields**
    - `<title>` — Page title
    - `<meta name="description">` — Meta description
    - `<meta property="og:title">` — Open Graph title
    - `<meta property="og:description">` — Open Graph description

---

## 🧠 How it works

- Loads the base template (`index.template.html`)
- Inserts selected sections into `<main>`
- Applies `data-i18n` prefix to all translatable keys
- Optionally injects meta fields in `<head>`
- Saves the result as `*.html` file in the project root
- Runs `deploy.js` to finalize the file (header/footer injection)

## 📂 File structure

```  
.  
├── templates/  
│   ├── index.template.html  
│   ├── hero.template.html  
│   ├── problem.template.html  
│   ├── ...  
├── page-generator.js  
├── deploy.js  
└── ...  
```

---

## 📂 Output structure

- Output file: `your-page-name.html` (e.g. `digital-transformation.html`)
- All selected sections are inserted **inside** the `<main id="main">` tag
- All `data-i18n` keys are prefixed with a PascalCase version of the filename
  - Example: `data-i18n="heroTitle"` → `data-i18n="DigitalTransformation_heroTitle"`

---

## 🚀 Landing Page Generator

This script generates SEO-ready, multilingual landing pages using a fixed `landing.template.html` file. It shares the same logic and CLI as the main `page-generator.js`, with a few landing-specific customizations.

### ✅ Differences from `page-generator.js`

| Feature | `page-generator.js` | `landing-page-generator.js` |
|--------|----------------------|------------------------------|
| 🔄 Template source | `index.template.html` | `landing.template.html` |
| 📁 Output folder | `./` (root) | `/landing/` |
| 🧩 Section selection | interactive checkbox | not applicable (template-based) |
| 🧠 i18n prefixing | based on `pageName` or `--prefix` | same |
| 🔍 SEO metadata injection | via prompt | same |
| 📦 `deploy.js` execution | optional | same |
| 🧰 CLI options | `--help`, `--dry-run`, `--prefix`, `--no-deploy`, `--list` | same |

### 🛠 CLI Options

```bash
node landing-page-generator.js [options]
```

| Flag | Description |
|------|-------------|
| `--prefix=<CustomPrefix>` | Use a custom prefix for `data-i18n` keys |
| `--dry-run` | Preview the final output without writing any files |
| `--no-deploy` | Skip the `deploy.js` post-processing step |
| `--help` | Show CLI usage instructions |
| `--list` | List already generated landing pages |

---

# ✍️ Blog Generator – `blog-generator.js`

This CLI tool creates localized blog posts and automatically updates the blog index.

### ✅ Features

- 📄 Creates new blog post HTML files from `templates/blog.template.html`
- 📂 Outputs to `/blog/[slug].html`
- 🧠 Adds unique `data-i18n` prefixes for each blog post
- 🗓️ Automatically inserts current date and time
- 🧵 Extracts blog title and intro for the blog index
- 📄 Updates `blog.html` (based on `templates/blog-index.template.html`)
- ⚙️ Optionally calls `deploy.js` to finalize everything

### 🧪 Usage

```bash
node blog-generator.js [options]
```

### 🛠 CLI Options

| Flag            | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `--title="..."`  | The visible blog post title (`<h2>`)                                        |
| `--prefix=...`   | Custom i18n prefix (auto-generated if omitted)                             |
| `--dry-run`      | Show output without writing any files                                      |
| `--no-deploy`    | Skip calling `deploy.js` after generation                                  |
| `--no-index`     | Skip updating `blog.html` index page                                       |
| `--help`         | Show CLI help                                                              |
| `--list`         | Lists all blog posts in the `/blog` directory                              |

### 📂 Output

- `/blog/your-post.html` — with proper meta structure, date, i18n keys
- `/blog.html` — auto-updated blog index with all posts listed

### 🧠 How it works

1. Loads `templates/blog.template.html`
2. Replaces `<h2 data-i18n="blog_title">` and `<strong data-i18n="blog_date">`
3. Injects current date and title
4. Extracts content from post for blog list:
    - `<h2 data-i18n="blog_title">` → blog_post_*_title
    - `<p data-i18n="blog_intro">` → blog_post_*_desc
5. Inserts entries into `<ul class="blog-list">` of `blog.html`
6. Optionally triggers `deploy.js`

### Example

```bash
node blog-generator.js --title="My First Blog Post"
```

Creates:

- `blog/my-first-blog-post.html`
- Updates `blog.html` with:
  ```html
  <a href="/blog/my-first-blog-post.html" data-i18n="blog_post_1_title">
    My First Blog Post
  </a>
  <p data-i18n="blog_post_1_desc">Short intro paragraph...</p>
  ```
---

## ✅ Requirements

- Node.js (v14+)
- `inquirer` package (install via `npm install inquirer`)

---

## 🔒 License

This project is open source and free to use or modify.  
Just please include attribution:

**Zoltán Horváth – https://beyondstart.solutions**
