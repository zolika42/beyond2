const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const config = require("./deploy.config.js");

const green = (str) => `\x1b[32m${str}\x1b[0m`;
const yellow = (str) => `\x1b[33m${str}\x1b[0m`;
const red = (str) => `\x1b[31m${str}\x1b[0m`;

const original = fs.readFileSync("translations.js", "utf-8");
const originalScript = fs.readFileSync("script.js", "utf-8");
const exported = original.replace(/^const translations =/, "module.exports =");
const specialKeys = [
    "pageTitle",
    "metaDescription",
    "ogTitle",
    "ogDescription",
    "metaKeywords"
];
const GTAG_SNIPPET = config.GTAG_SNIPPET;
const baseURL = config.baseURL;
// 0. Check Google tags
function ensureGtagInRawHTML(filePath) {
    const html = fs.readFileSync(filePath, "utf-8");

    const hasTag1 = html.includes(`gtag/js?id=${config.GTAG_SNIPPET_AW_CODE}`) &&
        html.includes(`gtag('config', '${config.GTAG_SNIPPET_AW_CODE}'`);

    if (hasTag1) return; // minden rendben

    const snippets = [];
    if (!hasTag1) snippets.push(GTAG_SNIPPET);

    const injected = snippets.join("\n") + "\n</body>";
    const modified = html.replace("</body>", injected);

    fs.writeFileSync(filePath, modified, "utf-8");
    console.log(yellow(`⚠️ Raw GTAG injected into ${filePath} (${snippets.length} tag)`));
}
const allRawHtmlFiles = [
    ...fs.readdirSync(".").filter(f => f.endsWith(".html")).map(f => f),
    ...(fs.existsSync("blog") ? fs.readdirSync("blog").filter(f => f.endsWith(".html")).map(f => `blog/${f}`) : []),
    ...(fs.existsSync("landing") ? fs.readdirSync("landing").filter(f => f.endsWith(".html")).map(f => `landing/${f}`) : [])
];

allRawHtmlFiles.forEach(ensureGtagInRawHTML);
console.log(green("✔ Raw HTML files checked & GTAG injected where needed."));

// 0/b. Check missing gtag event tracking on CTA
const trackingMissingTable = [];

function checkMissingTrackingCTAs(filePath) {
    const html = fs.readFileSync(filePath, "utf-8");
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const selectors = [
        'a[href^="#contact"]',
        'a[href^="/#contact"]',
        'button',
        'input[type="submit"]',
        'form[action*="web3forms"]',
        'form[action*="contact"]',
        'form[action*="submit"]'
    ];

    const candidates = [...doc.querySelectorAll(selectors.join(','))];

    candidates.forEach((el, i) => {
        const outer = el.outerHTML;
        const hasTracking =
            el.getAttribute("onclick")?.includes("gtag('event'") ||
            el.getAttribute("onsubmit")?.includes("gtag('event'");

        if (!hasTracking) {
            trackingMissingTable.push({
                file: filePath,
                index: i + 1,
                tag: el.tagName.toLowerCase(),
                html: outer
            });
        }
    });
}

allRawHtmlFiles.forEach(checkMissingTrackingCTAs);

if (trackingMissingTable.length > 0) {
    const col1 = "file";
    const col2 = "index";
    const col3 = "tag";
    const col4 = "snippet";

    const col1Len = Math.max(...trackingMissingTable.map(r => r.file.length), col1.length);
    const col2Len = col2.length;
    const col3Len = col3.length;
    const col4Len = 50;

    const pad = (str, len) => str + " ".repeat(Math.max(0, len - str.length));
    const truncate = (str, len) => str.length > len ? str.slice(0, len - 3) + "..." : str;

    const line = `┌${"─".repeat(col1Len + 2)}┬${"─".repeat(col2Len + 2)}┬${"─".repeat(col3Len + 2)}┬${"─".repeat(col4Len + 2)}┐`;
    const sep  = `├${"─".repeat(col1Len + 2)}┼${"─".repeat(col2Len + 2)}┼${"─".repeat(col3Len + 2)}┼${"─".repeat(col4Len + 2)}┤`;
    const end  = `└${"─".repeat(col1Len + 2)}┴${"─".repeat(col2Len + 2)}┴${"─".repeat(col3Len + 2)}┴${"─".repeat(col4Len + 2)}┘`;

    console.log("\n🔍 CTAs with missing GTAG 'event' tracking:");
    console.log(line);
    console.log(`│ ${pad(col1, col1Len)} │ ${pad(col2, col2Len)} │ ${pad(col3, col3Len)} │ ${pad(col4, col4Len)} │`);
    console.log(sep);
    trackingMissingTable.forEach(row => {
        console.log(yellow(`│ ${pad(row.file, col1Len)} │ ${pad(String(row.index), col2Len)} │ ${pad(row.tag, col3Len)} │ ${pad(truncate(row.html, col4Len), col4Len)} │`));
    });
    console.log(end);
} else {
    console.log(green("🎯 All CTA links to #contact have proper GTAG tracking."));
}

