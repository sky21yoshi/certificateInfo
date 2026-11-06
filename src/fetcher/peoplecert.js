const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const PEOPLECERT_ITIL_URL = 'https://www.peoplecert.org/jp/browse-certifications/it-governance-and-service-management/ITIL-1';
const PEOPLECERT_QUALIFICATIONS = [
  { no: 106, name: 'ITIL Foundation' },
];

async function fetchPeopleCertUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(PEOPLECERT_ITIL_URL) : customHtml;
  const snapshot = createPageSnapshot(
    'PeopleCert',
    'ITIL資格情報の更新',
    PEOPLECERT_ITIL_URL,
    html,
    PEOPLECERT_QUALIFICATIONS
  );
  const updates = extractLinkedItems(
    html,
    PEOPLECERT_ITIL_URL,
    'PeopleCert',
    () => PEOPLECERT_QUALIFICATIONS.map(({ no, name }) => ({ no, name })),
    /ITIL|service management|サービスマネジメント|資格|認定/i
  );
  return [snapshot, ...updates];
}

module.exports = { PEOPLECERT_QUALIFICATIONS, fetchPeopleCertUpdates };
