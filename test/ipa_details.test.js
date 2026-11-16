const assert = require('assert');
const {
  IPA_QUALIFICATIONS,
  parseIpaExamPage,
  hashIpaDetails,
  fetchIpaExamDetails,
} = require('../src/fetcher/ipa');
const { checkQualificationRecordDiff, detectDiff } = require('../src/checker');

console.log('=== IPA 資格詳細情報 単体テスト開始 ===');

// 1. 基本情報技術者試験のパース
const mockFeHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>基本情報技術者試験 | 試験情報 | IPA</title>
    <meta name="description" content="基本情報技術者試験のページです。">
  </head>
  <body>
    <h1>基本情報技術者試験</h1>
    <h2>ITエンジニアの登竜門</h2>
    <dl>
      <dt>略号</dt><dd>FE</dd>
      <dt>実施方式・実施時期</dt><dd>CBT方式により随時実施</dd>
    </dl>
    <p class="article-txt">ITエンジニアとしてキャリアをスタートするには、まず基本情報技術者試験から受験することをお勧めします。</p>
    <h3 class="ttl --lv3">1．対象者像</h3>
    <p>ITを活用したサービス、製品、システム及びソフトウェアを作る人材に必要な基本的知識・技能をもち、実践的な活用能力を身に付けた者</p>
    <h3 class="ttl --lv3">2．業務と役割</h3>
    <p>上位者の指導の下に、システムの設計・開発に参加する。</p>
    <h3 class="ttl --lv3">3．期待する技術水準</h3>
    <p>IT全般に関する基本的な事項を理解し、担当する活動に活用できる。</p>
    <h3 class="ttl --lv3">4．試験時間・出題形式・出題数（解答数）</h3>
    <div>
      <h4>科目A</h4>
      <dl>
        <dt>試験時間</dt><dd>90分</dd>
        <dt>出題形式</dt><dd>多肢選択式（四肢択一）</dd>
        <dt>出題数・解答数</dt><dd>出題数：60問 解答数：60問</dd>
      </dl>
      <h4>科目B</h4>
      <dl>
        <dt>試験時間</dt><dd>100分</dd>
        <dt>出題形式</dt><dd>多肢選択式</dd>
        <dt>出題数・解答数</dt><dd>出題数：20問 解答数：20問</dd>
      </dl>
    </div>
  </body>
</html>
`;

const feDetails = parseIpaExamPage(mockFeHtml, 'https://www.ipa.go.jp/shiken/kubun/fe.html');
assert.strictEqual(feDetails.category, 'レベル2（基本情報技術者）');
assert.strictEqual(feDetails.examDuration, '科目A: 90分、科目B: 100分');
assert.strictEqual(feDetails.examFormat, '科目A: 多肢選択式（四肢択一）（出題数：60問 解答数：60問）、科目B: 多肢選択式（出題数：20問 解答数：20問）');
assert.strictEqual(feDetails.cost, '7,500円（税込）');
assert.strictEqual(feDetails.testingOptions, 'CBT方式により随時実施');
assert(feDetails.introduction.includes('ITエンジニアの登竜門'));
assert(feDetails.introduction.includes('対象者像'));
assert.strictEqual(feDetails.examContent, '上位者の指導の下に、システムの設計・開発に参加する。');
assert.strictEqual(feDetails.contentOutline, 'IT全般に関する基本的な事項を理解し、担当する活動に活用できる。');
console.log('✓ 基本情報技術者試験 パース: OK');

// 2. ITパスポート試験のパース（単一試験時間・出題形式）
const mockIpHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>ITパスポート試験 | 試験情報 | IPA</title>
  </head>
  <body>
    <h1>ITパスポート試験</h1>
    <h2>あなたのIT力を証明する国家試験</h2>
    <dl>
      <dt>略号</dt><dd>IP</dd>
      <dt>実施方式・実施時期</dt><dd>CBT方式により随時実施</dd>
    </dl>
    <h3 class="ttl">1．対象者像</h3>
    <p>ITに関する共通的な基礎知識をもつ者</p>
    <h3 class="ttl">2．業務と役割</h3>
    <p>担当業務に対してITを活用する。</p>
    <h3 class="ttl">3．期待する技術水準</h3>
    <p>情報機器及びシステムの把握や業務の遂行ができる。</p>
    <h3 class="ttl">4．試験時間・出題形式・出題数</h3>
    <dl>
      <dt>試験時間</dt><dd>120分</dd>
      <dt>出題形式</dt><dd>多肢選択式（四肢択一）</dd>
      <dt>出題数</dt><dd>100問（小問形式）</dd>
    </dl>
  </body>
</html>
`;