// 1. Generate translations.node.js
fs.writeFileSync("translations.node.js", exported);
console.log(green("✔ translations.node.js created."));

// 2. Generate translations.min.js
const minifiedTranslations = original
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\n/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/:\s+/g, ":")
    .replace(/,\s+/g, ",")
    .replace(/\{\s+/g, "{")
    .replace(/\s+\}/g, "}");
fs.writeFileSync("translations.min.js", minifiedTranslations);
console.log(green("✔ translations.min.js created."));

// 3. Generate script.min.js
const minifiedScript = originalScript
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\n/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/:\s+/g, ":")
    .replace(/,\s+/g, ",")
    .replace(/\{\s+/g, "{")
    .replace(/\s+\}/g, "}");
fs.writeFileSync("script.min.js", minifiedScript);
console.log(green("✔ script.min.js created."));

// 4. Generate style.min.css
const cssOriginal = fs.readFileSync("style.css", "utf-8");
const cssMinified = cssOriginal
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\n/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*:\s*/g, ":")
    .trim();
fs.writeFileSync("style.min.css", cssMinified);
console.log(green("✔ style.min.css created."));

// 5. Load translations
const translations = require("./translations.node.js");
const {retarget} = require("jsdom/lib/jsdom/living/helpers/shadow-dom");
if (!translations || typeof translations !== "object") {
    console.error(red("❌ The translations object is not available!"));
    process.exit(1);
}

// 6. Create dist directory
const targetDir = "dist";
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

// 7. Copy minified files
fs.copyFileSync("style.min.css", path.join(targetDir, "style.min.css"));
fs.copyFileSync("script.min.js", path.join(targetDir, "script.min.js"));
fs.copyFileSync("translations.min.js", path.join(targetDir, "translations.min.js"));
if (fs.existsSync("site.webmanifest")) {
    fs.copyFileSync("site.webmanifest", path.join(targetDir, "site.webmanifest"));
}
console.log(green("✔ Minified files copied into /dist folder."));

// 8. Copy images folder
function copyFolderRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}
if (fs.existsSync("images")) {
    copyFolderRecursive("images", path.join(targetDir, "images"));
    console.log(green("✔ images folder copied."));
}

// 9. Process HTML files
const rootHtmlFiles = fs.readdirSync(".").filter(file => file.endsWith(".html"));
const blogHtmlFiles = fs.existsSync("blog") ? fs.readdirSync("blog").filter(file => file.endsWith(".html")).map(file => `blog/${file}`) : [];
const landingHtmlFiles = fs.existsSync("landing") ? fs.readdirSync("landing").filter(file => file.endsWith(".html")).map(file => `landing/${file}`) : [];
const htmlFiles = [...rootHtmlFiles, ...blogHtmlFiles, ...landingHtmlFiles];
const missingTranslationTable = [];

