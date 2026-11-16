// 更新スクリプト: qualifications.tsv に最新のスクレイピング情報を埋め込む
// このスクリプトは Node.js 環境で実行されます。
// 必要なモジュールは標準の fs と path のみです。

const fs = require('fs');
const path = require('path');

// ファイルパス
const tsvPath = path.join(__dirname, '..', 'qualifications.tsv');
const dataDir = path.join(__dirname, '..', 'data');
const masterDumpPath = 'C:/Users/sky21/.gemini/antigravity/brain/595f0cdd-dbe6-4cf1-b98f-841ebe8e8655/.system_generated/steps/248/output.txt';

// 1. 既存の qualifications.tsv の行を取得
const raw = fs.readFileSync(tsvPath, 'utf8').split(/\r?\n/);
const masterLines = raw.slice(1).filter(l => /^\d+\t/.test(l));

// 2. プロバイダーごとの状態ファイルロード
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

const stateMap = {
  ipa: loadState('ipa'),
  aws: loadState('aws'),
  cisco: loadState('cisco'),
  google_cloud: loadState('google_cloud'),
  microsoft: loadState('microsoft'),
  lpi: loadState('lpi'),
  oracle: loadState('oracle'),
  broadcom: loadState('broadcom'),
  comptia: loadState('comptia'),
  cncf: loadState('cncf'),
  anthropic: loadState('anthropic'),
  uipath: loadState('uipath'),
  certify: loadState('certify'),
  python_association: loadState('python_association'),
  pmaj: loadState('pmaj'),
  pmi: loadState('pmi'),
  isaca: loadState('isaca'),
  peoplecert: loadState('peoplecert'),
  fortinet: loadState('fortinet'),
  palo_alto: loadState('palo_alto'),
  ntt_at: loadState('ntt_at'),
};

function getProviderKey(providerName) {
  if (!providerName) return null;
  if (/ipa|情報処理推進機構/i.test(providerName)) return 'ipa';
  if (/aws|amazon/i.test(providerName)) return 'aws';
  if (/cisco|シスコ/i.test(providerName)) return 'cisco';
  if (/google/i.test(providerName)) return 'google_cloud';
  if (/microsoft/i.test(providerName)) return 'microsoft';
  if (/lpi|linuc/i.test(providerName)) return 'lpi';
  if (/oracle/i.test(providerName)) return 'oracle';
  if (/broadcom|vmware/i.test(providerName)) return 'broadcom';
  if (/comptia/i.test(providerName)) return 'comptia';
  if (/cncf|linux foundation/i.test(providerName)) return 'cncf';
  if (/anthropic/i.test(providerName)) return 'anthropic';
  if (/uipath/i.test(providerName)) return 'uipath';
  if (/サーティファイ|certify/i.test(providerName)) return 'certify';
  if (/python/i.test(providerName)) return 'python_association';
  if (/pmaj/i.test(providerName)) return 'pmaj';
  if (/pmi/i.test(providerName)) return 'pmi';
  if (/isaca/i.test(providerName)) return 'isaca';
  if (/peoplecert/i.test(providerName)) return 'peoplecert';
  if (/fortinet/i.test(providerName)) return 'fortinet';
  if (/palo alto/i.test(providerName)) return 'palo_alto';
  if (/ntt/i.test(providerName)) return 'ntt_at';
  return null;
}

// 3. 資格番号 (No) と認定機関、資格名に対応する最新情報を取得するヘルパー
function findLatest(no, providerName, qualificationName = '') {
  const num = parseInt(no, 10);
  const pKey = getProviderKey(providerName);
  const pool = (pKey && stateMap[pKey]) ? stateMap[pKey] : [];

  const matches = pool.filter(item => {
    if (!Array.isArray(item.relatedQualifications)) return false;
    return item.relatedQualifications.some(q => {
      if (Number(q.no) === num) return true;
      if (qualificationName && q.name) {
        const cleanQ = q.name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
        const cleanTarget = qualificationName.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
        if (cleanQ === cleanTarget) return true;
      }
      return false;
    });
  });

  // 詳細項目を持つアイテムがあれば抽出
  const detailItem = matches.find(m => m.category || m.introduction || m.examDuration)
    || (matches.length > 0 ? matches[0] : null);

  // ニュースなど日付を持つアイテムがあれば抽出
  const datedMatches = matches
    .filter(m => !m.detailsOnly && m.date)
    .sort((a, b) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0));
  const newsItem = datedMatches.length > 0 ? datedMatches[0] : null;

  if (!detailItem && !newsItem) return null;

  return {
    date: (newsItem && newsItem.date) || (detailItem && detailItem.date) || '',
    title: (newsItem && newsItem.title) || (detailItem && detailItem.title) || '',
    description: (newsItem && newsItem.description) || (detailItem && (detailItem.introduction || detailItem.description)) || '',
    url: (newsItem && newsItem.url) || (detailItem && detailItem.url) || '',
    category: (detailItem && detailItem.category) || '',
    examDuration: (detailItem && detailItem.examDuration) || '',
    examFormat: (detailItem && detailItem.examFormat) || '',
    cost: (detailItem && detailItem.cost) || '',
    testingOptions: (detailItem && detailItem.testingOptions) || '',
    introduction: (detailItem && detailItem.introduction) || '',
    examContent: (detailItem && detailItem.examContent) || '',
    contentOutline: (detailItem && detailItem.contentOutline) || ''
  };
}

// 4. 標準ヘッダー (16列)
const standardHeaders = [
  'No', '認定機関', '資格名', '資格情報取得元',
  '最終更新日時', 'タイトル', 'URL', '説明',
  'カテゴリ', '試験期間', '試験の形態', '費用', '受験オプション',
  'はじめに', '試験内容', '試験内容の概要'
];

// 5. データ行を生成
const updatedLines = [];
for (let i = 0; i < masterLines.length; i++) {
  const masterLine = masterLines[i];
  const [no, provider, name, sourceUrl] = masterLine.split('\t');
  const latest = findLatest(no, provider, name);

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
console.log(`qualifications.tsv を全 ${masterLines.length} 行で正常に更新しました。`);
