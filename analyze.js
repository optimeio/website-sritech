const fs = require('fs');
const content = fs.readFileSync('Frontend/src/App.jsx', 'utf8');

const routes = content.match(/<Route[^>]+>/g) || [];
console.log('Routes in App.jsx:');
console.log(routes.join('\n'));
