const assert = require('assert');
const { mergeProviderItems, mergeProviderState } = require('../src/checker');

const mergedProviderState = mergeProviderState(
  [
    { url: 'https://example.com/news', title: '最新のお知らせ' },
    { url: 'https://example.com/details/today', detailsOnly: true },
  ],
  [
    { url: 'https://example.com/details/yesterday', detailsOnly: true },
    { url: 'https://example.com/details/today', detailsOnly: true },
  ]
);
assert.deepStrictEqual(mergedProviderState.map(item => item.url), [
  'https://example.com/news',
  'https://example.com/details/today',
  'https://example.com/details/yesterday',
]);

const state = mergeProviderItems([
  [
    {
      fiscalYear: 2026,
      date: '2026年11月1日',
      title: '資格情報のお知らせ',
      url: 'https://example.com/news',
      relatedQualifications: [{ no: 1, name: '資格A' }],
      description: '差分検知用フィールド',
      category: 'Associate',
      examDuration: '90 minutes',
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
  'description',
  'category',
  'examDuration',
  'examFormat',
  'cost',
  'testingOptions',
  'introduction',
  'examContent',
  'contentOutline',
  'relatedQualifications',
]);
assert.deepStrictEqual(state[0], {
  fiscalYear: 2026,
  date: '2026年11月1日',
  title: '資格情報のお知らせ',
  url: 'https://example.com/news',
  description: '差分検知用フィールド',
  category: 'Associate',
  examDuration: '90 minutes',
  examFormat: '',
  cost: '',
  testingOptions: '',
  introduction: '',
  examContent: '',
  contentOutline: '',
  relatedQualifications: [
    { no: 1, name: '資格A' },
    { no: 2, name: '資格B' },
  ],
});
assert.strictEqual(state[1].fiscalYear, null);
assert.strictEqual(state[1].date, '');
assert.strictEqual(state[1].title, '更新情報');
assert.strictEqual(state[1].description, '');
assert.strictEqual(state[1].category, '');
assert.strictEqual(state[1].relatedQualifications.length, 0);

console.log('✓ 全ベンダー統合出力に共通情報と詳細項目を保持');
