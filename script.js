function setLanguage(lang) {
    localStorage.setItem("lang", lang);
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

document.addEventListener("DOMContentLoaded", () => {
    const supported = ['en', 'hu', 'de', 'fr', 'nl', 'es'];
    const savedLang = localStorage.getItem('lang');
    const parts = window.location.pathname.split('/');
    const currentLang = parts[1]; // e.g., 'en' from /en/index.html

    // Ha a gyökérből jövünk és van mentett nyelv, irányítsuk át
    if (window.location.pathname === '/' && savedLang && supported.includes(savedLang)) {
        window.location.href = `/${savedLang}/index.html`;
        return;
    }

    // Ha nincs mentett nyelv, és támogatott az aktuális, mentsük el
    if (!savedLang && supported.includes(currentLang)) {
        localStorage.setItem('lang', currentLang);
    }

    // Set dropdown érték
    const selector = document.getElementById('language');
    if (selector && supported.includes(currentLang)) {
        selector.value = `/${currentLang}/index.html`;
    }

    // Lefordítjuk az oldalt
    translatePage(currentLang || savedLang || detectBrowserLanguage());

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                gtag('event', 'conversion', {
                    'send_to': 'AW-16905609495/lEufCJjsrv4aEJfCnP0-'
                });
                observer.disconnect(); // egyszeri trigger
            }
        });
    });

    const contactSection = document.getElementById("contact");
    if (contactSection) {
        observer.observe(contactSection);
    }
});
