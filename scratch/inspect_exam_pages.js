const fs = require('fs');

async function inspectExamPage(slug) {
  const url = `https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/${slug}.html`;
  console.log(`\n================ ${slug} ================`);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 certificateInfo-bot/1.0' } });
  console.log('Status:', res.status);
  if (!res.ok) return;
  const text = await res.text();
  console.log('Length:', text.length);

  const title = text.match(/<title>([^<]+)<\/title>/i);
  console.log('Title:', title ? title[1].trim() : 'none');

  const metaDesc = text.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  console.log('Meta Desc:', metaDesc ? metaDesc[1].trim() : 'none');

  const headings = [...text.matchAll(/<(h[1-4]|dt|th)[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(m => m[1] + ': ' + m[2].replace(/<[^>]+>/g, '').trim());
  console.log('Headings:', headings);

  // dl や table や p タグなどの構造
  const dts = [...text.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim() + ' => ' + m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  if (dts.length > 0) {
    console.log('DT/DD pairs:', dts);
  }

  const ths = [...text.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>\s*<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim() + ' => ' + m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  if (ths.length > 0) {
    console.log('TH/TD pairs:', ths);
  }

  // 本文抜粋
  const lines = text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  console.log('Snippet (lines 20-50):', lines.slice(20, 50).join(' / '));
}

async function main() {
  await inspectExamPage('ccna-200-301');
  await inspectExamPage('encor-350-401');
  await inspectExamPage('enarsi-300-410');
}

main().catch(console.error);
