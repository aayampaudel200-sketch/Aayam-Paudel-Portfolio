const fs = require('fs');

const pages = ['index.html', 'about.html', 'projects.html', 'experience.html', 'playground.html', 'namaste-suman.html'];
let hasErrors = false;

pages.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  console.log(`\n=== ${f} ===`);
  if (!matches) {
    console.log('  ERROR: No JSON-LD found');
    hasErrors = true;
    return;
  }
  matches.forEach((m, i) => {
    const raw = m.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
    try {
      const parsed = JSON.parse(raw);
      if (parsed['@graph']) {
        console.log(`  Graph with ${parsed['@graph'].length} entities: ` + parsed['@graph'].map(x => `${x['@type']} [${x['@id'] || 'no-id'}]`).join(', '));
      } else {
        console.log(`  Single entity: ${parsed['@type']} [${parsed['@id'] || 'no-id'}]`);
      }
    } catch(err) {
      console.error(`  INVALID JSON in block ${i}: ${err.message}`);
      hasErrors = true;
    }
  });
});

if (hasErrors) {
  console.error('\nFAILED: JSON-LD validation errors detected.');
  process.exit(1);
} else {
  console.log('\nSUCCESS: All JSON-LD structures across all pages are valid!');
}
