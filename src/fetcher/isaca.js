const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const ISACA_CISA_URL = 'https://www.isaca.gr.jp/cisa/';
const ISACA_QUALIFICATIONS = [
  { no: 105, name: 'CISA (Certified Information Systems Auditor)' },
];

async function fetchIsacaUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(ISACA_CISA_URL) : customHtml;
  const snapshot = createPageSnapshot(
    'ISACA',
    'CISA資格情報の更新',
    ISACA_CISA_URL,
    html,
    ISACA_QUALIFICATIONS
  );
  const updates = extractLinkedItems(
    html,
    ISACA_CISA_URL,
    'ISACA',
    () => ISACA_QUALIFICATIONS.map(({ no, name }) => ({ no, name })),
    /CISA|公認情報システム監査人|試験|資格|更新/i
  );
  return [snapshot, ...updates];
}

module.exports = { ISACA_QUALIFICATIONS, fetchIsacaUpdates };
