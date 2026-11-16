const assert = require('assert');
const {
  CISCO_QUALIFICATIONS,
  CISCO_META,
  resolveCiscoContentUrl,
  matchCiscoQualifications,
  parseCiscoExamPage,
  hashCiscoDetails,
  fetchCiscoExamDetails,
} = require('../src/fetcher/cisco');
const { parseCredentialDetails } = require('../src/fetcher/qualification_details');
const { detectDiff } = require('../src/checker');

console.log('=== Cisco 資格詳細情報 単体テスト開始 ===');

// 1. resolveCiscoContentUrl
assert.strictEqual(
  resolveCiscoContentUrl('https://learningnetwork.cisco.com/s/ccna-exam-topics', 'CCNA (200-301)'),
  'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ccna-200-301.html'
);
assert.strictEqual(
  resolveCiscoContentUrl('https://learningnetwork.cisco.com/s/encor-exam-topics', 'ENCOR (350-401)'),
  'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/encor-350-401.html'
);
assert.strictEqual(
  resolveCiscoContentUrl('https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/professional/ccnp-enterprise.html', 'CCNP Enterprise'),
  'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/professional/ccnp-enterprise.html'
);
console.log('✓ resolveCiscoContentUrl: OK');

// 2. matchCiscoQualifications
const matched = matchCiscoQualifications('New updates for CCNA (200-301) and ENCOR 350-401 exams');
assert.strictEqual(matched.length, 2);
assert.strictEqual(matched[0].no, 92);
assert.strictEqual(matched[1].no, 93);
console.log('✓ matchCiscoQualifications: OK');

// 3. parseCiscoExamPage (CCNA 200-301)
const mockCcnaHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>200-301 CCNA - Cisco</title>
    <meta name="description" content="200-301 CCNA 試験は、シスコ認定アソシエイト資格に関連する試験です。">
  </head>
  <body>
    <h1>200-301 CCNA</h1>
    <h2>試験の概要</h2>
    <p>200-301 CCNA 試験（Implementing and Administering Cisco Solutions）は、ネットワークの基礎、ネットワークアクセス、IP接続などの幅広いスキルをテストします。</p>
    <p>試験時間：120分</p>
  </body>
</html>
`;

const ccnaDetails = parseCiscoExamPage(mockCcnaHtml, 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ccna-200-301.html', 'CCNA (200-301)');
assert.strictEqual(ccnaDetails.category, 'Associate');
assert.strictEqual(ccnaDetails.examDuration, '120分');
assert.strictEqual(ccnaDetails.cost, '300 USD（約45,000円）');
assert.strictEqual(ccnaDetails.introduction, '200-301 CCNA 試験は、シスコ認定アソシエイト資格に関連する試験です。');
assert(ccnaDetails.examContent.includes('200-301 CCNA 試験'));
assert(ccnaDetails.contentOutline.includes('ネットワークの基礎 (20%)'));
console.log('✓ parseCiscoExamPage (CCNA): OK');

// 4. parseCredentialDetails経由の呼び出し (Cisco)
const ccnaFromGeneric = parseCredentialDetails(mockCcnaHtml, 'Cisco Systems', 'https://learningnetwork.cisco.com/s/ccna-exam-topics');
assert.strictEqual(ccnaFromGeneric.category, 'Associate');
assert.strictEqual(ccnaFromGeneric.examDuration, '120分');
assert.strictEqual(ccnaFromGeneric.cost, '300 USD（約45,000円）');
console.log('✓ parseCredentialDetails (Cisco ルーティング): OK');

// 5. CCNP Enterprise & CCIE Enterprise Infrastructure
const mockCcnpHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>CCNP Enterprise - Cisco</title>
    <meta name="description" content="CCNP Enterprise 認定は、エンタープライズ ネットワーク ソリューションに関するスキルを証明します。">
  </head>
  <body>
    <h1>CCNP Enterprise</h1>
    <h2>認定の概要</h2>
    <p>エンタープライズ ネットワーキング テクノロジーをリードするプロフェッショナルのための認定です。</p>
  </body>
</html>
`;
const ccnpDetails = parseCiscoExamPage(mockCcnpHtml, 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/professional/ccnp-enterprise.html', 'CCNP Enterprise');
assert.strictEqual(ccnpDetails.category, 'Professional');
assert(ccnpDetails.cost.includes('700 USD'));
assert(ccnpDetails.contentOutline.includes('350-401 ENCOR'));
console.log('✓ parseCiscoExamPage (CCNP Enterprise): OK');

// 6. hashCiscoDetails と 差分検知
const hash1 = hashCiscoDetails(ccnaDetails);
const hash2 = hashCiscoDetails(ccnaDetails);
assert.strictEqual(hash1, hash2);

const modifiedCcna = { ...ccnaDetails, cost: '350 USD' };
const hash3 = hashCiscoDetails(modifiedCcna);
assert.notStrictEqual(hash1, hash3);

const oldState = [{
  provider: 'Cisco Systems',
  title: '200-301 CCNA',
  url: 'https://learningnetwork.cisco.com/s/ccna-exam-topics',
  contentHash: hash1,
  detailsOnly: true,
}];
const newState = [{
  provider: 'Cisco Systems',
  title: '200-301 CCNA',
  url: 'https://learningnetwork.cisco.com/s/ccna-exam-topics',
  contentHash: hash3,
  detailsOnly: true,
}];
const diffs = detectDiff(newState, oldState, 'url', 'contentHash');
assert.strictEqual(diffs.length, 1);
assert.strictEqual(diffs[0]._diffType, 'UPDATED');
console.log('✓ hashCiscoDetails & 差分検知: OK');

// 7. fetchCiscoExamDetails (モック利用)
(async () => {
  const fetched = await fetchCiscoExamDetails(
    'https://learningnetwork.cisco.com/s/ccna-exam-topics',
    'CCNA (200-301)',
    { html: mockCcnaHtml }
  );
  assert.strictEqual(fetched.title, '200-301 CCNA');
  assert.strictEqual(fetched.category, 'Associate');
  assert.strictEqual(fetched.cost, '300 USD（約45,000円）');
  console.log('✓ fetchCiscoExamDetails: OK');

  console.log('=== すべての Cisco 単体テストに成功しました ===');
})();
