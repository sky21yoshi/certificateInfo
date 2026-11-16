const fs = require('fs');

async function testExams() {
  const urls = [
    'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-exams.html',
    'https://www.cisco.com/c/en/us/training-events/training-certifications/exams/current-exams.html',
    'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications.html',
    'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications.html'
  ];
  for (const url of urls) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0' }
    });
    console.log(url, '=> Status:', res.status);
    if (res.ok) {
      const text = await res.text();
      console.log('Length:', text.length);
      const has200 = text.includes('200-301');
      const has350 = text.includes('350-401');
      console.log('has 200-301:', has200, 'has 350-401:', has350);
    }
  }
}

testExams().catch(console.error);
