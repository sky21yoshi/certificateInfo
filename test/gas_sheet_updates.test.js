const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const scriptProperties = new Map([
  ['QUALIFICATIONS_SPREADSHEET_URL', 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit'],
  ['QUALIFICATIONS_SHEET_NAME', '資格一覧'],
  ['SLACK_WEBHOOK_URL', 'https://hooks.slack.com/services/TEST/MOCK/WEBHOOK'],
]);

// 7列の旧形式行（URL列未作成）
const rows7Cols = [
  ['No', '認定機関', '資格名', '資格情報取得元', '最終更新日時', 'タイトル', '説明'],
  [15, 'AWS', 'AWS認定 Associate系', 'https://example.com/cert', '', '', ''],
  [16, 'AWS', 'AWS認定 Professional系', 'https://example.com/cert', '', '', ''],
];

let openedUrl;
const installedTriggers = [];
const triggerCalls = [];
const slackCalls = [];

const sheet = {
  getDataRange: () => ({ getValues: () => rows7Cols }),
  getRange: (row, column) => ({
    setValue: value => {
      rows7Cols[row - 1][column - 1] = value;
    },
  }),
};
const spreadsheet = {
  getSheetByName: name => name === '資格一覧' ? sheet : null,
  getSheets: () => [sheet],
};

const context = {
  console: { log() {}, warn() {}, error() {} },
  Utilities: {
    sleep: () => {},
    formatDate: () => '2026',
  },
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
    WeekDay: {
      SUNDAY: 1,
      MONDAY: 2,
      TUESDAY: 3,
      WEDNESDAY: 4,
      THURSDAY: 5,
      FRIDAY: 6,
      SATURDAY: 7,
    },
    getProjectTriggers: () => installedTriggers.slice(),
    deleteTrigger: trigger => {
      const index = installedTriggers.indexOf(trigger);
      if (index >= 0) installedTriggers.splice(index, 1);
    },
    newTrigger: handler => ({
      timeBased: () => ({
        onWeekDay: weekday => ({
          atHour: hour => ({
            inTimezone: timezone => ({
              create: () => {
                const trigger = {
                  getHandlerFunction: () => handler,
                  weekday,
                  hour,
                  timezone,
                };
                triggerCalls.push({ handler, weekday, hour, timezone });
                installedTriggers.push(trigger);
                return trigger;
              },
            }),
          }),
        }),
        everyDays: days => ({
          atHour: hour => ({
            inTimezone: timezone => ({
              create: () => {
                const trigger = {
                  getHandlerFunction: () => handler,
                  days,
                  hour,
                  timezone,
                };
                triggerCalls.push({ handler, days, hour, timezone });
                installedTriggers.push(trigger);
                return trigger;
              },
            }),
          }),
        }),
      }),
    }),
  },
  UrlFetchApp: {
    fetch: (url, options) => {
      if (options && options.payload) {
        slackCalls.push({ url, payload: JSON.parse(options.payload) });
      }
      return {
        getResponseCode: () => 200,
        getContentText: () => '{}',
      };
    },
  },
};

vm.runInNewContext(fs.readFileSync(require.resolve('../gas/Code.js'), 'utf8'), context);

assert.deepStrictEqual(Array.from(context.getPmajNewsUrls()), [
  'https://www.pmaj.or.jp/news/news_2026.html',
  'https://www.pmaj.or.jp/news/news_2025.html',
]);

// 1. 差分検知とスプレッドシート更新（初回ベースライン）
context.handleDiff('AWS', [
  {
    url: 'https://example.com/news/1',
    date: '2026-11-06',
    title: 'AWS資格の更新情報',
    description: '試験内容の更新',
    relatedQualifications: [{ no: 15, name: 'AWS認定 Associate系' }],
  },
], context.PropertiesService.getScriptProperties(), 'https://hooks.slack.com/services/TEST/MOCK/WEBHOOK');

// 2. 差分検知（更新検知＆Slack通知）
slackCalls.length = 0;
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
], context.PropertiesService.getScriptProperties(), 'https://hooks.slack.com/services/TEST/MOCK/WEBHOOK');

