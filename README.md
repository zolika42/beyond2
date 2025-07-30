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

## 🔒 License

This project is open source and free to use or modify.  
Just please include attribution:

**Zoltán Horváth – https://beyondstart.solutions**
