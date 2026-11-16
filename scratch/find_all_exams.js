const fs = require('fs');

async function findExams() {
  const url = 'https://www.cisco.com/site/jp/ja/learn/training-certifications/exams/index.html';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 certificateInfo-bot/1.0' } });
  const text = await res.text();
  const links = [...text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter(l => l.href.includes('current-list') || l.text.includes('425') || l.text.includes('430') || l.href.includes('425') || l.href.includes('430'));
  console.log('Found:', links);
}

findExams().catch(console.error);
