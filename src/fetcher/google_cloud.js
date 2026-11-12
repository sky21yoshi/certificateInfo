const { getDailyBatchIndex, loadQualificationRows } = require('./qualification_details');

/**
 * Google Cloud 公式 Training and Certifications 記事一覧および資格詳細情報を取得する
 */

const GOOGLE_CLOUD_NEWS_URL = 'https://cloud.google.com/blog/products/training-certifications';

const LEGACY_GOOGLE_CLOUD_QUALIFICATIONS = [
  {
    no: 40,
    name: 'GCP Leader系',
    officialUrl: 'https://cloud.google.com/learn/certification/cloud-digital-leader?hl=ja',
    aliases: ['Cloud Digital Leader', 'Digital Leader'],
  },
  {
    no: 41,
    name: 'GCP認定 Associate系',
    officialUrl: 'https://cloud.google.com/learn/certification/cloud-engineer?hl=ja',
    aliases: ['Associate Cloud Engineer', 'Associate certification'],
  },
  {
    no: 42,
    name: 'GCP認定 Professional系',
    officialUrl: 'https://cloud.google.com/learn/certification/directory?hl=ja',
    aliases: ['Professional Cloud', 'Professional certification'],
  },
];

function getGoogleCloudAliases(name, officialUrl) {
  const aliases = [name];
  const normalizedName = name.replace(/^GCP(?:認定)?\s*/i, '').replace(/系$/, '').trim();
  if (normalizedName && normalizedName !== name) aliases.push(normalizedName);
  const slug = String(officialUrl || '').match(/\/certification\/([^/?#]+)/i);
  if (slug) aliases.push(slug[1].replace(/-/g, ' '));
  return Array.from(new Set(aliases.filter(Boolean)));
}

function getGoogleCloudQualifications(rows = loadQualificationRows()) {
  rows = rows.filter(row => /Google Cloud|グーグル/i.test(row.providerName));
  if (rows.length === 0) return LEGACY_GOOGLE_CLOUD_QUALIFICATIONS;
  return rows.map(row => {
    return {
      no: row.no,
      name: row.name,
      officialUrl: row.url,
      aliases: getGoogleCloudAliases(row.name, row.url),
    };
  });
}

const GOOGLE_CLOUD_QUALIFICATIONS = getGoogleCloudQualifications();

function decodeHtml(value) {
  if (!value) return '';
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
  if (!value) return '';
  return decodeHtml(value
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function matchGoogleCloudQualifications(text, qualifications = GOOGLE_CLOUD_QUALIFICATIONS) {
  const normalized = text.toLowerCase();
  const matched = qualifications.filter(qualification =>
    qualification.aliases.some(alias => normalized.includes(alias.toLowerCase()))
  );
  if (/\b(google cloud )?certification(s)?\b|\bexam\b|\bcredential(s)?\b/i.test(text) && matched.length === 0) {
    return qualifications.map(({ no, name }) => ({ no, name }));
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

/**
 * Google Cloud 認定試験ページから詳細情報を抽出する
 * @param {string} html 
 * @param {string} [baseUrl='https://cloud.google.com']
 * @returns {{category: string, examDuration: string, examFormat: string, cost: string, testingOptions: string, introduction: string, examContent: string, contentOutline: string, examGuideUrl: string}}
 */
function parseGoogleCloudExamPage(html, baseUrl = 'https://cloud.google.com') {
  const result = {
    category: '',
    examDuration: '',
    examFormat: '',
    cost: '',
    testingOptions: '',
    introduction: '',
    examContent: '',
    contentOutline: '',
    examGuideUrl: '',
  };

  if (!html) return result;

  // 1. カテゴリ (URL、タイトル、本文から判定)
  if (/cloud-digital-leader/i.test(baseUrl) || /Cloud Digital Leader/i.test(html)) {
    result.category = 'Leader (Foundational)';
  } else if (/cloud-engineer|associate/i.test(baseUrl) || /Associate/i.test(html)) {
    result.category = 'Associate';
  } else if (/professional|architect|data-engineer|devops/i.test(baseUrl) || /Professional/i.test(html)) {
    result.category = 'Professional';
  }

  // 2. 試験期間 (所要時間 / 試験時間 / 時間)
  const durationMatch = html.match(/<(p|li|div)\b[^>]*>\s*<(b|strong)\b[^>]*>(?:試験時間|時間|所要時間)[:：]?<\/\2>[:：]?\s*([^<]+)<\/\1>/i);
  if (durationMatch) {
    result.examDuration = textFromHtml(durationMatch[3]);
  }

  // 3. 費用 (登録料 / 受験料 / 費用)
  const costMatch = html.match(/<(p|li|div)\b[^>]*>\s*<(b|strong)\b[^>]*>(?:登録料|受験料|費用)[:：]?<\/\2>[:：]?\s*([^<]+)<\/\1>/i);
  if (costMatch) {
    result.cost = textFromHtml(costMatch[3]);
  }

  // 4. 試験の形態 (試験の形式 / 形式)
  const formatMatch = html.match(/<(p|li|div)\b[^>]*>\s*<(b|strong)\b[^>]*>(?:試験の形式|形式)[:：]?<\/\2>[:：]?\s*([^<]+)<\/\1>/i);
  if (formatMatch) {
    result.examFormat = textFromHtml(formatMatch[3]);
  }

  // 5. 受験オプション (試験の実施方法など)
  const optionsMatch = html.match(/<(p|li|div)\b[^>]*>\s*<(b|strong)\b[^>]*>(?:試験の実施方法|受験方法|実施方法)[:：]?<\/\2>[\s\S]*?(?=<(h[1-6]|div class="cws-grid)\b|$)/i);
  if (optionsMatch) {
    const opts = [];
    const linkMatches = optionsMatch[0].match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) || [];
    for (const link of linkMatches) {
      const linkText = textFromHtml(link);
      if (linkText && !/http/i.test(linkText)) {
        opts.push(linkText);
      }
    }
    if (opts.length > 0) {
      result.testingOptions = opts.join('、');
    } else {
      result.testingOptions = textFromHtml(optionsMatch[0]);
    }
  } else if (/遠隔監視オンライン試験/i.test(html) && /テストセンター/i.test(html)) {
    result.testingOptions = '遠隔監視オンライン試験、テストセンターでオンサイト監視試験を受験する';
  }

  // 6. はじめに (H1直後の概要文 または hero-module__description または meta description)
  const introMatch = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>[\s\S]*?<div\b[^>]*class=["'][^"']*cws-content-block__text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div\b[^>]*class=["'][^"']*hero-module__description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (introMatch) {
    result.introduction = textFromHtml(introMatch[1]);
  } else {
    const metaMatch = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch) {
      result.introduction = textFromHtml(metaMatch[1]);
    }
  }

  // 7. Exam Guide リンク
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let am;
  while ((am = anchorRegex.exec(html)) !== null) {
    const attrs = am[1];
    const text = textFromHtml(am[2]);
    if (/試験ガイド|Exam Guide/i.test(text)) {
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      if (hrefMatch && !hrefMatch[1].startsWith('#')) {
        let guideUrl = hrefMatch[1].trim();
        if (guideUrl.startsWith('//')) {
          guideUrl = 'https:' + guideUrl;
        } else if (guideUrl.startsWith('/')) {
          guideUrl = baseUrl.replace(/\/+$/, '') + guideUrl;
        }
        result.examGuideUrl = guideUrl;
        break;
      }
    }
  }

  // 8. 試験内容
  const contentMatch = html.match(/<(p|div)\b[^>]*>\s*<(b|strong)\b[^>]*>内容[:：]?<\/\2>[\s\S]*?<\/p>/i);
  const caseStudyMatch = html.match(/<(p|div)\b[^>]*>\s*<(b|strong)\b[^>]*>ケーススタディ[:：]?<\/\2>[\s\S]*?<\/p>/i);
  const contentParts = [];
  if (contentMatch) contentParts.push(textFromHtml(contentMatch[0]));
  if (caseStudyMatch) contentParts.push(textFromHtml(caseStudyMatch[0]));
  if (contentParts.length > 0) {
    result.examContent = contentParts.join(' ');
  }

  // 9. 試験内容の概要 (評価される知識・分野リスト)
  const outlineListMatch = html.match(/<ul\b[^>]*class=["'][^"']*cws-bulleted-list[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
  if (outlineListMatch) {
    const items = [];
    const liMatches = outlineListMatch[1].match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi) || [];
    for (const li of liMatches) {
      const text = textFromHtml(li);
      if (text) items.push(text);
    }
    if (items.length > 0) {
      result.contentOutline = items.join('\n');
    }
  }

  return result;
}

/**
 * Google Cloud 資格詳細情報を取得する
 * @param {string} examPageUrl 
 * @returns {Promise<object>}
 */
async function fetchGoogleCloudExamDetails(examPageUrl) {
  const res = await fetch(examPageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    },
  });
  if (!res.ok) {
    throw new Error(`Google Cloud資格ページの取得に失敗しました (${examPageUrl}): HTTP ${res.status}`);
  }
  const html = await res.text();
  return parseGoogleCloudExamPage(html, examPageUrl);
}

/**
 * Google Cloud 資格詳細のハッシュ値を計算する
 * @param {object} details 
 * @returns {string}
 */
function hashGoogleCloudDetails(details) {
  const text = [
    details.category || '',
    details.examDuration || '',
    details.examFormat || '',
    details.cost || '',
    details.testingOptions || '',
    details.introduction || '',
    details.examContent || '',
    details.contentOutline || '',
  ].join(' | ');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Google Cloud の記事一覧と資格詳細情報を統合して取得する
 * @param {string} [customHtml]
 * @param {Array<object>} [customDetails]
 * @returns {Promise<Array<object>>}
 */
async function fetchGoogleCloudAllUpdates(customHtml = null, customDetails = null, options = {}) {
  const newsItems = await fetchGoogleCloudNews(customHtml);

  const detailItems = [];
  if (customDetails) {
    for (const d of customDetails) {
      detailItems.push(d);
    }
  } else {
    const batchIndex = options.batchIndex === undefined ? getDailyBatchIndex() : options.batchIndex;
    const grouped = new Map();
    for (const qualification of GOOGLE_CLOUD_QUALIFICATIONS) {
      if (!grouped.has(qualification.officialUrl)) {
        grouped.set(qualification.officialUrl, { officialUrl: qualification.officialUrl, qualifications: [] });
      }
      grouped.get(qualification.officialUrl).qualifications.push(qualification);
    }
    const targets = Array.from(grouped.values()).filter((_, index) => index % 5 === batchIndex);
    for (let index = 0; index < targets.length; index++) {
      const target = targets[index];
      const q = target.qualifications[0];
      try {
        if (index > 0) await new Promise(resolve => setTimeout(resolve, 1500));
        const details = await fetchGoogleCloudExamDetails(target.officialUrl);
        detailItems.push({
          provider: 'Google Cloud',
          title: `${q.name} 資格情報・試験ガイド`,
          url: target.officialUrl,
          date: '',
          description: `${q.name} の資格詳細および試験ガイド情報`,
          category: details.category,
          examDuration: details.examDuration,
          examFormat: details.examFormat,
          cost: details.cost,
          testingOptions: details.testingOptions,
          introduction: details.introduction,
          examContent: details.examContent,
          contentOutline: details.contentOutline,
          contentHash: hashGoogleCloudDetails(details),
          detailsOnly: true,
          relatedQualifications: target.qualifications.map(({ no, name }) => ({ no, name })),
        });
      } catch (err) {
        console.warn(`[Google Cloud] ${q.name} の詳細取得に失敗しました:`, err.message);
      }
    }
  }

  return [...newsItems, ...detailItems];
}

module.exports = {
  GOOGLE_CLOUD_QUALIFICATIONS,
  getGoogleCloudQualifications,
  matchGoogleCloudQualifications,
  parseGoogleCloudNews,
  fetchGoogleCloudNews,
  parseGoogleCloudExamPage,
  fetchGoogleCloudExamDetails,
  hashGoogleCloudDetails,
  fetchGoogleCloudAllUpdates,
};