for (const htmlFile of htmlFiles) {
    const htmlContent = fs.readFileSync(htmlFile, "utf-8");
    const baseDom = new JSDOM(htmlContent);

    for (const lang of Object.keys(translations)) {
        const langDict = translations[lang];
        const doc = baseDom.window.document.cloneNode(true);
        const missingKeys = [];

        doc.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (langDict[key]) {
                el.innerHTML = langDict[key];
            } else {
                missingKeys.push(key);
                missingTranslationTable.push({ key, lang, file: htmlFile });
            }
        });

        doc.documentElement.lang = lang;

        // Update canonical URL
        const canonical = doc.querySelector('link[rel="canonical"]');
        if (canonical) {
            const langPath = lang === "en" ? "" : `${lang}/`;
            canonical.href = `${baseURL}/${langPath}${htmlFile}`;
        }

        // 🔁 Replace non-data-i18n elements based on known selectors
        const skipTags = ["option", "button", "span", "li"];
        const specialMap = {
            title: "pageTitle",
            "meta[name='description']": "metaDescription",
            "meta[property='og:title']": "ogTitle",
            "meta[property='og:description']": "ogDescription",
            "meta[name='keywords']": "metaKeywords",
        };

        for (const [selector, key] of Object.entries(specialMap)) {
            const el = doc.querySelector(selector);
            let langKey = htmlFile.replace('_', '-');
            langKey = htmlFile.replace('/', '-');
            langKey = langKey.replace('.html', '-' + key);
            if (!langDict[langKey]) {
                langKey = key; // Fallback
            }

            if (el && langDict[langKey]) {
                if (el.tagName === "TITLE") el.textContent = langDict[langKey];
                else el.setAttribute("content", langDict[langKey]);
            }
        }

        doc.querySelectorAll("body *:not([data-i18n])").forEach(el => {
            if (skipTags.includes(el.tagName.toLowerCase())) return;
            if (el.children.length > 0) return;
            const text = el.textContent.trim();
            if (!text || text.length < 2) return;

            const autoKey = Object.keys(langDict).find(k => langDict["hu"]?.[k] === text || langDict[k] === text);
            if (autoKey && langDict[autoKey]) {
                el.textContent = langDict[autoKey];
            }
        });

        updateLanguageSelect(doc, lang);

        // Rewrite hrefs
        doc.querySelectorAll("a[href]").forEach((a) => {
            const href = a.getAttribute("href");
            if (a.closest(".language-switcher")) return;
            if (
                href.startsWith("/") &&
                !href.startsWith(`/${lang}/`) &&
                !href.startsWith("/images") &&
                !href.startsWith("/style") &&
                !href.startsWith("/script") &&
                !href.startsWith("/translations") &&
                !href.startsWith("http") &&
                !href.startsWith("#")
            ) {
                const newHref = `/${lang}${href}`;
                a.setAttribute("href", newHref);
            } else if (
                href.startsWith("/#") &&
                !href.startsWith(`/${lang}/`)
            ) {
                a.setAttribute("href", `/${lang}/${href.substring(2)}`);
            }
        });

        const langDir = path.join(targetDir, lang);
        if (!fs.existsSync(langDir)) fs.mkdirSync(langDir);

        const outputHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        const fullPath = path.join(langDir, htmlFile);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, outputHtml, "utf-8");
        console.log(green(`✅ ${lang}/${htmlFile} created.`));

        if (missingKeys.length > 0) {
            console.warn(yellow(`⚠️ ${lang}: Missing translations in ${htmlFile}: ${missingKeys.join(", ")}`));
        }
    }
}

// 10. Print summary table of missing translations
function pad(str, len) {
    return str + " ".repeat(Math.max(0, len - str.length));
}

if (missingTranslationTable.length > 0) {
    const col1 = "key";
    const col2 = "language";
    const col3 = "file";

    const col1Len = Math.max(...missingTranslationTable.map(r => r.key.length), col1.length);
    const col2Len = Math.max(...missingTranslationTable.map(r => r.lang.length), col2.length);
    const col3Len = Math.max(...missingTranslationTable.map(r => r.file.length), col3.length);

    const line = `┌${"─".repeat(col1Len + 2)}┬${"─".repeat(col2Len + 2)}┬${"─".repeat(col3Len + 2)}┐`;
    const sep = `├${"─".repeat(col1Len + 2)}┼${"─".repeat(col2Len + 2)}┼${"─".repeat(col3Len + 2)}┤`;
    const end = `└${"─".repeat(col1Len + 2)}┴${"─".repeat(col2Len + 2)}┴${"─".repeat(col3Len + 2)}┘`;

    console.log("\n📝 Missing translations summary:");
    console.log(line);
    console.log(`│ ${pad(col1, col1Len)} │ ${pad(col2, col2Len)} │ ${pad(col3, col3Len)} │`);
    console.log(sep);
    for (const row of missingTranslationTable) {
        console.log(red(`│ ${pad(row.key, col1Len)} │ ${pad(row.lang, col2Len)} │ ${pad(row.file, col3Len)} │`));
    }
    console.log(end);
} else {
    console.log(green("🎉 All translations are complete in every language!"));
}

// 11. Generate sitemap.xml
const siteBase = baseURL;
const sitemapEntries = [];

