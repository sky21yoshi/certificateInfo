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
const neededCols = [
  '最終更新日時', 'タイトル', 'URL', '説明',
  'カテゴリ', '試験期間', '試験の形態', '費用', '受験オプション',
  'はじめに', '試験内容', '試験内容の概要'
];
let newHeaderCols = [...existingCols];
for (const col of neededCols) {
  if (!newHeaderCols.includes(col)) {
    newHeaderCols.push(col);
  }
}
// docs/interface.md の標準順序 (16列)
const standardOrder = [
  'No', '認定機関', '資格名', '資格情報取得元',
  '最終更新日時', 'タイトル', 'URL', '説明',
  'カテゴリ', '試験期間', '試験の形態', '費用', '受験オプション',
  'はじめに', '試験内容', '試験内容の概要'
];
const isStandardCompatible = standardOrder.every(col => newHeaderCols.includes(col));
const targetHeaderCols = isStandardCompatible ? standardOrder : newHeaderCols;
raw[0] = targetHeaderCols.join('\t');

// 全プロバイダー統合状態をロードする
function loadState(name) {
  const p = path.join(dataDir, `${name}_state.json`);
  if (!fs.existsSync(p)) {
    return [];
  }
  try {
    const content = fs.readFileSync(p, { encoding: 'utf8' });
    const state = JSON.parse(content);
    if (!Array.isArray(state)) return [];
    return state;
  } catch (e) {
    console.warn(`状態ファイルの読み込みエラー (${name}): ${e.message}`);
    return [];
  }
}
const allItems = loadState('all');
const awsItems = loadState('aws');
const googleCloudItems = loadState('google_cloud');

// 各資格番号 (row[0]) に対応する最新情報を取得するヘルパー
function findLatest(no) {
  const num = parseInt(no, 10);
  const itemsPool = [...allItems, ...awsItems, ...googleCloudItems];
  const matches = itemsPool.filter(item =>
    Array.isArray(item.relatedQualifications) &&
    item.relatedQualifications.some(qualification => Number(qualification.no) === num)
  );
  if (matches.length === 0) return null;

  const datedMatches = matches
    .map(item => ({ item, timestamp: Date.parse(item.date || '') }))
    .filter(match => Number.isFinite(match.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);
  const match = datedMatches.length > 0 ? datedMatches[0].item : matches[0];

  // 詳細項目を持つアイテムがあればマージ
  const detailItem = matches.find(m => m.category || m.introduction || m.examDuration) || {};

  return {
    date: match.date || '',
    title: match.title || '',
    description: match.description || match.title || '',
    url: match.url || '',
    category: detailItem.category || '',
    examDuration: detailItem.examDuration || '',
    examFormat: detailItem.examFormat || '',
    cost: detailItem.cost || '',
    testingOptions: detailItem.testingOptions || '',
    introduction: detailItem.introduction || '',
    examContent: detailItem.examContent || '',
    contentOutline: detailItem.contentOutline || ''
  };
}

// データ行を更新
const updatedLines = [];
const headerCols = targetHeaderCols;
const dateIdx = headerCols.indexOf('最終更新日時');
const titleIdx = headerCols.indexOf('タイトル');
const urlIdx = headerCols.indexOf('URL');
const descIdx = headerCols.indexOf('説明');
const catIdx = headerCols.indexOf('カテゴリ');
const durIdx = headerCols.indexOf('試験期間');
const fmtIdx = headerCols.indexOf('試験の形態');
const costIdx = headerCols.indexOf('費用');
const optIdx = headerCols.indexOf('受験オプション');
const introIdx = headerCols.indexOf('はじめに');
const contentIdx = headerCols.indexOf('試験内容');
const outlineIdx = headerCols.indexOf('試験内容の概要');

for (let i = 1; i < raw.length; i++) {
  const line = raw[i];
  if (!line) continue; // 空行はスキップ
  const oldCols = line.split('\t');
  const no = oldCols[0];
  const latest = findLatest(no);

  // 新しいヘッダー列に合わせてマッピング
  const rowMap = new Map();
  for (let c = 0; c < existingCols.length; c++) {
    rowMap.set(existingCols[c], oldCols[c] || '');
  }

  if (latest) {
    if (dateIdx >= 0 && latest.date) rowMap.set('最終更新日時', latest.date);
    if (titleIdx >= 0 && latest.title) rowMap.set('タイトル', latest.title);
    if (urlIdx >= 0 && latest.url) rowMap.set('URL', latest.url);
    if (descIdx >= 0 && latest.description) rowMap.set('説明', latest.description);
    if (catIdx >= 0 && latest.category) rowMap.set('カテゴリ', latest.category);
    if (durIdx >= 0 && latest.examDuration) rowMap.set('試験期間', latest.examDuration);
    if (fmtIdx >= 0 && latest.examFormat) rowMap.set('試験の形態', latest.examFormat);
    if (costIdx >= 0 && latest.cost) rowMap.set('費用', latest.cost);
    if (optIdx >= 0 && latest.testingOptions) rowMap.set('受験オプション', latest.testingOptions);
    if (introIdx >= 0 && latest.introduction) rowMap.set('はじめに', latest.introduction);
    if (contentIdx >= 0 && latest.examContent) rowMap.set('試験内容', latest.examContent);
    if (outlineIdx >= 0 && latest.contentOutline) rowMap.set('試験内容の概要', latest.contentOutline);
  }

  const newCols = headerCols.map(col => rowMap.get(col) || '');
  updatedLines.push(newCols.join('\t'));
}

// 書き戻し
const output = [raw[0], ...updatedLines].join('\n') + '\n';
fs.writeFileSync(tsvPath, output, { encoding: 'utf8' });
console.log('qualifications.tsv を更新しました');
