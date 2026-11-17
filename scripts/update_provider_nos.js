/**
 * 全プロバイダーフェッチャーの No 体系を qualifications.tsv に合わせて更新するスクリプト
 * 旧No → 新No のマッピング
 */
const fs = require('fs');
const path = require('path');

// qualifications.tsv から各プロバイダーの資格Noを読み込む
const tsvPath = path.join(__dirname, '..', 'qualifications.tsv');
const lines = fs.readFileSync(tsvPath, 'utf8').split('\n');
const qualMap = new Map();

for (const line of lines.slice(1)) {
  const parts = line.split('\t');
  if (parts[0] && parts[2]) {
    qualMap.set(parts[2].trim(), Number(parts[0].trim()));
  }
}

console.log('qualifications.tsv から読み込んだ資格一覧:');
for (const [name, no] of qualMap) {
  console.log(`  No ${no}: ${name}`);
}
