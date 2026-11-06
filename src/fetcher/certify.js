const {
  fetchOfficialPage,
  createPageSnapshot,
} = require('./official_web');

const CERTIFY_C_LANGUAGE_URL = 'https://www.sikaku.gr.jp/js/cp/';
const CERTIFY_QUALIFICATIONS = [
  { no: 96, name: 'C言語プログラミング能力認定試験3級' },
  { no: 97, name: 'C言語プログラミング能力認定試験2級' },
  { no: 98, name: 'C言語プログラミング能力認定試験1級' },
];

async function fetchCertifyUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(CERTIFY_C_LANGUAGE_URL) : customHtml;
  const snapshot = createPageSnapshot(
    'サーティファイ',
    'C言語プログラミング能力認定試験の更新',
    CERTIFY_C_LANGUAGE_URL,
    html,
    CERTIFY_QUALIFICATIONS
  );
  return [snapshot];
}

module.exports = { CERTIFY_QUALIFICATIONS, fetchCertifyUpdates };
