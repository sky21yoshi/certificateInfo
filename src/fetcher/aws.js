/**
 * AWS（Amazon Web Services）トレーニング＆認定情報スクレイパー / フィードフェッチャー
 */

const AWS_BLOG_FEED_JA = 'https://aws.amazon.com/jp/blogs/training-and-certification/feed/';
const AWS_BLOG_FEED_EN = 'https://aws.amazon.com/blogs/training-and-certification/feed/';

// 監視対象のAWS資格一覧
const AWS_QUALIFICATIONS = [
  { no: 14, name: 'AWS認定 Practitioner系', aliases: ['Cloud Practitioner', 'クラウドプラクティショナー', 'CLF'] },
  { no: 15, name: 'AWS認定 Associate系', aliases: ['Solutions Architect - Associate', 'Developer - Associate', 'SysOps Administrator - Associate', 'Data Engineer - Associate', 'SAA', 'DVA', 'SOA', 'DEA'] },
  { no: 16, name: 'AWS認定 Professional系', aliases: ['Solutions Architect - Professional', 'DevOps Engineer - Professional', 'SAP', 'DOP'] },
  { no: 17, name: 'AWS認定 Specialty系', aliases: ['Specialty', 'Advanced Networking', 'Security', 'Machine Learning', 'ANS', 'SCS', 'MLS'] },
  { no: 18, name: 'AWS Certified AI Business Strategist', aliases: ['AI Business Strategist', 'AI Practitioner', 'AIF'] },
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

module.exports = {
  AWS_QUALIFICATIONS,
  matchAwsQualifications,
  parseAwsRss,
  fetchAwsNews,
};
