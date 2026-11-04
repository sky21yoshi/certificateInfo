const assert = require('assert');
const { parseAwsRss, matchAwsQualifications } = require('../src/fetcher/aws');
const { fetchMicrosoftCertifications } = require('../src/fetcher/microsoft');
const { matchLpiQualifications } = require('../src/fetcher/lpi');
const { detectDiff } = require('../src/checker');

console.log('=== 全プロバイダー 単体テスト開始 ===');

// 1. AWS テスト
{
  const mockRss = `
    <rss version="2.0">
      <channel>
        <item>
          <title>Updated AWS Certified Solutions Architect - Professional exam</title>
          <link>https://aws.amazon.com/blogs/sample-sap/</link>
          <pubDate>Wed, 04 Nov 2026 10:00:00 +0000</pubDate>
          <description>Registration is now open for AWS Certified Solutions Architect - Professional (SAP-C03).</description>
        </item>
      </channel>
    </rss>
  `;
  const items = parseAwsRss(mockRss);
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].title, 'Updated AWS Certified Solutions Architect - Professional exam');
  assert(items[0].relatedQualifications.some(q => q.name.includes('Professional')));
  console.log('✓ AWS: RSS パース & 資格マッチング OK');
}

// 2. Microsoft テスト
{
  const mockCatalog = {
    certifications: [
      {
        uid: "certification.azure-fundamentals",
        title: "Microsoft Certified: Azure Fundamentals",
        url: "https://learn.microsoft.com/certifications/azure-fundamentals",
        last_modified: "2026-10-01T00:00:00Z",
        type: "cert"
      },
      {
        uid: "certification.other-irrelevant",
        title: "Irrelevant Non Target Cert",
        url: "https://learn.microsoft.com/certifications/other",
        last_modified: "2026-10-01T00:00:00Z",
        type: "cert"
      }
    ]
  };

  fetchMicrosoftCertifications(mockCatalog).then(results => {
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].uid, 'certification.azure-fundamentals');
    assert(results[0].relatedQualifications.some(q => q.name.includes('fundamentals')));
    console.log('✓ Microsoft: Catalog API フィルタリング & 資格マッチング OK');
  });
}

// 3. LPI テスト
{
  const r1 = matchLpiQualifications('LinuC レベル1 Version 10.0 試験開始のお知らせ');
  assert(r1.some(q => q.name === 'LinuC-1'));

  const r2 = matchLpiQualifications('LPIC-2 認定の改訂について');
  assert(r2.some(q => q.name === 'LPIC-2'));

  console.log('✓ LPI & LinuC: 資格マッチング OK');
}

// 4. detectDiff (NEW & UPDATED) テスト
{
  const prev = [
    { uid: 'cert1', lastModified: '2026-01-01' },
    { uid: 'cert2', lastModified: '2026-01-01' }
  ];
  const curr = [
    { uid: 'cert1', lastModified: '2026-01-01' }, // 変更なし
    { uid: 'cert2', lastModified: '2026-02-01' }, // 更新
    { uid: 'cert3', lastModified: '2026-03-01' }  // 新規
  ];

  const diffs = detectDiff(curr, prev, 'uid', 'lastModified');
  assert.strictEqual(diffs.length, 2);
  const updated = diffs.find(d => d.uid === 'cert2');
  const created = diffs.find(d => d.uid === 'cert3');
  assert.strictEqual(updated._diffType, 'UPDATED');
  assert.strictEqual(created._diffType, 'NEW');
  console.log('✓ detectDiff: 新規(NEW) & 更新(UPDATED) 判定 OK');
}

console.log('=== 全プロバイダーのテスト完了 ===');
