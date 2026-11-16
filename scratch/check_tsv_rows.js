const fs = require('fs');
const lines = fs.readFileSync('qualifications.tsv', 'utf8').split(/\r?\n/);

console.log('Total lines in qualifications.tsv:', lines.length);

for (let i = 92; i <= 101; i++) {
  const line = lines[i + 1];
  if (!line) continue;
  const cols = line.split('\t');
  console.log('[行 ' + (i + 2) + ' / No ' + cols[0] + '] ' + cols[1] + ' | ' + cols[2]);
  console.log('  E (日時): ' + cols[4]);
  console.log('  F (タイトル): ' + cols[5]);
  console.log('  G (URL): ' + cols[6]);
  console.log('  I (カテゴリ): ' + cols[8]);
  console.log('  J (試験期間): ' + cols[9]);
  console.log('  K (試験の形態): ' + cols[10]);
  console.log('  L (費用): ' + cols[11]);
  console.log('  M (受験オプション): ' + cols[12]);
  console.log('  N (はじめに): ' + cols[13].slice(0, 50) + '...');
  console.log('  O (試験内容): ' + cols[14].slice(0, 50) + '...');
  console.log('  P (試験内容の概要): ' + cols[15].slice(0, 50) + '...');
  console.log('--------------------------------------------------');
}
