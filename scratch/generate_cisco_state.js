const fs = require('fs');
const path = require('path');
const { fetchCiscoAllUpdates } = require('../src/fetcher/cisco');

async function main() {
  console.log('Cisco の最新ニュースおよび資格詳細情報の取得を開始...');
  const items = await fetchCiscoAllUpdates();
  console.log(`取得完了: 合計 ${items.length} 件`);

  const detailCount = items.filter(i => i.detailsOnly).length;
  const newsCount = items.filter(i => !i.detailsOnly).length;
  console.log(`- ニュース記事: ${newsCount} 件`);
  console.log(`- 資格詳細情報: ${detailCount} 件`);

  const outputPath = path.join(__dirname, '..', 'data', 'cisco_state.json');
  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`data/cisco_state.json に保存しました: ${outputPath}`);
}

main().catch(err => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
