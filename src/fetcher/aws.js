/**
 * AWS（Amazon Web Services）トレーニング＆認定情報スクレイパー / フィードフェッチャー
 */

const { textFromHtml } = require('./official_web');

const AWS_BLOG_FEED_JA = 'https://aws.amazon.com/jp/blogs/training-and-certification/feed/';
const AWS_BLOG_FEED_EN = 'https://aws.amazon.com/blogs/training-and-certification/feed/';

// 監視対象のAWS資格一覧
const AWS_QUALIFICATIONS = [
  {
    no: 14,
    name: 'AWS認定 Practitioner系',
    officialUrl: 'https://aws.amazon.com/jp/certification/certified-cloud-practitioner/',
    aliases: ['Cloud Practitioner', 'クラウドプラクティショナー', 'CLF']
  },
  {
    no: 15,
    name: 'AWS認定 Associate系',
    officialUrl: 'https://aws.amazon.com/jp/certification/certified-solutions-architect-associate/',
    aliases: ['Solutions Architect - Associate', 'Developer - Associate', 'SysOps Administrator - Associate', 'Data Engineer - Associate', 'SAA', 'DVA', 'SOA', 'DEA']
  },
  {
    no: 16,
    name: 'AWS認定 Professional系',
    officialUrl: 'https://aws.amazon.com/jp/certification/certified-solutions-architect-professional/',
    aliases: ['Solutions Architect - Professional', 'DevOps Engineer - Professional', 'SAP', 'DOP']
  },
  {
    no: 17,
    name: 'AWS認定 Specialty系',
    officialUrl: 'https://aws.amazon.com/jp/certification/our-certifications/',
    aliases: ['Specialty', 'Advanced Networking', 'Security', 'Machine Learning', 'ANS', 'SCS', 'MLS']
  },
  {
    no: 18,
    name: 'AWS Certified AI Business Strategist',
    officialUrl: 'https://aws.amazon.com/jp/certification/certified-ai-practitioner/',
    aliases: ['AI Business Strategist', 'AI Practitioner', 'AIF']
  },
];

/**
 * テキストから関連するAWS資格を判定
 * @param {string} text 
 * @returns {Array<{no: number, name: string}>}
 */
function matchAwsQualifications(text) {
  const matched = [];
  for (const q of AWS_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(text))) {
      matched.push({ no: q.no, name: q.name });
    }
  }
  return matched;
}

/**
 * RSS XML からアイテムを抽出する
 * @param {string} xml 
 * @returns {Array<object>}
 */
function parseAwsRss(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);

    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    const desc = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim() : '';

    if (title && link) {
      const fullText = `${title} ${desc}`;
      const matched = matchAwsQualifications(fullText);
      items.push({
        title,
        url: link,
        date: pubDate,
        description: desc,
        relatedQualifications: matched,
      });
    }
  }

  return items;
}

/**
 * AWS Training & Certification フィードを取得
 * @param {string} [customXml] テスト用XML
 * @returns {Promise<Array<object>>}
 */
async function fetchAwsNews(customXml = null) {
  let xml = customXml;
  if (!xml) {
    const res = await fetch(AWS_BLOG_FEED_JA, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
        'Accept': 'application/rss+xml,application/xml,text/xml'
      }
    });
    if (!res.ok) {
      // 英語版へフォールバック
      const resEn = await fetch(AWS_BLOG_FEED_EN, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0' }
      });
      if (!resEn.ok) {
        throw new Error(`AWSフィードの取得に失敗しました: HTTP ${res.status} / ${resEn.status}`);
      }
      xml = await resEn.text();
    } else {
      xml = await res.text();
    }
  }

  return parseAwsRss(xml);
}

/**
 * 資格情報取得元ページのHTMLからカテゴリ、試験期間、試験の形態、費用、受験オプション、Exam Guideリンクを抽出する
 * @param {string} html 
 * @param {string} [baseUrl='https://aws.amazon.com']
 * @returns {{category: string, examDuration: string, examFormat: string, cost: string, testingOptions: string, examGuideUrl: string}}
 */
