const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const UIPATH_CERTIFICATION_URL = 'https://www.uipath.com/ja/learning/certification';
const UIPATH_QUALIFICATIONS = [
  { no: 92, name: 'UiPath Automation Developer Associate', aliases: ['Automation Developer Associate', 'オートメーション デベロッパー アソシエイト'] },
  { no: 93, name: 'UiPath Automation Developer Professional', aliases: ['Automation Developer Professional', 'オートメーション デベロッパー プロフェッショナル'] },
  { no: 94, name: 'UiPath Agentic Automation Associate', aliases: ['Agentic Automation Associate', 'エージェンティック オートメーション アソシエイト'] },
  { no: 95, name: 'UiPath Agentic Automation Professional', aliases: ['Agentic Automation Professional', 'エージェンティック オートメーション プロフェッショナル'] },
];

function matchUiPathQualifications(text) {
  const normalized = text.toLowerCase();
  return UIPATH_QUALIFICATIONS
    .filter(qualification => qualification.aliases.some(alias => normalized.includes(alias.toLowerCase())))
    .map(({ no, name }) => ({ no, name }));
}

async function fetchUiPathUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(UIPATH_CERTIFICATION_URL) : customHtml;
  const snapshot = createPageSnapshot(
    'UiPath',
    'UiPath certification program updates',
    UIPATH_CERTIFICATION_URL,
    html,
    UIPATH_QUALIFICATIONS
  );
  const articles = extractLinkedItems(
    html,
    UIPATH_CERTIFICATION_URL,
    'UiPath',
    matchUiPathQualifications,
    /certification|認定|資格|automation developer|agentic automation|エージェンティック|オートメーション/i
  );
  return [snapshot, ...articles];
}

module.exports = {
  UIPATH_QUALIFICATIONS,
  matchUiPathQualifications,
  fetchUiPathUpdates,
};
