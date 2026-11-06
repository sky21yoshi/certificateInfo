const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const COMPTIA_BLOG_URL = 'https://www.comptia.org/ja-jp/blog/';
const COMPTIA_QUALIFICATIONS = [
  { no: 71, name: 'IT Fundamentals', aliases: ['IT Fundamentals', 'ITF+'] },
  { no: 72, name: 'A+', aliases: ['CompTIA A+', 'A+'] },
  { no: 73, name: 'Network+', aliases: ['Network+'] },
  { no: 74, name: 'Security+', aliases: ['Security+'] },
  { no: 75, name: 'Cloud+', aliases: ['Cloud+'] },
  { no: 76, name: 'Linux+', aliases: ['Linux+'] },
  { no: 77, name: 'Server+', aliases: ['Server+'] },
  { no: 78, name: 'CASP+', aliases: ['CASP+', 'SecurityX'] },
  { no: 79, name: 'F+', aliases: ['CompTIA F+', 'F+'] },
  { no: 80, name: 'PenTest+', aliases: ['PenTest+'] },
  { no: 81, name: 'Project+', aliases: ['Project+'] },
  { no: 82, name: 'CTT+', aliases: ['CTT+'] },
  { no: 83, name: 'Cloud Essentials', aliases: ['Cloud Essentials'] },
];

function matchCompTIAQualifications(text) {
  return COMPTIA_QUALIFICATIONS
    .filter(qualification => qualification.aliases.some(alias => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^A-Z0-9])${escaped}($|[^A-Z0-9])`, 'i').test(text);
    }))
    .map(({ no, name }) => ({ no, name }));
}

async function fetchCompTIANews(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(COMPTIA_BLOG_URL) : customHtml;
  const snapshot = createPageSnapshot(
    'CompTIA',
    'CompTIA official blog updates',
    COMPTIA_BLOG_URL,
    html,
    COMPTIA_QUALIFICATIONS
  );
  const articles = extractLinkedItems(
    html,
    COMPTIA_BLOG_URL,
    'CompTIA',
    matchCompTIAQualifications,
    /comptia|資格|試験|certification|security\+|network\+|cloud\+|linux\+|project\+/i
  );
  return [snapshot, ...articles];
}

module.exports = {
  COMPTIA_QUALIFICATIONS,
  matchCompTIAQualifications,
  fetchCompTIANews,
};
