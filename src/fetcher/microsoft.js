/**
 * Microsoft Learn 認定情報フェッチャー (Catalog API ベース)
 */

const MS_CATALOG_URL = 'https://learn.microsoft.com/api/catalog/';

// 監視対象のMicrosoft資格キーワード定義
const MS_TARGET_PATTERNS = [
  { no: 19, name: 'Azure認定 fundamentals系', match: c => c.uid.includes('azure-fundamentals') || c.title.includes('Azure Fundamentals') },
  { no: 20, name: 'Azure認定 Associate系', match: c => c.uid.includes('azure-administrator') || c.uid.includes('azure-developer') },
  { no: 21, name: 'Azure認定 Expert系', match: c => c.uid.includes('azure-solutions-architect') || c.uid.includes('devops-engineer') },
  { no: 22, name: 'Azure認定 Specialty系', match: c => c.certification_type === 'specialty' || c.uid.includes('specialty') },
  { no: 27, name: 'Security Operations Analyst Associate', match: c => c.uid.includes('security-operations-analyst') || c.title.includes('Security Operations Analyst') },
  { no: 28, name: 'Collaboration Communications Systems Engineer Associate', match: c => c.uid.includes('collaboration-communications') || c.title.includes('Collaboration Communications') },
  { no: 29, name: 'Endpoint Administrator Associate', match: c => c.uid.includes('endpoint-administrator') || c.title.includes('Endpoint Administrator') },
  { no: 30, name: 'Teams Administrator Associate', match: c => c.uid.includes('teams-administrator') || c.title.includes('Teams Administrator') },
  { no: 31, name: 'Identity and Access Administrator Associate', match: c => c.uid.includes('identity-and-access-administrator') || c.title.includes('Identity and Access Administrator') },
  { no: 32, name: 'Power Platform Solution Architect Expert', match: c => c.uid.includes('power-platform-solution-architect') || c.title.includes('Power Platform Solution Architect') },
  { no: 33, name: 'Information Protection and Compliance Administrator Associate', match: c => c.uid.includes('information-protection') || c.title.includes('Information Protection') },
  { no: 34, name: 'Cybersecurity Architect Expert', match: c => c.uid.includes('cybersecurity-architect') || c.title.includes('Cybersecurity Architect') },
  { no: 35, name: 'Windows Server Hybrid Administrator Associate', match: c => c.uid.includes('windows-server-hybrid') || c.title.includes('Windows Server Hybrid') },
  { no: 36, name: 'Power Platform Fundamentals', match: c => c.uid.includes('power-platform-fundamentals') || c.title.includes('Power Platform Fundamentals') },
  { no: 37, name: 'Power Automate RPA Developer Associate', match: c => c.uid.includes('power-automate-rpa-developer') || c.title.includes('Power Automate RPA Developer') },
  { no: 38, name: 'Power BI Data Analyst Associate', match: c => c.uid.includes('power-bi-data-analyst') || c.title.includes('Power BI Data Analyst') },
  { no: 39, name: 'Power Platform Developer Associate', match: c => c.uid.includes('power-platform-developer') || c.title.includes('Power Platform Developer') },
];

/**
 * Microsoft Learn Catalog API から認定資格情報を取得する
 * @param {object} [customData] テスト用JSONデータ
 * @returns {Promise<Array<object>>}
 */
async function fetchMicrosoftCertifications(customData = null) {
  let data = customData;
  if (!data) {
    const res = await fetch(MS_CATALOG_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error(`Microsoft Learn Catalog API の取得に失敗しました: HTTP ${res.status}`);
    }
    data = await res.json();
  }

  const certs = data.certifications || [];
  const results = [];

  for (const cert of certs) {
    const matched = [];
    for (const pattern of MS_TARGET_PATTERNS) {
      if (pattern.match(cert)) {
        matched.push({ no: pattern.no, name: pattern.name });
      }
    }

    // 対象リストにマッチするもの、または更新監視対象として抽出
    if (matched.length > 0) {
      results.push({
        uid: cert.uid,
        title: cert.title,
        url: cert.url,
        lastModified: cert.last_modified,
        type: cert.certification_type || cert.type,
        relatedQualifications: matched,
      });
    }
  }

  return results;
}

/**
 * Microsoft Learn 認定試験・資格詳細ページ (HTML) をパースする
 * @param {string} html HTML文字列
 * @param {string} [url] ページのURL
 * @returns {object} 詳細情報オブジェクト
 */
