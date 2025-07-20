function setLanguage(lang) {
    const supportedLangs = ['en', 'hu', 'de', 'fr', 'nl', 'es'];
    if (!supportedLangs.includes(lang)) {
        lang = 'en'; // fallback
    }
    window.location.href = `/${lang}/index.html`;
}

function translatePage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
}

function detectBrowserLanguage() {
    const supported = Object.keys(translations);
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    return supported.includes(browserLang) ? browserLang : 'en';
}