function parseAwsExamPage(html, baseUrl = 'https://aws.amazon.com') {
  const result = {
    category: '',
    examDuration: '',
    examFormat: '',
    cost: '',
    testingOptions: '',
    examGuideUrl: '',
  };

  if (!html) return result;

  // 1. JSON-embedded data (data.items[].fields)
  const jsonMatches = html.match(/<script\b[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const script of jsonMatches) {
    if (script.includes('itemHeading')) {
      const jsonText = script.replace(/<[^>]+>/g, '').trim();
      try {
        const obj = JSON.parse(jsonText);
        const items = (obj && obj.data && Array.isArray(obj.data.items)) ? obj.data.items : [];
        for (const item of items) {
          if (!item || !item.fields) continue;
          const heading = textFromHtml(item.fields.itemHeading || '');
          const content = textFromHtml(item.fields.itemLongLoc || item.fields.itemTextLoc || '');
          if (!heading || !content) continue;

          if (!result.category && /^(カテゴリ|カテゴリー|Category)$/i.test(heading)) {
            result.category = content;
          } else if (!result.examDuration && /(試験期間|試験時間|Exam duration)/i.test(heading)) {
            result.examDuration = content;
          } else if (!result.examFormat && /(試験の形態|出題形式|試験形式|Exam format)/i.test(heading)) {
            result.examFormat = content;
          } else if (!result.cost && /(費用|試験費用|Cost)/i.test(heading)) {
            result.cost = content;
          } else if (!result.testingOptions && /(受験オプション|Testing options|対面テストまたはオンラインテスト)/i.test(heading)) {
            result.testingOptions = content;
          }
        }
      } catch (e) {}
    }
  }

  // 2. HTML見出し・定義リスト等のフォールバック
  if (!result.category || !result.examDuration || !result.examFormat || !result.cost || !result.testingOptions) {
    const headingRegex = /<(h[2-6]|dt|strong|b)\b[^>]*>([\s\S]*?)<\/\1>([\s\S]*?)(?=<(h[2-6]|dt|strong|b)\b|$)/gi;
    let m;
    while ((m = headingRegex.exec(html)) !== null) {
      const heading = textFromHtml(m[2]);
      const content = textFromHtml(m[3]);
      if (!heading || !content) continue;

      if (!result.category && /^(カテゴリ|カテゴリー|Category)$/i.test(heading)) {
        result.category = content;
      } else if (!result.examDuration && /(試験期間|試験時間|Exam duration)/i.test(heading)) {
        result.examDuration = content;
      } else if (!result.examFormat && /(試験の形態|出題形式|試験形式|Exam format)/i.test(heading)) {
        result.examFormat = content;
      } else if (!result.cost && /(費用|試験費用|Cost)/i.test(heading)) {
        result.cost = content;
      } else if (!result.testingOptions && /(受験オプション|Testing options|対面テストまたはオンラインテスト)/i.test(heading)) {
        result.testingOptions = content;
      }
    }
  }

  // 3. meta description からのフォールバック (e.g. Category, Professional. Exam duration, 180 minutes. Exam format, 75 questions... Cost, 300 USD.)
  if (!result.category || !result.examDuration || !result.examFormat || !result.cost) {
    const metaMatch = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaMatch) {
      const desc = metaMatch[1];
      const catMatch = desc.match(/Category,\s*([^.]+)\./i);
      const durMatch = desc.match(/Exam duration,\s*([^.]+)\./i);
      const fmtMatch = desc.match(/Exam format,\s*([^.]+)\./i);
      const costMatch = desc.match(/Cost,\s*([^.]+)\./i);
      if (!result.category && catMatch) result.category = catMatch[1].trim();
      if (!result.examDuration && durMatch) result.examDuration = durMatch[1].trim();
      if (!result.examFormat && fmtMatch) result.examFormat = fmtMatch[1].trim();
      if (!result.cost && costMatch) result.cost = costMatch[1].trim();
    }
  }

  // 4. Exam Guide リンク探索
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let am;
  while ((am = anchorRegex.exec(html)) !== null) {
    const attrs = am[1];
    const text = textFromHtml(am[2]);
    if (/試験ガイド|Exam Guide/i.test(text) || /試験ガイド|Exam Guide/i.test(attrs)) {
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      if (hrefMatch) {
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

  return result;
}

/**
 * Exam Guide のページから「はじめに」「試験内容」「試験内容の概要」を抽出する
 * @param {string} html 
 * @returns {{introduction: string, examContent: string, contentOutline: string}}
 */
function parseAwsExamGuidePage(html) {
  const result = {
    introduction: '',
    examContent: '',
    contentOutline: '',
  };

  if (!html) return result;

  // <h1-2> タグを大見出し区切りとして分割（h3などのサブ見出しを内容に含める）
  const sections = html.split(/(?=<h[12]\b)/i);
  for (const sec of sections) {
    const headingMatch = sec.match(/^<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i);
    if (!headingMatch) continue;
    const heading = textFromHtml(headingMatch[1]);
    const body = textFromHtml(sec.slice(headingMatch[0].length));
    if (!heading) continue;

    if (!result.introduction && /(はじめに|Introduction)/i.test(heading)) {
      result.introduction = body;
    } else if (!result.contentOutline && /(試験内容の概要|Content outline)/i.test(heading)) {
      result.contentOutline = body;
    } else if (!result.examContent && /(試験内容|Exam content)/i.test(heading)) {
      result.examContent = body;
    }
  }

  return result;
}

/**
 * AWS資格情報取得元およびExam Guideから詳細情報を取得する
 * @param {string} examPageUrl 
 * @returns {Promise<object>}
 */
async function fetchAwsExamDetails(examPageUrl) {
  const res = await fetch(examPageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    },
  });
  if (!res.ok) {
    throw new Error(`AWS資格ページの取得に失敗しました (${examPageUrl}): HTTP ${res.status}`);
  }
  const html = await res.text();
  const pageDetails = parseAwsExamPage(html, examPageUrl);

  let guideDetails = { introduction: '', examContent: '', contentOutline: '' };
  if (pageDetails.examGuideUrl) {
    try {
      const gRes = await fetch(pageDetails.examGuideUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
      });
      if (gRes.ok) {
        const gHtml = await gRes.text();
        guideDetails = parseAwsExamGuidePage(gHtml);
      }
    } catch (err) {
      console.warn(`[AWS] Exam Guide の取得エラー (${pageDetails.examGuideUrl}):`, err.message);
    }
  }

  return {
    ...pageDetails,
    ...guideDetails,
  };
}

