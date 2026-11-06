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

  const isaca = await fetchIsacaUpdates('<main>CISA exam and certification updates</main>');
  assert.strictEqual(isaca[0].relatedQualifications[0].no, 105);

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
