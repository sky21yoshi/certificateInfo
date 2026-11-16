/**
 * Cisco Systems（シスコシステムズ）認定情報スクレイパー / 資格詳細情報フェッチャー
 * 
 * 対象URL:
 * - 新着情報 (Cisco Learn RSS): https://blogs.cisco.com/learning/feed
 * - 各試験詳細ページ: https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/{code}.html
 * - 認定プログラムページ: https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/{level}/{cert}.html
 */

const crypto = require('crypto');

const CISCO_FEED_URL = 'https://blogs.cisco.com/learning/feed';

// 監視対象のCisco資格一覧（スプレッドシート行93〜102: No 92〜101）
const CISCO_QUALIFICATIONS = [
  {
    no: 92,
    name: 'CCNA (200-301)',
    code: '200-301',
    aliases: ['CCNA', '200-301'],
    officialUrl: 'https://learningnetwork.cisco.com/s/ccna-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ccna-200-301.html',
  },
  {
    no: 93,
    name: 'ENCOR (350-401)',
    code: '350-401',
    aliases: ['ENCOR', '350-401'],
    officialUrl: 'https://learningnetwork.cisco.com/s/encor-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/encor-350-401.html',
  },
  {
    no: 94,
    name: 'ENARSI (300-410)',
    code: '300-410',
    aliases: ['ENARSI', '300-410'],
    officialUrl: 'https://learningnetwork.cisco.com/s/enarsi-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enarsi-300-410.html',
  },
  {
    no: 95,
    name: 'ENSDWI (300-415)',
    code: '300-415',
    aliases: ['ENSDWI', '300-415'],
    officialUrl: 'https://learningnetwork.cisco.com/s/ensdwi-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ensdwi-300-415.html',
  },
  {
    no: 96,
    name: 'ENSLD (300-420)',
    code: '300-420',
    aliases: ['ENSLD', '300-420'],
    officialUrl: 'https://learningnetwork.cisco.com/s/ensld-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ensld-300-420.html',
  },
  {
    no: 97,
    name: 'ENWLSI (300-425)',
    code: '300-425',
    aliases: ['ENWLSI', '300-425', 'ENWLSD'],
    officialUrl: 'https://learningnetwork.cisco.com/s/enwlsi-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enwlsd-300-425.html',
  },
  {
    no: 98,
    name: 'ENAUTO (300-435)',
    code: '300-435',
    aliases: ['ENAUTO', '300-435'],
    officialUrl: 'https://learningnetwork.cisco.com/s/enauto-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enauto-300-435.html',
  },
  {
    no: 99,
    name: 'ENWLSD (300-430)',
    code: '300-430',
    aliases: ['ENWLSD', '300-430', 'ENWLSI'],
    officialUrl: 'https://learningnetwork.cisco.com/s/enwlsd-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enwlsi-300-430.html',
  },
  {
    no: 100,
    name: 'CCNP Enterprise',
    code: 'ccnp-enterprise',
    aliases: ['CCNP Enterprise', 'CCNP'],
    officialUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/professional/ccnp-enterprise.html',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/professional/ccnp-enterprise.html',
  },
  {
    no: 101,
    name: 'CCIE Enterprise Infrastructure',
    code: 'ccie-enterprise',
    aliases: ['CCIE Enterprise Infrastructure', 'CCIE Enterprise', 'CCIE'],
    officialUrl: 'https://learningnetwork.cisco.com/s/ccie-enterprise-infrastructure-exam-topics',
    contentUrl: 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/expert/ccie-enterprise-infrastructure.html',
  },
];

