const {
  fetchOfficialPage,
  createPageSnapshot,
} = require('./official_web');

const PMI_PMP_URL = 'https://www.pmi-japan.org/pmp_license/';
const PMI_QUALIFICATIONS = [
  { no: 104, name: 'Project Management Professional (PMP)' },
];

async function fetchPmiUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(PMI_PMP_URL) : customHtml;
  return [createPageSnapshot(
    'Project Management Institute (PMI)',
    'PMP試験・資格情報の更新',
    PMI_PMP_URL,
    html,
    PMI_QUALIFICATIONS
  )];
}

module.exports = { PMI_QUALIFICATIONS, fetchPmiUpdates };
