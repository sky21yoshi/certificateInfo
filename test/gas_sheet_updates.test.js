const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const scriptProperties = new Map([
  ['QUALIFICATIONS_SPREADSHEET_URL', 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit'],
  ['QUALIFICATIONS_SHEET_NAME', '資格一覧'],
]);
const rows = [
  ['No', '認定機関', '資格名', '資格情報取得元', '最終更新日時', 'タイトル', '説明'],
  [15, 'AWS', 'AWS認定 Associate系', 'https://example.com/cert', '', '', ''],
  [16, 'AWS', 'AWS認定 Professional系', 'https://example.com/cert', '', '', ''],
];
let openedUrl;
const sheet = {
  getDataRange: () => ({ getValues: () => rows }),
  getRange: (row, column) => ({
    setValue: value => {
      rows[row - 1][column - 1] = value;
    },
  }),
};
const spreadsheet = {
  getSheetByName: name => name === '資格一覧' ? sheet : null,
  getSheets: () => [sheet],
};

const context = {
  console: { log() {}, warn() {}, error() {} },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: key => scriptProperties.get(key) || null,
      setProperty: (key, value) => scriptProperties.set(key, value),
    }),
  },
  SpreadsheetApp: {
    openByUrl: url => {
      openedUrl = url;
      return spreadsheet;
    },
  },
  UrlFetchApp: { fetch: () => ({}) },
};

vm.runInNewContext(fs.readFileSync(require.resolve('../gas/Code.js'), 'utf8'), context);
context.handleDiff('AWS', [
  {
    url: 'https://example.com/news/1',
    date: '2026-11-06',
    title: 'AWS資格の更新情報',
    description: '試験内容の更新',
    relatedQualifications: [{ no: 15, name: 'AWS認定 Associate系' }],
  },
], context.PropertiesService.getScriptProperties(), null);

context.handleDiff('AWS', [
  {
    url: 'https://example.com/news/2',
    date: '2026-11-07',
    title: 'AWS資格の新着情報',
    description: '申込期間の更新',
    relatedQualifications: [
      { no: 15, name: 'AWS認定 Associate系' },
      { no: 16, name: 'AWS認定 Professional系' },
    ],
  },
], context.PropertiesService.getScriptProperties(), null);

assert.strictEqual(openedUrl, 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit');
assert.deepStrictEqual(rows[1].slice(4), [
  '2026-11-07',
  'AWS資格の新着情報',
  '申込期間の更新',
]);
assert.deepStrictEqual(rows[2].slice(4), [
  '2026-11-07',
  'AWS資格の新着情報',
  '申込期間の更新',
]);
assert.strictEqual(rows[1][3], 'https://example.com/cert');

console.log('✓ 資格番号に応じたシート更新とURL設定を確認');
