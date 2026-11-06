/**
 * 公式Webページ取得元で共通利用するHTML処理
 */

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (entity, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (entity, code) => String.fromCodePoint(parseInt(code, 16)));
}

function textFromHtml(value) {
  return decodeHtml(value
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function hashContent(value) {
  const text = textFromHtml(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function resolveUrl(url, baseUrl) {
  return new URL(decodeHtml(url), baseUrl).toString();
}

async function fetchOfficialPage(url, accept = 'text/html,application/xhtml+xml') {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
      'Accept': accept,
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    },
  });
  if (!response.ok) {
    throw new Error(`公式ページの取得に失敗しました (${url}): HTTP ${response.status}`);
  }
  return response.text();
}

function createPageSnapshot(provider, title, url, html, relatedQualifications) {
  return {
    provider,
    title,
    url,
    date: '',
    contentHash: hashContent(html),
    relatedQualifications,
  };
}

function extractLinkedItems(html, baseUrl, provider, matchQualifications, relevantTitle) {
  const items = [];
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const hrefMatch = match[1].match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const title = textFromHtml(match[2]) || textFromHtml((match[1].match(/\btitle\s*=\s*["']([^"']+)["']/i) || [])[1] || '');
    if (!title || !relevantTitle.test(title)) continue;

    const url = resolveUrl(hrefMatch[1], baseUrl);
    const relatedQualifications = matchQualifications(title);
    items.push({
      provider,
      title,
      url,
      date: '',
      contentHash: hashContent(match[2]),
      relatedQualifications,
    });
  }

  return Array.from(new Map(items.map(item => [item.url, item])).values());
}

module.exports = {
  decodeHtml,
  textFromHtml,
  hashContent,
  resolveUrl,
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
};
