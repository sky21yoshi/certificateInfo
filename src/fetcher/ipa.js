/**
 * IPA（独立行政法人 情報処理推進機構）の試験情報スクレイパー
 * 
 * 対象URL:
 * - 本年度: https://www.ipa.go.jp/news/{本年度}/index.html?=exam
 * - 前年度: https://www.ipa.go.jp/news/{前年度}/index.html?=exam
 * - 前々年度: https://www.ipa.go.jp/news/{前々年度}/index.html?=exam
 */

const BASE_URL = 'https://www.ipa.go.jp';

// 監視対象のIPA資格一覧（キーワード判定用）
const IPA_QUALIFICATIONS = [
  { no: 1, name: '基本情報技術者試験', aliases: ['基本情報', 'FE'] },
  { no: 2, name: '応用情報技術者試験(旧:ソフトウェア開発技術者試験)', aliases: ['応用情報', 'AP'] },
  { no: 3, name: 'ネットワークスペシャリスト試験', aliases: ['ネットワークスペシャリスト', 'NW'] },
  { no: 4, name: 'データベーススペシャリスト試験', aliases: ['データベーススペシャリスト', 'DB'] },
  { no: 5, name: 'エンベデッドシステムスペシャリスト試験', aliases: ['エンベデッドシステムスペシャリスト', 'エンべデッド', 'ES'] },
  { no: 6, name: 'ITサービスマネージャ試験', aliases: ['ITサービスマネージャ', 'SM'] },
  { no: 7, name: '情報処理安全確保支援士試験', aliases: ['情報処理安全確保支援士', '登録情報セキュリティスペシャリスト', '登録セキスペ', '支援士', 'RISS'] },
  { no: 8, name: 'システムアーキテクト試験', aliases: ['システムアーキテクト', 'SA'] },
  { no: 9, name: 'ITストラテジスト試験', aliases: ['ITストラテジスト', 'ST'] },
  { no: 10, name: 'プロジェクトマネージャ試験', aliases: ['プロジェクトマネージャ', 'PM'] },
  { no: 11, name: 'システム監査技術者試験', aliases: ['システム監査技術者', 'AU'] },
  { no: 12, name: 'ITパスポート試験', aliases: ['ITパスポート', 'iパス', 'IP'] },
  { no: 13, name: '情報セキュリティマネジメント試験', aliases: ['情報セキュリティマネジメント', 'セキュマネ', 'SG'] },
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 日本の年度（4月始まり）を取得
 * @param {Date} [date] 
 * @returns {number}
 */
function getFiscalYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  return month >= 4 ? year : year - 1;
}

/**
 * 本年度、前年度、前々年度のスクレイピング対象URLリストを生成
 * @param {Date} [date] 
 * @returns {Array<{year: number, label: string, url: string}>}
 */
function getIpaNewsTargetUrls(date = new Date()) {
  const currentFY = getFiscalYear(date);
  return [
    { year: currentFY, label: '本年度', url: `${BASE_URL}/news/${currentFY}/index.html?=exam` },
    { year: currentFY - 1, label: '前年度', url: `${BASE_URL}/news/${currentFY - 1}/index.html?=exam` },
    { year: currentFY - 2, label: '前々年度', url: `${BASE_URL}/news/${currentFY - 2}/index.html?=exam` },
  ];
}

/**
 * お知らせのタイトルから関連する資格名を判定する
 * @param {string} text 
 * @returns {Array<{no: number, name: string}>}
 */
function matchQualifications(text) {
  const matched = [];
  for (const q of IPA_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => text.includes(alias))) {
      matched.push({ no: q.no, name: q.name });
    }
  }

  // 「高度試験」などの包括的なキーワードの場合
  if (text.includes('高度試験') && matched.length === 0) {
    matched.push({ no: 0, name: '高度試験（複数区分対象）' });
  }

  return matched;
}

/**
 * 年度別ニュースHTMLから試験関連の新着情報アイテムを抽出する
 * @param {string} html 
 * @param {number} [fiscalYear] 対象年度
 * @returns {Array<object>}
 */
function parseNewsItems(html, fiscalYear = null) {
  const items = [];
  
  // <li ... class="news-list__item" ...> の開始位置でブロック分割
  const parts = html.split(/<li\s+[^>]*class="[^"]*news-list__item[^"]*"/i);

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];

    // data-search 属性の確認
    const searchMatch = block.match(/^([^>]*)data-search="([^"]*)"/i);
    const dataSearch = searchMatch ? searchMatch[2] : '';

    // 試験関連（data-search="exam"）またはタイトル/リンクに試験を含むものを抽出
    const isExamCategory = dataSearch.includes('exam');

    // リンク
    const aMatch = block.match(/<a\s+[^>]*href="([^"]+)"/i);
    let url = aMatch ? aMatch[1].trim() : '';
    if (url && !url.startsWith('http')) {
      url = BASE_URL + (url.startsWith('/') ? '' : '/') + url;
    }

    // 日付 (<li class="news-list__date">...</li>)
    const dMatch = block.match(/<li[^>]*class="[^"]*news-list__date[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
    const date = dMatch ? dMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // タイトル (<p class="news-list__ttl">...</p>)
    const tMatch = block.match(/<p[^>]*class="[^"]*news-list__ttl[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const title = tMatch ? tMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : '';

    if (title && url) {
      const matched = matchQualifications(title);
      // data-search="exam" または 資格名マッチングがあるものを対象とする
      if (isExamCategory || matched.length > 0 || title.includes('試験')) {
        items.push({
          fiscalYear: fiscalYear,
          date: date,
          title: title,
          url: url,
          relatedQualifications: matched,
        });
      }
    }
  }

  return items;
}

/**
 * IPAの3年度分（本年度、前年度、前々年度）のニュースページから新着情報を取得する
 * @param {object} [mockDataMap] テスト用 { [url]: html }
 * @returns {Promise<Array<object>>}
 */
async function fetchIpaNews(mockDataMap = null) {
  const targetUrls = getIpaNewsTargetUrls();
  const allItems = [];
  const seenUrls = new Set();

  for (let i = 0; i < targetUrls.length; i++) {
    const target = targetUrls[i];
    let html = null;

    if (mockDataMap && mockDataMap[target.url]) {
      html = mockDataMap[target.url];
    } else if (!mockDataMap) {
      try {
        const res = await fetch(target.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 certificateInfo-bot/1.0',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
          }
        });
        if (res.ok) {
          html = await res.text();
        } else {
          console.warn(`[IPA] ${target.label}(${target.year}年度)の取得をスキップしました (HTTP ${res.status})`);
        }
      } catch (err) {
        console.warn(`[IPA] ${target.label}(${target.year}年度)の取得中にエラー: ${err.message}`);
      }
    }

    if (html) {
      const items = parseNewsItems(html, target.year);
      for (const item of items) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allItems.push(item);
        }
      }
    }

    // 複数URL取得時のインターバル（負荷軽減）
    if (!mockDataMap && i < targetUrls.length - 1) {
      await sleep(1000);
    }
  }

  return allItems;
}

module.exports = {
  IPA_QUALIFICATIONS,
  getFiscalYear,
  getIpaNewsTargetUrls,
  matchQualifications,
  parseNewsItems,
  fetchIpaNews,
};
