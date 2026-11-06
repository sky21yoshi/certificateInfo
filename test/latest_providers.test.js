const assert = require('assert');
const { fetchPmiUpdates } = require('../src/fetcher/pmi');
const { fetchIsacaUpdates } = require('../src/fetcher/isaca');
const { fetchPeopleCertUpdates } = require('../src/fetcher/peoplecert');
const { fetchFortinetUpdates } = require('../src/fetcher/fortinet');
const { fetchPaloAltoUpdates } = require('../src/fetcher/palo_alto');
const { fetchNttAtUpdates } = require('../src/fetcher/ntt_at');
const { detectDiff } = require('../src/checker');
const { PROVIDERS } = require('../src/index');

async function main() {
  const pmi = await fetchPmiUpdates('<main>PMP examination update 2026</main>');
  assert.strictEqual(pmi.length, 1);
  assert.strictEqual(pmi[0].relatedQualifications[0].no, 104);

  const isaca = await fetchIsacaUpdates(`
    <!--トピックス-->
    <table><tr><td><p class="topics">2026/10</p></td><td><p class="topics"><a href="/cisa/index.html">CISA exam updates</a></p></td></tr></table>
    <!--//トピックス-->
  `);
  assert.strictEqual(isaca[1].relatedQualifications[0].no, 105);

  const isacaTopics = await fetchIsacaUpdates(`
    <!--トピックス-->
    <table>
      <tr><td><p class="topics">2026/10</p></td><td><p class="topics"><a href="https://www.isaca.gr.jp/cisa/index.html#cisa_course">2026年11月期 CISA試験レビューコースの開催のご案内</a></p></td></tr>
      <tr><td><p class="topics">2026/08</p></td><td><p class="topics"><a href="/cism/index.html">CISM試験レビューコースのご案内</a></p></td></tr>
      <tr><td><p class="topics">2026/06</p></td><td><p class="topics"><a href="/membership/fees.html">年会費のお知らせ</a></p></td></tr>
    </table>
    <!--//トピックス-->
  `);
  assert.strictEqual(isacaTopics[0].url, 'https://www.isaca.gr.jp/index.html');
  assert.strictEqual(isacaTopics[1].title, '2026年11月期 CISA試験レビューコースの開催のご案内');
  assert.strictEqual(isacaTopics[1].url, 'https://www.isaca.gr.jp/cisa/index.html#cisa_course');
  assert.strictEqual(isacaTopics[1].date, '2026-10');
  assert.strictEqual(isacaTopics.length, 2);

  const peoplecert = await fetchPeopleCertUpdates('<main>ITIL Foundation certification updates</main>');
  assert.strictEqual(peoplecert[0].relatedQualifications[0].no, 106);

  const fortinetPages = {
    'https://www.fortinet.com/jp/training-certification': '<main>FCP certification overview 2026</main>',
    'https://www.fortinet.com/nse-training-update': '<main>NSE program update 2026</main>',
  };
  const fortinet = await fetchFortinetUpdates(fortinetPages);
  assert.strictEqual(fortinet.length, 2);
  assert.strictEqual(fortinet[0].relatedQualifications[0].no, 107);
  const revisedFortinet = await fetchFortinetUpdates({
    ...fortinetPages,
    'https://www.fortinet.com/nse-training-update': '<main>NSE program update 2027</main>',
  });
  assert.strictEqual(detectDiff(revisedFortinet, fortinet, 'url', 'contentHash')[0]._diffType, 'UPDATED');

  const paloAlto = await fetchPaloAltoUpdates('<main>Network Security Professional certification</main>');
  assert.strictEqual(paloAlto[0].relatedQualifications[0].no, 108);

  const nttAt = await fetchNttAtUpdates('<main>WinActor Certification of WinActor CWA</main>');
  assert.deepStrictEqual(nttAt[0].relatedQualifications.map(item => item.no), [109, 110]);

  for (const key of ['pmi', 'isaca', 'peoplecert', 'fortinet', 'palo_alto', 'ntt_at']) {
    assert.strictEqual(typeof PROVIDERS[key].fetch, 'function', `${key} must be registered`);
    assert.strictEqual(PROVIDERS[key].idKey, 'url');
    assert.strictEqual(PROVIDERS[key].updateKey, 'contentHash');
  }

  console.log('✓ PMI / ISACA / PeopleCert / Fortinet / Palo Alto Networks / NTT-AT OK');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
