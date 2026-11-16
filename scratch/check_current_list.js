const fs = require('fs');

async function testCurrentList() {
  const codes = [
    '200-301',
    'ccna-200-301',
    '350-401',
    'encor-350-401',
    '300-410',
    'enarsi-300-410',
    '300-415',
    'ensdwi-300-415',
    '300-420',
    'ensld-300-420',
    '300-425',
    'enwlsi-300-425',
    '300-430',
    'enwlsd-300-430',
    '300-435',
    'enauto-300-435'
  ];

  for (const code of codes) {
    const url = `https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/${code}.html`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 certificateInfo-bot/1.0' } });
    if (res.ok) {
      console.log(`[200 OK] ${code} => ${url}`);
    }
  }
}

testCurrentList().catch(console.error);
