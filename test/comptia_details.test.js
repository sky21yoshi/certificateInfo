const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// GAS コンテキストのセットアップ
const scriptContent = fs.readFileSync(require.resolve('../gas/Code.js'), 'utf8');

const mockHtmlSecurityPlus = `
<!DOCTYPE html>
<html>
<head>
  <title>CompTIA Security+ 認定資格 | CompTIA 日本公式サイト</title>
  <meta name="description" content="CompTIA Security+は、サイバーセキュリティのベースラインスキルを証明する国際的な認定資格です。最新のセキュリティ脅威、脆弱性分析、セキュリティアーキテクチャの運用と管理を実務レベルで評価します。">
</head>
<body>
  <h1>CompTIA Security+ (SY0-701)</h1>
  <p>世界で最も広く認知されているサイバーセキュリティ資格です。</p>
</body>
</html>
`;

const mockHtmlNetworkPlus = `
<!DOCTYPE html>
<html>
<head>
  <title>CompTIA Network+ 認定資格 | CompTIA 日本公式サイト</title>
  <meta name="description" content="CompTIA Network+は、ベンダーニュートラルなネットワーク設計、構築、トラブルシューティングを網羅する認定資格です。">
</head>
<body>
  <h1>CompTIA Network+ (N10-008)</h1>
</body>
</html>
`;

const context = {
  console: { log() {}, warn() {}, error() {} },
  Utilities: {
    sleep: () => {},
    formatDate: () => '2026-11-18 17:00:00',
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: () => null,
      setProperty: () => {},
    }),
  },
  UrlFetchApp: {
    fetch: (url) => {
      const isNet = /network/i.test(url);
      return {
        getResponseCode: () => 200,
        getContentText: () => isNet ? mockHtmlNetworkPlus : mockHtmlSecurityPlus,
      };
    },
  },
};

vm.runInNewContext(scriptContent, context);

// 1. parseCompTIAExamPage の単体テスト
console.log('--- 1. parseCompTIAExamPage テスト ---');
const parsedSec = context.parseCompTIAExamPage(
  mockHtmlSecurityPlus,
  'https://www.comptia.jp/certif/core/comptia_security/',
  'CompTIA Security+',
  124
);
assert.strictEqual(parsedSec.category, 'Core / Cybersecurity');
assert.strictEqual(parsedSec.examDuration, '90分');
assert(parsedSec.examFormat.includes('パフォーマンスベーステスト'));
assert.strictEqual(parsedSec.cost, '55,440円（税込）');
assert(parsedSec.testingOptions.includes('ピアソンVUE'));
assert(parsedSec.introduction.includes('ベースラインスキル'));
assert(parsedSec.introduction.includes('【公式最新情報】'));
assert(parsedSec.examContent.includes('セキュリティアーキテクチャ'));
assert(parsedSec.contentOutline.includes('1.0 一般的なセキュリティの概念'));

const parsedNet = context.parseCompTIAExamPage(
  mockHtmlNetworkPlus,
  'https://www.comptia.jp/certif/core/comptia_network/',
  'Network+',
  123
);
assert.strictEqual(parsedNet.category, 'Core / Infrastructure');
assert.strictEqual(parsedNet.examDuration, '90分');
assert.strictEqual(parsedNet.cost, '49,500円（税込）');
assert(parsedNet.testingOptions.includes('ピアソンVUE'));
assert(parsedNet.introduction.includes('ネットワーク'));
assert(parsedNet.examContent.includes('ネットワークトラブルシューティング'));
assert(parsedNet.contentOutline.includes('1.0 ネットワークの概念'));

// 2. 121〜132行目および161〜163行目の fetchQualificationDetails 統合テスト
console.log('--- 2. 121〜132行目、161〜163行目 (計15資格) の取得テスト ---');

const testRows = [
  // 121〜132行目 (12資格)
  { rowIndex: 121, name: 'IT Fundamentals', expectedKey: 'itf', minDuration: 60 },
  { rowIndex: 122, name: 'A+', expectedKey: 'a', minDuration: 90 },
  { rowIndex: 123, name: 'Network+', expectedKey: 'network', minDuration: 90 },
  { rowIndex: 124, name: 'Security+', expectedKey: 'security', minDuration: 90 },
  { rowIndex: 125, name: 'Cloud+', expectedKey: 'cloud', minDuration: 90 },
  { rowIndex: 126, name: 'Linux+', expectedKey: 'linux', minDuration: 90 },
  { rowIndex: 127, name: 'Server+', expectedKey: 'server', minDuration: 90 },
  { rowIndex: 128, name: 'CASP+', expectedKey: 'casp', minDuration: 165 },
  { rowIndex: 129, name: 'F+', expectedKey: 'f', minDuration: 60 },
  { rowIndex: 130, name: 'PenTest+', expectedKey: 'pentest', minDuration: 165 },
  { rowIndex: 131, name: 'Project+', expectedKey: 'project', minDuration: 90 },
  { rowIndex: 132, name: 'CTT+', expectedKey: 'ctt', minDuration: 90 },
  // 161〜163行目 (3資格)
  { rowIndex: 161, name: 'Cloud Essentials', expectedKey: 'cloud_essentials', minDuration: 60 },
  { rowIndex: 162, name: 'CySA+', expectedKey: 'cysa', minDuration: 165 },
  { rowIndex: 163, name: 'Data+', expectedKey: 'data', minDuration: 90 }
];

const detailFields = [
  'category',        // I列
  'examDuration',    // J列
  'examFormat',      // K列
  'cost',            // L列
  'testingOptions',  // M列
  'introduction',    // N列
  'examContent',     // O列
  'contentOutline'   // P列
];

for (const target of testRows) {
  // 行番号のみでも、またはURL/資格名からでも正しくルーティングされて取得できること
  const details = context.fetchQualificationDetails(
    `https://www.comptia.jp/certif/test/${target.expectedKey}/`,
    'CompTIA（コンプティア）',
    target.name,
    target.rowIndex
  );

  assert.notStrictEqual(details, null, `行 ${target.rowIndex} (${target.name}) の詳細情報が取得できること`);
  assert(details.title && details.title.length > 0, `行 ${target.rowIndex} のタイトルが存在すること`);
  assert(details.url && details.url.length > 0, `行 ${target.rowIndex} のURLが存在すること`);

  // 3. Row 2（2行目のデータ）と同等の8項目完全性チェック（全項目が非空であること）
  for (const field of detailFields) {
    const val = details[field];
    assert(
      val && typeof val === 'string' && val.trim().length > 0,
      `行 ${target.rowIndex} (${target.name}) の ${field} (I〜P列) が空欄でないこと (実値: "${val}")`
    );
  }

  // 行番号単体（URLが空や汎用トップページ）の場合でもフォールバックとして正しく機能すること
  const rowOnlyDetails = context.fetchQualificationDetails(
    'https://www.comptia.jp/certif/',
    'CompTIA',
    'CompTIA 認定資格',
    target.rowIndex
  );
  assert.notStrictEqual(rowOnlyDetails, null, `行番号 ${target.rowIndex} 単体でも取得できること`);
  for (const field of detailFields) {
    assert(
      rowOnlyDetails[field] && rowOnlyDetails[field].trim().length > 0,
      `行番号 ${target.rowIndex} 単体の ${field} が空欄でないこと`
    );
  }
}

console.log('✓ CompTIA 認定資格（121〜132行目、161〜163行目の計15件）のI列〜P列詳細情報取得テストがすべて成功しました！');
