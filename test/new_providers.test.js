const assert = require('assert');
const {
  fetchBroadcomUpdates,
} = require('../src/fetcher/broadcom');
const {
  fetchCompTIANews,
  matchCompTIAQualifications,
} = require('../src/fetcher/comptia');
const {
  fetchCNCFNews,
  matchCNCFQualifications,
} = require('../src/fetcher/cncf');
const {
  fetchAnthropicUpdates,
  matchAnthropicQualifications,
} = require('../src/fetcher/anthropic');
const {
  fetchUiPathUpdates,
} = require('../src/fetcher/uipath');
const {
  fetchCertifyUpdates,
} = require('../src/fetcher/certify');
const {
  PYTHON_NEWS_FEED_URL,
  PYTHON_EXAMS,
  fetchPythonAssociationUpdates,
} = require('../src/fetcher/python_association');
const {
  fetchPmajUpdates,
  matchPmajQualifications,
} = require('../src/fetcher/pmaj');
const { detectDiff } = require('../src/checker');
const { PROVIDERS } = require('../src/index');

async function main() {
  const broadcom = await fetchBroadcomUpdates('<main>VMware VCP certification version 2026</main>');
  assert.strictEqual(broadcom.length, 1);
  assert.strictEqual(broadcom[0].relatedQualifications.length, 4);
  const changedBroadcom = await fetchBroadcomUpdates('<main>VMware VCP certification version 2027</main>');
  assert.strictEqual(detectDiff(changedBroadcom, broadcom, 'url', 'contentHash')[0]._diffType, 'UPDATED');

  const comptia = await fetchCompTIANews(`
    <h1>CompTIA blog</h1>
    <a href="/ja-jp/blog/security-plus-update/"><h2>Security+ exam update</h2></a>
  `);
  assert.strictEqual(comptia.length, 2);
  assert.strictEqual(comptia[1].relatedQualifications[0].name, 'Security+');
  assert.strictEqual(matchCompTIAQualifications('Network+ certification')[0].name, 'Network+');

  const cncf = await fetchCNCFNews({
    'https://www.cncf.io/blog/': '<a href="/blog/cka-news/"><h2>CKA certification news</h2></a>',
    'https://training.linuxfoundation.org/blog/': '<a href="/blog/ckad-news/"><h2>CKAD exam updates</h2></a>',
  });
  assert.strictEqual(cncf.length, 4);
  assert.strictEqual(matchCNCFQualifications('CKS exam')[0].name, 'Certified Kubernetes Security Specialist (CKS)');

  const anthropic = await fetchAnthropicUpdates(`
    <h1>Claude Academy</h1>
    <a href="/courses/ccar-f"><h2>Claude Certified Architect – Foundations (CCAR-F)</h2></a>
  `);
  assert.strictEqual(anthropic.length, 2);
  assert.strictEqual(matchAnthropicQualifications('CCAO-F')[0].no, 88);

  const uipath = await fetchUiPathUpdates(`
    <h1>認定資格</h1>
    <a href="/ja/learning/certification/agentic"><h2>エージェンティック オートメーション アソシエイト</h2></a>
  `);
  assert.strictEqual(uipath.length, 2);
  assert.strictEqual(uipath[1].relatedQualifications[0].no, 94);

  const certify = await fetchCertifyUpdates(`
    <h1>C言語プログラミング能力認定試験</h1>
    <a href="/js/cpjv/cp/introduction/">試験概要を見る</a>
  `);
  assert.strictEqual(certify.length, 1);
  assert.strictEqual(certify[0].relatedQualifications.length, 3);

  const pythonPages = Object.fromEntries(PYTHON_EXAMS.map(exam => [exam.url, `<main>${exam.name} 2026</main>`]));
  pythonPages[PYTHON_NEWS_FEED_URL] = `
    <rss><channel><item>
      <title>Python 3エンジニア認定基礎試験の出題範囲を更新</title>
      <link>https://www.pythonic-exam.com/archives/news/basic-update</link>
      <pubDate>Thu, 05 Nov 2026 10:00:00 +0000</pubDate>
      <description>基礎試験の案内</description>
    </item></channel></rss>
  `;
  const python = await fetchPythonAssociationUpdates(pythonPages);
  assert.strictEqual(python.length, 3);
  assert.strictEqual(python[0].relatedQualifications[0].no, 99);
  assert.strictEqual(python[2].relatedQualifications[0].no, 99);

  const pmajPages = {
    'https://www.pmaj.or.jp/p2m/exam/pmc/top.html': '<main>PMC資格試験</main>',
    'https://www.pmaj.or.jp/p2m/exam/pms/top.html': '<main>PMS資格試験</main>',
    'https://www.pmaj.or.jp/p2m/exam/pmr/top.html': '<a href="/p2m/exam/pmr/annai.html">2026年度PMR資格試験の申込案内</a>',
  };
  const pmaj = await fetchPmajUpdates(pmajPages);
  assert.strictEqual(pmaj.length, 4);
  assert.strictEqual(matchPmajQualifications('PMC資格試験')[0].no, 101);

  for (const key of [
    'broadcom',
    'comptia',
    'cncf',
    'anthropic',
    'uipath',
    'certify',
    'python_association',
    'pmaj',
  ]) {
    assert.strictEqual(typeof PROVIDERS[key].fetch, 'function', `${key} provider must be registered`);
    assert.strictEqual(PROVIDERS[key].updateKey, 'contentHash');
  }

  console.log('✓ Broadcom / CompTIA / CNCF / Anthropic / UiPath / サーティファイ / Python協会 / PMAJ OK');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
