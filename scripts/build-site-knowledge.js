/* Builds the public, deployment-time knowledge source used by the portfolio assistant. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = [
  ['/', 'index.html'],
  ['/about.html', 'about.html'],
  ['/projects.html', 'projects.html'],
  ['/experience.html', 'experience.html'],
  ['/namaste-suman.html', 'namaste-suman.html'],
  ['/playground.html', 'playground.html'],
];

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#(?:x[\da-f]+|\d+);/gi, (entity) => {
    const number = entity.slice(2, -1);
    return String.fromCodePoint(number.startsWith('x') || number.startsWith('X') ? parseInt(number.slice(1), 16) : parseInt(number, 10));
  });
}

function clean(value) {
  return decode(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function match(html, expression) {
  return html.match(expression)?.[1] || '';
}

const knowledge = {
  generatedAt: new Date().toISOString(),
  pages: pages.map(([url, filename]) => {
    const html = fs.readFileSync(path.join(root, filename), 'utf8');
    const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((item) => clean(item[1])).filter(Boolean).slice(0, 18);
    const body = clean(match(html, /<main\b[^>]*>([\s\S]*?)<\/main>/i));
    return {
      url,
      title: clean(match(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
      description: decode(match(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)),
      headings,
      summary: body.slice(0, 2200),
    };
  }),
};

const outputPath = path.join(root, 'data', 'site-knowledge.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(knowledge, null, 2)}\n`);
console.log(`Updated ${path.relative(root, outputPath)} from ${pages.length} public pages.`);