const ipDetails = parseIpaExamPage(mockIpHtml, 'https://www.ipa.go.jp/shiken/kubun/ip.html');
assert.strictEqual(ipDetails.category, 'レベル1（ITパスポート）');
assert.strictEqual(ipDetails.examDuration, '120分');
assert.strictEqual(ipDetails.examFormat, '多肢選択式（四肢択一）（100問（小問形式））');
assert.strictEqual(ipDetails.cost, '7,500円（税込）');
assert.strictEqual(ipDetails.testingOptions, 'CBT方式により随時実施');
console.log('✓ ITパスポート試験 パース: OK');

// 3. 高度試験（ネットワークスペシャリスト）のパース
const mockNwHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>ネットワークスペシャリスト試験 | 試験情報 | IPA</title>
  </head>
  <body>
    <h1>ネットワークスペシャリスト試験</h1>
    <h2>ネットワーク社会を担う花形エンジニア</h2>
    <dl>
      <dt>実施方式・実施時期</dt><dd>2026年度はCBT方式により前期に実施</dd>
    </dl>
    <h3 class="ttl">1．対象者像</h3>
    <p>ネットワークに関係する固有技術を活用する者</p>
    <h3 class="ttl">2．業務と役割</h3>
    <p>ネットワークシステムを企画・要件定義・設計・構築・運用・保守する業務に従事する。</p>
    <h3 class="ttl">3．期待する技術水準</h3>
    <p>最適な情報システム基盤の企画・要件定義ができる。</p>
    <h3 class="ttl">4．試験時間・出題形式・出題数（解答数）</h3>
    <div>
      <h4>科目A-1</h4>
      <dl>
        <dt>試験時間</dt><dd>50分</dd>
        <dt>出題形式</dt><dd>多肢選択式（四肢択一）</dd>
        <dt>出題数・解答数</dt><dd>出題数：30問 解答数：30問</dd>
      </dl>
      <h4>科目B-2</h4>
      <dl>
        <dt>試験時間</dt><dd>120分</dd>
        <dt>出題形式</dt><dd>記述式</dd>
        <dt>出題数・解答数</dt><dd>出題数：2問 解答数：1問</dd>
      </dl>
    </div>
  </body>
</html>
`;

const nwDetails = parseIpaExamPage(mockNwHtml, 'https://www.ipa.go.jp/shiken/kubun/nw.html');
assert.strictEqual(nwDetails.category, 'レベル4（高度試験）');
assert.strictEqual(nwDetails.examDuration, '科目A-1: 50分、科目B-2: 120分');
assert.strictEqual(nwDetails.examFormat, '科目A-1: 多肢選択式（四肢択一）（出題数：30問 解答数：30問）、科目B-2: 記述式（出題数：2問 解答数：1問）');
console.log('✓ 高度試験 パース: OK');

// 4. ハッシュおよび差分検知
const hash1 = hashIpaDetails(feDetails);
const hash2 = hashIpaDetails({ ...feDetails, cost: '8,000円' });
assert.notStrictEqual(hash1, hash2);

const recordDiff = checkQualificationRecordDiff(
  { ...feDetails, title: '基本情報技術者試験' },
  { title: '基本情報技術者試験', category: '試験要綱・シラバス' },
  '2026-11-16 11:00'
);
assert.strictEqual(recordDiff.isChanged, true);
assert(recordDiff.changedFields.includes('category'));
assert.strictEqual(recordDiff.updatedRecord.date, '2026-11-16 11:00');
assert.strictEqual(recordDiff.updatedRecord.category, 'レベル2（基本情報技術者）');
console.log('✓ 差分検知 & 現在日時更新: OK');

console.log('=== すべての IPA 資格詳細テストが正常にパスしました！ ===');
