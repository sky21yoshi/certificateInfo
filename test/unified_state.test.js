const assert = require('assert');
const { mergeProviderItems } = require('../src/checker');

const state = mergeProviderItems([
  [
    {
      fiscalYear: 2026,
      date: '2026年11月1日',
      title: '資格情報のお知らせ',
      url: 'https://example.com/news',
      relatedQualifications: [{ no: 1, name: '資格A' }],
      description: '差分検知用フィールド',
      contentHash: 'abc123',
    },
  ],
  [
    {
      lastModified: '2026-11-02',
      name: '別取得元からのお知らせ',
      officialUrl: 'https://example.com/news',
      relatedQualifications: [{ no: 2, name: '資格B' }],
      uid: 'provider-id',
    },
    {
      title: '更新情報',
      url: 'https://example.com/update',
      relatedQualifications: [],
    },
  ],
]);

assert.strictEqual(state.length, 2);
assert.deepStrictEqual(Object.keys(state[0]), [
  'fiscalYear',
  'date',
  'title',
  'url',
  'relatedQualifications',
]);
assert.deepStrictEqual(state[0], {
  fiscalYear: 2026,
  date: '2026年11月1日',
  title: '資格情報のお知らせ',
  url: 'https://example.com/news',
  relatedQualifications: [
    { no: 1, name: '資格A' },
    { no: 2, name: '資格B' },
  ],
});
assert.strictEqual(state[1].fiscalYear, null);
assert.strictEqual(state[1].date, '');
assert.strictEqual(state[1].title, '更新情報');
assert.strictEqual(state[1].relatedQualifications.length, 0);

console.log('✓ 全ベンダー統合出力は ipa_state.json と同じ項目構成');
