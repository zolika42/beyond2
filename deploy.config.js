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
    headerTemplate: 'header.template',
    footerTemplate: 'footer.template',
};