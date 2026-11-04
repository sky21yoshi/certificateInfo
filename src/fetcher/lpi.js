/**
 * LPI（Linux Professional Institute）および LPI-Japan のスクレイパー / フィードフェッチャー
 */

const LPI_FEED_URL = 'https://www.lpi.org/feed/';
const LINUC_NEWS_URL = 'https://linuc.org/news/';

const LPI_QUALIFICATIONS = [
  { no: 53, name: 'LPIC-1', aliases: ['LPIC-1', 'Linux Administrator'] },
  { no: 54, name: 'LPIC-2', aliases: ['LPIC-2', 'Linux Engineer'] },
  { no: 55, name: 'LPIC-3', aliases: ['LPIC-3', 'Enterprise Professional'] },
  { no: 56, name: 'LinuC-1', aliases: ['LinuC-1', 'LinuC レベル1'] },
  { no: 57, name: 'LinuC-2', aliases: ['LinuC-2', 'LinuC レベル2'] },
  { no: 58, name: 'LinuC-3', aliases: ['LinuC-3', 'LinuC レベル3'] },
  { no: 59, name: 'HTML5プロフェッショナル認定試験', aliases: ['HTML5プロフェッショナル', 'HTML5'] },
];

/**
 * 資格名のマッチング
 * @param {string} text 
 * @returns {Array<{no: number, name: string}>}
 */
function matchLpiQualifications(text) {
  const matched = [];
  for (const q of LPI_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => text.includes(alias))) {
      matched.push({ no: q.no, name: q.name });
    }
  }
  return matched;
}

/**
 * LPI の公式 RSS からニュースを取得
 * @param {string} [customXml] 
 * @returns {Promise<Array<object>>}
 */
async function fetchLpiNews(customXml = null) {
  let xml = customXml;
  if (!xml) {
    const res = await fetch(LPI_FEED_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0' }
    });
    if (!res.ok) {
      throw new Error(`LPIフィードの取得に失敗しました: HTTP ${res.status}`);
    }
    xml = await res.text();
  }

  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    const date = dateMatch ? dateMatch[1].trim() : '';

    if (title && link) {
      const matched = matchLpiQualifications(title);
      items.push({
        provider: 'LPI (Linux Professional Institute)',
        title,
        url: link,
        date,
        relatedQualifications: matched,
      });
    }
  }

  return items;
}

/**
 * LPI-Japan (LinuC) の新着ニュースをスクレイピング
 * @param {string} [customHtml] 
 * @returns {Promise<Array<object>>}
 */
async function fetchLinucNews(customHtml = null) {
  let html = customHtml;
  if (!html) {
    const res = await fetch(LINUC_NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 certificateInfo-bot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) {
      throw new Error(`LinuCニュースの取得に失敗しました: HTTP ${res.status}`);
    }
    html = await res.text();
  }

  const items = [];
  const itemRegex = /<li class="app-news-item">([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = itemRegex.exec(html)) !== null) {
    const block = match[1];
    const dateMatch = block.match(/<span class="app-news-date">([\s\S]*?)<\/span>/i);
    const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);

    const date = dateMatch ? dateMatch[1].trim() : '';
    let url = linkMatch ? linkMatch[1].trim() : '';
    const title = linkMatch ? linkMatch[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : '';

    if (url && !url.startsWith('http')) {
      url = 'https://linuc.org' + (url.startsWith('/') ? '' : '/') + url;
    }

    if (title && url) {
      const matched = matchLpiQualifications(title);
      items.push({
        provider: 'LPI-Japan',
        title,
        url,
        date,
        relatedQualifications: matched,
      });
    }
  }

  return items;
}

module.exports = {
  LPI_QUALIFICATIONS,
  matchLpiQualifications,
  fetchLpiNews,
  fetchLinucNews,
};