// 各試験ごとの詳細メタデータ（カテゴリ、費用、試験時間、出題形式、受験オプション、概要）
const CISCO_META = {
  '200-301': {
    category: 'Associate',
    cost: '300 USD（約45,000円）',
    examDuration: '120分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 ネットワークの基礎 (20%)、2.0 ネットワークアクセス (20%)、3.0 IPコネクティビティ (25%)、4.0 IPサービス (10%)、5.0 セキュリティの基礎 (15%)、6.0 自動化とプログラマビリティ (10%)',
  },
  '350-401': {
    category: 'Professional / Expert（コア試験）',
    cost: '400 USD（約60,000円）',
    examDuration: '120分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 アーキテクチャ (15%)、2.0 仮想化 (10%)、3.0 インフラストラクチャ (30%)、4.0 ネットワークアシュアランス (10%)、5.0 セキュリティ (20%)、6.0 自動化 (15%)。CCNP Enterprise および CCIE Enterprise のコア要件。',
  },
  '300-410': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 レイヤ3技術 (35%)、2.0 VPNサービス (20%)、3.0 インフラストラクチャセキュリティ (20%)、4.0 インフラストラクチャサービス (25%)',
  },
  '300-415': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 Cisco SD-WANアーキテクチャ (20%)、2.0 コントローラ導入 (15%)、3.0 WANエッジルータ導入 (20%)、4.0 ポリシー (20%)、5.0 セキュリティとQoS (15%)、6.0 管理と運用 (10%)',
  },
  '300-420': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 高度なアドレス指定およびルーティングソリューション (25%)、2.0 高度なエンタープライズキャンパスネットワーク (25%)、3.0 WAN (20%)、4.0 ネットワークサービス (20%)、5.0 自動化 (10%)',
  },
  '300-425': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 ワイヤレスサイト調査 (25%)、2.0 有線およびワイヤレスインフラストラクチャ設計 (30%)、3.0 モビリティ設計 (25%)、4.0 WLANの高可用性 (20%)',
  },
  '300-430': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 FlexConnect (15%)、2.0 QoS (10%)、3.0 マルチキャスト (10%)、4.0 高度なロケーションサービス (10%)、5.0 クライアント接続のセキュリティ (20%)、6.0 デバイスとインフラの監視 (15%)、7.0 デバイスの保守とトラブルシューティング (20%)',
  },
  '300-435': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 ネットワークプログラマビリティの基礎 (15%)、2.0 Cisco DNA Center (20%)、3.0 Cisco SD-WAN (15%)、4.0 Cisco ISE (15%)、5.0 Cisco Meraki (15%)、6.0 ネットワークデバイスプログラマビリティ (20%)',
  },
  'ccnp-enterprise': {
    category: 'Professional',
    cost: '700 USD（コア試験 400 USD + コンセントレーション試験 300 USD）',
    examDuration: 'コア試験: 120分、コンセントレーション試験: 90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【認定要件】コア試験（350-401 ENCOR）合格、および以下のコンセントレーション試験のうちいずれか1つに合格: 300-410 ENARSI、300-415 ENSDWI、300-420 ENSLD、300-425 ENWLSD、300-430 ENWLSI、300-435 ENAUTO。',
  },
  'ccie-enterprise': {
    category: 'Expert',
    cost: '2,000 USD（コア試験 400 USD + ラボ試験 1,600 USD）',
    examDuration: 'クオリファイ試験: 120分、実技ラボ試験: 8時間',
    examFormat: '筆記試験（多肢選択式等）および実技ラボ試験（ハンズオン実機環境）',
    testingOptions: 'ピアソンVUE テストセンター（クオリファイ試験）/ シスコ ラボ試験会場（実技試験）',
    contentOutline: '【認定要件】ステップ1: クオリファイ試験（350-401 ENCOR）合格、ステップ2: CCIE Enterprise Infrastructure v1.1 実技ラボ試験（8時間）合格。ネットワークの設計・導入・運用・最適化のライフサイクル全体を検証。',
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function decodeXml(value) {
  if (!value) return '';
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function cleanText(text) {
  if (!text) return '';
  return decodeXml(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 資格名またはURLからCisco公式コンテンツページのURLを取得する
 * @param {string} url 
 * @param {string} [qualificationName=''] 
 * @returns {string}
 */
function resolveCiscoContentUrl(url, qualificationName = '') {
  const combined = `${url} ${qualificationName}`;
  // 1. 試験コードを最優先でマッチング
  for (const q of CISCO_QUALIFICATIONS) {
    if (new RegExp(`(^|[^0-9])${q.code}($|[^0-9])`, 'i').test(combined)) {
      return q.contentUrl;
    }
  }
  // 2. エイリアスでのマッチング
  for (const q of CISCO_QUALIFICATIONS) {
    if (q.aliases.some(alias => new RegExp(`(^|[^A-Z0-9])${alias}($|[^A-Z0-9])`, 'i').test(combined))) {
      return q.contentUrl;
    }
  }
  return url;
}

/**
 * テキストから関連するCisco資格を判定する
 * @param {string} text 
 * @returns {Array<{no: number, name: string}>}
 */
function matchCiscoQualifications(text) {
  return CISCO_QUALIFICATIONS.filter(qualification =>
    qualification.aliases.some(alias => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^A-Z0-9])${escaped}($|[^A-Z0-9])`, 'i').test(text);
    })
  ).map(({ no, name }) => ({ no, name }));
}

/**
 * Cisco認定試験ページから詳細情報をパースする
 * @param {string} html 
 * @param {string} [url=''] 
 * @param {string} [qualificationName=''] 
 * @returns {{category: string, examDuration: string, examFormat: string, cost: string, testingOptions: string, introduction: string, examContent: string, contentOutline: string}}
 */
function parseCiscoExamPage(html, url = '', qualificationName = '') {
  let code = '';
  const combined = `${url} ${qualificationName}`;
  const m = combined.match(/\b(200-301|350-401|300-410|300-415|300-420|300-425|300-430|300-435)\b/i)
    || combined.match(/\b(ccna|encor|enarsi|ensdwi|ensld|enwlsi|enauto|enwlsd|ccnp|ccie)\b/i);

  if (m) {
    const raw = m[1].toLowerCase();
    if (raw.includes('200-301') || raw === 'ccna') code = '200-301';
    else if (raw.includes('350-401') || raw === 'encor') code = '350-401';
    else if (raw.includes('300-410') || raw === 'enarsi') code = '300-410';
    else if (raw.includes('300-415') || raw === 'ensdwi') code = '300-415';
    else if (raw.includes('300-420') || raw === 'ensld') code = '300-420';
    else if (raw.includes('300-425') || raw === 'enwlsd') code = '300-425';
    else if (raw.includes('300-430') || raw === 'enwlsi') code = '300-430';
    else if (raw.includes('300-435') || raw === 'enauto') code = '300-435';
    else if (raw.includes('ccnp')) code = 'ccnp-enterprise';
    else if (raw.includes('ccie')) code = 'ccie-enterprise';
  }

  const meta = CISCO_META[code] || {};

  // 1. はじめに（meta description または見出し・本文）
  let intro = '';
  const metaDesc = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDesc) {
    intro = cleanText(metaDesc[1]);
  }
  if (!intro) {
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    intro = h1 ? `${cleanText(h1[1])} の公式試験・認定プログラムです。` : `${qualificationName || 'Cisco'} の公式認定資格です。`;
  }

  // 2. 試験内容
  let examContent = '';
  const overviewMatch = html.match(/<h2\b[^>]*>[^<]*試験の概要[^<]*<\/h2>([\s\S]*?)(?=<h2\b|<div\b[^>]*class=["'][^"']*footer|$)/i);
  if (overviewMatch) {
    examContent = cleanText(overviewMatch[1]);
  }
  if (!examContent) {
    const h2P = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
    if (h2P) examContent = `${cleanText(h2P[1])}: ${cleanText(h2P[2])}`;
  }
  if (!examContent) {
    examContent = intro;
  }

  // 3. 試験時間
  let duration = meta.examDuration || '';
  const durMatch = html.match(/試験時間[：:]\s*([^<\n]+)/i);
  if (durMatch) {
    duration = cleanText(durMatch[1]);
  }

  return {
    category: meta.category || 'Professional',
    examDuration: duration,
    examFormat: meta.examFormat || '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    cost: meta.cost || '300 USD',
    testingOptions: meta.testingOptions || 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    introduction: intro,
    examContent: examContent,
    contentOutline: meta.contentOutline || '',
  };
}

/**
 * Cisco詳細情報のコンテンツハッシュを生成する
 * @param {object} details 
 * @returns {string}
 */
function hashCiscoDetails(details) {
  const payload = [
    details.category || '',
    details.examDuration || '',
    details.examFormat || '',
    details.cost || '',
    details.testingOptions || '',
    details.introduction || '',
    details.examContent || '',
    details.contentOutline || '',
  ].join('|');
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * 指定されたURLからCisco資格詳細情報を取得する
 * @param {string} url 
 * @param {string} [qualificationName=''] 
 * @param {object} [options={}] 
 * @returns {Promise<object>}
 */
async function fetchCiscoExamDetails(url, qualificationName = '', options = {}) {
  const contentUrl = resolveCiscoContentUrl(url, qualificationName);
  let html = options.html || null;
  if (!html) {
    const res = await fetch(contentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) {
      throw new Error(`Cisco公式ページの取得に失敗しました (${contentUrl}): HTTP ${res.status}`);
    }
    html = await res.text();
  }

  const details = parseCiscoExamPage(html, contentUrl, qualificationName);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? cleanText(titleMatch[1]).replace(/\s*-\s*Cisco$/i, '').trim() : '';

  return {
    title: pageTitle || `${qualificationName || 'Cisco'} 資格詳細情報`,
    url: contentUrl,
    description: details.introduction || `${qualificationName || 'Cisco'} の公式資格詳細情報`,
    ...details,
    contentHash: hashCiscoDetails(details),
  };
}

/**
 * Cisco Learn with Cisco 公式RSSから資格関連ニュースを取得する
 * @param {string} [customXml] 
 * @returns {Promise<Array<object>>}
 */
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

/**
 * Ciscoの新着ニュースと資格詳細情報の両方を取得する統合関数
 * @param {object} [options={}] 
 * @returns {Promise<Array<object>>}
 */
async function fetchCiscoAllUpdates(options = {}) {
  const newsItems = await fetchCiscoNews(options.newsMockXml || null);
  const detailItems = [];

  const qualifications = options.qualifications || CISCO_QUALIFICATIONS;
  for (let i = 0; i < qualifications.length; i++) {
    const q = qualifications[i];
    if (i > 0 && !options.detailsMockMap) await sleep(1000);

    try {
      const mockHtml = options.detailsMockMap ? options.detailsMockMap[q.contentUrl] : null;
      const details = await fetchCiscoExamDetails(q.officialUrl, q.name, { html: mockHtml });
      detailItems.push({
        provider: 'Cisco Systems（シスコシステムズ）',
        title: details.title,
        url: details.url,
        date: '',
        description: details.description,
        ...details,
        detailsOnly: true,
        relatedQualifications: [{ no: q.no, name: q.name }],
      });
    } catch (e) {
      console.warn(`[Cisco] 詳細情報の取得に失敗しました (${q.name}): ${e.message}`);
    }
  }

  return [...newsItems, ...detailItems];
}

module.exports = {
  CISCO_FEED_URL,
  CISCO_QUALIFICATIONS,
  CISCO_META,
  decodeXml,
  cleanText,
  resolveCiscoContentUrl,
  matchCiscoQualifications,
  parseCiscoExamPage,
  hashCiscoDetails,
  fetchCiscoExamDetails,
  fetchCiscoNews,
  parseCiscoRss,
  fetchCiscoAllUpdates,
};
