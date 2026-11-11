const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const PMAJ_QUALIFICATIONS = [
  { no: 101, name: 'プロジェクトマネジメント・コーディネーター (PMC)', aliases: ['PMC', 'コーディネーター'] },
  { no: 102, name: 'プロジェクトマネジメント・スペシャリスト (PMS)', aliases: ['PMS', 'スペシャリスト'] },
  { no: 103, name: 'プログラムマネジャー・レジスタード (PMR)', aliases: ['PMR', 'プログラムマネジャー'] },
];

function getPmajNewsUrls(year = Number(new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
}).format(new Date()))) {
  return [
    `https://www.pmaj.or.jp/news/news_${year}.html`,
    `https://www.pmaj.or.jp/news/news_${year - 1}.html`,
  ];
}

function matchPmajQualifications(text) {
  return PMAJ_QUALIFICATIONS
    .filter(qualification => qualification.aliases.some(alias => {
      if (/^[A-Z]+$/.test(alias)) {
        return new RegExp(`(^|[^A-Z0-9])${alias}($|[^A-Z0-9])`, 'i').test(text);
      }
      return text.includes(alias);
    }))
    .map(({ no, name }) => ({ no, name }));
}

async function fetchPmajUpdates(customPages = null, year) {
  const items = [];
  const urls = getPmajNewsUrls(year);
  for (let index = 0; index < urls.length; index++) {
    const url = urls[index];
    const html = customPages
      ? customPages[url]
      : await fetchOfficialPage(url);
    if (typeof html !== 'string') {
      throw new Error(`PMAJ公式ページのテストデータがありません: ${url}`);
    }

    items.push(createPageSnapshot(
      '日本プロジェクトマネジメント協会 (PMAJ)',
      'PMAJお知らせ一覧の更新',
      url,
      html,
      []
    ));
    items.push(...extractLinkedItems(
      html,
      url,
      '日本プロジェクトマネジメント協会 (PMAJ)',
      matchPmajQualifications,
      /PMC|PMS|PMR|P2M|プロジェクトマネジメント|プロジェクトマネジャー|資格|試験|認定/i
    ));
    if (!customPages && index < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return Array.from(new Map(items.map(item => [item.url, item])).values());
}

module.exports = {
  PMAJ_QUALIFICATIONS,
  getPmajNewsUrls,
  matchPmajQualifications,
  fetchPmajUpdates,
};
