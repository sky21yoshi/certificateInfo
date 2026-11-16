const fs = require('fs');
const path = require('path');

const tsvPath = path.join(__dirname, '..', 'qualifications.tsv');
const dataDir = path.join(__dirname, '..', 'data');
const masterDumpPath = 'C:/Users/sky21/.gemini/antigravity/brain/595f0cdd-dbe6-4cf1-b98f-841ebe8e8655/.system_generated/steps/248/output.txt';

// 1. スプレッドシートマスターの159行を抽出
let masterLines = [];
if (fs.existsSync(masterDumpPath)) {
  const content = fs.readFileSync(masterDumpPath, 'utf8');
  masterLines = content.split(/\r?\n/).filter(l => /^\d+\t/.test(l));
}

console.log(`マスター行数: ${masterLines.length}`);

// 2. 状態ファイルの読み込みヘルパー
function loadState(name) {
  const p = path.join(dataDir, `${name}_state.json`);
  if (!fs.existsSync(p)) return [];
  try {
    const content = fs.readFileSync(p, 'utf8');
    const state = JSON.parse(content);
    return Array.isArray(state) ? state : [];
  } catch (e) {
    console.warn(`状態ファイルの読み込みエラー (${name}): ${e.message}`);
    return [];
  }
}

const allItems = loadState('all');
const ipaItems = loadState('ipa');
const awsItems = loadState('aws');
const ciscoItems = loadState('cisco');
const googleCloudItems = loadState('google_cloud');

console.log(`ロード完了: ipa=${ipaItems.length}, cisco=${ciscoItems.length}, aws=${awsItems.length}`);

// 3. 資格番号 (No) に対応する最新情報を取得するヘルパー
function findLatest(no) {
  const num = parseInt(no, 10);
  const itemsPool = [...allItems, ...ipaItems, ...awsItems, ...ciscoItems, ...googleCloudItems];
  const matches = itemsPool.filter(item =>
    Array.isArray(item.relatedQualifications) &&
    item.relatedQualifications.some(q => Number(q.no) === num)
  );
  if (matches.length === 0) return null;

  const datedMatches = matches
    .map(item => ({ item, timestamp: Date.parse(item.date || '') }))
    .filter(match => Number.isFinite(match.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);
  const match = datedMatches.length > 0 ? datedMatches[0].item : matches[0];

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

// 4. 標準ヘッダー (16列)
const standardHeaders = [
  'No', '認定機関', '資格名', '資格情報取得元',
  '最終更新日時', 'タイトル', 'URL', '説明',
  'カテゴリ', '試験期間', '試験の形態', '費用', '受験オプション',
  'はじめに', '試験内容', '試験内容の概要'
];

// 5. 159行の更新データを生成
const updatedLines = [];
for (let i = 0; i < masterLines.length; i++) {
  const masterLine = masterLines[i];
  const [no, provider, name, sourceUrl] = masterLine.split('\t');
  const latest = findLatest(no);

  const row = [
    no,
    provider,
    name,
    sourceUrl,
    latest ? (latest.date || '') : '',
    latest ? (latest.title || '') : '',
    latest ? (latest.url || '') : '',
    latest ? (latest.description || '') : '',
    latest ? (latest.category || '') : '',
    latest ? (latest.examDuration || '') : '',
    latest ? (latest.examFormat || '') : '',
    latest ? (latest.cost || '') : '',
    latest ? (latest.testingOptions || '') : '',
    latest ? (latest.introduction || '') : '',
    latest ? (latest.examContent || '') : '',
    latest ? (latest.contentOutline || '') : '',
  ];

  updatedLines.push(row.join('\t'));
}

const finalTsv = [standardHeaders.join('\t'), ...updatedLines].join('\n') + '\n';
fs.writeFileSync(tsvPath, finalTsv, 'utf8');
console.log(`qualifications.tsv を全 ${masterLines.length} 行で更新しました。`);
