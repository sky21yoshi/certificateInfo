const {
  fetchOfficialPage,
  createPageSnapshot,
  textFromHtml,
  resolveUrl,
  hashContent,
} = require('./official_web');

const ISACA_TOPICS_URL = 'https://www.isaca.gr.jp/index.html';
const ISACA_QUALIFICATIONS = [
  { no: 105, name: 'CISA (Certified Information Systems Auditor)' },
];

async function fetchIsacaUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(ISACA_TOPICS_URL) : customHtml;
  const topics = extractIsacaTopics(html);
  const snapshot = createPageSnapshot(
    'ISACA',
    'ISACAトピックスの更新',
    ISACA_TOPICS_URL,
    topics,
    ISACA_QUALIFICATIONS
  );
  return [snapshot, ...parseIsacaTopicItems(topics)];
}

function extractIsacaTopics(html) {
  const match = html.match(/<!--\s*トピックス\s*-->[\s\S]*?<!--\s*\/\/トピックス\s*-->/i);
  if (!match) {
    throw new Error('ISACAトップページにトピックス欄が見つかりません');
  }
  return match[0];
}

function parseIsacaTopicItems(topics) {
  const items = [];
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(topics)) !== null) {
    const row = rowMatch[1];
    const dateMatch = row.match(/<p\b[^>]*class=["']topics["'][^>]*>\s*(\d{4})\/(\d{1,2})/i);
    const anchorMatch = row.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    if (!dateMatch || !anchorMatch) continue;

    const title = textFromHtml(anchorMatch[2]);
    if (!/CISA|公認情報システム監査人|ISACA認定資格試験/i.test(title)) continue;
    const hrefMatch = anchorMatch[1].match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    items.push({
      provider: 'ISACA',
      title,
      url: resolveUrl(hrefMatch[1], ISACA_TOPICS_URL),
      date: `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`,
      contentHash: hashContent(row),
      relatedQualifications: ISACA_QUALIFICATIONS.map(({ no, name }) => ({ no, name })),
    });
  }
  return Array.from(new Map(items.map(item => [item.url, item])).values());
}

module.exports = {
  ISACA_QUALIFICATIONS,
  extractIsacaTopics,
  parseIsacaTopicItems,
  fetchIsacaUpdates,
};
