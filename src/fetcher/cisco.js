/**
 * Cisco Learn with Cisco 公式RSSから資格関連ニュースを取得する
 */

const CISCO_FEED_URL = 'https://blogs.cisco.com/learning/feed';

const CISCO_QUALIFICATIONS = [
  { no: 43, name: 'CCNA', aliases: ['CCNA', '200-301'] },
  { no: 44, name: 'ENCOR', aliases: ['ENCOR', '350-401'] },
  { no: 45, name: 'ENARSI', aliases: ['ENARSI', '300-410'] },
  { no: 46, name: 'ENSDWI', aliases: ['ENSDWI', '300-415'] },
  { no: 47, name: 'ENSLD', aliases: ['ENSLD', '300-420'] },
  { no: 48, name: 'ENWLSI', aliases: ['ENWLSI', '300-425'] },
  { no: 49, name: 'ENAUTO', aliases: ['ENAUTO', '300-435'] },
  { no: 50, name: 'ENWLSD', aliases: ['ENWLSD', '300-430'] },
  { no: 51, name: 'CCNP Enterprise', aliases: ['CCNP Enterprise'] },
  { no: 52, name: 'CCIE Enterprise Infrastructure', aliases: ['CCIE Enterprise Infrastructure'] },
];

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function matchCiscoQualifications(text) {
  return CISCO_QUALIFICATIONS.filter(qualification =>
    qualification.aliases.some(alias => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^A-Z0-9])${escaped}($|[^A-Z0-9])`, 'i').test(text);
    })
  ).map(({ no, name }) => ({ no, name }));
}

function parseCiscoRss(xml) {
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descriptionMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
    const title = titleMatch ? decodeXml(titleMatch[1]).trim() : '';
    const url = linkMatch ? decodeXml(linkMatch[1]).trim() : '';
    const date = dateMatch ? decodeXml(dateMatch[1]).trim() : '';
    const description = descriptionMatch ? decodeXml(descriptionMatch[1]).replace(/<[^>]+>/g, '').trim() : '';
    const relatedQualifications = matchCiscoQualifications(`${title} ${description}`);

    if (title && url && (
      relatedQualifications.length > 0 ||
      /\b(certification|certified|credential|exam)\b/i.test(`${title} ${description}`)
    )) {
      items.push({
        provider: 'Cisco Systems',
        title,
        url,
        date,
        description,
        relatedQualifications,
      });
    }
  }

  return items;
}

async function fetchCiscoNews(customXml = null) {
  let xml = customXml;
  if (xml === null) {
    const response = await fetch(CISCO_FEED_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 certificateInfo-bot/1.0',
        'Accept': 'application/rss+xml,application/xml,text/xml',
      },
    });
    if (!response.ok) {
      throw new Error(`Cisco Learn RSSの取得に失敗しました: HTTP ${response.status}`);
    }
    xml = await response.text();
  }

  return parseCiscoRss(xml);
}

module.exports = {
  CISCO_QUALIFICATIONS,
  matchCiscoQualifications,
  parseCiscoRss,
  fetchCiscoNews,
};
