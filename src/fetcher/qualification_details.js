const fs = require('fs');
const path = require('path');
const { decodeHtml, hashContent, fetchOfficialPage } = require('./official_web');

const QUALIFICATIONS_PATH = path.join(__dirname, '..', '..', 'qualifications.tsv');
const DETAIL_FIELDS = [
  'category',
  'examDuration',
  'examFormat',
  'cost',
  'testingOptions',
  'introduction',
  'examContent',
  'contentOutline',
];
const BATCH_COUNT = 5;

const PROVIDER_RULES = [
  { key: 'ipa', match: /情報処理推進機構|^IPA/i, labels: {
    category: ['試験区分'], examDuration: ['試験時間', '試験時間（目安）'], examFormat: ['出題形式', '試験方式'],
    cost: ['受験手数料', '受験料'], testingOptions: ['試験方式', '受験方法'],
  } },
  { key: 'microsoft', match: /Microsoft|マイクロソフト/i, labels: {
    category: ['レベル', '認定レベル'], examDuration: ['試験時間', '時間', 'Exam duration'], examFormat: ['問題数', '試験形式', 'Exam format'],
    cost: ['受験料', '価格', 'Price'], testingOptions: ['スケジュール', '試験の予約', 'Schedule exam'],
  } },
  { key: 'cisco', match: /Cisco|シスコ/i, labels: {
    category: ['レベル', '認定レベル'], examDuration: ['試験時間', 'Duration'], examFormat: ['試験内容', '試験形式', 'Exam format'],
    cost: ['試験料金', '受験料', 'Exam price'], testingOptions: ['受験方法', '受験場所', 'Exam delivery'],
  } },
  { key: 'lpi', match: /Linux Professional Institute|LPI-Japan|エルピーアイ|^LPI/i, labels: {
    category: ['認定レベル', 'レベル'], examDuration: ['試験時間', '試験時間（分）'], examFormat: ['問題数', '出題形式'],
    cost: ['受験料', '受験料金'], testingOptions: ['受験方法', '試験方式'],
  } },
  { key: 'oracle', match: /Oracle|オラクル/i, labels: {
    category: ['認定レベル', '認定資格レベル'], examDuration: ['試験時間', 'Duration'], examFormat: ['問題数', '試験形式'],
    cost: ['受験料', '試験料', 'Exam price'], testingOptions: ['受験方法', '試験方法'],
  } },
  { key: 'broadcom', match: /Broadcom|VMware/i, labels: {
    category: ['認定レベル', 'Certification level'], examDuration: ['試験時間', 'Duration'], examFormat: ['試験形式', 'Exam format'],
    cost: ['受験料', 'Exam price'], testingOptions: ['受験方法', 'Exam delivery'],
  } },
  { key: 'comptia', match: /CompTIA|コンプティア/i, labels: {
    category: ['認定レベル', 'レベル'], examDuration: ['試験時間', 'Test duration'], examFormat: ['問題数', '出題形式', 'Exam format'],
    cost: ['試験価格', '受験料', 'Exam price'], testingOptions: ['試験実施方法', '受験方法', 'Testing options'],
  } },
  { key: 'cncf', match: /CNCF|Linux Foundation/i, labels: {
    category: ['レベル', 'Certification level'], examDuration: ['試験時間', 'Duration'], examFormat: ['試験形式', 'Exam format'],
    cost: ['受験料', '試験価格', 'Exam price'], testingOptions: ['受験方法', 'Exam delivery'],
  } },
  { key: 'anthropic', match: /Anthropic|アンスロピック/i, labels: {
    category: ['レベル', 'Level'], examDuration: ['所要時間', 'Duration'], examFormat: ['形式', 'Format'],
    cost: ['費用', '価格', 'Price'], testingOptions: ['受験方法', 'Delivery'],
  } },
  { key: 'uipath', match: /UiPath|ユーアイパス/i, labels: {
    category: ['レベル', '認定レベル'], examDuration: ['試験時間', 'Duration'], examFormat: ['試験形式', '問題数'],
    cost: ['受験料', '試験料金', 'Price'], testingOptions: ['受験方法', '試験会場'],
  } },
  { key: 'certify', match: /サーティファイ|Certify/i, labels: {
    category: ['級', 'レベル'], examDuration: ['試験時間'], examFormat: ['出題形式', '問題数', '試験形式'],
    cost: ['受験料', '受験料金'], testingOptions: ['受験方法', '試験方式'],
  } },
  { key: 'python_association', match: /Pythonエンジニア育成推進協会|pythonic-exam/i, labels: {
    category: ['試験区分', 'レベル'], examDuration: ['試験時間'], examFormat: ['問題数', '出題形式'],
    cost: ['受験料', '受験料金'], testingOptions: ['受験方法', '試験方式'],
  } },
  { key: 'pmaj', match: /PMAJ|プロジェクトマネジメント協会/i, labels: {
    category: ['資格区分', 'レベル'], examDuration: ['試験時間'], examFormat: ['試験方式', '出題形式'],
    cost: ['受験料', '受験費用'], testingOptions: ['受験方法', '試験方式'],
  } },
  { key: 'pmi', match: /Project Management Institute|PMI/i, labels: {
    category: ['Certification type', '資格区分'], examDuration: ['Exam duration', '試験時間'], examFormat: ['Exam format', '問題数'],
    cost: ['Exam fee', '受験料'], testingOptions: ['Exam options', '受験方法'],
  } },
  { key: 'isaca', match: /ISACA|情報システムコントロール協会/i, labels: {
    category: ['Certification level', '資格区分'], examDuration: ['Exam length', '試験時間'], examFormat: ['Exam format', '問題数'],
    cost: ['Exam fee', '受験料'], testingOptions: ['Exam options', '受験方法'],
  } },
  { key: 'peoplecert', match: /PeopleCert|AXELOS/i, labels: {
    category: ['Level', 'レベル'], examDuration: ['Exam duration', '試験時間'], examFormat: ['Exam format', '問題数'],
    cost: ['Exam price', '受験料'], testingOptions: ['Exam delivery', '受験方法'],
  } },
  { key: 'fortinet', match: /Fortinet|フォーティネット/i, labels: {
    category: ['認定レベル', 'Certification level'], examDuration: ['試験時間', 'Duration'], examFormat: ['試験形式', '問題数'],
    cost: ['受験料', 'Exam price'], testingOptions: ['試験方法', 'Exam delivery'],
  } },
  { key: 'palo_alto', match: /Palo Alto|パロアルト/i, labels: {
    category: ['レベル', 'Certification level'], examDuration: ['試験時間', 'Duration'], examFormat: ['試験形式', 'Exam format'],
    cost: ['受験料', 'Exam price'], testingOptions: ['受験方法', 'Exam delivery'],
  } },
  { key: 'ntt_at', match: /NTT.?AT|アドバンステクノロジ/i, labels: {
    category: ['認定レベル', 'レベル'], examDuration: ['試験時間'], examFormat: ['試験形式', '出題形式'],
    cost: ['受験料', '受験料金'], testingOptions: ['受験方法', '試験方式'],
  } },
];

