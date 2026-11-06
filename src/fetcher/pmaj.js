const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const PMAJ_QUALIFICATIONS = [
  { no: 101, name: 'プロジェクトマネジメント・コーディネーター (PMC)', url: 'https://www.pmaj.or.jp/p2m/exam/pmc/top.html', aliases: ['PMC', 'コーディネーター'] },
  { no: 102, name: 'プロジェクトマネジメント・スペシャリスト (PMS)', url: 'https://www.pmaj.or.jp/p2m/exam/pms/top.html', aliases: ['PMS', 'スペシャリスト'] },
  { no: 103, name: 'プログラムマネジャー・レジスタード (PMR)', url: 'https://www.pmaj.or.jp/p2m/exam/pmr/top.html', aliases: ['PMR', 'プログラムマネジャー'] },
];

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

async function fetchPmajUpdates(customPages = null) {
  const items = [];
  for (const qualification of PMAJ_QUALIFICATIONS) {
    const html = customPages
      ? customPages[qualification.url]
      : await fetchOfficialPage(qualification.url);
    if (typeof html !== 'string') {
      throw new Error(`PMAJ公式ページのテストデータがありません: ${qualification.url}`);
    }

    items.push(createPageSnapshot(
      '日本プロジェクトマネジメント協会 (PMAJ)',
      `${qualification.name}の更新`,
      qualification.url,
      html,
      [{ no: qualification.no, name: qualification.name }]
    ));
    items.push(...extractLinkedItems(
      html,
      qualification.url,
      '日本プロジェクトマネジメント協会 (PMAJ)',
      matchPmajQualifications,
      /PMC|PMS|PMR|プロジェクトマネジメント|プロジェクトマネジャー/i
    ));
    if (!customPages && qualification.no !== PMAJ_QUALIFICATIONS[PMAJ_QUALIFICATIONS.length - 1].no) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return Array.from(new Map(items.map(item => [item.url, item])).values());
}

module.exports = {
  PMAJ_QUALIFICATIONS,
  matchPmajQualifications,
  fetchPmajUpdates,
};
