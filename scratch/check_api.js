const fs = require('fs');

const html = fs.readFileSync('cisco_ccna.html', 'utf8');
const urls = [...html.matchAll(/https?:\/\/[^\s"'<>()]+/g)].map(m => m[0]);
console.log('unique URLs count:', new Set(urls).size);
const apiUrls = urls.filter(u => u.includes('api') || u.includes('aura') || u.includes('webruntime'));
console.log('API-like URLs:', apiUrls.slice(0, 20));
