const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

/** newsroomの1ページ目URL */
const UIPATH_NEWSROOM_BASE_URL = 'https://www.uipath.com/ja/newsroom/';

/**
 * newsroom取得対象URLリスト（1〜10ページ）
 * 1ページ目は末尾スラッシュあり、2〜10ページ目は数値を付与
 */
const UIPATH_NEWSROOM_URLS = [
  UIPATH_NEWSROOM_BASE_URL,
  ...Array.from({ length: 9 }, (_, i) => `https://www.uipath.com/ja/newsroom/${i + 2}`),
];

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

/**
 * UiPath newsroomページ（複数）から更新情報を取得する
 * @param {Object|string|null} customPages
 *   - null: 実際にURLをフェッチする
 *   - string: 後方互換（1ページ目のHTMLとして扱う）
 *   - Object: URL → HTMLのマップ（テスト用）
 * @returns {Promise<Array>} スナップショットと記事リストの配列
 */
async function fetchUiPathUpdates(customPages = null) {
  const items = [];
  for (const url of UIPATH_NEWSROOM_URLS) {
    let html;
    if (customPages !== null) {
      // 後方互換性: 文字列が渡された場合は1ページ目のHTMLとして扱う
      if (typeof customPages === 'string') {
        if (url !== UIPATH_NEWSROOM_BASE_URL) continue;
        html = customPages;
      } else {
        html = customPages[url];
        if (typeof html !== 'string') continue;
      }
    } else {
      html = await fetchOfficialPage(url);
    }

    // newsroomの各ページをスナップショット + 記事抽出
    const snapshot = createPageSnapshot(
      'UiPath',
      `UiPath newsroom updates (${url})`,
      url,
      html,
      UIPATH_QUALIFICATIONS
    );
    const articles = extractLinkedItems(
      html,
      url,
      'UiPath',
      matchUiPathQualifications,
      /certification|認定|資格|automation developer|agentic automation|エージェンティック|オートメーション/i
    );
    items.push(snapshot, ...articles);

    // 実際のフェッチ時はサーバー負荷を考慮して1.5秒待機
    if (customPages === null && url !== UIPATH_NEWSROOM_URLS[UIPATH_NEWSROOM_URLS.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return items;
}

module.exports = {
  UIPATH_NEWSROOM_BASE_URL,
  UIPATH_NEWSROOM_URLS,
  UIPATH_QUALIFICATIONS,
  matchUiPathQualifications,
  fetchUiPathUpdates,
};