for (const htmlFile of htmlFiles) {
    const filename = path.basename(htmlFile);
    for (const lang of Object.keys(translations)) {
        const url = `${siteBase}${lang === "en" ? "" : `/${lang}`}/${filename}`;
        sitemapEntries.push(`<url><loc>${url}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
    }
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapEntries.join("\n") +
    `\n</urlset>`;

fs.writeFileSync(path.join(targetDir, "sitemap.xml"), sitemapXml, "utf-8");
console.log(green("✔ sitemap.xml created."));

// 12. Generate robots.txt
const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${siteBase}/sitemap.xml`;
fs.writeFileSync(path.join(targetDir, "robots.txt"), robotsTxt, "utf-8");
console.log(green("✔ robots.txt created."));

// 13. Update <select id="language"> for selected language
function updateLanguageSelect(doc, currentLang) {
    const select = doc.querySelector("select#language");
    if (!select) return;

    const options = select.querySelectorAll("option");
    options.forEach((opt) => {
        const langFromValue = (opt.value.match(/^\/([a-z]{2})\//) || [])[1];
        if (langFromValue === currentLang) {
            opt.setAttribute("selected", "selected");
        } else {
            opt.removeAttribute("selected");
        }
    });
}

// 14. Log unused translation keys
const usedKeys = new Set();
htmlFiles.forEach(file => {
    const htmlContent = fs.readFileSync(file, "utf-8");
    const matches = [...htmlContent.matchAll(/data-i18n=["']([^"']+)["']/g)];
    matches.forEach(m => usedKeys.add(m[1]));
});

const unusedKeysByLang = {};
for (const [lang, dict] of Object.entries(translations)) {
    const langKeys = Object.keys(dict);
    const unused = langKeys.filter(k => !usedKeys.has(k));
    if (unused.length > 0) unusedKeysByLang[lang] = unused;
}

if (Object.keys(unusedKeysByLang).length > 0) {
    const col1 = "key";
    const col2 = "language";
    const col3 = "file";
    const table = [];

    const unusedKeysByLang = {};

    Object.entries(translations).forEach(([lang, langData]) => {
        const unused = Object.keys(langData).filter(key => !usedKeys.has(key) && !specialKeys.some(special => key.includes(special)));
        if (unused.length > 0) unusedKeysByLang[lang] = unused;
    });

    Object.entries(unusedKeysByLang).forEach(([lang, keys]) => {
        keys.forEach(key => {
            table.push({ key, lang, file: "translations.js" });
        });
    });

    const col1Len = Math.max(...table.map(r => r.key.length), col1.length);
    const col2Len = Math.max(...table.map(r => r.lang.length), col2.length);
    const col3Len = Math.max(...table.map(r => r.file.length), col3.length);

    const line = `┌${"─".repeat(col1Len + 2)}┬${"─".repeat(col2Len + 2)}┬${"─".repeat(col3Len + 2)}┐`;
    const sep = `├${"─".repeat(col1Len + 2)}┼${"─".repeat(col2Len + 2)}┼${"─".repeat(col3Len + 2)}┤`;
    const end = `└${"─".repeat(col1Len + 2)}┴${"─".repeat(col2Len + 2)}┴${"─".repeat(col3Len + 2)}┘`;

    console.log("\n🟨 Unused translation keys:");
    console.log(line);
    console.log(`│ ${pad(col1, col1Len)} │ ${pad(col2, col2Len)} │ ${pad(col3, col3Len)} │`);
    console.log(sep);
    for (const row of table) {
        console.log(yellow(`│ ${pad(row.key, col1Len)} │ ${pad(row.lang, col2Len)} │ ${pad(row.file, col3Len)} │`));
    }
    console.log(end);
} else {
    console.log(green("🎉 No unused translation keys. translations.js is clean!"));
}

// 15. Copy .htaccess file from template
if (fs.existsSync(".htaccess.template")) {
    const htaccess = fs.readFileSync(".htaccess.template", "utf-8");
    fs.writeFileSync(path.join(targetDir, ".htaccess"), htaccess.trim() + "\n", "utf-8");
    console.log(green("✔ .htaccess created in /dist from template."));
}

// 16. Copy contents of favicons/ directly into dist/
const faviconsDir = "favicons";
if (fs.existsSync(faviconsDir)) {
    fs.readdirSync(faviconsDir).forEach(file => {
        const srcPath = path.join(faviconsDir, file);
        const destPath = path.join(targetDir, file);
        fs.copyFileSync(srcPath, destPath);
    });
    console.log(green("✔ favicons copied directly into /dist."));
}

// 17. REMOVE UNUSED TRANSLATION KEYS FROM translations.js
const cleanedTranslations = {};

Object.entries(translations).forEach(([lang, dict]) => {
    const cleaned = {};
    Object.entries(dict).forEach(([key, value]) => {
        if (usedKeys.has(key) || specialKeys.some(special => key.includes(special))) {
            cleaned[key] = value;
        }
    });
    cleanedTranslations[lang] = cleaned;
});

// Re-format JS file.
const output = "const translations = " + JSON.stringify(cleanedTranslations, null, 4) + ";\n";
fs.writeFileSync("translations.js", output, "utf-8");
console.log(green("🧹 translations.js cleaned from unused keys."));

// Update translations.node.js again.
const reexported = output.replace(/^const translations =/, "module.exports =");
fs.writeFileSync("translations.node.js", reexported, "utf-8");
console.log(green("🔁 translations.node.js regenerated from cleaned source."));
