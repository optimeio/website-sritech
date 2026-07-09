const fs = require('fs');
const path = require('path');
const files = [
  'Frontend/src/App.jsx',
  'Frontend/src/AdminDashboard.jsx',
  'Frontend/src/pages/AuthPage.jsx'
];
const tagRe = /<(input|select|textarea)([^>]*)>/gi;
files.forEach((f) => {
  const text = fs.readFileSync(path.resolve(f), 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    tagRe.lastIndex = 0;
    let m;
    while ((m = tagRe.exec(line))) {
      const tag = m[1];
      const attrs = m[2];
      const hasId = /\bid\s*=/i.test(attrs);
      const hasName = /\bname\s*=/i.test(attrs);
      const hasAuto = /\bautocomplete\s*=/i.test(attrs);
      if (!hasId && !hasName) {
        console.log(`${f}:${index + 1}: MISSING id/name => ${line.trim()}`);
      }
      if (tag === 'input' && /\btype\s*=\s*(?:"(text|email|password|tel|url|search|date|number)"|'(text|email|password|tel|url|search|date|number)')/.test(attrs) && !hasAuto) {
        console.log(`${f}:${index + 1}: MISSING autocomplete => ${line.trim()}`);
      }
      if (tag === 'select' && !hasId && !hasName) {
        console.log(`${f}:${index + 1}: SELECT MISSING id/name => ${line.trim()}`);
      }
      if (tag === 'textarea' && !hasId && !hasName) {
        console.log(`${f}:${index + 1}: TEXTAREA MISSING id/name => ${line.trim()}`);
      }
    }
  });
});
