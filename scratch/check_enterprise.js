const fs = require('fs');

async function testEnterprise() {
  const urls = [
    'https://www.cisco.com/site/jp/ja/learn/training-certifications/exams/index.html',
    'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/enterprise.html'
  ];
  for (const url of urls) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0' } });
    console.log(url, '=> Status:', res.status);
    if (res.ok) {
      const text = await res.text();
      console.log('Length:', text.length);
      const m200 = text.includes('200-301');
      const m350 = text.includes('350-401');
      const m300_410 = text.includes('300-410');
      console.log('200-301:', m200, '350-401:', m350, '300-410:', m300_410);
      
      const links = [...text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
        .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
        .filter(l => l.text.includes('350-401') || l.text.includes('300-') || l.text.includes('200-301') || l.href.includes('350-401') || l.href.includes('300-410'));
      console.log('Found exam links:', links);
    }
  }
}

testEnterprise().catch(console.error);
