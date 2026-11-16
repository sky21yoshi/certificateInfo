const fs = require('fs');

async function check(url) {
  console.log(`\n=== Checking: ${url} ===`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
  });
  console.log('Status:', res.status);
  if (!res.ok) return;
  const t = await res.text();
  console.log('Length:', t.length);

  const title = t.match(/<title>([^<]+)<\/title>/i);
  console.log('Title:', title ? title[1].trim() : 'none');

  const metaDesc = t.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  console.log('Meta Desc:', metaDesc ? metaDesc[1].trim() : 'none');

  const headings = [...t.matchAll(/<(h[1-4]|dt|th)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(m => m[1] + ': ' + m[2].replace(/<[^>]+>/g, '').trim());
  console.log('Headings:', headings.slice(0, 25));

  const text = t
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  console.log('Snippet (lines 0-30):', text.slice(0, 30).join(' / '));
}

async function main() {
  await check('https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/professional/ccnp-enterprise.html');
  await check('https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/associate/ccna.html');
  await check('https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/expert/ccie-enterprise-infrastructure.html');
}

main().catch(console.error);
