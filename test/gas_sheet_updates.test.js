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
const installedTriggers = [];
const triggerCalls = [];
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
  ScriptApp: {
    getProjectTriggers: () => installedTriggers.slice(),
    deleteTrigger: trigger => {
      const index = installedTriggers.indexOf(trigger);
      if (index >= 0) installedTriggers.splice(index, 1);
    },
    newTrigger: handler => {
      triggerCalls.push({ handler });
      return {
        timeBased: () => ({
          everyDays: days => {
            triggerCalls[triggerCalls.length - 1].days = days;
            return {
              atHour: hour => {
                triggerCalls[triggerCalls.length - 1].hour = hour;
                return {
                  inTimezone: timezone => {
                    triggerCalls[triggerCalls.length - 1].timezone = timezone;
                    return {
                      create: () => {
                        const trigger = {
                          getHandlerFunction: () => handler,
                        };
                        installedTriggers.push(trigger);
                        return trigger;
                      },
                    };
                  },
                };
              },
            };
          },
        }),
      };
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
assert.deepStrictEqual(rows[1].slice(4, 7), [
  '2026-11-07',
  'AWS資格の新着情報',
  '申込期間の更新',
]);
assert.deepStrictEqual(rows[2].slice(4, 7), [
  '2026-11-07',
  'AWS資格の新着情報',
  '申込期間の更新',
]);
assert.strictEqual(rows[1][3], 'https://example.com/cert');
assert.strictEqual(rows[0][7], '更新情報URL');
assert.strictEqual(rows[1][7], 'https://example.com/news/2');
assert.strictEqual(rows[2][7], 'https://example.com/news/2');

context.updateQualificationSheet([
  {
    url: 'https://example.com/news/older',
    date: '2026年10月',
    title: '古いAWS資格情報',
    description: '古い説明',
    relatedQualifications: [{ no: 15 }],
  },
  {
    url: 'https://example.com/news/newer',
    date: '2026年11月',
    title: '新しいAWS資格情報',
    summary: '新しい説明',
    relatedQualifications: [{ no: 15 }],
  },
]);
assert.strictEqual(rows[1][4], '2026年11月');
assert.strictEqual(rows[1][5], '新しいAWS資格情報');
assert.strictEqual(rows[1][6], '新しい説明');
assert.strictEqual(rows[1][7], 'https://example.com/news/newer');

installedTriggers.push({ getHandlerFunction: () => 'anotherHandler' });
context.setupDailyTrigger();
context.setupDailyTrigger();
assert.deepStrictEqual(triggerCalls, [
  { handler: 'checkAllCertificateUpdates', days: 1, hour: 10, timezone: 'Asia/Tokyo' },
  { handler: 'checkAllCertificateUpdates', days: 1, hour: 10, timezone: 'Asia/Tokyo' },
]);
assert.strictEqual(installedTriggers.length, 2);
assert.strictEqual(installedTriggers[0].getHandlerFunction(), 'anotherHandler');
assert.strictEqual(installedTriggers[1].getHandlerFunction(), 'checkAllCertificateUpdates');

const oracleItems = context.parseOracleAnnouncements(`
  <h3 id="y20261102-1">2026年版 Oracle Cloud Applications 認定試験のお知らせ (2026/11/2)</h3>
  <table><tr><td>ORACLE MASTER Silver Oracle Database</td></tr></table>
`);
assert.strictEqual(oracleItems.length, 1);
assert.strictEqual(oracleItems[0].url, 'https://www.oracle.com/jp/education/news/#y20261102-1');
assert.strictEqual(oracleItems[0].date, '2026-11-02');
assert.strictEqual(oracleItems[0].relatedQualifications[0].no, 62);

const isacaTopicItems = context.parseIsacaTopicItems(context.extractIsacaTopics(`
  <!--トピックス-->
  <table>
    <tr><td><p class="topics">2026/10</p></td><td><p class="topics"><a href="/cisa/index.html#cisa_course">2026年11月期 CISA試験レビューコースの開催のご案内</a></p></td></tr>
    <tr><td><p class="topics">2026/08</p></td><td><p class="topics"><a href="/cism/index.html">CISM試験レビューコースのご案内</a></p></td></tr>
  </table>
  <!--//トピックス-->
`));
assert.strictEqual(isacaTopicItems.length, 1);
assert.strictEqual(isacaTopicItems[0].url, 'https://www.isaca.gr.jp/cisa/index.html#cisa_course');
assert.strictEqual(isacaTopicItems[0].date, '2026-10');
assert.strictEqual(isacaTopicItems[0].relatedQualifications[0].no, 105);

console.log('✓ 資格番号に応じたシート更新とURL設定を確認');
