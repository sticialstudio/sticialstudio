const fs = require('fs');
const unoPath = '../../node_modules/@wokwi/elements/dist/arduino-uno.js';
if (!fs.existsSync(unoPath)) {
  console.log('Cannot find ' + unoPath);
  process.exit(1);
}
const uno = fs.readFileSync(unoPath, 'utf8');

// Find all elements with an id containing "pin-"
const pinMatches = [...uno.matchAll(/id=["'](pin-[^"']+)["'][^>]*transform=["']translate\(([\d.-]+),\s*([\d.-]+)\)["']/g)];
if (pinMatches.length > 0) {
  console.log("Found pins with inline transforms!");
  pinMatches.forEach(m => console.log(m[1], m[2], m[3]));
} else {
  // Try finding just ID and translate separately 
  // It's likely building SVG with Lit templates: `<g id="pin-13" transform="translate(x, y)">`
  const litMatches = [...uno.matchAll(/id=["'](pin-[^"']+)["'][^>]*translate\(([\d.-]+)[ ,]+([\d.-]+)\)/g)];
  if (litMatches.length > 0) {
      litMatches.forEach(m => console.log(m[1], m[2], m[3]));
  } else {
      console.log("Could not parse pins with simple regex. Dumping raw translate tags...");
      const trans = [...uno.matchAll(/translate\(([\d.-]+)[ ,]+([\d.-]+)\)/g)].slice(0, 50);
      trans.forEach(m => console.log(m[0]));
  }
}
