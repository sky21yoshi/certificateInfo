const assert = require('assert');
const {
  parseGoogleCloudExamPage,
  hashGoogleCloudDetails,
} = require('../src/fetcher/google_cloud');
const { detectGoogleCloudDetailsDiff } = require('../src/checker');

// 1. parseGoogleCloudExamPage のテスト
const mockExamPageHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="description" content="Cloud Digital Leader はクラウドの基礎知識を検証します。">
    </head>
    <body>
      <div class="cws-content-block">
        <h1 class="cws-headline--headline-3">Cloud Digital Leader</h1>
        <div class="cws-content-block__text">
          <div class="cws-body--large richtext">
            <p>Cloud Digital Leader は、Google Cloud の中核的なプロダクトやサービスの機能と、それらが組織にもたらすメリットを明確にできます。</p>
          </div>
        </div>
      </div>

      <div class="richtext">
        <h3 id="standard-exam-information"><b>標準試験に関する情報</b></h3>
        <p><b>試験時間:</b>: 90 分</p>
        <p><b>登録料:</b> $99（税別）</p>
        <p><b>言語:</b> 英語、日本語</p>
        <p><b>試験の形式:</b> 50～60 問の多肢選択（複数選択）式</p>
        <p><strong>内容:</strong> <a class="cws-link" href="https://services.google.com/fh/files/misc/cloud_digital_leader_exam_guide_japanese.pdf?hl=ja">標準試験ガイド</a>をご覧ください</p>
        <p><strong>試験の実施方法:</strong></p>
        <p>a. <a class="cws-link" href="https://cp.certmetrics.com/google/en/login">遠隔監視オンライン試験</a>を受験する</p>
        <p>b. <a class="cws-link" href="https://www.pearsonvue.com/">テストセンター</a>でオンサイト監視試験を受験する</p>
      </div>

      <ul class="cws-bulleted-list">
        <li>Google Cloud によるデジタル トランスフォーメーション</li>
        <li>Google Cloud によるデータ トランスフォーメーションの探求</li>
        <li>Google Cloud の AI を活用したイノベーション</li>
      </ul>
    </body>
  </html>
`;

const parsedPage = parseGoogleCloudExamPage(mockExamPageHtml, 'https://cloud.google.com/learn/certification/cloud-digital-leader?hl=ja');
assert.strictEqual(parsedPage.category, 'Leader (Foundational)');
assert.strictEqual(parsedPage.examDuration, '90 分');
assert.strictEqual(parsedPage.examFormat, '50～60 問の多肢選択（複数選択）式');
assert.strictEqual(parsedPage.cost, '$99（税別）');
assert(parsedPage.testingOptions.includes('遠隔監視オンライン試験'));
assert(parsedPage.testingOptions.includes('テストセンター'));
assert(parsedPage.introduction.includes('Google Cloud の中核的なプロダクトやサービス'));
assert(parsedPage.examContent.includes('標準試験ガイド'));
assert(parsedPage.contentOutline.includes('Google Cloud によるデジタル トランスフォーメーション'));
assert.strictEqual(parsedPage.examGuideUrl, 'https://services.google.com/fh/files/misc/cloud_digital_leader_exam_guide_japanese.pdf?hl=ja');

// 2. detectGoogleCloudDetailsDiff のテスト
const previousList = [
  {
    no: 40,
    category: 'Leader (Foundational)',
    examDuration: '90 分',
    examFormat: '50～60 問',
    cost: '$99（税別）',
    testingOptions: '遠隔監視オンライン試験、テストセンター',
    introduction: '旧Introduction',
    examContent: '旧Exam content',
    contentOutline: '旧Content outline',
  },
];

// 変更なし
const diffNone = detectGoogleCloudDetailsDiff(previousList, previousList);
assert.strictEqual(diffNone.length, 0);

// 「費用」と「試験内容の概要」が変更
const currentWithDiff = [
  {
    no: 40,
    category: 'Leader (Foundational)',
    examDuration: '90 分',
    examFormat: '50～60 問',
    cost: '$105（税別）', // 変更！
    testingOptions: '遠隔監視オンライン試験、テストセンター',
    introduction: '旧Introduction',
    examContent: '旧Exam content',
    contentOutline: '新Content outline (AI分野の追加)', // 変更！
  },
];

const diffDetected = detectGoogleCloudDetailsDiff(currentWithDiff, previousList);
assert.strictEqual(diffDetected.length, 1);
assert.strictEqual(diffDetected[0]._diffType, 'UPDATED');
assert.deepStrictEqual(diffDetected[0]._changedFields, ['cost', 'contentOutline']);

// 3. hashGoogleCloudDetails のテスト
const hash1 = hashGoogleCloudDetails(previousList[0]);
const hash2 = hashGoogleCloudDetails(currentWithDiff[0]);
assert(typeof hash1 === 'string' && hash1.length === 8);
assert(typeof hash2 === 'string' && hash2.length === 8);
assert.notStrictEqual(hash1, hash2, '変更によりハッシュ値が異なること');

console.log('✓ Google Cloud資格詳細情報パースおよび差分検知テストが成功しました！');
