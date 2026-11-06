// 更新スクリプト: qualifications.tsv に最新のスクレイピング情報を埋め込む
// このスクリプトは Node.js 環境で実行されます。
// 必要なモジュールは標準の fs と path のみです。

const fs = require('fs');
const path = require('path');

// ファイルパス
const tsvPath = path.join(__dirname, '..', 'qualifications.tsv');
const dataDir = path.join(__dirname, '..', 'data');

// 読み込みヘッダーと行を取得
const raw = fs.readFileSync(tsvPath, { encoding: 'utf8' }).split(/\r?\n/);
if (raw.length === 0) {
  console.error('TSV が空です');
  process.exit(1);
}

// 既存ヘッダーを解析し、必要なら新しい列を追加
let header = raw[0].trim();
const existingCols = header.split('\t');
const neededCols = ['最終更新日時', 'タイトル', '説明'];
let newHeader = header;
let added = false;
for (const col of neededCols) {
  if (!existingCols.includes(col)) {
    newHeader += '\t' + col;
    added = true;
  }
}
if (added) {
  raw[0] = newHeader;
}

// 全プロバイダー統合状態をロードする
function loadState(name) {
  const p = path.join(dataDir, `${name}_state.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`状態ファイルがありません: ${p}。先に node src/index.js を実行してください。`);
  }
  try {
    const content = fs.readFileSync(p, { encoding: 'utf8' });
    const state = JSON.parse(content);
    if (!Array.isArray(state)) throw new Error('状態ファイルの形式が配列ではありません');
    return state;
  } catch (e) {
    throw new Error(`状態ファイルの読み込みエラー (${name}): ${e.message}`);
  }
}
const allItems = loadState('all');

// 各資格番号 (row[0]) に対応する最新情報を取得するヘルパー
function findLatest(no) {
  const num = parseInt(no, 10);
  const matches = allItems.filter(item =>
    Array.isArray(item.relatedQualifications) &&
    item.relatedQualifications.some(qualification => Number(qualification.no) === num)
  );
  if (matches.length === 0) return null;

  const datedMatches = matches
    .map(item => ({ item, timestamp: Date.parse(item.date || '') }))
    .filter(match => Number.isFinite(match.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);
  const match = datedMatches.length > 0 ? datedMatches[0].item : matches[0];
  return {
    date: match.date || '',
    title: match.title || '',
    description: match.description || match.title || '',
    url: match.url || ''
  };
}

// データ行を更新
const updatedLines = [];
for (let i = 1; i < raw.length; i++) {
  const line = raw[i];
  if (!line) continue; // 空行はスキップ
  const cols = line.split('\t');
  const no = cols[0];
  const latest = findLatest(no);
  // 既存列数に合わせて不足分は空文字で埋める
  while (cols.length < existingCols.length) cols.push('');
  // 必要な列を追加または上書き
  const headerCols = (added ? newHeader : header).split('\t');
  const dateIdx = headerCols.indexOf('最終更新日時');
  const titleIdx = headerCols.indexOf('タイトル');
  const descIdx = headerCols.indexOf('説明');
  if (latest) {
    cols[dateIdx] = latest.date;
    cols[titleIdx] = latest.title;
    cols[descIdx] = latest.description;
  }
  updatedLines.push(cols.join('\t'));
}

// 書き戻し
const output = [raw[0], ...updatedLines].join('\n') + '\n';
fs.writeFileSync(tsvPath, output, { encoding: 'utf8' });
console.log('qualifications.tsv を更新しました');
