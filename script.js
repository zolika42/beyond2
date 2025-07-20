function setLanguage(lang) {
    localStorage.setItem('lang', lang);
    const path = window.location.pathname.replace(/^\/[^/]+/, ''); // pl. /index.html vagy /aszf.html
    window.location.href = `/${lang}${path}`;
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
    const supported = ['en', 'hu', 'de', 'fr', 'nl', 'es'];
    const savedLang = localStorage.getItem('lang');
    const currentLang = window.location.pathname.split('/')[1]; // pl. "de"

    // Ha nincs még mentett nyelv, elmentjük amit most látunk
    if (!savedLang && supported.includes(currentLang)) {
        localStorage.setItem('lang', currentLang);
    }

    // Ha a mentett nyelv más, mint az aktuális, átirányítás
    if (savedLang && supported.includes(savedLang) && savedLang !== currentLang) {
        const path = window.location.pathname.replace(/^\/[^/]+/, ''); // az /hu/index.html -> /index.html
        window.location.href = `/${savedLang}${path}`;
        return;
    }

    // Nyelvválasztó select értékének beállítása
    const select = document.querySelector('#language');
    if (select) {
        const url = window.location.pathname;
        select.value = url;
    }

    // Fordítás
    translatePage(currentLang || savedLang || detectBrowserLanguage());
});