function parseMicrosoftExamPage(html, url = '') {
  const result = {
    title: '',
    url: url || '',
    description: '',
    category: '',
    examDuration: '',
    examFormat: '',
    cost: '',
    testingOptions: '',
    introduction: '',
    examContent: '',
    contentOutline: ''
  };

  if (!html) return result;

  // タイトル抽出
  const titleMatch = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    result.title = titleMatch[1].replace(/\s*-\s*Certifications.*$/i, '').trim();
  }

  // 説明抽出
  const descMatch = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
    result.introduction = result.description;
  }

  // カテゴリ（URLやテキストから）
  if (/\bfundamentals\b/i.test(url) || /\bfundamentals\b/i.test(html) || /基礎/i.test(html)) {
    result.category = 'Fundamentals';
  } else if (/\bassociate\b/i.test(url) || /\bassociate\b/i.test(html) || /アソシエイト/i.test(html)) {
    result.category = 'Associate';
  } else if (/\bexpert\b/i.test(url) || /\bexpert\b/i.test(html) || /エキスパート/i.test(html)) {
    result.category = 'Expert';
  } else if (/\bspecialty\b/i.test(url) || /\bspecialty\b/i.test(html) || /専門/i.test(html)) {
    result.category = 'Specialty';
  }

  // 概要（はじめに）セクション
  const overviewMatch = html.match(/<section[^>]*id=["']certification-overview["'][^>]*>([\s\S]*?)<\/section>/i);
  if (overviewMatch) {
    const text = overviewMatch[1]
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<div id=["']skill-badge-list-container["'][\s\S]*?<\/div>\s*<\/div>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) {
      result.introduction = text.slice(0, 2000);
    }
  }

  // 試験内容 (Exam content) - 「この試験で評価」等
  const examEvalMatch = html.match(/<p class="font-weight-semibold margin-top-none">\s*この試験で評価\s*<\/p>[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (examEvalMatch) {
    const items = [];
    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = liRegex.exec(examEvalMatch[1])) !== null) {
      const itemText = m[1].replace(/<[^>]+>/g, '').trim();
      if (itemText) items.push(`・${itemText}`);
    }
    if (items.length > 0) {
      result.examContent = items.join('\n');
    }
  }

  // 試験期間
  if (/45\s*分/i.test(html)) {
    result.examDuration = '45分';
  } else if (/60\s*分/i.test(html)) {
    result.examDuration = '60分';
  } else if (/85\s*分/i.test(html)) {
    result.examDuration = '85分';
  } else if (/100\s*分/i.test(html)) {
    result.examDuration = '100分';
  } else if (/120\s*分/i.test(html)) {
    result.examDuration = '120分';
  } else if (/試験期間/i.test(html)) {
    result.examDuration = '約45分〜120分（試験区分により異なる）';
  }

  // 試験の形態
  if (/Pearson Vue/i.test(html)) {
    result.examFormat = 'オンライン（監督付き）またはテストセンター';
  }

  // 費用
  const priceExplicit = html.match(/(?:価格|料金|費用|price)[:：]\s*([\$¥][0-9,]+|[0-9,]+\s*円)/i);
  if (priceExplicit) {
    result.cost = priceExplicit[1].trim();
  } else if (/試験が監督されている国または地域に基づく価格/i.test(html)) {
    result.cost = '国または地域に基づく価格（日本: 約12,500円〜21,000円 / 100〜165 USD）';
  }

  // 受験オプション
  const options = [];
  if (/Pearson Vue/i.test(html)) options.push('Pearson VUE (テストセンター / オンライン監視)');
  if (/Certiport/i.test(html)) options.push('Certiport (学生・教育機関向け)');
  if (options.length > 0) {
    result.testingOptions = options.join(', ');
  }

  // 試験内容の概要 (Content outline / スキル測定)
  const skillsGuideMatch = html.match(/<a\b[^>]*href=["']([^"']*(?:study-guide|skills-measured)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (skillsGuideMatch) {
    result.contentOutline = `学習ガイド・スキル測定: ${skillsGuideMatch[1]}`;
  } else if (result.examContent) {
    result.contentOutline = result.examContent;
  }

  return result;
}

module.exports = {
  MS_TARGET_PATTERNS,
  fetchMicrosoftCertifications,
  parseMicrosoftExamPage,
};