const SECTION_RULES = {
  introduction: /^(?:概要|資格概要|試験概要|Introduction|Overview|About this certification|About the exam)$/i,
  examContent: /^(?:試験内容|試験について|Exam content|Exam details|Exam overview)$/i,
  contentOutline: /(?:試験範囲|出題範囲|試験内容の概要|Content outline|Exam objectives|Skills measured|Syllabus|Domains)/i,
};

function htmlToText(html) {
  return decodeHtml(String(html || '')
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|\/p|\/li|\/div|\/h[1-6]|\/tr|\/dt|\/dd)\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, ' '))
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function normalizedLabel(value) {
  return String(value || '').replace(/[：:]\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractLabeledValue(html, labels, plainText) {
  if (!labels || labels.length === 0) return '';
  const escapedLabels = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const labelPattern = escapedLabels.join('|');
  const structuralPatterns = [
    new RegExp(`<dt\\b[^>]*>\\s*([^<]+)\\s*<\\/dt>\\s*<dd\\b[^>]*>([\\s\\S]*?)<\\/dd>`, 'gi'),
    new RegExp(`<th\\b[^>]*>\\s*([^<]+)\\s*<\\/th>\\s*<td\\b[^>]*>([\\s\\S]*?)<\\/td>`, 'gi'),
    new RegExp(`<(?:p|li|div)\\b[^>]*>[\\s\\S]*?<(?:strong|b)\\b[^>]*>\\s*(${labelPattern})\\s*[:：]?\\s*<\\/(?:strong|b)>\\s*([\\s\\S]*?)<\\/(?:p|li|div)>`, 'gi'),
  ];

  for (const pattern of structuralPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const label = normalizedLabel(match[1]);
      if (labels.some(candidate => normalizedLabel(candidate) === label)) {
        const value = htmlToText(match[2]);
        if (value) return value;
      }
    }
  }

  const lines = plainText.split('\n');
  for (let index = 0; index < lines.length; index++) {
    const match = lines[index].match(/^([^:：]{1,60})\s*[:：]\s*(.+)$/);
    if (match && labels.some(label => normalizedLabel(label) === normalizedLabel(match[1]))) {
      return match[2].trim();
    }
    if (labels.some(label => normalizedLabel(label) === normalizedLabel(lines[index])) && lines[index + 1]) {
      return lines[index + 1].trim();
    }
  }
  return '';
}

function extractSections(html) {
  const headings = [];
  const headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({ start: match.index, end: headingRegex.lastIndex, title: htmlToText(match[2]) });
  }
  return headings.map((heading, index) => ({
    title: heading.title,
    text: htmlToText(html.slice(heading.end, headings[index + 1] ? headings[index + 1].start : html.length)),
  }));
}