assert.strictEqual(openedUrl, 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit');
assert.deepStrictEqual(rows7Cols[1].slice(4, 7), [
  '2026-11-07',
  'AWS資格の新着情報',
  '申込期間の更新',
]);
assert.deepStrictEqual(rows7Cols[2].slice(4, 7), [
  '2026-11-07',
  'AWS資格の新着情報',
  '申込期間の更新',
]);
assert.strictEqual(rows7Cols[1][3], 'https://example.com/cert');
// 列名「URL」が新設されて末尾に追加されること
assert.strictEqual(rows7Cols[0][7], 'URL');
assert.strictEqual(rows7Cols[1][7], 'https://example.com/news/2');
assert.strictEqual(rows7Cols[2][7], 'https://example.com/news/2');

// 3. Slack投稿の検証: 複数資格の更新がある場合、それぞれ別々に投稿され、5項目が含まれていること
assert.strictEqual(slackCalls.length, 2);
for (const call of slackCalls) {
  assert.strictEqual(call.url, 'https://hooks.slack.com/services/TEST/MOCK/WEBHOOK');
  const payloadStr = JSON.stringify(call.payload);
  assert(payloadStr.includes('2026-11-07'), '更新日時が含まれていること');
  assert(payloadStr.includes('AWS認定'), '資格名が含まれていること');
  assert(payloadStr.includes('AWS資格の新着情報'), 'タイトルが含まれていること');
  assert(payloadStr.includes('https://example.com/news/2'), 'URLが含まれていること');
  assert(payloadStr.includes('申込期間の更新'), '説明が含まれていること');
}

// 4. docs/interface.md 完全準拠の8列シートでの更新検証
const rows8Cols = [
  ['No', '認定機関', '資格名', '資格情報取得元', '最終更新日時', 'タイトル', 'URL', '説明'],
  [15, 'AWS', 'AWS認定 Associate系', 'https://example.com/cert', '2026-10-01', '古いタイトル', 'https://example.com/old', '古い説明'],
];
const sheet8Cols = {
  getDataRange: () => ({ getValues: () => rows8Cols }),
  getRange: (row, column) => ({
    setValue: value => {
      rows8Cols[row - 1][column - 1] = value;
    },
  }),
};
spreadsheet.getSheetByName = () => sheet8Cols;
spreadsheet.getSheets = () => [sheet8Cols];

const updated = context.updateQualificationSheet([
  {
    url: 'https://example.com/news/newer',
    date: '2026-11-08',
    title: '最新のAWS認定Associate情報',
    description: '新シラバス公開',
    relatedQualifications: [{ no: 15, name: 'AWS認定 Associate系' }],
  },
]);
assert.strictEqual(updated.length, 1);
assert.strictEqual(rows8Cols[1][4], '2026-11-08');
assert.strictEqual(rows8Cols[1][5], '最新のAWS認定Associate情報');
assert.strictEqual(rows8Cols[1][6], 'https://example.com/news/newer');
assert.strictEqual(rows8Cols[1][7], '新シラバス公開');

// 古い情報では更新されない（前回実行時より新しくない）検証
const updatedOlder = context.updateQualificationSheet([
  {
    url: 'https://example.com/news/older',
    date: '2026-10-01',
    title: '過去のAWS情報',
    description: '過去説明',
    relatedQualifications: [{ no: 15, name: 'AWS認定 Associate系' }],
  },
]);
assert.strictEqual(updatedOlder.length, 0);
assert.strictEqual(rows8Cols[1][4], '2026-11-08'); // 更新されない

// 5. 毎平日トリガー（setupDailyTrigger）の検証
installedTriggers.length = 0;
triggerCalls.length = 0;
installedTriggers.push({ getHandlerFunction: () => 'anotherHandler' });

context.setupDailyTrigger();
// 月曜〜金曜の5日分が登録されていること
assert.strictEqual(triggerCalls.length, 5);
const expectedWeekdays = [
  context.ScriptApp.WeekDay.MONDAY,
  context.ScriptApp.WeekDay.TUESDAY,
  context.ScriptApp.WeekDay.WEDNESDAY,
  context.ScriptApp.WeekDay.THURSDAY,
  context.ScriptApp.WeekDay.FRIDAY,
];
assert.deepStrictEqual(triggerCalls.map(c => c.weekday), expectedWeekdays);
triggerCalls.forEach(c => {
  assert.strictEqual(c.handler, 'checkAllCertificateUpdates');
  assert.strictEqual(c.hour, 10);
  assert.strictEqual(c.timezone, 'Asia/Tokyo');
});
assert.strictEqual(installedTriggers.length, 6); // anotherHandler(1) + 5 weekday triggers

// 6. 平日判定（isWeekdayJST）の検証
// 2026-11-09 (月曜日) -> true
assert.strictEqual(context.isWeekdayJST(new Date('2026-11-09T10:00:00+09:00')), true);
// 2026-11-13 (金曜日) -> true
assert.strictEqual(context.isWeekdayJST(new Date('2026-11-13T23:59:00+09:00')), true);
// 2026-11-14 (土曜日) -> false
assert.strictEqual(context.isWeekdayJST(new Date('2026-11-14T10:00:00+09:00')), false);
// 2026-11-15 (日曜日) -> false
assert.strictEqual(context.isWeekdayJST(new Date('2026-11-15T10:00:00+09:00')), false);

// 7. Oracle & ISACA パース処理の検証
const oracleItems = context.parseOracleAnnouncements(`
  <h3 id="y20261102-1">2026年版 Oracle Cloud Applications 認定試験のお知らせ (2026/11/2)</h3>
  <table><tr><td>ORACLE MASTER Silver Oracle Database</td></tr></table>
`);
assert.strictEqual(oracleItems.length, 1);
assert.strictEqual(oracleItems[0].url, 'https://www.oracle.com/jp/education/news/#y20261102-1');
assert.strictEqual(oracleItems[0].date, '2026-11-02');
assert.strictEqual(oracleItems[0].relatedQualifications[0].no, 62);

// Oracle RSS パースの検証
const oracleRssItems = context.parseOracleRss(`
  <rss version="2.0">
    <channel>
      <title>Oracle University Blog</title>
      <item>
        <title>New Certification Exam for Java SE and ORACLE MASTER Silver</title>
        <link>https://blogs.oracle.com/oracleuniversity/post/new-exam-2026</link>
        <pubDate>Mon, 09 Nov 2026 08:00:00 GMT</pubDate>
        <description>Details about Oracle Certified Java Programmer, Silver SE 11</description>
      </item>
    </channel>
  </rss>
`);
assert.strictEqual(oracleRssItems.length, 1);
assert.strictEqual(oracleRssItems[0].url, 'https://blogs.oracle.com/oracleuniversity/post/new-exam-2026');
assert.strictEqual(oracleRssItems[0].date, 'Mon, 09 Nov 2026 08:00:00 GMT');
assert(oracleRssItems[0].relatedQualifications.some(q => q.no === 62 || q.no === 63));

const isacaTopicItems = context.parseIsacaTopicItems(context.extractIsacaTopics(`
  <!--トピックス-->
  <table>
    <tr><td><p class="topics">2026/10</p></td><td><p class="topics"><a href="/cisa/index.html#cisa_course">2026年11月期 CISA試験レビューコースの開催のご案内</a></p></td></tr>
    <tr><td><p class="topics">2026/08</p></td><td><p class="topics"><a href="/cism/index.html">CISM試験レビューコースのご案内</a></p></td></tr>
  </table>
  <!--//トピックス-->
`));
assert.strictEqual(isacaTopicItems.length, 1);
assert.strictEqual(isacaTopicItems[0].url, 'https://engage.isaca.org/cisa/index.html#cisa_course');
assert.strictEqual(isacaTopicItems[0].date, '2026-10');
assert.strictEqual(isacaTopicItems[0].relatedQualifications[0].no, 105);

console.log('✓ requirements.md & interface.md に沿ったGAS機能のテストがすべて成功しました！');
