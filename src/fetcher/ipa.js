/**
 * IPA（独立行政法人 情報処理推進機構）の試験情報スクレイパー
 */

const BASE_URL = 'https://www.ipa.go.jp';
const NEWS_URL = `${BASE_URL}/shiken/index.html`;

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
 * HTMLから新着情報アイテムを抽出する
 * @param {string} html 
 * @returns {Array<object>}
 */
function parseNewsItems(html) {
  const items = [];
  
  // news-list 内の <a> タグを抽出
  const aRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let aMatch;

  while ((aMatch = aRegex.exec(html)) !== null) {
    const fullTag = aMatch[0];
    const rawHref = aMatch[1];
    const innerHtml = aMatch[2];

    // news-list__inner クラスを持つリンクのみを対象とする
    if (!fullTag.includes('news-list__inner')) {
      continue;
    }

    let url = rawHref.trim();
    if (url && !url.startsWith('http')) {
      url = BASE_URL + (url.startsWith('/') ? '' : '/') + url;
    }

    // 日付抽出 (<li class="news-list__date">...</li>)
    const dateMatch = innerHtml.match(/<li[^>]*class="[^"]*news-list__date[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
    const dateStr = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // タイトル抽出 (<p class="news-list__ttl">...</p>)
    const ttlMatch = innerHtml.match(/<p[^>]*class="[^"]*news-list__ttl[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const title = ttlMatch ? ttlMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : '';

    if (title && url) {
      const matched = matchQualifications(title);
      items.push({
        date: dateStr,
        title: title,
        url: url,
        relatedQualifications: matched,
      });
    }
  }

  return items;
}

/**
 * IPAの試験情報トップページから新着情報を取得する
 * @param {string} [customHtml] テスト用HTML（省略時はWebからfetch）
 * @returns {Promise<Array<object>>}
 */
async function fetchIpaNews(customHtml = null) {
  let html = customHtml;
  if (!html) {
    const res = await fetch(NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 certificateInfo-bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) {
      throw new Error(`IPAサイトへのアクセスに失敗しました: HTTP ${res.status} ${res.statusText}`);
    }
    html = await res.text();
  }

  return parseNewsItems(html);
}

module.exports = {
  IPA_QUALIFICATIONS,
  matchQualifications,
  parseNewsItems,
  fetchIpaNews,
};
