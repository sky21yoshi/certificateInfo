const assert = require('assert');
const {
  getAwsQualifications,
  matchAwsQualifications,
  parseAwsExamPage,
  parseAwsExamGuidePage,
  hashAwsDetails,
} = require('../src/fetcher/aws');
const { detectAwsDetailsDiff } = require('../src/checker');

const splitAwsQualifications = getAwsQualifications([
  { no: 70, providerName: 'Amazon Web Services (AWS)', name: 'AWS Certified Solutions Architect - Associate', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
  { no: 71, providerName: 'Amazon Web Services (AWS)', name: 'AWS Certified Developer - Associate', url: 'https://aws.amazon.com/certification/certified-developer-associate/' },
]);
assert.deepStrictEqual(splitAwsQualifications.map(item => item.no), [70, 71]);
assert.deepStrictEqual(matchAwsQualifications('AWS Certified Developer - Associate exam', splitAwsQualifications), [
  { no: 71, name: 'AWS Certified Developer - Associate' },
]);

// 1. parseAwsExamPage のテスト（JSON & HTML 見出し両方からの抽出）
const mockExamPageHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="description" content="Category, Foundational. Exam duration, 90 minutes. Exam format, 65 questions. Cost, 100 USD.">
    </head>
    <body>
      <script type="application/json">
        {
          "data": {
            "items": [
              {
                "fields": {
                  "itemHeading": "カテゴリ",
                  "itemLongLoc": "<p>Foundational</p>"
                }
              },
              {
                "fields": {
                  "itemHeading": "試験期間",
                  "itemLongLoc": "<p>90 分</p>"
                }
              },
              {
                "fields": {
                  "itemHeading": "試験の形態",
                  "itemLongLoc": "<p>65 個の問題 (択一選択問題または複数選択問題)</p>"
                }
              },
              {
                "fields": {
                  "itemHeading": "費用",
                  "itemLongLoc": "<p>100 USD。為替レートを含む他の料金情報については「試験の料金」をご覧ください</p>"
                }
              },
              {
                "fields": {
                  "itemHeading": "対面テストまたはオンラインテスト",
                  "itemLongLoc": "<p>ピアソンVUE テストセンターまたはオンライン監督付き試験</p>"
                }
              }
            ]
          }
        }
      </script>
      <div>
        <a href="https://docs.aws.amazon.com/ja_jp/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html">試験ガイドを確認します</a>
      </div>
    </body>
  </html>
`;

const parsedPage = parseAwsExamPage(mockExamPageHtml);
assert.strictEqual(parsedPage.category, 'Foundational');
assert.strictEqual(parsedPage.examDuration, '90 分');
assert.strictEqual(parsedPage.examFormat, '65 個の問題 (択一選択問題または複数選択問題)');
assert.strictEqual(parsedPage.cost, '100 USD。為替レートを含む他の料金情報については「試験の料金」をご覧ください');
assert.strictEqual(parsedPage.testingOptions, 'ピアソンVUE テストセンターまたはオンライン監督付き試験');
assert.strictEqual(parsedPage.examGuideUrl, 'https://docs.aws.amazon.com/ja_jp/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html');

// 2. parseAwsExamGuidePage のテスト
const mockGuideHtml = `
  <!DOCTYPE html>
  <html>
    <body>
      <h1 class="topictitle">AWS Certified Cloud Practitioner</h1>
      <h2 id="intro">はじめに</h2>
      <p>AWS Certified Cloud Practitioner (CLF-C02) 試験は、AWS クラウドに関する総合的な理解を効果的に実証できる方を対象としています。</p>
      <h2 id="target">受験対象者について</h2>
      <p>AWS クラウドの設計、実装、オペレーションの経験が 6 か月以下の方を対象としています。</p>
      <h2 id="exam-content">試験内容</h2>
      <p>試験には次の 2 種類の設問があります。択一選択問題と複数選択問題。</p>
      <h3 id="unscored">採点対象外の設問</h3>
      <p>試験には採点対象外の設問が含まれている場合があります。</p>
      <h2 id="domains">試験内容の概要</h2>
      <p>第 1 分野: クラウドの概念 (24%)、第 2 分野: セキュリティとコンプライアンス (30%)</p>
    </body>
  </html>
`;

const parsedGuide = parseAwsExamGuidePage(mockGuideHtml);
assert(parsedGuide.introduction.includes('AWS Certified Cloud Practitioner (CLF-C02) 試験は'));
assert(parsedGuide.examContent.includes('択一選択問題と複数選択問題'));
assert(parsedGuide.contentOutline.includes('第 1 分野: クラウドの概念'));

// 3. detectAwsDetailsDiff のテスト
const previousList = [
  {
    no: 14,
    category: 'Foundational',
    examDuration: '90 分',
    examFormat: '65 個の問題',
    cost: '100 USD',
    testingOptions: 'ピアソンVUE',
    introduction: '旧Introduction',
    examContent: '旧Exam content',
    contentOutline: '旧Content outline',
  },
];

// 変更なし
const diffNone = detectAwsDetailsDiff(previousList, previousList);
assert.strictEqual(diffNone.length, 0);

// 「費用」と「試験内容の概要」が変更
const currentWithDiff = [
  {
    no: 14,
    category: 'Foundational',
    examDuration: '90 分',
    examFormat: '65 個の問題',
    cost: '110 USD', // 変更！
    testingOptions: 'ピアソンVUE',
    introduction: '旧Introduction',
    examContent: '旧Exam content',
    contentOutline: '新Content outline (分野比率更新)', // 変更！
  },
];

const diffDetected = detectAwsDetailsDiff(currentWithDiff, previousList);
assert.strictEqual(diffDetected.length, 1);
assert.strictEqual(diffDetected[0]._diffType, 'UPDATED');
assert.deepStrictEqual(diffDetected[0]._changedFields, ['cost', 'contentOutline']);

// 4. hashAwsDetails のテスト
const hash1 = hashAwsDetails(previousList[0]);
const hash2 = hashAwsDetails(currentWithDiff[0]);
assert(typeof hash1 === 'string' && hash1.length === 8);
assert(typeof hash2 === 'string' && hash2.length === 8);
assert.notStrictEqual(hash1, hash2, '変更によりハッシュ値が異なること');

console.log('✓ AWS資格詳細情報パースおよび差分検知テストが成功しました！');
