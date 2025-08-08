# Architecture Overview

This repository contains CLI tools used to generate and deploy static websites, blog posts, and landing pages with multilingual support.

## 🧱 Project Structure

- `blog-generator.js` – creates blog posts and updates the blog index.
- `page-generator.js` – generates modular static pages and landing pages from templates.
- `deploy.js` – post-processes generated HTML: injects headers/footers, GTAGs, i18n translations, etc.
- `templates/` – base templates used by the generators.
- `translations.js` – localization file used by deploy.js.
- `deploy.config.js` – feature flags and reusable paths.
- `blog/`, `landing/`, etc. – output folders for generated pages.

## 🛠 Generators

### Blog Generator
- Creates a new blog post from `templates/blog.template.html`
- Injects i18n keys with a unique prefix
- Updates `blog.html` with links and previews

### Page Generator
- Generates static or landing pages
- Supports dynamic sections and templates
- Uses CLI flags for control (`--prefix`, `--dry-run`, `--template`, etc.)

## 🚀 Deployment Script

- Replaces translation keys (`data-i18n`) from `translations.js`
- Injects GTAG if enabled
- Adds headers, footers, favicons
- Can be toggled using `deploy.config.js`

## 📦 NPM Integration

- Run generators via `npm run` scripts
- Dependencies managed via `package.json`

## 💬 Notes

- All output is placed in `/dist` or appropriate content folders
- `--dry-run` flags prevent accidental file writes
