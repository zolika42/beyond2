const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
});

document.querySelectorAll('.scroll-reveal').forEach(section => {
    observer.observe(section);
});

function setLanguage(lang) {
    localStorage.setItem('lang', lang);
    translatePage(lang);

    const selector = document.getElementById('language');
    if (selector && selector.value !== lang) {
        selector.value = lang;
    }

    // Force retranslation of dynamically added content
    requestAnimationFrame(() => {
        translatePage(lang);
    });
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

document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem('lang');
    const initialLang = savedLang || detectBrowserLanguage();
    translatePage(initialLang);

    const selector = document.getElementById('language');
    if (selector) {
        selector.value = initialLang;
    }
});
