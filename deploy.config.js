const GTAG_SNIPPET_AW_CODE = "AW-16905609495"; // Google Tag Manager
const GTAG_SNIPPET_GA4_CODE = "AW-16882358510"; // Google Analytics
module.exports = {
    // Feature toggles
    enableGoogleTags: true,
    enableHeaderFooterTemplates: true,
    enableAssetMinification: true,
    generateSitemapAndRobots: true,
    cleanUnusedTranslations: true,

    // Basic constants
    GTAG_SNIPPET_AW_CODE,
    baseURL: "https://beyondstart.solutions",
    headerTemplate: 'header.template',
    footerTemplate: 'footer.template',
    targetDir: 'dist',
    faviconsDir: 'favicons',
    okColor: (str) => `\x1b[32m${str}\x1b[0m`,
    warningColor: (str) => `\x1b[33m${str}\x1b[0m`,
    errorColor: (str) => `\x1b[31m${str}\x1b[0m`,
    GTAG_SNIPPET: `<script async src="https://www.googletagmanager.com/gtag/js?id=${GTAG_SNIPPET_AW_CODE}"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${GTAG_SNIPPET_GA4_CODE}"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', '${GTAG_SNIPPET_AW_CODE}');
    gtag('config', '${GTAG_SNIPPET_GA4_CODE}');
</script>`,
    helpText: `
        🆘 \x1b[36mBeyondStart deploy.js – CLI flags\x1b[0m
        
        \x1b[33m--noGoogleTags\x1b[0m             Disable Google Tag injection and CTA tracking check
        \x1b[33m--noHeaderFooterTemplates\x1b[0m  Skip replacing <header>/<footer> using templates
        \x1b[33m--noAssetMinification\x1b[0m      Skip minifying JS and CSS assets
        \x1b[33m--noSitemap\x1b[0m                Skip generating sitemap.xml and robots.txt
        \x1b[33m--noCleanTranslations\x1b[0m      Skip cleaning unused translation keys
        \x1b[33m--dry-run\x1b[0m                   Simulate the process – no file writes, just logs
        
        \x1b[36mExample:\x1b[0m
          node deploy.js --noGoogleTags --dry-run
            `,
};