/**
 * Google Cloud 公式 Training and Certifications 記事一覧から情報を取得する
 */

const GOOGLE_CLOUD_NEWS_URL = 'https://cloud.google.com/blog/products/training-certifications';

const GOOGLE_CLOUD_QUALIFICATIONS = [
  { no: 40, name: 'GCP Leader系', aliases: ['Cloud Digital Leader', 'Digital Leader'] },
  { no: 41, name: 'GCP認定 Associate系', aliases: ['Associate Cloud Engineer', 'Associate certification'] },
  { no: 42, name: 'GCP認定 Professional系', aliases: ['Professional Cloud', 'Professional certification'] },
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

function matchGoogleCloudQualifications(text) {
  const normalized = text.toLowerCase();
  const matched = GOOGLE_CLOUD_QUALIFICATIONS.filter(qualification =>
    qualification.aliases.some(alias => normalized.includes(alias.toLowerCase()))
  );
  if (/\b(google cloud )?certification(s)?\b|\bexam\b|\bcredential(s)?\b/i.test(text) && matched.length === 0) {
    return GOOGLE_CLOUD_QUALIFICATIONS.map(({ no, name }) => ({ no, name }));
  }
  return matched.map(({ no, name }) => ({ no, name }));
}

function parseGoogleCloudNews(html) {
  const items = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']*\/blog\/topics\/training-certifications\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const block = match[2];
    const headingMatch = block.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = headingMatch ? textFromHtml(headingMatch[1]) : textFromHtml(block);
    const url = new URL(decodeHtml(match[1]), GOOGLE_CLOUD_NEWS_URL).toString();
    const dateMatch = block.match(/<time\b[^>]*datetime=["']([^"']+)["']/i);
    const date = dateMatch ? decodeHtml(dateMatch[1]).trim() : '';

    if (title && /\b(certifications?|certified|exams?|credentials?|renewal)\b/i.test(title)) {
      items.push({
        provider: 'Google Cloud',
        title,
        url,
        date,
        relatedQualifications: matchGoogleCloudQualifications(title),
      });
    }
  }

  return Array.from(new Map(items.map(item => [item.url, item])).values());
}

async function fetchGoogleCloudNews(customHtml = null) {
  let html = customHtml;
  if (html === null) {
    const response = await fetch(GOOGLE_CLOUD_NEWS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 certificateInfo-bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) {
      throw new Error(`Google Cloud資格情報ページの取得に失敗しました: HTTP ${response.status}`);
    }
    html = await response.text();
  }

  return parseGoogleCloudNews(html);
}

module.exports = {
  GOOGLE_CLOUD_QUALIFICATIONS,
  matchGoogleCloudQualifications,
  parseGoogleCloudNews,
  fetchGoogleCloudNews,
};
