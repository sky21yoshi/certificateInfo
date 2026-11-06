const {
  fetchOfficialPage,
  createPageSnapshot,
} = require('./official_web');

const FORTINET_CERTIFICATION_URL = 'https://www.fortinet.com/jp/training-certification';
const FORTINET_PROGRAM_UPDATE_URL = 'https://www.fortinet.com/nse-training-update';
const FORTINET_QUALIFICATIONS = [
  { no: 107, name: 'Fortinet Certified Professional (FCP)' },
];

async function fetchFortinetUpdates(customPages = null) {
  const sources = [
    { url: FORTINET_CERTIFICATION_URL, title: 'Fortinet認定資格プログラムの更新' },
    { url: FORTINET_PROGRAM_UPDATE_URL, title: 'Fortinet NSE認定プログラム改訂情報' },
  ];
  const items = [];
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index];
    const html = customPages ? customPages[source.url] : await fetchOfficialPage(source.url);
    if (typeof html !== 'string') {
      throw new Error(`Fortinet公式ページのテストデータがありません: ${source.url}`);
    }
    items.push(createPageSnapshot(
      'Fortinet',
      source.title,
      source.url,
      html,
      FORTINET_QUALIFICATIONS
    ));
    if (!customPages && index < sources.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return items;
}

module.exports = { FORTINET_QUALIFICATIONS, fetchFortinetUpdates };
