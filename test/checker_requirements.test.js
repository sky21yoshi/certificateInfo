const assert = require('assert');
const {
  isWeekdayJST,
  getUpdateTimestamp,
  sendSlackNotification,
  notifySlackUpdates,
} = require('../src/checker');

// 1. 平日判定（isWeekdayJST）のテスト
// 2026-11-09 (月曜日 10:00 JST)
assert.strictEqual(isWeekdayJST(new Date('2026-11-09T10:00:00+09:00')), true);
// 2026-11-13 (金曜日 23:59 JST)
assert.strictEqual(isWeekdayJST(new Date('2026-11-13T23:59:00+09:00')), true);
// 2026-11-14 (土曜日 12:00 JST)
assert.strictEqual(isWeekdayJST(new Date('2026-11-14T12:00:00+09:00')), false);
// 2026-11-15 (日曜日 00:01 JST)
assert.strictEqual(isWeekdayJST(new Date('2026-11-15T00:01:00+09:00')), false);

// 2. 日付タイムスタンプ変換テスト
const ts = getUpdateTimestamp('2026年11月5日');
assert(!Number.isNaN(ts));
assert.strictEqual(new Date(ts).getUTCFullYear(), 2026);

// 3. Slack通知ペイロードの検証（更新日時、資格名、タイトル、URL、説明）
(async () => {
  const sentPayloads = [];
  const originalFetch = global.fetch;

  global.fetch = async (url, options) => {
    sentPayloads.push({ url, body: JSON.parse(options.body) });
    return { ok: true };
  };

  try {
    const updates = [
      {
        date: '2026-11-09',
        qualificationName: '基本情報技術者試験',
        title: '試験実施要項の公開',
        url: 'https://example.com/fe-news',
        description: '基本情報技術者試験の実施要項が公開されました。',
      },
      {
        date: '2026-11-09',
        qualificationName: '応用情報技術者試験',
        title: '秋期合格発表',
        url: 'https://example.com/ap-news',
        description: '応用情報技術者試験の合格者一覧が掲載されました。',
      },
    ];

    const count = await notifySlackUpdates(updates, 'https://hooks.slack.com/services/TEST/MOCK', 0);
    // 複数の更新がある場合、それぞれ別々に実施する
    assert.strictEqual(count, 2);
    assert.strictEqual(sentPayloads.length, 2);

    for (let i = 0; i < sentPayloads.length; i++) {
      const call = sentPayloads[i];
      assert.strictEqual(call.url, 'https://hooks.slack.com/services/TEST/MOCK');
      const bodyStr = JSON.stringify(call.body);
      const expected = updates[i];

      assert(bodyStr.includes(expected.date), '更新日時が含まれていること');
      assert(bodyStr.includes(expected.qualificationName), '資格名が含まれていること');
      assert(bodyStr.includes(expected.title), 'タイトルが含まれていること');
      assert(bodyStr.includes(expected.url), 'URLが含まれていること');
      assert(bodyStr.includes(expected.description), '説明が含まれていること');
    }

    console.log('✓ checker.js の平日判定・Slack通知（5項目個別投稿）テストが成功しました！');
  } finally {
    global.fetch = originalFetch;
  }
})();