/**
 * AWS資格詳細のハッシュ値を計算する
 * @param {object} details 
 * @returns {string}
 */
function hashAwsDetails(details) {
  const text = [
    details.category || '',
    details.examDuration || '',
    details.examFormat || '',
    details.cost || '',
    details.testingOptions || '',
    details.introduction || '',
    details.examContent || '',
    details.contentOutline || ''
  ].join(' | ');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * AWSのRSS新着情報と資格詳細情報を統合して取得する
 * @param {string} [customXml]
 * @param {Array<object>} [customDetails]
 * @returns {Promise<Array<object>>}
 */
async function fetchAwsAllUpdates(customXml = null, customDetails = null) {
  const newsItems = await fetchAwsNews(customXml);

  const detailItems = [];
  if (customDetails) {
    for (const d of customDetails) {
      detailItems.push(d);
    }
  } else {
    for (const q of AWS_QUALIFICATIONS) {
      try {
        const details = await fetchAwsExamDetails(q.officialUrl);
        detailItems.push({
          provider: 'Amazon Web Services (AWS)',
          title: `${q.name} 資格情報・試験ガイド`,
          url: q.officialUrl,
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
          contentHash: hashAwsDetails(details),
          relatedQualifications: [{ no: q.no, name: q.name }]
        });
      } catch (err) {
        console.warn(`[AWS] ${q.name} の詳細取得に失敗しました:`, err.message);
      }
    }
  }

  return [...newsItems, ...detailItems];
}

module.exports = {
  AWS_QUALIFICATIONS,
  matchAwsQualifications,
  parseAwsRss,
  fetchAwsNews,
  parseAwsExamPage,
  parseAwsExamGuidePage,
  fetchAwsExamDetails,
  hashAwsDetails,
  fetchAwsAllUpdates,
};
