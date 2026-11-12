const {
  fetchOfficialPage,
  createPageSnapshot,
} = require('./official_web');
const { loadQualificationRows } = require('./qualification_details');

const WINACTOR_CERTIFICATION_URL = 'https://winactor.com/rpa-kentei/';
const WINACTOR_QUALIFICATION_NAMES = [
  'WinActor RPA技術者検定アソシエイト',
  'WinActor RPA技術者検定エキスパート',
];

function getNttAtQualifications(rows = loadQualificationRows()) {
  const qualifications = rows
    .filter(row => /NTT.?AT|アドバンステクノロジ/i.test(row.providerName))
    .filter(row => WINACTOR_QUALIFICATION_NAMES.includes(row.name))
    .map(({ no, name }) => ({ no, name }));
  const foundNames = new Set(qualifications.map(item => item.name));
  const missingNames = WINACTOR_QUALIFICATION_NAMES.filter(name => !foundNames.has(name));
  if (missingNames.length > 0) {
    throw new Error(`資格一覧にWinActor資格がありません: ${missingNames.join(', ')}`);
  }
  return qualifications;
}

const NTT_AT_QUALIFICATIONS = getNttAtQualifications();

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

module.exports = { NTT_AT_QUALIFICATIONS, getNttAtQualifications, fetchNttAtUpdates };
