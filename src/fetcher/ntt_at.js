const {
  fetchOfficialPage,
  createPageSnapshot,
} = require('./official_web');

const WINACTOR_CERTIFICATION_URL = 'https://winactor.biz/use/winactor_certification.html';
const NTT_AT_QUALIFICATIONS = [
  { no: 109, name: 'WinActor RPA技術者検定アソシエイト' },
  { no: 110, name: 'WinActor RPA技術者検定エキスパート' },
];

async function fetchNttAtUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(WINACTOR_CERTIFICATION_URL) : customHtml;
  return [createPageSnapshot(
    'NTTアドバンステクノロジ (NTT-AT)',
    'WinActor認定情報の更新',
    WINACTOR_CERTIFICATION_URL,
    html,
    NTT_AT_QUALIFICATIONS
  )];
}

module.exports = { NTT_AT_QUALIFICATIONS, fetchNttAtUpdates };
