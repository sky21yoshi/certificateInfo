const assert = require('assert');
const { detectDiff } = require('../src/checker');
const {
  getDailyBatchIndex,
  getProviderKey,
  getQualificationDetailTargets,
  loadQualificationRows,
  parseCredentialDetails,
  fetchQualificationDetails,
} = require('../src/fetcher/qualification_details');

const rows = loadQualificationRows();
const providerNames = Array.from(new Set(rows.map(row => row.providerName)));
for (const providerName of providerNames) {
  if (/Amazon Web Services|Google Cloud/i.test(providerName)) {
    assert.strictEqual(getProviderKey(providerName), null);
  } else {
    assert(getProviderKey(providerName), `${providerName} must have a provider-specific detail profile`);
  }
}

const firstBatch = getDailyBatchIndex(new Date('2026-11-09T12:00:00Z'));
const nextBatch = getDailyBatchIndex(new Date('2026-11-10T12:00:00Z'));
assert(firstBatch >= 0 && firstBatch < 5);
assert.strictEqual((nextBatch - firstBatch + 5) % 5, 1);
const fridayBatch = getDailyBatchIndex(new Date('2026-11-06T12:00:00Z'));
assert.strictEqual((firstBatch - fridayBatch + 5) % 5, 1);

for (const rule of require('../src/fetcher/qualification_details').PROVIDER_RULES) {
  const providerRows = rows.filter(row => getProviderKey(row.providerName) === rule.key);
  const expectedUrls = new Set(providerRows.map(row => row.url));
  const batchedUrls = new Set();
  for (let batch = 0; batch < 5; batch++) {
    for (const target of getQualificationDetailTargets(rule.key, rows, batch)) {
      batchedUrls.add(target.url);
    }
  }
  assert.deepStrictEqual(batchedUrls, expectedUrls, `${rule.key} pages must be distributed across the five batches`);
}

const ipaDetails = parseCredentialDetails(`
  <meta name="description" content="基本情報技術者試験の資格概要です。">
  <dl>
    <dt>試験時間</dt><dd>科目A 90分、科目B 100分</dd>
    <dt>受験料</dt><dd>7,500円</dd>
  </dl>
  <h2>出題範囲</h2><p>テクノロジ系・マネジメント系・ストラテジ系</p>
`, 'IPA（独立行政法人 情報処理推進機構）');
assert.strictEqual(ipaDetails.examDuration, '科目A 90分、科目B 100分');
assert.strictEqual(ipaDetails.cost, '7,500円');
assert.strictEqual(ipaDetails.introduction, '基本情報技術者試験の資格概要です。');
assert.strictEqual(ipaDetails.contentOutline, 'テクノロジ系・マネジメント系・ストラテジ系');

const microsoftDetails = parseCredentialDetails(`
  <table><tr><th>Exam duration</th><td>100 minutes</td></tr></table>
  <h2>Skills measured</h2><ul><li>Manage Azure identities</li><li>Implement storage</li></ul>
`, 'Microsoft（マイクロソフト）');
assert.strictEqual(microsoftDetails.examDuration, '100 minutes');
assert(microsoftDetails.contentOutline.includes('Manage Azure identities'));

const groupedRows = [
  { no: 1, providerName: 'Cisco Systems（シスコシステムズ）', name: 'CCNA', url: 'https://example.test/ccna' },
  { no: 2, providerName: 'Cisco Systems（シスコシステムズ）', name: 'CCNP', url: 'https://example.test/ccna' },
  { no: 3, providerName: 'Cisco Systems（シスコシステムズ）', name: 'CCIE', url: 'https://example.test/ccie' },
];
const targets = getQualificationDetailTargets('cisco', groupedRows, 0);
assert.strictEqual(targets.length, 1);
assert.deepStrictEqual(targets[0].qualifications.map(item => item.no), [1, 2]);

async function main() {
  const items = await fetchQualificationDetails('ipa', {
    rows: [
      { no: 1, providerName: 'IPA（独立行政法人 情報処理推進機構）', name: '基本情報技術者試験', url: 'https://example.test/ipa' },
    ],
    batchIndex: 0,
    pages: {
      'https://example.test/ipa': '<dt>受験料</dt><dd>7,500円</dd>',
    },
    wait: async () => {},
  });
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].detailsOnly, true);
  assert.strictEqual(items[0].relatedQualifications[0].no, 1);
  const changedDetails = detectDiff(
    [{ ...items[0], contentHash: 'changed-hash' }],
    [items[0]],
    'url',
    null
  );
  assert.strictEqual(changedDetails.length, 1);
  assert.strictEqual(changedDetails[0]._diffType, 'UPDATED');

    console.log('✓ 資格詳細情報: 全認定機関の個別ルール、公式ページ抽出、5日分割 OK');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
