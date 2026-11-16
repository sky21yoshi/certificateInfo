/**
 * IPA（独立行政法人 情報処理推進機構）の試験情報スクレイパー / 資格詳細情報フェッチャー
 * 
 * 対象URL:
 * - 新着情報 (本年度・前年度・前々年度): https://www.ipa.go.jp/news/{年度}/index.html?=exam
 * - 各試験区分詳細: https://www.ipa.go.jp/shiken/kubun/{区分}.html
 */

const crypto = require('crypto');

const BASE_URL = 'https://www.ipa.go.jp';

// 監視対象のIPA資格一覧（キーワード判定および詳細取得用）
const IPA_QUALIFICATIONS = [
  { no: 1, name: '基本情報技術者試験', aliases: ['基本情報', 'FE'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/fe.html' },
  { no: 2, name: '応用情報技術者試験(旧:ソフトウェア開発技術者試験)', aliases: ['応用情報', 'AP'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/ap.html' },
  { no: 3, name: 'ネットワークスペシャリスト試験', aliases: ['ネットワークスペシャリスト', 'NW'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/nw.html' },
  { no: 4, name: 'データベーススペシャリスト試験', aliases: ['データベーススペシャリスト', 'DB'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/db.html' },
  { no: 5, name: 'エンベデッドシステムスペシャリスト試験', aliases: ['エンベデッドシステムスペシャリスト', 'エンべデッド', 'ES'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/es.html' },
  { no: 6, name: 'ITサービスマネージャ試験', aliases: ['ITサービスマネージャ', 'SM'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/sm.html' },
  { no: 7, name: '情報処理安全確保支援士試験', aliases: ['情報処理安全確保支援士', '登録情報セキュリティスペシャリスト', '登録セキスペ', '支援士', 'RISS'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/sc.html' },
  { no: 8, name: 'システムアーキテクト試験', aliases: ['システムアーキテクト', 'SA'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/sa.html' },
  { no: 9, name: 'ITストラテジスト試験', aliases: ['ITストラテジスト', 'ST'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/st.html' },
  { no: 10, name: 'プロジェクトマネージャ試験', aliases: ['プロジェクトマネージャ', 'PM'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/pm.html' },
  { no: 11, name: 'システム監査技術者試験', aliases: ['システム監査技術者', 'AU'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/au.html' },
  { no: 12, name: 'ITパスポート試験', aliases: ['ITパスポート', 'iパス', 'IP'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/ip.html' },
  { no: 13, name: '情報セキュリティマネジメント試験', aliases: ['情報セキュリティマネジメント', 'セキュマネ', 'SG'], officialUrl: 'https://www.ipa.go.jp/shiken/kubun/sg.html' },
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function decodeHtml(value) {
  if (!value) return '';
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function textFromHtml(value) {
  if (!value) return '';
  return decodeHtml(value
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 日本の年度（4月始まり）を取得
 * @param {Date} [date] 
 * @returns {number}
 */
function getFiscalYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  return month >= 4 ? year : year - 1;
}

/**
 * 本年度、前年度、前々年度のスクレイピング対象URLリストを生成
 * @param {Date} [date] 
 * @returns {Array<{year: number, label: string, url: string}>}
 */
function getIpaNewsTargetUrls(date = new Date()) {
  const currentFY = getFiscalYear(date);
  return [
    { year: currentFY, label: '本年度', url: `${BASE_URL}/news/${currentFY}/index.html?=exam` },
    { year: currentFY - 1, label: '前年度', url: `${BASE_URL}/news/${currentFY - 1}/index.html?=exam` },
    { year: currentFY - 2, label: '前々年度', url: `${BASE_URL}/news/${currentFY - 2}/index.html?=exam` },
  ];
}

/**
 * お知らせのタイトルから関連する資格名を判定する
 * @param {string} text 
 * @returns {Array<{no: number, name: string}>}
 */
function matchQualifications(text) {
  const matched = [];
  for (const q of IPA_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => text.includes(alias))) {
      matched.push({ no: q.no, name: q.name });
    }
  }

  // 「高度試験」などの包括的なキーワードの場合
  if (text.includes('高度試験') && matched.length === 0) {
    matched.push({ no: 0, name: '高度試験（複数区分対象）' });
  }

  return matched;
}

/**
 * 年度別ニュースHTMLから試験関連の新着情報アイテムを抽出する
 * @param {string} html 
 * @param {number} [fiscalYear] 対象年度
 * @returns {Array<object>}
 */
function parseNewsItems(html, fiscalYear = null) {
  const items = [];
  
  const parts = html.split(/<li\s+[^>]*class="[^"]*news-list__item[^"]*"/i);

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i];

    const searchMatch = block.match(/^([^>]*)data-search="([^"]*)"/i);
    const dataSearch = searchMatch ? searchMatch[2] : '';
    const isExamCategory = dataSearch.includes('exam');

    const aMatch = block.match(/<a\s+[^>]*href="([^"]+)"/i);
    let url = aMatch ? aMatch[1].trim() : '';
    if (url && !url.startsWith('http')) {
      url = BASE_URL + (url.startsWith('/') ? '' : '/') + url;
    }

    const dMatch = block.match(/<li[^>]*class="[^"]*news-list__date[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
    const date = dMatch ? dMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const tMatch = block.match(/<p[^>]*class="[^"]*news-list__ttl[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const title = tMatch ? tMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : '';

    if (title && url) {
      const matched = matchQualifications(title);
      if (isExamCategory || matched.length > 0 || title.includes('試験')) {
        items.push({
          fiscalYear: fiscalYear,
          date: date,
          title: title,
          url: url,
          relatedQualifications: matched,
        });
      }
    }
  }

  return items;
}

/**
 * IPA試験区分ページから詳細情報（カテゴリ〜試験内容の概要）をパースする
 * @param {string} html 
 * @param {string} [url='']
 * @returns {{category: string, examDuration: string, examFormat: string, cost: string, testingOptions: string, introduction: string, examContent: string, contentOutline: string}}
 */
function parseIpaExamPage(html, url = '') {
  const result = {
    category: '',
    examDuration: '',
    examFormat: '',
    cost: '7,500円（税込）',
    testingOptions: '',
    introduction: '',
    examContent: '',
    contentOutline: '',
  };

  if (!html) return result;

  // 1. タイトル取得およびカテゴリ判定
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const examTitle = h1Match ? textFromHtml(h1Match[1]) : '';

  if (/ip\.html/i.test(url) || /ITパスポート/i.test(examTitle)) {
    result.category = 'レベル1（ITパスポート）';
  } else if (/fe\.html/i.test(url) || /基本情報技術者/i.test(examTitle)) {
    result.category = 'レベル2（基本情報技術者）';
  } else if (/sg\.html/i.test(url) || /情報セキュリティマネジメント/i.test(examTitle)) {
    result.category = 'レベル2（情報セキュリティマネジメント）';
  } else if (/ap\.html/i.test(url) || /応用情報技術者/i.test(examTitle)) {
    result.category = 'レベル3（応用情報技術者）';
  } else if (/sc\.html|sg_riss\.html/i.test(url) || /情報処理安全確保支援士/i.test(examTitle)) {
    result.category = 'レベル4（登録セキスペ・国家資格）';
  } else if (/(nw|db|es|sm|sa|st|pm|au)\.html/i.test(url) || /スペシャリスト|マネージャ|アーキテクト|ストラテジスト|監査技術者/i.test(examTitle)) {
    result.category = 'レベル4（高度試験）';
  } else {
    result.category = '情報処理技術者試験';
  }

  // 2. 費用（受験手数料 / 受験料）
  const costMatch = html.match(/<dt\b[^>]*>[^<]*(?:受験手数料|受験料|費用)[^<]*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i)
    || html.match(/<(?:p|li|div|th|td)\b[^>]*>[^<]*(?:受験手数料|受験料|費用)[:：]?\s*<(?:span|td|dd)\b[^>]*>([\s\S]*?)<\/(?:span|td|dd)>/i);
  if (costMatch) {
    result.cost = textFromHtml(costMatch[1]);
  } else {
    result.cost = '7,500円（税込）';
  }

  // 3. 受験オプション（実施方式・実施時期）
  const timingMatch = html.match(/<dt\b[^>]*>[^<]*実施方式・実施時期[^<]*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i);
  if (timingMatch) {
    result.testingOptions = textFromHtml(timingMatch[1]);
  }

  // 4. はじめに（キャッチコピー + リード文 + 1．対象者像）
  let catchCopy = '';
  const catchMatch = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>[\s\S]*?<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if (catchMatch) {
    const cText = textFromHtml(catchMatch[1]);
    if (!/organization|category|関連リンク|出題/i.test(cText)) {
      catchCopy = cText;
    }
  }

  const targetMatch = html.match(/<h3\b[^>]*>[^<]*1[．\.]\s*対象者像[^<]*<\/h3>([\s\S]*?)(?=<h3\b|$)/i);
  const targetText = targetMatch ? textFromHtml(targetMatch[1]) : '';

  let leadText = '';
  const dlMatch = html.match(/<\/dl>\s*([\s\S]*?)(?=<div\b[^>]*class=["'][^"']*btn|<h3\b)/i);
  if (dlMatch) {
    leadText = textFromHtml(dlMatch[1]);
  }
  if (!leadText) {
    const metaDesc = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDesc) leadText = textFromHtml(metaDesc[1]);
  }

  const introParts = [];
  if (catchCopy) introParts.push(`【概要】${catchCopy}`);
  if (leadText && leadText !== catchCopy) introParts.push(leadText);
  if (targetText) introParts.push(`【対象者像】${targetText}`);
  result.introduction = introParts.join(' ');
  if (!result.introduction && leadText) {
    result.introduction = leadText;
  }

  // 5. 試験内容（2．業務と役割）
  const roleMatch = html.match(/<h3\b[^>]*>[^<]*2[．\.]\s*業務と役割[^<]*<\/h3>([\s\S]*?)(?=<h3\b|$)/i);
  if (roleMatch) {
    result.examContent = textFromHtml(roleMatch[1]);
  }

  // 6. 試験内容の概要（3．期待する技術水準 または 出題範囲）
  const skillMatch = html.match(/<h3\b[^>]*>[^<]*3[．\.]\s*期待する技術水準[^<]*<\/h3>([\s\S]*?)(?=<h3\b|<div\b[^>]*class=["'][^"']*(?:related|link|btn)|$)/i);
  if (skillMatch) {
    result.contentOutline = textFromHtml(skillMatch[1]);
  } else {
    const outlineMatch = html.match(/<h[2-4]\b[^>]*>[^<]*(?:出題範囲|試験範囲|シラバス|Syllabus|Outline)[^<]*<\/h[2-4]>([\s\S]*?)(?=<h[2-4]\b|$)/i);
    if (outlineMatch) {
      result.contentOutline = textFromHtml(outlineMatch[1]);
    }
  }

  // 7. 試験時間・出題形式・出題数（4．試験時間・出題形式・出題数（解答数））
  const examSectionMatch = html.match(/<h3\b[^>]*>[^<]*4[．\.]\s*試験時間[\s\S]*?<\/h3>([\s\S]*?)(?=<h3\b|<div\b[^>]*class=["'][^"']*(?:related|link|btn)|$)/i);
  if (examSectionMatch) {
    const secHtml = examSectionMatch[1];
    const subSections = secHtml.split(/(?=<h4\b)/i);
    const durationParts = [];
    const formatParts = [];

    for (const sub of subSections) {
      const h4Match = sub.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i);
      const subTitle = h4Match ? textFromHtml(h4Match[1]) : '';

      const durMatch = sub.match(/<dt\b[^>]*>[^<]*試験時間[^<]*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i);
      const fmtMatch = sub.match(/<dt\b[^>]*>[^<]*出題形式[^<]*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i);
      const qMatch = sub.match(/<dt\b[^>]*>[^<]*出題数[^<]*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i);

      const durText = durMatch ? textFromHtml(durMatch[1]) : '';
      const fmtText = fmtMatch ? textFromHtml(fmtMatch[1]) : '';
      const qText = qMatch ? textFromHtml(qMatch[1]) : '';

      if (durText) {
        durationParts.push(subTitle ? `${subTitle}: ${durText}` : durText);
      }
      if (fmtText || qText) {
        let f = fmtText;
        if (qText) {
          f = f ? `${f}（${qText}）` : qText;
        }
        formatParts.push(subTitle ? `${subTitle}: ${f}` : f);
      }
    }

    if (durationParts.length > 0) result.examDuration = durationParts.join('、');
    if (formatParts.length > 0) result.examFormat = formatParts.join('、');
  }

  // 単一dl定義からのフォールバック（科目別h4がない場合）
  if (!result.examDuration) {
    const singleDurMatch = html.match(/<dt\b[^>]*>[^<]*試験時間[^<]*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i);
    if (singleDurMatch) {
      result.examDuration = textFromHtml(singleDurMatch[1]);
    }
  }
  if (!result.examFormat) {
    const singleFmtMatch = html.match(/<dt\b[^>]*>[^<]*(?:出題形式|試験形式)[^<]*<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/i);
    if (singleFmtMatch) {
      result.examFormat = textFromHtml(singleFmtMatch[1]);
    }
  }

  return result;
}

/**
 * IPA詳細情報のコンテンツハッシュを生成する
 * @param {object} details 
 * @returns {string}
 */
function hashIpaDetails(details) {
  const payload = [
    details.category || '',
    details.examDuration || '',
    details.examFormat || '',
    details.cost || '',
    details.testingOptions || '',
    details.introduction || '',
    details.examContent || '',
    details.contentOutline || ''
  ].join('|');
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * 指定されたURLからIPA資格詳細情報を取得する
 * @param {string} url 
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
async function fetchIpaExamDetails(url, options = {}) {
  let html = options.html || null;
  if (!html) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });
    if (!res.ok) {
      throw new Error(`IPA資格ページの取得に失敗しました (${url}): HTTP ${res.status}`);
    }
    html = await res.text();
  }

  const details = parseIpaExamPage(html, url);
  return {
    ...details,
    url: url,
    contentHash: hashIpaDetails(details),
  };
}

/**
 * IPAの3年度分のニュースページから新着情報を取得する
 * @param {object} [mockDataMap] テスト用 { [url]: html }
 * @returns {Promise<Array<object>>}
 */
async function fetchIpaNews(mockDataMap = null) {
  const targetUrls = getIpaNewsTargetUrls();
  const allItems = [];
  const seenUrls = new Set();

  for (let i = 0; i < targetUrls.length; i++) {
    const target = targetUrls[i];
    let html = null;

    if (mockDataMap && mockDataMap[target.url]) {
      html = mockDataMap[target.url];
    } else if (!mockDataMap) {
      try {
        const res = await fetch(target.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
          }
        });
        if (res.ok) {
          html = await res.text();
        } else {
          console.warn(`[IPA] ${target.label}(${target.year}年度)の取得をスキップしました (HTTP ${res.status})`);
        }
      } catch (err) {
        console.warn(`[IPA] ${target.label}(${target.year}年度)の取得中にエラー: ${err.message}`);
      }
    }

    if (html) {
      const items = parseNewsItems(html, target.year);
      for (const item of items) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allItems.push(item);
        }
      }
    }

    if (!mockDataMap && i < targetUrls.length - 1) {
      await sleep(1000);
    }
  }

  return allItems;
}

/**
 * IPAの新着ニュースと資格詳細情報の両方を取得する統合関数
 * @param {object} [options={}]
 * @returns {Promise<Array<object>>}
 */
async function fetchIpaAllUpdates(options = {}) {
  const newsItems = await fetchIpaNews(options.newsMockMap || null);
  const detailItems = [];

  const qualifications = options.qualifications || IPA_QUALIFICATIONS;
  for (let i = 0; i < qualifications.length; i++) {
    const q = qualifications[i];
    if (i > 0 && !options.detailsMockMap) await sleep(1000);

    try {
      const mockHtml = options.detailsMockMap ? options.detailsMockMap[q.officialUrl] : null;
      const details = await fetchIpaExamDetails(q.officialUrl, { html: mockHtml });
      detailItems.push({
        provider: 'IPA（独立行政法人 情報処理推進機構）',
        title: `${q.name} 資格詳細情報`,
        url: q.officialUrl,
        date: '',
        description: details.introduction || `${q.name} の公式資格詳細情報`,
        ...details,
        detailsOnly: true,
        relatedQualifications: [{ no: q.no, name: q.name }],
      });
    } catch (e) {
      console.warn(`[IPA] 詳細情報の取得に失敗しました (${q.name}): ${e.message}`);
    }
  }

  return [...newsItems, ...detailItems];
}

module.exports = {
  IPA_QUALIFICATIONS,
  decodeHtml,
  textFromHtml,
  getFiscalYear,
  getIpaNewsTargetUrls,
  matchQualifications,
  parseNewsItems,
  parseIpaExamPage,
  hashIpaDetails,
  fetchIpaExamDetails,
  fetchIpaNews,
  fetchIpaAllUpdates,
};