function parseCredentialDetails(html, providerName) {
  const rules = PROVIDER_RULES.find(rule => rule.match.test(providerName || ''));
  if (!rules) throw new Error(`詳細情報の抽出ルールがありません: ${providerName}`);

  const plainText = htmlToText(html);
  const details = Object.fromEntries(DETAIL_FIELDS.map(field => [field, '']));
  for (const field of ['category', 'examDuration', 'examFormat', 'cost', 'testingOptions']) {
    details[field] = extractLabeledValue(html, rules.labels[field], plainText);
  }

  const descriptionMatch = html.match(/<meta\b[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || html.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*>/i);
  if (descriptionMatch) details.introduction = htmlToText(descriptionMatch[1]).slice(0, 2000);

  for (const section of extractSections(html)) {
    if (!section.text) continue;
    if (!details.introduction && SECTION_RULES.introduction.test(section.title)) {
      details.introduction = section.text.slice(0, 2000);
    } else if (!details.contentOutline && SECTION_RULES.contentOutline.test(section.title)) {
      details.contentOutline = section.text.slice(0, 4000);
    } else if (!details.examContent && SECTION_RULES.examContent.test(section.title)) {
      details.examContent = section.text.slice(0, 4000);
    }
  }

  return details;
}

function getProviderKey(providerName) {
  const rule = PROVIDER_RULES.find(candidate => candidate.match.test(providerName || ''));
  return rule ? rule.key : null;
}

function loadQualificationRows(filePath = QUALIFICATIONS_PATH) {
  const lines = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  return lines.slice(1).map(line => {
    const [no, providerName, name, url] = line.split('\t');
    return { no: Number(no), providerName, name, url };
  }).filter(item => item.no && item.providerName && item.name && item.url);
}

function getDailyBatchIndex(date = new Date()) {
  const targetDay = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  const mondayEpoch = Math.floor(Date.UTC(2026, 0, 5) / 86400000);
  const daysSinceEpoch = targetDay - mondayEpoch;
  const fullWeeks = Math.floor(daysSinceEpoch / 7);
  const daysInWeek = daysSinceEpoch - fullWeeks * 7;
  const weekdays = fullWeeks * 5 + Math.min(daysInWeek, 5);
  return ((weekdays - 1) % BATCH_COUNT + BATCH_COUNT) % BATCH_COUNT;
}

function getQualificationDetailTargets(providerKey, rows = loadQualificationRows(), batchIndex = getDailyBatchIndex()) {
  const grouped = new Map();
  for (const row of rows) {
    if (getProviderKey(row.providerName) !== providerKey) continue;
    if (!grouped.has(row.url)) grouped.set(row.url, { url: row.url, providerName: row.providerName, qualifications: [] });
    grouped.get(row.url).qualifications.push({ no: row.no, name: row.name });
  }
  return Array.from(grouped.values()).filter((_, index) => index % BATCH_COUNT === batchIndex);
}

async function fetchQualificationDetails(providerKey, options = {}) {
  const targets = getQualificationDetailTargets(providerKey, options.rows, options.batchIndex);
  const fetchPage = options.fetchPage || fetchOfficialPage;
  const wait = options.wait === undefined ? ms => new Promise(resolve => setTimeout(resolve, ms)) : options.wait;
  const items = [];

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    if (index > 0) await wait(1500);
    try {
      const html = options.pages ? options.pages[target.url] : await fetchPage(target.url);
      if (typeof html !== 'string') throw new Error('公式ページからHTMLを取得できませんでした');
      const details = parseCredentialDetails(html, target.providerName);
      if (!DETAIL_FIELDS.some(field => details[field])) continue;
      items.push({
        provider: target.providerName,
        title: `${target.qualifications[0].name} 資格詳細情報`,
        url: target.url,
        date: '',
        description: details.introduction || `${target.qualifications[0].name} の公式資格詳細情報`,
        ...details,
        contentHash: hashContent(JSON.stringify(details)),
        detailsOnly: true,
        relatedQualifications: target.qualifications,
      });
    } catch (error) {
      console.warn(`[${target.providerName}] 資格詳細の取得に失敗しました (${target.url}): ${error.message}`);
    }
  }
  return items;
}

module.exports = {
  DETAIL_FIELDS,
  PROVIDER_RULES,
  parseCredentialDetails,
  getProviderKey,
  loadQualificationRows,
  getDailyBatchIndex,
  getQualificationDetailTargets,
  fetchQualificationDetails,
};
