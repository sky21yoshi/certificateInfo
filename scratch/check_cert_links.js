const fs = require('fs');

async function testLinks() {
  const url = 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0' } });
  const text = await res.text();
  const links = [...text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(l => l.href.includes('certifications') || l.text.includes('CCNA') || l.text.includes('CCNP') || l.text.includes('CCIE'));
  console.log('Cert links count:', links.length);
  for (const l of links) {
    console.log(l.text, '=>', l.href);
  }
}

testLinks().catch(console.error);
