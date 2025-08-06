import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';

const TEMPLATE_DIR = './templates';
const TEMPLATE_MAIN = path.join(TEMPLATE_DIR, 'index.template.html');

const SECTIONS = [
    'hero',
    'problem',
    'services',
    'references',
    'testimonials',
    'about',
    'contact',
    'cta-section'
];

// 🔧 Inserts all section content inside the <main> tag
function insertSectionsIntoMain(templateContent, sectionsContent) {
    return templateContent.replace(
        '<main id="main">',
        `<main id="main">\n${sectionsContent.join('\n')}`
    );
}

function toPascalCase(str) {
    return str
        .replace(/[-_]/g, ' ')
        .replace(/\s+./g, (m) => m.trim().charAt(1).toUpperCase())
        .replace(/^\w/, (c) => c.toUpperCase());
}

function prefixDataI18nAttributes(html, prefix) {
    return html.replace(/data-i18n=["']([^"']+)["']/g, (match, key) => {
        if (key.startsWith(`${prefix}_`)) return match; // ne prefixelj kétszer
        return `data-i18n="${prefix}_${key}"`;
    });
}

async function main() {
    console.log('📄 BeyondStart oldal generátor');

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'pageName',
            message: 'Mi legyen az oldal neve? (pl: digital-transformation)'
        },
        {
            type: 'checkbox',
            name: 'sections',
            message: '🧩 Válaszd ki a szekciókat, amiket szeretnél:',
            choices: SECTIONS
        }
    ]);

    const filename = `${answers.pageName.trim()}.html`;
    const selectedSections = answers.sections;

    if (!answers.pageName || selectedSections.length === 0) {
        console.log('❌ Nincs érvényes oldalnév vagy nincs kiválasztott szekció.');
        return;
    }

    // 📥 Load base template (index.template.html)
    const baseTemplate = fs.readFileSync(TEMPLATE_MAIN, 'utf-8');
    const pagePrefix = toPascalCase(answers.pageName.trim());

    // 📚 Read section templates
    const sectionsContent = [];
    for (const section of selectedSections) {
        const sectionPath = path.join(TEMPLATE_DIR, `${section}.template.html`);
        if (fs.existsSync(sectionPath)) {
            let content = fs.readFileSync(sectionPath, 'utf-8');
            content = prefixDataI18nAttributes(content, pagePrefix);
            sectionsContent.push(content);
        } else {
            console.warn(`⚠️ Nem található: ${sectionPath}`);
        }
    }

    let finalHTML = insertSectionsIntoMain(baseTemplate, sectionsContent);
    finalHTML = prefixDataI18nAttributes(finalHTML, pagePrefix); // base template i18n kulcsait is prefixeljük

    // 💾 Write to output file
    const outputPath = path.join('./', filename);
    fs.writeFileSync(outputPath, finalHTML, 'utf-8');

    console.log(`✅ Létrehozva: ${outputPath}`);

    // 🚀 Run deploy.js (adds header + footer)
    try {
        console.log('🚀 deploy.js futtatása...');
        // execSync('node deploy.js', { stdio: 'inherit' });
    } catch (err) {
        console.error('❌ deploy.js hibát dobott.');
    }
}

main();
