const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

// GAS コンテキストのセットアップ
const scriptContent = fs.readFileSync(require.resolve('../gas/Code.js'), 'utf8');

const mockHtmlAssoc = `
<!DOCTYPE html>
<html>
<head><title>RPA技術者検定アソシエイト | WinActor</title></head>
<body>
  <h1>RPA技術者検定アソシエイト</h1>
  <table>
    <tr><th>試験日時</th><td>通年開催</td></tr>
    <tr><th>検定形式</th><td>CBT（Computer Based Testing）指定会場での会場受検、またはオンライン受検（リモート受験（AI））</td></tr>
    <tr><th>出題範囲</th><td>・WinActorの概要（10問） ・WinActorの機能に関する知識（20問） ・WinActorのシナリオに関する知識（20問）</td></tr>
    <tr><th>WinActorバージョン</th><td>Ver.7</td></tr>
    <tr><th>合格基準</th><td>正答率7割以上</td></tr>
    <tr><th>受検料</th><td>7,150円（税込）</td></tr>
    <tr><th>申し込みサイト・試験詳細</th><td>RPA技術者検定 アソシエイト | 資格・検定・CBT試験なら【J-Testing】</td></tr>
  </table>
</body>
</html>
`;

const mockHtmlExpert = `
<!DOCTYPE html>
<html>
<head><title>RPA技術者検定エキスパート | WinActor</title></head>
<body>
  <h1>RPA技術者検定エキスパート</h1>
  <table>
    <tr><th>試験日時</th><td>午前（10:00～12:00） 2026年5月22日、午後（15:00～17:00） 2026年5月22日</td></tr>
    <tr><th>検定形式</th><td>オンライン形式</td></tr>
    <tr><th>出題範囲（WinActorマニュアル）</th><td>簡易マニュアル、操作マニュアル、ユーザライブラリサンプル説明書、ブラウザ操作シナリオ作成マニュアル、作ろう！ハンズオントレーニング</td></tr>
    <tr><th>WinActorバージョン</th><td>Ver7.6.1</td></tr>
    <tr><th>受検料</th><td>21,780円（税込）</td></tr>
    <tr><th>申し込みサイト</th><td>WinActorビジネスオンラインショップ</td></tr>
  </table>
</body>
</html>
`;

const context = {
  console: { log() {}, warn() {}, error() {} },
  Utilities: {
    sleep: () => {},
    formatDate: () => '2026-11-18 15:00:00',
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: () => null,
      setProperty: () => {},
    }),
  },
  UrlFetchApp: {
    fetch: (url) => {
      const isExp = /expert/i.test(url);
      return {
        getResponseCode: () => 200,
        getContentText: () => isExp ? mockHtmlExpert : mockHtmlAssoc,
      };
    },
  },
};

vm.runInNewContext(scriptContent, context);

// 1. parseWinActorExamPage の単体テスト
console.log('--- 1. parseWinActorExamPage テスト ---');
const parsedAssoc = context.parseWinActorExamPage(mockHtmlAssoc, 'https://winactor.com/rpa-kentei/associate/', 'WinActor RPA技術者検定アソシエイト', 159);
assert.strictEqual(parsedAssoc.category, 'アソシエイト');
assert.strictEqual(parsedAssoc.examDuration, '60分');
assert(parsedAssoc.examFormat.includes('CBT'));
assert.strictEqual(parsedAssoc.cost, '7,150円（税込）');
assert(parsedAssoc.testingOptions.includes('指定会場') || parsedAssoc.testingOptions.includes('オンライン'));
assert(parsedAssoc.introduction.length > 20);
assert(parsedAssoc.examContent.includes('WinActorの概要（10問）'));
assert(parsedAssoc.contentOutline.includes('WinActorの概要と基本画面操作'));

const parsedExpert = context.parseWinActorExamPage(mockHtmlExpert, 'https://winactor.com/rpa-kentei/expert/', 'WinActor RPA技術者検定エキスパート', 160);
assert.strictEqual(parsedExpert.category, 'エキスパート');
assert.strictEqual(parsedExpert.examDuration, '120分（多肢選択式30分、実技問題90分）');
assert(parsedExpert.examFormat.includes('オンライン'));
assert.strictEqual(parsedExpert.cost, '21,780円（税込）');
assert(parsedExpert.testingOptions.includes('オンライン形式'));
assert(parsedExpert.introduction.length > 20);
assert(parsedExpert.examContent.includes('簡易マニュアル'));
assert(parsedExpert.contentOutline.includes('仕様書に基づく複雑な自動化シナリオの設計と構築'));

// 2. fetchQualificationDetails の統合テスト (159行目, 160行目のD列サイトから取得)
console.log('--- 2. 159行目・160行目の fetchQualificationDetails テスト ---');
// 159行目: WinActor RPA検定 (D列がトップページの場合でも159行目指定でアソシエイト情報を取得)
const row159Details = context.fetchQualificationDetails(
  'https://winactor.com/rpa-kentei/',
  'NTTアドバンステクノロジ（NTT-AT）',
  'WinActor RPA検定',
  159
);
assert.notStrictEqual(row159Details, null);
assert.strictEqual(row159Details.category, 'アソシエイト');
assert.strictEqual(row159Details.cost, '7,150円（税込）');
assert.strictEqual(row159Details.examDuration, '60分');
assert(row159Details.examFormat.length > 0);
assert(row159Details.testingOptions.length > 0);
assert(row159Details.introduction.length > 0);
assert(row159Details.examContent.length > 0);
assert(row159Details.contentOutline.length > 0);

// 160行目: WinActor RPA検定 (D列がトップページの場合でも160行目指定でエキスパート情報を取得)
const row160Details = context.fetchQualificationDetails(
  'https://winactor.com/rpa-kentei/',
  'NTTアドバンステクノロジ（NTT-AT）',
  'WinActor RPA検定',
  160
);
assert.notStrictEqual(row160Details, null);
assert.strictEqual(row160Details.category, 'エキスパート');
assert.strictEqual(row160Details.cost, '21,780円（税込）');
assert.strictEqual(row160Details.examDuration, '120分（多肢選択式30分、実技問題90分）');
assert(row160Details.examFormat.length > 0);
assert(row160Details.testingOptions.length > 0);
assert(row160Details.introduction.length > 0);
assert(row160Details.examContent.length > 0);
assert(row160Details.contentOutline.length > 0);

// 3. Row 2（2行目のデータ）と同等の完全性チェック（I列〜P列すべてが空欄でないこと）
console.log('--- 3. 2行目のデータと同等の8項目完全性チェック ---');
const detailColumns = [
  'category',        // I列
  'examDuration',    // J列
  'examFormat',      // K列
  'cost',            // L列
  'testingOptions',  // M列
  'introduction',    // N列
  'examContent',     // O列
  'contentOutline'   // P列
];

for (const col of detailColumns) {
  assert(row159Details[col] && row159Details[col].trim().length > 0, `159行目の ${col} が空欄でないこと`);
  assert(row160Details[col] && row160Details[col].trim().length > 0, `160行目の ${col} が空欄でないこと`);
}

console.log('✓ WinActor RPA検定(159、160行目)のI列～P列詳細情報取得テストがすべて成功しました！');
