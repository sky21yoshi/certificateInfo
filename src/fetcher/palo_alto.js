const {
  fetchOfficialPage,
  createPageSnapshot,
} = require('./official_web');

const PALO_ALTO_CERTIFICATION_URL = 'https://www.paloaltonetworks.com/services/education/certification';
const PALO_ALTO_QUALIFICATIONS = [
  { no: 108, name: 'Palo Alto Networks Network Security Professional' },
];

async function fetchPaloAltoUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(PALO_ALTO_CERTIFICATION_URL) : customHtml;
  return [createPageSnapshot(
    'Palo Alto Networks',
    'Network Security Professional認定プログラムの更新',
    PALO_ALTO_CERTIFICATION_URL,
    html,
    PALO_ALTO_QUALIFICATIONS
  )];
}

module.exports = { PALO_ALTO_QUALIFICATIONS, fetchPaloAltoUpdates };
