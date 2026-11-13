const assert = require('assert');
const { parseMicrosoftExamPage } = require('../src/fetcher/microsoft');
const { checkQualificationRecordDiff, getNowJstString } = require('../src/checker');

// 1. parseMicrosoftExamPage のテスト
const mockMsHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Microsoft 認定: Azure Fundamentals - Certifications | Microsoft Learn</title>
      <meta property="og:title" content="Microsoft 認定: Azure Fundamentals - Certifications" />
      <meta name="description" content="クラウドの概念、Azure のコア サービスに関する基本的な知識を示します。" />
    </head>
    <body>
      <section id="certification-overview">
        <h2>概要</h2>
        <p>この認定資格の受験者は、クラウドの概念全般に関する基本的な知識の実証を望む専門家です。</p>
        <p>Azure のアーキテクチャ コンポーネントとサービスについて説明できます。</p>
      </section>

      <section id="certification-take-the-exam">
        <h2>試験を受ける</h2>
        <p class="font-weight-semibold margin-top-none">この試験で評価</p>
        <ul>
          <li>クラウドの概念について説明する</li>
          <li>Azure のアーキテクチャとサービスについて説明する</li>
          <li>Azure の管理とガバナンスについて説明する</li>
        </ul>
        <p>45分 の試験時間です。</p>
        <p>Pearson Vue を使用してスケジュールを設定する</p>
        <p>Certiport を使用してスケジュールを設定する</p>
        <p>試験が監督されている国または地域に基づく価格。</p>
        <a href="https://learn.microsoft.com/ja-jp/credentials/certifications/resources/study-guides/az-900">学習ガイド</a>
      </section>
    </body>
  </html>
`;

const parsed = parseMicrosoftExamPage(mockMsHtml, 'https://learn.microsoft.com/ja-jp/credentials/certifications/azure-fundamentals/');
assert.strictEqual(parsed.title, 'Microsoft 認定: Azure Fundamentals');
assert.strictEqual(parsed.description, 'クラウドの概念、Azure のコア サービスに関する基本的な知識を示します。');
assert.strictEqual(parsed.category, 'Fundamentals');
assert.strictEqual(parsed.examDuration, '45分');
assert.strictEqual(parsed.examFormat, 'オンライン（監督付き）またはテストセンター');
assert(parsed.cost.includes('国または地域に基づく価格'));
assert(parsed.testingOptions.includes('Pearson VUE'));
assert(parsed.testingOptions.includes('Certiport'));
assert(parsed.introduction.includes('クラウドの概念全般に関する基本的な知識の実証'));
assert(parsed.examContent.includes('クラウドの概念について説明する'));
assert(parsed.examContent.includes('Azure のアーキテクチャとサービスについて説明する'));
assert(parsed.contentOutline.includes('学習ガイド'));

// 2. checkQualificationRecordDiff のテスト（いずれかに変更があった場合はE列に現在日時を設定）
const existingRecord = {
  no: 19,
  provider: 'Microsoft',
  name: 'Azure認定 fundamentals系',
  url: 'https://learn.microsoft.com/ja-jp/credentials/certifications/azure-fundamentals/',
  date: '2026-10-01 10:00',
  title: 'Microsoft 認定: Azure Fundamentals',
  description: 'クラウドの概念、Azure のコア サービスに関する基本的な知識を示します。',
  category: 'Fundamentals',
  examDuration: '45分',
  examFormat: 'オンライン（監督付き）またはテストセンター',
  cost: '国または地域に基づく価格',
  testingOptions: 'Pearson VUE, Certiport',
  introduction: '古いはじめに',
  examContent: '古い試験内容',
  contentOutline: '古い試験内容の概要'
};

// 変更なしの場合
const noDiff = checkQualificationRecordDiff(existingRecord, existingRecord, '2026-11-13 18:00');
assert.strictEqual(noDiff.isChanged, false);
assert.strictEqual(noDiff.changedFields.length, 0);
assert.strictEqual(noDiff.updatedRecord.date, '2026-10-01 10:00'); // 既存日時が維持される

// 詳細項目（試験内容）に変更があった場合
const currentWithDetailChange = {
  ...existingRecord,
  examContent: '・クラウドの概念\n・AIサービスの基礎\n・セキュリティとガバナンス' // 変更！
};
const detailDiff = checkQualificationRecordDiff(currentWithDetailChange, existingRecord, '2026-11-13 18:00');
assert.strictEqual(detailDiff.isChanged, true);
assert.deepStrictEqual(detailDiff.changedFields, ['examContent']);
// いずれかに変更があったためE列（date）に現在日時が設定される
assert.strictEqual(detailDiff.updatedRecord.date, '2026-11-13 18:00');

// タイトルに変更があった場合
const currentWithTitleChange = {
  ...existingRecord,
  title: 'Microsoft 認定: Azure Fundamentals (更新版)' // 変更！
};
const titleDiff = checkQualificationRecordDiff(currentWithTitleChange, existingRecord, '2026-11-13 18:00');
assert.strictEqual(titleDiff.isChanged, true);
assert.deepStrictEqual(titleDiff.changedFields, ['title']);
assert.strictEqual(titleDiff.updatedRecord.date, '2026-11-13 18:00');

console.log('✓ Microsoft認定資格詳細情報パースおよび差分検知（現在日時設定）テストが成功しました！');
