/**
 * Oracle Certification 公式ページの告知から資格情報を取得する
 */

const ORACLE_CERTIFICATION_URL = 'https://www.oracle.com/education/certification/';

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
  const announcementIndex = html.search(/>\s*Announcements\s*</i);
  if (announcementIndex < 0) {
    throw new Error('Oracle CertificationページにAnnouncementsセクションが見つかりません');
  }

  const remaining = html.slice(announcementIndex);
  const nextSectionIndex = remaining.search(/<h2\b/i);
  const section = nextSectionIndex > 0 ? remaining.slice(0, nextSectionIndex) : remaining;
  const items = [];
  const headingRegex = /<h[3-5]\b[^>]*>([\s\S]*?)<\/h[3-5]>/gi;
  let headingMatch;

  while ((headingMatch = headingRegex.exec(section)) !== null) {
    const title = textFromHtml(headingMatch[1]);
    const nextHeading = section.slice(headingRegex.lastIndex).search(/<h[3-5]\b/i);
    const card = section.slice(headingRegex.lastIndex, nextHeading < 0
      ? section.length
      : headingRegex.lastIndex + nextHeading);
    const linkMatch = card.match(/<a\b[^>]*href=["']([^"']+)["']/i);
    if (!title || !linkMatch) continue;

    const url = new URL(decodeHtml(linkMatch[1]), ORACLE_CERTIFICATION_URL).toString();
    items.push({
      provider: 'Oracle',
      title,
      url,
      date: '',
      relatedQualifications: matchOracleQualifications(title),
    });
  }

  return Array.from(new Map(items.map(item => [item.url, item])).values());
}

async function fetchOracleNews(customHtml = null) {
  let html = customHtml;
  if (html === null) {
    const response = await fetch(ORACLE_CERTIFICATION_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    });
    if (!response.ok) {
      throw new Error(`Oracle Certificationページの取得に失敗しました: HTTP ${response.status}`);
    }
    html = await response.text();
  }

  return parseOracleAnnouncements(html);
}

module.exports = {
  ORACLE_QUALIFICATIONS,
  matchOracleQualifications,
  parseOracleAnnouncements,
  fetchOracleNews,
};
