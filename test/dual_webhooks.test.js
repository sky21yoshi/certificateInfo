const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const { sendSlackNotification, sendSlackErrorNotification } = require('../src/checker');

// 1. src/checker.js の sendSlackErrorNotification 単体テスト
(async () => {
  const sentRequests = [];
  const originalFetch = global.fetch;

  global.fetch = async (url, options) => {
    sentRequests.push({ url, options: { ...options, body: JSON.parse(options.body) } });
    return { ok: true };
  };

  try {
    const webhook1 = 'https://hooks.slack.com/services/TEST/WEBHOOK/1';
    const webhook2 = 'https://hooks.slack.com/services/TEST/WEBHOOK/2';

    // 1-1. Webhook 2 への正常エラー通知
    const err = new Error('HTML構造が変更されたためセレクタにマッチしませんでした');
    const ok = await sendSlackErrorNotification(err, 'IPA スクレイピング', webhook2);
    assert.strictEqual(ok, true);
    assert.strictEqual(sentRequests.length, 1);
    assert.strictEqual(sentRequests[0].url, webhook2);
    const payload = sentRequests[0].options.body;
    assert(payload.text.includes('IPA スクレイピング'));
    assert(payload.text.includes('エラーが発生しました'));
    const blockText = JSON.stringify(payload.blocks);
    assert(blockText.includes('🚨 資格情報監視 プログラムエラー通知'));
    assert(blockText.includes('HTML構造が変更されたためセレクタにマッチしませんでした'));

    // 1-2. Oracle のエラーは通知対象外（403エラー）
    sentRequests.length = 0;
    const oracleErr = new Error('HTTP 403 Forbidden: Access denied');
    const oracleResult = await sendSlackErrorNotification(oracleErr, 'Oracle チェック', webhook2);
    assert.strictEqual(oracleResult, false);
    assert.strictEqual(sentRequests.length, 0, 'OracleのエラーはWebhook2へ送信されないこと');

    // 1-3. Webhook 1 への更新通知テスト
    sentRequests.length = 0;
    const updateItem = {
      qualificationName: '基本情報技術者試験',
      date: '2026-11-16 10:00',
      title: '試験実施方式の変更について',
      url: 'https://www.ipa.go.jp/news/1',
      description: 'CBT方式に関する更新',
    };
    const updateOk = await sendSlackNotification(updateItem, webhook1);
    assert.strictEqual(updateOk, true);
    assert.strictEqual(sentRequests.length, 1);
    assert.strictEqual(sentRequests[0].url, webhook1, '更新通知はWebhook1へ送信されること');
    const updatePayload = sentRequests[0].options.body;
    assert(JSON.stringify(updatePayload).includes('📢 資格情報 更新通知'));

  } finally {
    global.fetch = originalFetch;
  }
})();

// 2. GAS (gas/Code.js) 内の Webhook 1 / Webhook 2 分割テスト
(() => {
  const webhook1 = 'https://hooks.slack.com/services/GAS/WEBHOOK/1';
  const webhook2 = 'https://hooks.slack.com/services/GAS/WEBHOOK/2';

  const scriptProperties = new Map([
    ['SLACK_WEBHOOK_URL_1', webhook1],
    ['SLACK_WEBHOOK_URL_2', webhook2],
    ['QUALIFICATIONS_SPREADSHEET_URL', 'https://docs.google.com/spreadsheets/d/test-sheet-id/edit'],
  ]);

  const gasFetchCalls = [];
  const testRows = [
    ['No', '認定機関', '資格名', '資格情報取得元', '最終更新日時', 'タイトル', 'URL', '説明'],
    [1, 'IPA', '基本情報技術者試験', 'https://www.ipa.go.jp/shiken/fe.html', '', '', '', ''],
  ];

  const gasSheet = {
    getDataRange: () => ({ getValues: () => testRows }),
    getRange: (row, column) => ({
      setValue: val => {
        testRows[row - 1][column - 1] = val;
      },
    }),
  };

  const gasSpreadsheet = {
    getSheetByName: () => gasSheet,
    getSheets: () => [gasSheet],
  };

  const context = {
    console: { log() {}, warn() {}, error() {} },
    Utilities: {
      sleep: () => {},
      formatDate: () => '2026-11-16 10:00:00',
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: key => scriptProperties.get(key) || null,
        setProperty: (key, val) => scriptProperties.set(key, val),
      }),
    },
    SpreadsheetApp: {
      openByUrl: () => gasSpreadsheet,
    },
    ScriptApp: {
      getProjectTriggers: () => [],
      deleteTrigger: () => {},
    },
    UrlFetchApp: {
      fetch: (url, options) => {
        gasFetchCalls.push({
          url,
          options: options ? { ...options, payload: options.payload ? JSON.parse(options.payload) : null } : null,
        });
        return {
          getResponseCode: () => 200,
          getContentText: () => '{}',
        };
      },
    },
  };

  vm.runInNewContext(fs.readFileSync(require.resolve('../gas/Code.js'), 'utf8'), context);

  // 2-1. GASの sendSlackErrorNotification テスト
  context.sendSlackErrorNotification(new Error('GAS内部パース例外'), 'AWS 詳細パース', webhook2);
  assert.strictEqual(gasFetchCalls.length, 1);
  assert.strictEqual(gasFetchCalls[0].url, webhook2);
  const errPayload = gasFetchCalls[0].options.payload;
  assert(errPayload.text.includes('AWS 詳細パース'));
  assert(JSON.stringify(errPayload.blocks).includes('GAS内部パース例外'));

  // 2-2. GASの Oracle エラー除外テスト
  gasFetchCalls.length = 0;
  context.sendSlackErrorNotification(new Error('403 Forbidden'), 'Oracle チェック', webhook2);
  assert.strictEqual(gasFetchCalls.length, 0, 'Oracleは通知されないこと');

  // 2-3. GASの sendSlackNotification は Webhook 1 へ送信
  gasFetchCalls.length = 0;
  context.sendSlackNotification({
    qualificationName: 'AWS認定',
    date: '2026-11-16 10:00',
    title: 'AWS新着',
    url: 'https://aws.amazon.com',
    description: '説明',
  }, webhook1);
  assert.strictEqual(gasFetchCalls.length, 1);
  assert.strictEqual(gasFetchCalls[0].url, webhook1);

  console.log('✓ Webhook 1 (更新通知) / Webhook 2 (エラー通知) の切り分けテストが成功しました！');
})();
