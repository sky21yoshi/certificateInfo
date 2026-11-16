const fs = require('fs');

async function checkAllExams() {
  const url = 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 certificateInfo-bot/1.0' } });
  console.log('Status:', res.status);
  if (!res.ok) return;
  const text = await res.text();
  console.log('Length:', text.length);
  const links = [...text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(l => l.href.includes('current-list') || l.href.includes('exam') || /\b(?:200|300|350)-\d{3}\b/.test(l.text));
  for (const l of links) {
    console.log(l.text, '=>', l.href);
  }
}

checkAllExams().catch(console.error);
