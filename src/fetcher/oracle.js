/**
 * Oracle University 日本語ニュースから資格情報を取得する
 */

const ORACLE_NEWS_URL = 'https://www.oracle.com/jp/education/news/';

const ORACLE_QUALIFICATIONS = [
  { no: 60, name: 'Oracle Certified Java Programmer, Bronze SE', aliases: ['Java Programmer, Bronze', 'Java SE Bronze'] },
  { no: 61, name: 'ORACLE MASTER Bronze DBA', aliases: ['ORACLE MASTER Bronze', 'Bronze DBA'] },
  { no: 62, name: 'ORACLE MASTER Silver Oracle Database', aliases: ['ORACLE MASTER Silver', 'Silver Oracle Database'] },
  { no: 63, name: 'Oracle Certified Java Programmer, Silver SE 11', aliases: ['Java Programmer, Silver', 'Java SE 11'] },
  { no: 64, name: 'ORACLE MASTER Gold Oracle Database', aliases: ['ORACLE MASTER Gold', 'Gold Oracle Database'] },
  { no: 65, name: 'Oracle Certified Java Programmer, Gold SE', aliases: ['Java Programmer, Gold', 'Java SE Gold'] },
  { no: 66, name: 'ORACLE MASTER Platinum', aliases: ['ORACLE MASTER Platinum', 'Platinum Oracle Database'] },
];

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (entity, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (entity, code) => String.fromCodePoint(parseInt(code, 16)));
}

function textFromHtml(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function matchOracleQualifications(text) {
  const normalized = text.toLowerCase();
  return ORACLE_QUALIFICATIONS
    .filter(qualification => qualification.aliases.some(alias => normalized.includes(alias.toLowerCase())))
    .map(({ no, name }) => ({ no, name }));
}

function parseOracleAnnouncements(html) {
  const items = [];
  const headingRegex = /<h3\b([^>]*)>([\s\S]*?)<\/h3>/gi;
  let headingMatch;

  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const title = textFromHtml(headingMatch[2]);
    const idMatch = headingMatch[1].match(/\bid=["']([^"']+)["']/i);
    const dateMatch = title.match(/\((\d{4})\/(\d{1,2})\/(\d{1,2})\)\s*$/);
    if (!idMatch || !dateMatch || !/(認定|資格|試験|certification|certified|exam)/i.test(title)) continue;

    const nextHeading = html.slice(headingRegex.lastIndex).search(/<h3\b/i);
    const card = html.slice(headingRegex.lastIndex, nextHeading < 0
      ? html.length
      : headingRegex.lastIndex + nextHeading);
    const details = `${title} ${textFromHtml(card)}`;
    items.push({
      provider: 'Oracle',
      title,
      url: `${ORACLE_NEWS_URL}#${idMatch[1]}`,
      date: `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`,
      relatedQualifications: matchOracleQualifications(details),
    });
  }

  return Array.from(new Map(items.map(item => [item.url, item])).values());
}

async function fetchOracleNews(customHtml = null) {
  let html = customHtml;
  if (html === null) {
    const response = await fetch(ORACLE_NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    });
    if (!response.ok) {
      throw new Error(`Oracle Universityニュースの取得に失敗しました: HTTP ${response.status}`);
    }
    html = await response.text();
  }

  return parseOracleAnnouncements(html);
}

module.exports = {
  ORACLE_NEWS_URL,
  ORACLE_QUALIFICATIONS,
  matchOracleQualifications,
  parseOracleAnnouncements,
  fetchOracleNews,
};
